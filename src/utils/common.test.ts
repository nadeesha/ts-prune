import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { countBy, differenceBy, last, pick } from "./common";

describe("dependency-free collection utilities", () => {
  it("preserves order, references and duplicates when taking a difference", () => {
    const first = { id: 2, name: "first" };
    const duplicate = { id: 2, name: "second" };
    assert.deepEqual(differenceBy((item) => item.id, [first, { id: 1, name: "removed" }, duplicate, first], [{ id: 1, name: "other" }]), [first, duplicate, first]);
    assert.deepEqual(differenceBy((item) => item, [], []), []);
    assert.deepEqual(differenceBy((item) => item, [NaN, 0, -0, 1], [NaN, 0]), [1]);
  });

  it("picks present properties including inherited ones and retains undefined", () => {
    const value = Object.assign(Object.create({ inherited: 2 }), { present: 1, empty: undefined });
    assert.deepEqual(pick(["present", "absent", "inherited", "empty"])(value), { present: 1, inherited: 2, empty: undefined });
    assert.deepEqual(pick([])({ present: 1 }), {});
  });

  it("counts values after string conversion, including duplicates and empty input", () => {
    assert.deepEqual(countBy((value: string | number) => value)([1, "1", 2, 1]), { 1: 3, 2: 1 });
    assert.deepEqual(countBy((value) => value)([]), {});
  });

  it("counts inherited object keys as ordinary own properties", () => {
    const keys = ["constructor", "toString", "hasOwnProperty", "__proto__"];
    const result = countBy((value: string) => value)([...keys, ...keys]);
    assert.deepEqual(Object.entries(result), keys.map((key) => [key, 2]));
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
  });

  it("returns the final element without mutating its input", () => {
    const values = [1, 2, 2];
    assert.equal(last(values), 2);
    assert.deepEqual(values, [1, 2, 2]);
    assert.equal(last([]), undefined);
  });
});
