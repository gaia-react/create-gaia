#!/usr/bin/env node
// create-gaia — scaffold a new GAIA React project.
//
// Usage: npx create-gaia <project-name> [--version vX.Y.Z] [--no-install] [--no-git]

import {execSync, spawnSync} from 'node:child_process';
import {createWriteStream} from 'node:fs';
import {mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import {request} from 'node:https';
import {createInterface} from 'node:readline/promises';
import {stdin as input, stdout as output} from 'node:process';
import {join, resolve} from 'node:path';

const TEMPLATE_REPO = 'gaia-react/gaia';
const FALLBACK_VERSION = 'v1.0.1';

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  await run(args);
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  if (process.env.CREATE_GAIA_DEBUG) console.error(err);
  process.exit(1);
}

async function run(args) {
  const projectName = args.projectName ?? (await prompt('Project name: '));
  if (!projectName) throw new Error('Project name is required.');

  const targetDir = resolve(process.cwd(), projectName);
  await assertTargetWritable(targetDir);

  const version = args.version ?? (await resolveLatestVersion());
  const tarballUrl = `https://github.com/${TEMPLATE_REPO}/releases/download/${version}/gaia-${version}.tar.gz`;

  console.log(`\nCreating ${projectName} from GAIA ${version}...`);

  await mkdir(targetDir, {recursive: true});

  const tarballPath = join(targetDir, '.gaia-download.tar.gz');
  console.log(`  ↓ downloading ${tarballUrl}`);
  await downloadFollowingRedirects(tarballUrl, tarballPath);

  console.log('  ↳ extracting');
  execSync(`tar -xzf ${quote(tarballPath)} --strip-components=1 -C ${quote(targetDir)}`, {
    stdio: 'inherit',
  });
  await rm(tarballPath, {force: true});

  await writeFile(join(targetDir, '.gaia/VERSION'), `${version.replace(/^v/, '')}\n`);

  if (!args.noGit) {
    console.log('  ↳ git init');
    await rm(join(targetDir, '.git'), {recursive: true, force: true});
    run_(targetDir, 'git', ['init', '--quiet']);
    run_(targetDir, 'git', ['add', '.']);
    run_(targetDir, 'git', ['commit', '--quiet', '-m', `chore: scaffold from GAIA ${version}`]);
  }

  const pm = detectPackageManager();

  if (!args.noInstall) {
    console.log(`  ↳ ${pm} install (this takes a minute)`);
    run_(targetDir, pm, ['install']);
  }

  printWelcome(projectName, version, args.noInstall, pm);
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') result.help = true;
    else if (a === '--version') result.version = normalizeVersion(argv[++i]);
    else if (a === '--no-install') result.noInstall = true;
    else if (a === '--no-git') result.noGit = true;
    else if (a.startsWith('--')) throw new Error(`Unknown flag: ${a}`);
    else if (!result.projectName) result.projectName = a;
    else throw new Error(`Unexpected argument: ${a}`);
  }
  return result;
}

function normalizeVersion(v) {
  if (!v) throw new Error('--version requires a value');
  return v.startsWith('v') ? v : `v${v}`;
}

function printHelp() {
  console.log(`create-gaia — scaffold a new GAIA React project

Usage:
  npx create-gaia <project-name> [options]

Options:
  --version <vX.Y.Z>   Pin to a specific GAIA release (default: latest).
  --no-install         Skip 'npm install'.
  --no-git             Skip git init + initial commit.
  -h, --help           Show this help.

After scaffolding, open the project in Claude Code and run '/init'.`);
}

async function assertTargetWritable(targetDir) {
  try {
    const entries = await readdir(targetDir);
    if (entries.length > 0) {
      throw new Error(`Target directory ${targetDir} exists and is not empty.`);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

async function resolveLatestVersion() {
  try {
    const body = await httpsGetJson(`https://api.github.com/repos/${TEMPLATE_REPO}/releases/latest`);
    if (body?.tag_name) return body.tag_name;
  } catch {
    /* fall through */
  }
  console.warn(`  ⚠ could not reach GitHub API, falling back to ${FALLBACK_VERSION}`);
  return FALLBACK_VERSION;
}

function httpsGetJson(url) {
  return new Promise((resolve_, reject) => {
    request(url, {headers: {'user-agent': 'create-gaia', accept: 'application/vnd.github+json'}}, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpsGetJson(res.headers.location).then(resolve_, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve_(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
      res.on('error', reject);
    })
      .on('error', reject)
      .end();
  });
}

function downloadFollowingRedirects(url, destPath, depth = 0) {
  if (depth > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve_, reject) => {
    const req = request(url, {headers: {'user-agent': 'create-gaia'}}, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        downloadFollowingRedirects(res.headers.location, destPath, depth + 1).then(resolve_, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const file = createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve_()));
      file.on('error', reject);
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

function run_(cwd, cmd, argv) {
  const result = spawnSync(cmd, argv, {cwd, stdio: 'inherit'});
  if (result.status !== 0) {
    throw new Error(`${cmd} ${argv.join(' ')} exited with ${result.status ?? 'signal ' + result.signal}`);
  }
}

function detectPackageManager() {
  try {
    execSync('pnpm --version', {stdio: 'ignore'});
    return 'pnpm';
  } catch {
    return 'npm';
  }
}

function quote(p) {
  return `'${p.replaceAll("'", "'\\''")}'`;
}

async function prompt(q) {
  const rl = createInterface({input, output});
  const answer = await rl.question(q);
  rl.close();
  return answer.trim();
}

function printWelcome(projectName, version, skippedInstall, pm = 'npm') {
  console.log(`\n✓ ${projectName} ready (GAIA ${version}).\n`);
  console.log('Next steps:\n');
  console.log(`  cd ${projectName}`);
  if (skippedInstall) console.log(`  ${pm} install`);
  console.log('  # Open Claude Code in this directory, then:');
  console.log('    /init\n');
  console.log('/init will complete the setup of your GAIA project.\n');
}
