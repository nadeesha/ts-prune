import { getConfig } from "./configurator";
describe("getConfig", () => {
  it("should return a sensible default config", () => {
    expect(getConfig()).toMatchInlineSnapshot(`
      {
        "error": [Function],
        "project": "tsconfig.json",
      }
    `);
  });
});
