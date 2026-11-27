# Releasing

Releases are published to npm by the manual **Release** workflow (`.github/workflows/release.yml`). It uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers): GitHub Actions authenticates to npm with a short-lived OIDC token, so no npm token is stored anywhere. Every release carries a provenance attestation linking it to the commit and workflow run that built it.

## One-time setup

### 1. npm: add the trusted publisher

1. Sign in at https://www.npmjs.com with an account that owns `mapbox-gl-draw-circle`. To check, run `npm owner ls mapbox-gl-draw-circle`.
2. Open https://www.npmjs.com/package/mapbox-gl-draw-circle/access. That's the package's **Settings** page.
3. Under **Trusted Publisher**, choose **GitHub Actions** and enter:

   | Field | Value |
   |---|---|
   | Organization or user | `iamanvesh` |
   | Repository | `mapbox-gl-draw-circle` |
   | Workflow filename | `release.yml` |
   | Environment name | `npm-release` |

   These must match exactly. A wrong filename or environment makes `npm publish` fail with a 404 or "not authorized".
4. Recommended: on the same page, under **Publishing access**, choose **Require two-factor authentication and disallow tokens**. Only the trusted workflow can then publish, and leaked tokens can't.

### 2. GitHub: create the approval environment

1. Open https://github.com/iamanvesh/mapbox-gl-draw-circle/settings/environments and click **New environment**. Name it `npm-release`.
2. Tick **Required reviewers** and add yourself. Every real publish then pauses until you approve it. If you're the only maintainer, leave **Prevent self-review** unticked.
3. Under **Deployment branches and tags**, choose **Selected branches and tags** and add the rule `master`. The environment then can't be used from any other branch.

There are no secrets to add.

## Releasing a version

1. **Prepare the release on master:**
   - Bump the version: `npm version 2.1.0 --no-git-tag-version`.
   - Add a `## [2.1.0] - YYYY-MM-DD` section to `CHANGELOG.md`.
   - Commit and push.

   The workflow creates the git tag itself, so don't tag by hand.
2. **Dry run:** go to **Actions → Release → Run workflow**, choose branch `master`, and leave **Dry run** ticked. It checks the version, tag and changelog, then runs the full CI suite on that commit. Finally it prints the packed files and the release notes. Nothing is published.
3. **Publish:** run the workflow again with **Dry run** unticked and dist-tag `latest`.
   - The run pauses at **Publish to npm**. Click **Review deployments → Approve**.
   - It then publishes to npm, tags `vX.Y.Z` and creates the GitHub release, using the CHANGELOG section as the release notes.
4. **Check:**
   - `npm view mapbox-gl-draw-circle` shows the new version.
   - The npm page shows a "Provenance" badge.
   - `node fixtures/run.mjs` against the published version is a good final smoke test.

**Prereleases:** use a version like `2.1.0-beta.1` and dist-tag `next`. The workflow refuses to publish a prerelease as `latest`.

## If something goes wrong

- **"already on npm" / "Tag already exists":** the version was already released. Bump it.
- **`npm publish` fails with 404 / "not authorized":** the trusted publisher fields on npm don't match the repo, the workflow filename (`release.yml`) or the environment (`npm-release`).
- **Tests fail:** nothing is published. Fix, push, and run the workflow again.
- **Published, but tagging or the GitHub release failed:** create them by hand from the published commit with `gh release create vX.Y.Z --target <sha> --notes-file <notes>`. You can get the notes from `node .github/scripts/release-notes.mjs X.Y.Z`.
- **A bad release:** npm versions can't be reused. Run `npm deprecate mapbox-gl-draw-circle@X.Y.Z "reason"` and publish a fixed version. `npm unpublish` only works within 72 hours and is discouraged.
