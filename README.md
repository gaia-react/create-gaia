# create-gaia

Scaffold a new project from [GAIA React](https://github.com/gaia-react/gaia).

## Usage

```bash
npx create-gaia@latest my-app
```

Use `@latest` so npx does not reuse a cached older copy of create-gaia: GAIA 2.0.0 and later publish their release asset under a new name that only create-gaia 2.0.0 and later can download.

After scaffolding, Claude Code launches in the project root and runs `/gaia-init` to complete setup. Pass `--no-claude` to skip that and follow the printed steps instead.

From GAIA 2.0.0 the project is a pnpm workspace with the React app under `frontend/`. Run commands and launch Claude Code from the project root.

Pin a release with `--version`, for example `npx create-gaia@latest my-app --version v1.6.1`.

## License

MIT
