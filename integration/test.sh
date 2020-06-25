#!/bin/bash

STEP_COUNTER=0
step () {
  STEP_COUNTER=$(($STEP_COUNTER + 1))
  printf "\n$STEP_COUNTER. $1 \n"
}

step "Creating npm link to the current working tree"
yarn link

step "Change to testproject dir"
cd "$(dirname "$0")"
cd testproject

step "Linking ts-prune from step 1"
yarn link ts-prune

step "Run ts-prune"
ts-prune | tee outfile

step "Diff between outputs"
DIFF=$(diff outfile ../outfile.base)
EXIT_CODE=2
if [ "$DIFF" != "" ] 
then
  echo "The output was not the same as the base"
  echo "---"
  echo $DIFF
  echo "---"
  EXIT_CODE=1
else
  echo "Everything seems to be match! 🎉"
  EXIT_CODE=0
fi

step "Cleanup"
# rm ../../package-lock.json # remnants of the npm link

echo "🏁"
exit $EXIT_CODE
