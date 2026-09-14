import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ignoreComment } from "./constants";

describe("constants", () => {
  describe("ignoreComment", () => {
    it("should have the correct ignore comment value", () => {
      assert.equal(ignoreComment, "ts-prune-ignore-next");
    });

    it("should be a string", () => {
      assert.equal(typeof ignoreComment, "string");
    });

    it("should not be empty", () => {
      assert.ok((ignoreComment.length) > 0);
    });

    it("should match expected pattern for ignore comments", () => {
      assert.match(ignoreComment, /^ts-prune-ignore/);
    });
  });
});