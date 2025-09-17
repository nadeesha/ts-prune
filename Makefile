.PHONY: build test publish publish-dry clean check-auth

# Build the project
build:
	npm run build

# Run tests
test:
	npm test
	npm run test:integration

# Clean build artifacts
clean:
	rm -rf lib/

# Prepare for publishing
prepare-publish: clean test build
	@echo "Project built and tested successfully"

# Dry run to see what would be released (analyze commits without publishing)
publish-dry:
	npm run semantic-release -- --dry-run

# Publish using semantic-release (analyzes commits and publishes if needed)
publish: prepare-publish
	@echo "Running semantic-release to analyze commits and publish if needed..."
	npm run semantic-release

# Check current npm authentication
check-auth:
	npm whoami

# Check GitHub token
check-github:
	@if [ -z "$$GITHUB_TOKEN" ]; then \
		echo "ERROR: GITHUB_TOKEN is not set"; \
		echo "Export it with: export GITHUB_TOKEN=your_github_token"; \
		exit 1; \
	else \
		echo "GITHUB_TOKEN is set"; \
	fi

# Check NPM token
check-npm:
	@if [ -z "$$NPM_TOKEN" ]; then \
		echo "ERROR: NPM_TOKEN is not set"; \
		echo "Export it with: export NPM_TOKEN=your_npm_token"; \
		exit 1; \
	else \
		echo "NPM_TOKEN is set"; \
	fi

# Check all required tokens
check-tokens: check-github check-npm
	@echo "All required tokens are set"