When you change dependencies in package.json

Why this matters

Vercel and many CI environments install dependencies using npm (via `npm ci`) or other package managers and rely on a corresponding lockfile to remain unchanged during CI. If your local changes modify `package.json` without updating `package-lock.json`, CI may fail with an error like:

  npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.

This commonly happens when you add/remove/update a dependency locally and forget to regenerate the lockfile before pushing.

Quick steps to fix locally

1. Regenerate the lockfile locally (this updates `package-lock.json` to match your `package.json`):

```bash
npm install
```

2. Commit the updated lockfile and push the branch:

```bash
git add package-lock.json
git commit -m "chore: regenerate package-lock.json to match package.json"
git push
```

3. Re-run CI / redeploy. CI should now succeed since the lockfile and package manifest match.

Best practices

- Always run `npm install` (or `npm ci` in CI) and commit the updated `package-lock.json` whenever you change `package.json`.
- Avoid committing `vendor/` directories or other local package copies that can make lockfile entries point to local directories (`file:vendor/...`). Use published package versions when possible.
- If CI still fails, try clearing the build cache or triggering a rebuild without cache via your CI provider / Vercel dashboard.

Troubleshooting

- If the lockfile still shows a `file:vendor/...` specifier but the vendor directory is removed, regenerate the lockfile and re-install. Make sure `package.json`'s dependency specifier matches your desired version (e.g., `"stripe": "^19.1.0"`).
- If a git-hosted dependency runs prepack scripts and your CI environment lacks required tooling, prefer published packages or vendor the code in a controlled way and add build instructions to the repo.

If you want, I can add a GitHub Action that validates `package-lock.json` is up to date on pull requests and blocks merges when it doesn't match.