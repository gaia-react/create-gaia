# create-gaia

Scaffold a new project from the [GAIA React Template](https://github.com/gaia-react/react-router) — a Claude-native React Router 7 starter with TypeScript, Tailwind v4, Vitest, Playwright, and Storybook pre-configured.

## Usage

```bash
npx create-gaia my-app
# or
npm create gaia@latest my-app
```

Then follow the printed instructions: open the new project in Claude Code and run `/gaia-init`.

## Options

```
create-gaia <project-name> [options]

Options:
  --version <vX.Y.Z>   Pin to a specific GAIA release (default: latest).
  --no-install         Skip 'npm install' after scaffolding.
  --no-git             Skip 'git init' and initial commit.
  -h, --help           Show help.
```

Examples:

```bash
npx create-gaia my-app --version v1.0.0
npx create-gaia my-app --no-install
```

## What it does

1. Resolves the target GAIA release (latest, or the `--version` you pinned).
2. Downloads the pre-scrubbed release tarball from GitHub (already stripped of dev-only wiki context).
3. Extracts into `<project-name>/`.
4. Writes `.gaia/VERSION` so `/gaia-update` can track your baseline later.
5. `git init` + initial commit (unless `--no-git`).
6. `npm install` (unless `--no-install`).
7. Prints next steps.

The scaffold is intentionally minimal — post-setup (project rename, language config, branding strip, Claude plugin install) happens via the `/gaia-init` command inside Claude Code.

## License

MIT
