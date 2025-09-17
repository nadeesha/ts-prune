import { getConfig } from "./configurator";

jest.mock("commander", () => ({
  allowUnknownOption: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  parse: jest.fn().mockReturnValue({
    project: "tsconfig.json"
  })
}));

jest.mock("cosmiconfig", () => ({
  cosmiconfigSync: jest.fn(() => ({
    search: jest.fn(() => null)
  }))
}));

describe("configurator", () => {
  const originalArgv = process.argv;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe("getConfig", () => {
    it("should return a sensible default config", () => {
      expect(getConfig()).toMatchInlineSnapshot(`
        Object {
          "project": "tsconfig.json",
        }
      `);
    });

    it("should merge default, file, and CLI configs in correct order", () => {
      const mockCommander = require("commander");
      const mockCosmiconfig = require("cosmiconfig");

      mockCommander.parse.mockReturnValue({
        project: "cli-tsconfig.json",
        error: true
      });

      mockCosmiconfig.cosmiconfigSync.mockReturnValue({
        search: jest.fn(() => ({
          config: {
            project: "file-tsconfig.json",
            ignore: "file-ignore-pattern",
            skip: "file-skip-pattern"
          }
        }))
      });

      const config = getConfig();

      expect(config).toEqual({
        project: "cli-tsconfig.json", // CLI overrides file config
        ignore: "file-ignore-pattern", // From file config
        skip: "file-skip-pattern", // From file config
        error: true // From CLI
      });
    });

    it("should handle CLI options correctly", () => {
      const mockCommander = require("commander");

      mockCommander.parse.mockReturnValue({
        project: "custom.tsconfig.json",
        ignore: "test.*",
        error: true,
        skip: "\\.spec\\.",
        unusedInModule: true
      });

      const config = getConfig();

      expect(config.project).toBe("custom.tsconfig.json");
      expect(config.ignore).toBe("test.*");
      expect(config.error).toBe(true);
      expect(config.skip).toBe("\\.spec\\.");
      expect(config.unusedInModule).toBe(true);
    });

    it("should handle file config without CLI overrides", () => {
      const mockCommander = require("commander");
      const mockCosmiconfig = require("cosmiconfig");

      mockCommander.parse.mockReturnValue({
        project: "tsconfig.json" // Only default value
      });

      mockCosmiconfig.cosmiconfigSync.mockReturnValue({
        search: jest.fn(() => ({
          config: {
            ignore: "node_modules",
            error: false,
            skip: "\\.test\\."
          }
        }))
      });

      const config = getConfig();

      expect(config).toEqual({
        project: "tsconfig.json",
        ignore: "node_modules",
        error: false,
        skip: "\\.test\\."
      });
    });

    it("should handle missing config file", () => {
      const mockCommander = require("commander");
      const mockCosmiconfig = require("cosmiconfig");

      mockCommander.parse.mockReturnValue({
        project: "tsconfig.json"
      });

      mockCosmiconfig.cosmiconfigSync.mockReturnValue({
        search: jest.fn(() => null) // No config file found
      });

      const config = getConfig();

      expect(config).toEqual({
        project: "tsconfig.json"
      });
    });

    it("should handle empty file config", () => {
      const mockCommander = require("commander");
      const mockCosmiconfig = require("cosmiconfig");

      mockCommander.parse.mockReturnValue({
        project: "tsconfig.json"
      });

      mockCosmiconfig.cosmiconfigSync.mockReturnValue({
        search: jest.fn(() => ({
          config: {} // Empty config object
        }))
      });

      const config = getConfig();

      expect(config).toEqual({
        project: "tsconfig.json"
      });
    });

    it("should filter unknown CLI options", () => {
      const mockCommander = require("commander");

      mockCommander.parse.mockReturnValue({
        project: "tsconfig.json",
        ignore: "valid-option",
        unknownOption: "should-be-filtered",
        version: "should-be-filtered",
        help: "should-be-filtered"
      });

      const config = getConfig();

      expect(config).toEqual({
        project: "tsconfig.json",
        ignore: "valid-option"
      });
      expect(config).not.toHaveProperty("unknownOption");
      expect(config).not.toHaveProperty("version");
      expect(config).not.toHaveProperty("help");
    });

    it("should handle boolean flags correctly", () => {
      const mockCommander = require("commander");

      mockCommander.parse.mockReturnValue({
        project: "tsconfig.json",
        error: true,
        unusedInModule: true
      });

      const config = getConfig();

      expect(config.error).toBe(true);
      expect(config.unusedInModule).toBe(true);
    });

    it("should handle all supported CLI options", () => {
      const mockCommander = require("commander");

      mockCommander.parse.mockReturnValue({
        project: "custom.json",
        ignore: "ignore-pattern",
        error: true,
        skip: "skip-pattern",
        unusedInModule: true
      });

      const config = getConfig();

      expect(config).toEqual({
        project: "custom.json",
        ignore: "ignore-pattern",
        error: true,
        skip: "skip-pattern",
        unusedInModule: true
      });
    });

    it("should handle config file search errors gracefully", () => {
      const mockCommander = require("commander");
      const mockCosmiconfig = require("cosmiconfig");

      mockCommander.parse.mockReturnValue({
        project: "tsconfig.json"
      });

      mockCosmiconfig.cosmiconfigSync.mockReturnValue({
        search: jest.fn(() => {
          throw new Error("Config search error");
        })
      });

      expect(() => getConfig()).toThrow("Config search error");
    });
  });
});
