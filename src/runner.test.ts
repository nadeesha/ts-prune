import fs from "fs";
import { run } from "./runner";
import { IConfigInterface } from "./configurator";
import { Project } from "ts-morph";

jest.mock("fs");
jest.mock("./initializer");
jest.mock("./analyzer");
jest.mock("./presenter");

const mockFs = fs as jest.Mocked<typeof fs>;
const mockInitializer = require("./initializer");
const mockAnalyzer = require("./analyzer");
const mockPresenter = require("./presenter");

describe("runner", () => {
  const mockProject = new Project();
  const mockOutput = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockInitializer.initialize.mockReturnValue({ project: mockProject });
    mockAnalyzer.analyze.mockImplementation(() => {});
    mockPresenter.present.mockReturnValue([]);
  });

  describe("run", () => {
    it("should run with minimal config", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json"
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');

      const result = run(config, mockOutput);

      expect(mockInitializer.initialize).toHaveBeenCalledWith(expect.stringContaining("tsconfig.json"));
      expect(mockAnalyzer.analyze).toHaveBeenCalled();
      expect(mockPresenter.present).toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it("should handle tsconfig with files array", () => {
      const config: IConfigInterface = {
        project: "/project/tsconfig.json"
      };

      mockFs.readFileSync.mockReturnValue('{"files": ["src/index.ts", "src/utils.ts"]}');

      run(config, mockOutput);

      const analyzeCall = mockAnalyzer.analyze.mock.calls[0];
      expect(analyzeCall[2]).toEqual([
        "/project/src/index.ts",
        "/project/src/utils.ts"
      ]);
    });

    it("should handle tsconfig without files array", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json"
      };

      mockFs.readFileSync.mockReturnValue('{"compilerOptions": {}}');

      run(config, mockOutput);

      const analyzeCall = mockAnalyzer.analyze.mock.calls[0];
      expect(analyzeCall[2]).toEqual([]);
    });

    it("should filter results when unusedInModule is true", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json",
        unusedInModule: "true"
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');
      mockPresenter.present.mockReturnValue([
        "file.ts:1 - export1",
        "file.ts:2 - export2 (used in module)",
        "file.ts:3 - export3"
      ]);

      const result = run(config, mockOutput);

      expect(mockOutput).toHaveBeenCalledTimes(2);
      expect(mockOutput).toHaveBeenCalledWith("file.ts:1 - export1");
      expect(mockOutput).toHaveBeenCalledWith("file.ts:3 - export3");
      expect(result).toBe(2);
    });

    it("should filter results when ignore pattern is provided", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json",
        ignore: "test"
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');
      mockPresenter.present.mockReturnValue([
        "src/utils.ts:1 - export1",
        "src/test.ts:2 - export2",
        "src/main.ts:3 - export3"
      ]);

      const result = run(config, mockOutput);

      expect(mockOutput).toHaveBeenCalledTimes(2);
      expect(mockOutput).toHaveBeenCalledWith("src/utils.ts:1 - export1");
      expect(mockOutput).toHaveBeenCalledWith("src/main.ts:3 - export3");
      expect(result).toBe(2);
    });

    it("should handle both unusedInModule and ignore filters", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json",
        unusedInModule: "true",
        ignore: "test"
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');
      mockPresenter.present.mockReturnValue([
        "src/utils.ts:1 - export1",
        "src/utils.ts:2 - export2 (used in module)",
        "src/test.ts:3 - export3",
        "src/main.ts:4 - export4"
      ]);

      const result = run(config, mockOutput);

      expect(mockOutput).toHaveBeenCalledTimes(2);
      expect(mockOutput).toHaveBeenCalledWith("src/utils.ts:1 - export1");
      expect(mockOutput).toHaveBeenCalledWith("src/main.ts:4 - export4");
      expect(result).toBe(2);
    });

    it("should pass skip pattern to analyzer", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json",
        skip: "\\.test\\."
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');

      run(config, mockOutput);

      const analyzeCall = mockAnalyzer.analyze.mock.calls[0];
      expect(analyzeCall[3]).toBe("\\.test\\.");
    });

    it("should return correct count of filtered results", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json"
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');
      mockPresenter.present.mockReturnValue([
        "file1.ts:1 - export1",
        "file2.ts:2 - export2",
        "file3.ts:3 - export3"
      ]);

      const result = run(config, mockOutput);

      expect(result).toBe(3);
    });

    it("should handle empty results", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json"
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');
      mockPresenter.present.mockReturnValue([]);

      const result = run(config, mockOutput);

      expect(mockOutput).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it("should resolve relative project paths", () => {
      const config: IConfigInterface = {
        project: "./custom/tsconfig.json"
      };

      mockFs.readFileSync.mockReturnValue('{"files": []}');

      run(config, mockOutput);

      expect(mockInitializer.initialize).toHaveBeenCalledWith(
        expect.stringMatching(/custom\/tsconfig\.json$/)
      );
    });

    it("should handle JSON5 tsconfig files", () => {
      const config: IConfigInterface = {
        project: "tsconfig.json"
      };

      // JSON5 with comments and trailing commas
      mockFs.readFileSync.mockReturnValue(`{
        // TypeScript configuration
        "files": [
          "src/index.ts",
          "src/utils.ts", // trailing comma
        ],
        "compilerOptions": {
          "strict": true,
        }
      }`);

      expect(() => run(config, mockOutput)).not.toThrow();

      const analyzeCall = mockAnalyzer.analyze.mock.calls[0];
      expect(analyzeCall[2]).toHaveLength(2);
    });
  });
});