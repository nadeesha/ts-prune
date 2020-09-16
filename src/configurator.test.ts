import { getConfig } from "./configurator";
describe("getConfig", () => {
  it("should return a sensible default config", () => {
    expect(getConfig()).toMatchInlineSnapshot(`
      Object {
        "project": "tsconfig.json",
      }
    `);
  });
});
