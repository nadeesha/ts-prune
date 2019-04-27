import { run } from "./runner";

export function foo() {
  return "bar";
}

export function baz() {
  return "bar";
}

describe("runner", () => {
  it("should find the unused foo and bar exports", () => {
    const mockWriter: any = {
      write: jest.fn()
    };

    run([], mockWriter);

    expect(mockWriter.write).toHaveBeenCalledTimes(2);

    expect(mockWriter.write.mock.calls[0][0]).toMatch(
      "foo @ /Users/nadeesha/ts-deadcode-search/src/runner.test.ts:3"
    );

    expect(mockWriter.write.mock.calls[1][0]).toMatch(
      "baz @ /Users/nadeesha/ts-deadcode-search/src/runner.test.ts:7"
    );
  });
});
