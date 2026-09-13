import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import { present, USED_IN_MODULE } from "./presenter";
import { State } from "./state";
import { AnalysisResultTypeEnum, IAnalysedResult } from "./analyzer";

describe("presenter", () => {
  let state: State;
  const setResults = (results: IAnalysedResult[]) => {
    results.forEach((result) => state.onResult(result));
  };

  beforeEach(() => {
    state = new State();
    mock.method(process, "cwd", () => "/project");
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe("present", () => {
    it("formats Windows paths with the same relative slash output", () => {
      mock.method(process, "cwd", () => "C:\\project");
      setResults([
        {
          file: "C:\\project\\src\\utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [{ name: "unused", line: 1, usedInModule: false }],
        },
        {
          file: "C:/project/src/types.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [{ name: "UnusedType", line: 2, usedInModule: false }],
        },
      ]);

      assert.deepEqual(present(state), [
        "src/utils.ts:1 - unused",
        "src/types.ts:2 - UnusedType",
      ]);
    });

    it("should format output for unused exports", () => {
      setResults([
        {
          file: "/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "unusedFunction", line: 10, usedInModule: false },
            { name: "unusedVar", line: 15, usedInModule: false }
          ]
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, [
        "src/utils.ts:10 - unusedFunction",
        "src/utils.ts:15 - unusedVar"
      ]);
    });

    it("should handle exports used in module", () => {
      setResults([
        {
          file: "/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "locallyUsed", line: 5, usedInModule: true },
            { name: "notUsed", line: 10, usedInModule: false }
          ]
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, [
        "src/utils.ts:5 - locallyUsed (used in module)",
        "src/utils.ts:10 - notUsed"
      ]);
    });

    it("should remove project root from file paths", () => {
      setResults([
        {
          file: "/project/src/components/Button.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "ButtonProps", line: 1, usedInModule: false }
          ]
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, [
        "src/components/Button.ts:1 - ButtonProps"
      ]);
    });

    it("should handle multiple files", () => {
      setResults([
        {
          file: "/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "util1", line: 5, usedInModule: false }
          ]
        },
        {
          file: "/project/src/types.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "UnusedType", line: 2, usedInModule: false }
          ]
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, [
        "src/utils.ts:5 - util1",
        "src/types.ts:2 - UnusedType"
      ]);
    });

    it("should handle empty results", () => {
      setResults([]);

      const result = present(state);

      assert.deepEqual(result, []);
    });

    it("should handle files with no unused symbols", () => {
      setResults([
        {
          file: "/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: []
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, []);
    });

    it("should handle absolute paths outside project root", () => {
      setResults([
        {
          file: "/other/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "externalUtil", line: 1, usedInModule: false }
          ]
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, [
        "other/src/utils.ts:1 - externalUtil"
      ]);
    });

    it("should handle file paths with leading slash after cwd removal", () => {
      setResults([
        {
          file: "/project/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "rootUtil", line: 1, usedInModule: false }
          ]
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, [
        "utils.ts:1 - rootUtil"
      ]);
    });

    it("should format output without color codes", () => {
      setResults([
        {
          file: "/project/src/test.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "testFunction", line: 42, usedInModule: true }
          ]
        }
      ]);

      const result = present(state);

      assert.deepEqual(result, [
        "src/test.ts:42 - testFunction (used in module)"
      ]);
    });

    it("should flatten results from multiple files correctly", () => {
      setResults([
        {
          file: "/project/file1.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "export1", line: 1, usedInModule: false },
            { name: "export2", line: 2, usedInModule: false }
          ]
        },
        {
          file: "/project/file2.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "export3", line: 1, usedInModule: false }
          ]
        }
      ]);

      const result = present(state);

      assert.equal((result).length, 3);
      assert.ok((result[0]).includes("file1.ts"));
      assert.ok((result[1]).includes("file1.ts"));
      assert.ok((result[2]).includes("file2.ts"));
    });
  });

  describe("USED_IN_MODULE constant", () => {
    it("should have the correct value", () => {
      assert.equal(USED_IN_MODULE, " (used in module)");
    });
  });
});
