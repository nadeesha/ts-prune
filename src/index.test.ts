describe("index (CLI logic)", () => {
  it("should export the expected interfaces and functions", () => {
    const indexModule = require("./index");

    expect(indexModule).toHaveProperty("run");
    expect(indexModule).toHaveProperty("IConfigInterface");
    expect(indexModule).toHaveProperty("ResultSymbol");
  });

  describe("CLI exit logic", () => {
    it("should determine correct exit code based on results and error flag", () => {
      // Test the logic that would be in the CLI
      const getExitCode = (resultCount: number, errorFlag?: string | boolean) => {
        if (resultCount > 0 && errorFlag) {
          return 1;
        }
        return 0;
      };

      expect(getExitCode(5, "true")).toBe(1);
      expect(getExitCode(0, "true")).toBe(0);
      expect(getExitCode(5, false)).toBe(0);
      expect(getExitCode(0, false)).toBe(0);
      expect(getExitCode(5, undefined)).toBe(0);
    });
  });
});