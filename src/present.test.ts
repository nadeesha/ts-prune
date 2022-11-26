import { State } from "./state";
import { AnalysisResultTypeEnum } from "./analyzer";
import { present } from "./presenter";

describe("present", () => {
  describe("when given state with unused exports", () => {
    const state = new State();

    [
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "foo", line: 0, usedInModule: false }],
        file: "foo.ts",
      },
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "bar", line: 0, usedInModule: false }],
        file: "bar.ts",
      },
    ].forEach((result) => state.onResult(result));

    it("should produce a presentable output", () => {
      expect(present(state)).toMatchInlineSnapshot(`
        [
          "[32mfoo.ts[39m:[33m0[39m - [36mfoo[39m",
          "[32mbar.ts[39m:[33m0[39m - [36mbar[39m",
        ]
      `);
    });
  });

  describe("when given state with no unused exports", () => {
    const state = new State();

    [
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "foo", line: 0, usedInModule: false }],
        file: "foo.ts",
      },
      {
        type: AnalysisResultTypeEnum.DEFINITELY_USED,
        symbols: [{ name: "foo", line: 0, usedInModule: false }],
        file: "foo.ts",
      },
    ].forEach((result) => state.onResult(result));

    it("should produce an empty output", () => {
      expect(JSON.stringify(present(state))).toBe(JSON.stringify([]));
    });
  });

  describe("when given state with exports used in own module", () => {
    const state = new State();

    [
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "foo", line: 0, usedInModule: true }],
        file: "foo.ts",
      },
      {
        type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
        symbols: [{ name: "bar", line: 0, usedInModule: false }],
        file: "bar.ts",
      },
    ].forEach((result) => state.onResult(result));

    it("should produce a presentable output", () => {
      expect(present(state)).toMatchInlineSnapshot(`
        [
          "[32mfoo.ts[39m:[33m0[39m - [36mfoo[39m[90m (used in module)[39m",
          "[32mbar.ts[39m:[33m0[39m - [36mbar[39m",
        ]
      `);
    });
  });
});
