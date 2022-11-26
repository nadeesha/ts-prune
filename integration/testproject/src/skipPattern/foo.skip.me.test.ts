import { foo } from "./foo";

describe("foo", () => {
  it("should return false", () => {
    expect(foo()).toBeFalsy;
  });
});
