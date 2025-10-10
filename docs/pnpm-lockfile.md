When you change dependencies in package.json

Why this matters

Vercel and many CI environments install dependencies with pnpm using the "frozen-lockfile" behavior by default. This prevents the install from modifying the lockfile during CI. If your local changes modify package.json without updating `pnpm-lock.yaml`, CI will fail with an error like:

  ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json

This commonly happens when you add/remove/update a dependency locally and forget to regenerate the lockfile before pushing.

Quick steps to fix locally

1. Regenerate the lockfile locally (this updates `pnpm-lock.yaml` to match your `package.json`):

```bash
pnpm install --no-frozen-lockfile
```

2. Commit the updated lockfile and push the branch:

```bash
git add pnpm-lock.yaml
git commit -m "chore: regenerate pnpm-lock.yaml to match package.json"
git push
```

3. Re-run CI / redeploy. Vercel and CI should now succeed since the lockfile and package manifest match.

Best practices

- Always run `pnpm install` (or `pnpm install --no-frozen-lockfile`) and commit the updated `pnpm-lock.yaml` whenever you change `package.json`.
- Avoid committing `vendor/` directories or other local package copies that can make lockfile entries point to local directories (`file:vendor/...`). Use published package versions when possible.
- If CI still fails, try clearing the build cache or triggering a rebuild without cache via your CI provider / Vercel dashboard.

Troubleshooting

- If the lockfile still shows a `file:vendor/...` specifier but the vendor directory is removed, regenerate the lockfile and re-install. Make sure `package.json`'s dependency specifier matches your desired version (e.g., `"stripe": "^19.1.0"`).
- If a git-hosted dependency runs prepack scripts and your CI environment lacks required tooling, prefer published packages or vendor the code in a controlled way and add build instructions to the repo.

If you want, I can add a GitHub Action that validates `pnpm-lock.yaml` is up to date on pull requests and blocks merges when it doesn't match.