import { run } from "./runner";

export function unusedFooFunction() {
  return "bar";
}

export function unusedBarFunction() {
  return "bar";
}

describe("runner", () => {
  it("should find the unused unusedFooFunction and unusedBarFunction exports", () => {
    const mockWriter: any = {
      write: jest.fn()
    };

    run([], mockWriter);

    expect(mockWriter.write).toHaveBeenCalledTimes(2);

    expect(mockWriter.write.mock.calls[0][0]).toMatch(
      "unusedFooFunction @ /Users/nadeesha/ts-deadcode-search/src/runner.test.ts:3"
    );

    expect(mockWriter.write.mock.calls[1][0]).toMatch(
      "unusedBarFunction @ /Users/nadeesha/ts-deadcode-search/src/runner.test.ts:7"
    );
  });
});
