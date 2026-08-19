import test from "node:test";
import assert from "node:assert/strict";
import { POSE_LIBRARY } from "../poses.js";

test("標準ポーズを72種類収録する", () => {
  assert.equal(POSE_LIBRARY.length, 72);
  assert.equal(new Set(POSE_LIBRARY.map((pose) => pose.id)).size, 72);
});

test("全カリキュラムに十分なポーズがある", () => {
  for (const theme of ["gesture", "torso", "proportion", "foreshortening", "twist", "dynamic"]) {
    assert.ok(POSE_LIBRARY.filter((pose) => pose.tags.includes(theme)).length >= 12, `${theme} needs at least 12 poses`);
  }
});

test("全関節はSVGキャンバス内にある", () => {
  for (const pose of POSE_LIBRARY) {
    for (const [name, [x, y]] of Object.entries(pose.points)) {
      assert.ok(x >= 0 && x <= 100, `${pose.id}.${name}.x`);
      assert.ok(y >= 0 && y <= 140, `${pose.id}.${name}.y`);
    }
  }
});
