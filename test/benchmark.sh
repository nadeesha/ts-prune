#!/bin/bash

# increment this on any change to the current script
BENCHMARK_SCRIPT_VERSION="0"

echo "1. Creating npm link to the current working tree"
npm link

cd "$(dirname "$0")"

echo "2. Initializing package.json and tsconfig.json"
yarn init -y
cp ../tsconfig.json ./tsconfig.json

echo "3. Linking ts-prune from step 1"
npm link ts-prune

echo "4. Generating files in the src..."
rm -rf src
mkdir src
cp 0.template src/0.ts

for n in {1..1000}
do
  let REFER_TO=n-1
  cat testFileContent.template | sed "s/__n__/$REFER_TO/g" > "src/$n.ts"
done

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