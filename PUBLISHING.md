# Publishing

The `Test` GitHub Actions workflow runs on pull requests, pushes to `master` and `codex/**`, and `v*` tags. Version tags publish to npm and create a GitHub release only after all five Node/platform test jobs pass. Branch pushes and pull requests do not publish.

## Prepare a release branch

Use the Node version in `.nvmrc` and create a branch under `codex/`. Update the package version, README, and `RELEASE_NOTES.md` together. For a minor release:

```sh
npm version minor --no-git-tag-version --ignore-scripts
npm ci
npm run check
npm run test:coverage
npm run test:package
npm audit
```

The package smoke test installs the tarball with production dependencies in a temporary project and verifies its CLI, API, executable shim, and published declarations. `prepack` rebuilds the package before publishing.

Commit and push the release branch, then wait for its `Test` run to pass. The workflow validates Node 22/24/26 on Linux and Node 26 on macOS and Windows. Keep the version bump and release notes on the release branch; merging `master` is not required to publish a tested version tag.

## Publish the tested commit

Create an annotated tag matching `package.json` exactly and push that tag. For the 0.11 release:

```sh
git tag -a v0.11.0 -m "Release ts-prune 0.11.0"
git push origin v0.11.0
```

The tag must reference the tested release-branch commit. Its workflow reruns the full test matrix, checks the tag/version match, publishes with provenance, and creates the GitHub release from `RELEASE_NOTES.md`.

Publishing uses npm trusted publishing when configured for `nadeesha/ts-prune` and workflow `test.yml`. Otherwise it uses the repository's `NPM_TOKEN` secret, falling back to `NPM_AUTH_TOKEN` when the first secret is absent. The credential must have publish access to ts-prune and satisfy npm's authentication requirements. If publishing fails authentication, renew the repository secret or configure the trusted publisher, then rerun the failed publishing job. Never paste tokens into issues, commits, or logs.

After success, verify the npm version and dist-tag, the GitHub release, and the tagged commit. Do not move a released version tag or publish the same version from a different commit.

## Existing semantic-release tooling

The `semantic-release` script and the existing Makefile publishing targets remain available for the original local `master` workflow. They are separate from the version-tag release path; do not run both for the same release. The 0.11.0 release uses the tested version-tag workflow above.
