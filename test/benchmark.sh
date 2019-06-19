#!/bin/bash

# increment this on any change to the current script
BENCHMARK_SCRIPT_VERSION="4"

echo "0. Building current source"
yarn build

echo "1. Creating npm link to the current working tree"
npm link

cd "$(dirname "$0")"

# echo "2. Initializing test repository"
# rm -rf testproject
# git clone git@github.com:gcanti/fp-ts.git testproject
cd testproject
# git checkout 3ce5cb0e02fdafd1cc66e5e868b942d61402c98e

echo "3. Linking ts-prune from step 1"
npm link ts-prune

echo "5. Run ts-prune"
TIME_START=`date +%s`
ts-prune
TIME_END=`date +%s`
COMPLETED_ON=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
HOSTNAME=`hostname`

HASHED_HOSTNAME=`cksum <<< 'asdfasdf' | cut -f 1 -d ' '`

echo "6. Writing to benchmark history"
echo "VERSION-$BENCHMARK_SCRIPT_VERSION $HASHED_HOSTNAME $COMPLETED_ON $((TIME_END-TIME_START))" >> ./benchmark_history.txt

echo "7. Cleaning up"
rm package-lock.json

tail -1 ./benchmark_history.txt