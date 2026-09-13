#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
exec npm run test:integration
