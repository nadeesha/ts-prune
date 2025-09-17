import { present, USED_IN_MODULE } from "./presenter";
import { State } from "./state";
import { AnalysisResultTypeEnum } from "./analyzer";
import chalk from "chalk";

jest.mock("chalk", () => ({
  green: jest.fn((str) => `GREEN(${str})`),
  yellow: jest.fn((str) => `YELLOW(${str})`),
  cyan: jest.fn((str) => `CYAN(${str})`),
  grey: jest.fn((str) => `GREY(${str})`)
}));

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
        "GREEN(src/utils.ts):YELLOW(10) - CYAN(unusedFunction)",
        "GREEN(src/utils.ts):YELLOW(15) - CYAN(unusedVar)"
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
        "GREEN(src/utils.ts):YELLOW(5) - CYAN(locallyUsed)GREY( (used in module))",
        "GREEN(src/utils.ts):YELLOW(10) - CYAN(notUsed)"
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
        "GREEN(src/components/Button.ts):YELLOW(1) - CYAN(ButtonProps)"
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
        "GREEN(src/utils.ts):YELLOW(5) - CYAN(util1)",
        "GREEN(src/types.ts):YELLOW(2) - CYAN(UnusedType)"
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
        "GREEN(other/src/utils.ts):YELLOW(1) - CYAN(externalUtil)"
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
        "GREEN(utils.ts):YELLOW(1) - CYAN(rootUtil)"
      ]);
    });

    it("should call chalk formatting functions correctly", () => {
      mockState.definitelyUnused.mockReturnValue([
        {
          file: "/project/src/test.ts",
          type: AnalysisResultTypeEnum.POTENTIALLY_UNUSED,
          symbols: [
            { name: "testFunction", line: 42, usedInModule: true }
          ]
        }
      ]);

      present(mockState);

      expect(chalk.green).toHaveBeenCalledWith("src/test.ts");
      expect(chalk.yellow).toHaveBeenCalledWith(42);
      expect(chalk.cyan).toHaveBeenCalledWith("testFunction");
      expect(chalk.grey).toHaveBeenCalledWith(USED_IN_MODULE);
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