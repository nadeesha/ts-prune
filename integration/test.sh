#!/bin/bash

STEP_COUNTER=0
step () {
  STEP_COUNTER=$(($STEP_COUNTER + 1))
  printf "\n$STEP_COUNTER. $1 \n"
}

step "Creating npm link to the current working tree"
npm link

step "Change to testproject dir"
cd "$(dirname "$0")"
cd testproject

step "Linking ts-prune from step 1"
npm link ts-prune

step "Run ts-prune"
ts-prune --skip "skip.me" | tee outfile

step "Diff between outputs"
DIFF=$(diff outfile ../outfile.base)
EXIT_CODE=2
if [ "$DIFF" != "" ] 
then
  echo "The output was not the same as the base"
  echo "---"
  diff outfile ../outfile.base
  echo "---"
  EXIT_CODE=1
else
  echo "Everything seems to be match! 🎉"
  EXIT_CODE=0
fi

step "Run ts-prune with --unusedInModule option"
ts-prune --skip "skip.me" --unusedInModule | tee outfile_unusedInModules

step "Diff between outputs"
DIFF=$(diff outfile_unusedInModules ../outfile_unusedInModules.base)
EXIT_CODE=2
if [ "$DIFF" != "" ] 
then
  echo "The output was not the same as the base"
  echo "---"
  diff outfile_unusedInModules ../outfile_unusedInModules.base
  echo "---"
  EXIT_CODE=1
else
  echo "Everything seems to be match! 🎉"
  EXIT_CODE=0
fi

step "Test exit code with no error flag"
if ! ts-prune > /dev/null; then
  echo "ts-prune with no error flag returned error"
  EXIT_CODE=1
fi

step "Test exit code with error flag"
if ts-prune -e > /dev/null; then
  echo "ts-prune with error flag did not return error"
  EXIT_CODE=1
fi

step "Test exit code with invalid config path"
if ts-prune -p ./tsconfig.nonexistens.json &> /dev/null; then
  echo "ts-prune with invalid config path didn't return error"
  EXIT_CODE=1
fi

step "Test exit code with relative config path"
if ! ts-prune -p ./tsconfig.json > /dev/null; then
  echo "ts-prune with relative config path returned error"
  EXIT_CODE=1
fi

step "Test exit code with absolute config path"
if ! ts-prune -p $(pwd)/tsconfig.json > /dev/null; then
  echo "ts-prune with absolute config path returned error"
  EXIT_CODE=1
fi

step "Cleanup"
rm ../../package-lock.json || true # remnants of the npm link (if exists)
rm outfile # generated outfile
rm outfile_unusedInModules # generated outfile

echo "🏁"
exit $EXIT_CODE
