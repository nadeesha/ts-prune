import { getConfig } from "./configurator";
describe("getConfig", () => {
  it("should return a sensible default config", () => {
    expect(getConfig()).toMatchInlineSnapshot(`
      Object {
        "error": undefined,
        "ignore": undefined,
        "output": "text",
        "project": "tsconfig.json",
        "skip": undefined,
      }
    `);
  });
});
