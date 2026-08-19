import test from "node:test";
import assert from "node:assert/strict";
import { POSE_LIBRARY } from "../poses.js";

test("標準人体イラストを23種類収録する", () => {
  assert.equal(POSE_LIBRARY.length, 23);
  assert.equal(new Set(POSE_LIBRARY.map((pose) => pose.id)).size, 23);
  assert.ok(POSE_LIBRARY.every((pose) => pose.image.endsWith(".webp")));
});

test("全カリキュラムに十分なポーズがある", () => {
  for (const theme of ["gesture", "torso", "proportion", "foreshortening", "twist", "dynamic"]) {
    assert.ok(POSE_LIBRARY.filter((pose) => pose.tags.includes(theme)).length >= 6, `${theme} needs at least 6 poses`);
  }
});

test("全構造オーバーレイは画像キャンバス内にある", () => {
  for (const pose of POSE_LIBRARY) {
    const { chest, pelvis, gravity } = pose.overlay;
    for (const [name, point] of [["chest", chest], ["pelvis", pelvis]]) {
      assert.ok(point[0] >= 0 && point[0] <= 100, `${pose.id}.${name}.x`);
      assert.ok(point[1] >= 0 && point[1] <= 133.5, `${pose.id}.${name}.y`);
    }
    assert.ok(gravity.every(Number.isFinite), `${pose.id}.gravity`);
  }
});
