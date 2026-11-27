# Releasing

Releases use **npm staged publishing** together with **trusted publishing**:

- The manual **Release** workflow (`.github/workflows/release.yml`) tests the commit and *stages* the version on npm. It authenticates with a short-lived OIDC token, so no npm token is stored anywhere. The staged version carries a provenance attestation.
- A staged version is not public. It goes live only when a maintainer approves it with `npm stage approve`, which asks for **npm 2FA**.

CI can only ever stage. A compromised workflow, dependency or GitHub account cannot release anything without the maintainer's npm 2FA.

## One-time setup

### 1. npm: trusted publisher (stage only)

1. Sign in at https://www.npmjs.com with an account that owns `mapbox-gl-draw-circle`. To check, run `npm owner ls mapbox-gl-draw-circle`. Make sure 2FA is enabled on the account; approving a staged release requires it.
2. Open https://www.npmjs.com/package/mapbox-gl-draw-circle/access. That's the package's **Settings** page.
3. Under **Trusted Publisher**, choose **GitHub Actions** and enter:

   | Field | Value |
   |---|---|
   | Organization or user | `iamanvesh` |
   | Repository | `mapbox-gl-draw-circle` |
   | Workflow filename | `release.yml` |
   | Environment name | `npm-release` |

   These must match exactly. A wrong filename or environment makes staging fail with a 404 or "not authorized".
4. Under **Allowed access** ("npm stage publish is always allowed"), leave both boxes unticked:
   - **Publish directly: off.** CI may only stage, so nothing goes live without your 2FA.
   - **Manage dist-tags: off.** The tag (`latest` / `next`) is fixed when the version is staged, so CI never needs to move tags.
5. Recommended: under **Publishing access**, choose **Require two-factor authentication and disallow tokens**.

### 2. GitHub: restrict the environment to master

1. Open https://github.com/iamanvesh/mapbox-gl-draw-circle/settings/environments and create an environment named `npm-release`.
2. Under **Deployment branches and tags**, choose **Selected branches and tags** and add the rule `master`. Only workflow runs on master can then get npm's OIDC trust.
3. **Required reviewers** is optional. The npm 2FA approval is the real gate. Add yourself only if you also want a GitHub-side pause before anything is staged.

There are no secrets to add. On your machine you need the `gh` CLI, or the GitHub web UI, to publish the draft release.

## Releasing a version

1. **Prepare on master:**
   - Bump the version: `npm version 2.1.0 --no-git-tag-version`.
   - Add a `## [2.1.0] - YYYY-MM-DD` section to `CHANGELOG.md`.
   - Commit and push.

   The workflow creates the git tag itself, so don't tag by hand.
2. **Dry run:** go to **Actions → Release → Run workflow**, choose branch `master`, and leave **Dry run** ticked. It checks the version, tag, release and changelog, then runs the full CI suite on that commit. Finally it prints the packed files and the release notes. Nothing is staged.
3. **Stage:** run the workflow again with **Dry run** unticked and dist-tag `latest`. It stages the version on npm and creates a draft GitHub release. The run summary lists the next commands.
4. **Approve on npm**, on your machine:
   ```sh
   npm stage list mapbox-gl-draw-circle     # find the stage id for the new version
   npm stage download <stage-id>            # optional: inspect the exact tarball
   npm stage approve <stage-id>             # asks for 2FA; the version is now live
   ```
5. **Publish the GitHub release.** This also creates the `vX.Y.Z` tag on the tested commit:
   ```sh
   gh release edit v2.1.0 --draft=false
   ```
   Or open the draft under **Releases** and click **Publish release**.
6. **Check:**
   - `npm view mapbox-gl-draw-circle version` shows the new version.
   - The npm page shows a "Provenance" badge.
   - `node fixtures/run.mjs` is a good final smoke test.

**Prereleases:** use a version like `2.1.0-beta.1` and dist-tag `next`. The workflow refuses to stage a prerelease as `latest`.

## If something goes wrong

- **"already on npm" / "Tag already exists" / "GitHub release already exists":** this version was already released or staged. Delete a leftover draft release, or bump the version.
- **Staging fails with 404 / "not authorized":** the trusted publisher fields on npm don't match the repo, the workflow filename (`release.yml`) or the environment (`npm-release`).
- **Staging fails with "version already exists":** that version is already staged. Approve it, or run `npm stage reject <stage-id>` and run the workflow again.
- **Tests fail:** nothing is staged. Fix, push, and run the workflow again.
- **Abandon a staged release:** run `npm stage reject <stage-id>` (asks for 2FA), then delete the draft GitHub release.
- **A bad release that's already approved:** npm versions can't be reused. Run `npm deprecate mapbox-gl-draw-circle@X.Y.Z "reason"` and release a fixed version. `npm unpublish` only works within 72 hours and is discouraged.
