import { present, USED_IN_MODULE } from "./presenter";
import { State } from "./state";
import { AnalysisResultTypeEnum } from "./analyzer";

describe("presenter", () => {
  let mockState: jest.Mocked<State>;
  const originalCwd = process.cwd();

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      definitelyUnused: jest.fn()
    } as any;

    // Mock process.cwd() to return a consistent value
    jest.spyOn(process, 'cwd').mockReturnValue('/project');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("present", () => {
    it("should format output for unused exports", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "unusedFunction", line: 10, usedInModule: false },
            { name: "unusedVar", line: 15, usedInModule: false }
          ]
        }
      ]);

      const result = present(mockState);

      expect(result).toEqual([
        "src/utils.ts:10 - unusedFunction",
        "src/utils.ts:15 - unusedVar"
      ]);
    });

    it("should handle exports used in module", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "locallyUsed", line: 5, usedInModule: true },
            { name: "notUsed", line: 10, usedInModule: false }
          ]
        }
      ]);

      const result = present(mockState);

      expect(result).toEqual([
        "src/utils.ts:5 - locallyUsed (used in module)",
        "src/utils.ts:10 - notUsed"
      ]);
    });

    it("should remove project root from file paths", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/project/src/components/Button.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "ButtonProps", line: 1, usedInModule: false }
          ]
        }
      ]);

      const result = present(mockState);

      expect(result).toEqual([
        "src/components/Button.ts:1 - ButtonProps"
      ]);
    });

    it("should handle multiple files", () => {
      mockState.definitelyUnused.mockReturnValue([
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

      const result = present(mockState);

      expect(result).toEqual([
        "src/utils.ts:5 - util1",
        "src/types.ts:2 - UnusedType"
      ]);
    });

    it("should handle empty results", () => {
      mockState.definitelyUnused.mockReturnValue([]);

      const result = present(mockState);

      expect(result).toEqual([]);
    });

    it("should handle files with no unused symbols", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: []
        }
      ]);

      const result = present(mockState);

      expect(result).toEqual([]);
    });

    it("should handle absolute paths outside project root", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/other/project/src/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "externalUtil", line: 1, usedInModule: false }
          ]
        }
      ]);

      const result = present(mockState);

      expect(result).toEqual([
        "other/src/utils.ts:1 - externalUtil"
      ]);
    });

    it("should handle file paths with leading slash after cwd removal", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/project/utils.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "rootUtil", line: 1, usedInModule: false }
          ]
        }
      ]);

      const result = present(mockState);

      expect(result).toEqual([
        "utils.ts:1 - rootUtil"
      ]);
    });

    it("should format output without color codes", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/project/src/test.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "testFunction", line: 42, usedInModule: true }
          ]
        }
      ]);

      const result = present(mockState);

      expect(result).toEqual([
        "src/test.ts:42 - testFunction (used in module)"
      ]);
    });

    it("should flatten results from multiple files correctly", () => {
      mockState.definitelyUnused.mockReturnValue([
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

      const result = present(mockState);

      expect(result).toHaveLength(3);
      expect(result[0]).toContain("file1.ts");
      expect(result[1]).toContain("file1.ts");
      expect(result[2]).toContain("file2.ts");
    });
  });

  describe("USED_IN_MODULE constant", () => {
    it("should have the correct value", () => {
      expect(USED_IN_MODULE).toBe(" (used in module)");
    });
  });
});