async function test1() {
  const mything = await import("./succ");
  console.log(mything);
}

async function test2() {
  // won't work for dynamic strings obviously
  const mything = await import(`${"./fail"}`);
  console.log(mything);
}
