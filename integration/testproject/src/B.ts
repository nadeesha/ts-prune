export const foo = () => {
  return 1;
};

const bar = 2;

// ts-prune-dont-ignore-next
export type FooType = 1;
export type UnusedFooType = 1;

// ts-prune-ignore-next
export const unusedButIgnored = 1;

export default bar;
