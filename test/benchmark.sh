yarn init -y
cp ../tsconfig.json ./tsconfig.json
mkdir src

for n in {1..999}
do
    cat testFilContent.template | sed -En "s/__n__/$(expr $n - 1)/g" > "src/$n.ts"
done
