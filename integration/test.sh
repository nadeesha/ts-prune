#!/bin/bash

# increment this on any change to the current script
BENCHMARK_SCRIPT_VERSION="4"

echo "1. Creating npm link to the current working tree"
npm link

cd "$(dirname "$0")"
cd testproject

echo "3. Linking ts-prune from step 1"
npm link ts-prune

echo "4. Run ts-prune"
ts-prune
