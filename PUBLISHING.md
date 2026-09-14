# Publishing

Publishing is manual. The `Test` workflow runs automatically on pull requests, pushes to `master` and `codex/**`, and `v*` tags. It has no publishing job or publishing credentials. The separate `Release` workflow publishes only when you start it with **Run workflow** or `gh workflow run`.

## One-time setup

Merge the workflow changes into `master`. GitHub requires a workflow with `workflow_dispatch` to exist on the default branch before it can be started manually. See [GitHub's manual workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

Prefer [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for authentication. In the ts-prune package settings on npm, configure:

- GitHub owner: `nadeesha`
- Repository: `ts-prune`
- Workflow filename: `release.yml`
- Allow direct publishing with `npm publish`.

The workflow requests an OIDC token only in the publishing job and publishes with provenance. If an existing trusted publisher names `test.yml`, replace it with one for `release.yml`. Alternatively, the workflow accepts the repository's `NPM_TOKEN` secret, falling back to `NPM_AUTH_TOKEN` if the first is absent. Tokens must have publish access to ts-prune and satisfy npm's authentication requirements.

## Prepare a version

Use the Node version in `.nvmrc`. On a release branch, update the package version and `RELEASE_NOTES.md`. Update the README if usage or requirements changed; it does not need a release announcement for every version.

```sh
npm version minor --no-git-tag-version --ignore-scripts
npm ci
npm run check
npm run test:coverage
npm run test:package
npm audit
```

Commit and push the changes, then wait for CI. The package smoke test installs a tarball with production dependencies in a temporary project and verifies the CLI, CommonJS API, executable shim, and declarations. `prepack` rebuilds the package before publishing.

Create an annotated version tag on the commit you intend to publish. The tag must match `package.json`: a package version of `1.2.3` requires `v1.2.3`. Push that tag when ready. Tag creation and pushes run tests but do not publish with the updated workflows.

Use a new tag for each version. Do not move existing release tags. The release workflow accepts stable versions; prerelease tags are rejected because this workflow publishes to npm's `latest` dist-tag.

## Publish when ready

1. Open **Actions → Release → Run workflow**.
2. Select the branch whose current commit matches the tag (for example, the release branch, or `master` if the tag points to its latest commit).
3. Enter the existing version tag to publish.
4. Click **Run workflow**.

The equivalent CLI command is:

```sh
gh workflow run release.yml --ref v1.2.3 -f tag=v1.2.3
```

The workflow resolves that tag to a commit and checks its package name and version. It then reruns the shared test matrix on that exact commit: Node 22/24/26 on Linux, and Node 26 on macOS and Windows. Only after all checks pass does it install dependencies, rebuild, publish to npm with provenance, and create the GitHub release from the tagged `RELEASE_NOTES.md`.

The branch selected in the UI supplies the workflow definition; the tag input selects the code being released. Their commits must match because npm provenance records the workflow's commit. If the branch has moved on, use the CLI command above to run directly from the tag. The selected commit must contain `release.yml` and its supporting scripts. Publishing uses the tested commit, and fails if the tag has moved during the run. Release runs are serialized so two publishes cannot run concurrently.

## Check the result or retry

After success, verify the npm version and `latest` dist-tag, the GitHub release, and the tagged commit.

If authentication fails before npm accepts the package, fix the trusted publisher or repository secret, then rerun the failed `Release` job. Never paste tokens into issues, commits, or logs. Do not rerun the old `Test` workflow's publishing job: historical workflow runs retain the old publishing behavior.

If npm succeeded but GitHub release creation failed, create the GitHub release for the existing tag separately. Do not attempt to publish the same npm version again.

## Existing semantic-release tooling

The `semantic-release` script and Makefile publishing targets remain available for the original local `master` workflow. They run only when explicitly invoked and are separate from the manual GitHub Actions release process. Use one publishing path per version.
