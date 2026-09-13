const js = require("@eslint/js");
const parser = require("@typescript-eslint/parser");

module.exports = [
  { ignores: ["lib/**", ".test-build/**", "coverage/**", "integration/**", "debug-test/**"] },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: { parser, ecmaVersion: "latest", sourceType: "module" },
    rules: {
      ...js.configs.recommended.rules,
      // TypeScript checks these with scope and type information.
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["scripts/**/*.cjs", "*.config.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: { __dirname: "readonly", __filename: "readonly", process: "readonly", console: "readonly", Buffer: "readonly", URL: "readonly" },
    },
    rules: js.configs.recommended.rules,
  },
];
