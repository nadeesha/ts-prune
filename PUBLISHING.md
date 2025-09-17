# Publishing Guide

This guide describes how to publish new versions of ts-prune to npm from your local machine using semantic-release.

## How Semantic Release Works

Semantic-release automates the version management and package publishing by analyzing your git commit messages. It:
1. Analyzes commits since the last release
2. Determines the version bump type (major, minor, or patch) based on commit messages
3. Creates a new git tag and GitHub release
4. Publishes to npm

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

- `fix:` - Bug fixes (triggers PATCH release: 0.10.4 → 0.10.5)
- `feat:` - New features (triggers MINOR release: 0.10.4 → 0.11.0)
- `BREAKING CHANGE:` in commit body or `!` after type (triggers MAJOR release: 0.10.4 → 1.0.0)
- Other types (`docs:`, `chore:`, `style:`, `refactor:`, `test:`) don't trigger releases

Examples:
```bash
git commit -m "fix: resolve issue with unused export detection"
git commit -m "feat: add support for TypeScript 5.0"
git commit -m "feat!: change CLI interface"
```

## Prerequisites

### 1. Required Tokens

You need two authentication tokens set as environment variables:

#### GitHub Token
Create a personal access token with `repo` scope at https://github.com/settings/tokens

```bash
export GITHUB_TOKEN=your_github_token_here
```

#### NPM Token
Create an automation token at https://www.npmjs.com/settings/your-username/tokens

```bash
export NPM_TOKEN=your_npm_token_here
```

### 2. Verify Setup

Check that all tokens are properly configured:

```bash
make check-tokens  # Verifies both GITHUB_TOKEN and NPM_TOKEN are set
make check-auth    # Verifies npm authentication
```

### 3. Clean Working Directory

Ensure your git working directory is clean and you're on the master branch:

```bash
git checkout master
git pull origin master
git status  # Should show no uncommitted changes
```

## Publishing Process

### 1. Dry Run (Recommended)

First, do a dry run to see what semantic-release would do without actually publishing:

```bash
make publish-dry
```

This will:
- Analyze commit messages since the last release
- Show what version would be published
- Display what changes would be included
- NOT actually publish anything

### 2. Publish

Once you're satisfied with the dry run results:

```bash
make publish
```

This will:
1. Clean build artifacts
2. Run all tests (unit and integration)
3. Build the TypeScript project
4. Run semantic-release, which will:
   - Analyze commits since last release
   - Determine if a release is needed
   - Calculate the new version number
   - Update package.json
   - Create a git tag
   - Create a GitHub release with release notes
   - Publish to npm
   - Push changes back to GitHub

## Manual Semantic Release (Advanced)

If you need more control, you can run semantic-release directly:

```bash
# Dry run with debug output
npm run semantic-release -- --dry-run --debug

# Run with specific configuration
npm run semantic-release -- --no-ci

# Run from a specific branch
npm run semantic-release -- --branches my-branch
```

## Troubleshooting

### No Release Published

If semantic-release doesn't publish anything:
- Check that you have qualifying commits (`fix:`, `feat:`, etc.) since the last release
- Verify you're on the correct branch (master)
- Run with debug flag: `npm run semantic-release -- --dry-run --debug`

### Token Issues

If you get authentication errors:

```bash
# Check tokens are set
make check-tokens

# Re-export tokens if needed
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
export NPM_TOKEN=npm_xxxxxxxxxxxx
```

### Build or Test Failures

The publish process will stop if tests or build fail:

```bash
# Run tests separately
make test

# Build separately
make build
```

## Post-Publish

After successful publishing, semantic-release will have:

1. Updated the version in package.json
2. Created a git tag (e.g., v0.11.0)
3. Created a GitHub release with changelog
4. Published the package to npm
5. Pushed all changes to GitHub

You can verify the release:
- Check npm: https://www.npmjs.com/package/ts-prune
- Check GitHub releases: https://github.com/nadeesha/ts-prune/releases

## CI/CD Note

The GitHub Actions workflow now only runs tests and builds on push to master. All publishing must be done manually from a local machine using this guide to ensure proper review and control over releases.