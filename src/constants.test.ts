import { ignoreComment } from "./constants";

describe("constants", () => {
  describe("ignoreComment", () => {
    it("should have the correct ignore comment value", () => {
      expect(ignoreComment).toBe("ts-prune-ignore-next");
    });

    it("should be a string", () => {
      expect(typeof ignoreComment).toBe("string");
    });

    it("should not be empty", () => {
      expect(ignoreComment.length).toBeGreaterThan(0);
    });

    it("should match expected pattern for ignore comments", () => {
      expect(ignoreComment).toMatch(/^ts-prune-ignore/);
    });
  });
});