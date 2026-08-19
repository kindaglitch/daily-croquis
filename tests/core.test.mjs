import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultState, migrateState, mergeStates, parseGrade, calculateStreak,
  selectDailyPoses, shiftYmd, ymd, curriculumForDay
} from "../core.js";

test("日付処理は月境界をまたぐ", () => {
  assert.equal(shiftYmd("2026-03-01", -1), "2026-02-28");
  assert.match(ymd(new Date(2026, 7, 19)), /^2026-08-19$/);
});

test("60日カリキュラムが循環する", () => {
  assert.equal(curriculumForDay(1).cycle, 1);
  assert.equal(curriculumForDay(61).cycle, 1);
  assert.equal(curriculumForDay(46).curriculum.id, "dynamic");
});

test("旧V2データを失わずに移行する", () => {
  const legacy = { days: { "2026-08-18": { poses: [true, false, true], note: "記録", saved: true, score: 70, comment: "よい" } } };
  const state = migrateState(legacy, "2026-08-19", "2026-08-18");
  assert.equal(state.version, 5);
  assert.deepEqual(state.days["2026-08-18"].legacyPoses, [true, false, true]);
  assert.equal(state.days["2026-08-18"].score, 70);
});

test("採点は縦棒、全角縦棒、点数だけを受け付ける", () => {
  assert.deepEqual(parseGrade("64|動きを先に"), { ok: true, score: 64, comment: "動きを先に" });
  assert.equal(parseGrade("88｜よい").score, 88);
  assert.equal(parseGrade("73").score, 73);
  assert.equal(parseGrade("120").ok, false);
});

test("今日が未練習なら昨日からストリークを数える", () => {
  const days = {
    "2026-08-18": { poseIds: ["a"], poseStats: { a: { completed: true } }, saved: true, score: null },
    "2026-08-17": { poseIds: ["b"], poseStats: { b: { completed: true } }, saved: true, score: null }
  };
  assert.equal(calculateStreak(days, "2026-08-19"), 2);
});

test("バックアップ統合はローカルの入力を優先する", () => {
  const current = createDefaultState("2026-08-19");
  current.days["2026-08-18"] = { poseIds: [], poseStats: {}, note: "local", saved: false, score: null, comment: "", weakness: "" };
  const incoming = createDefaultState("2026-08-19");
  incoming.days["2026-08-18"] = { poseIds: [], poseStats: {}, note: "backup", saved: true, score: 80, comment: "ok", weakness: "線" };
  const merged = mergeStates(current, incoming);
  assert.equal(merged.days["2026-08-18"].note, "local");
  assert.equal(merged.days["2026-08-18"].score, 80);
});

test("日ごとの選択は決定的で重複しない", () => {
  const library = Array.from({ length: 12 }, (_, index) => ({ id: `p${index}`, tags: [index < 8 ? "gesture" : "dynamic"] }));
  const options = { dayKey: "2026-08-19", themeId: "gesture", recentIds: [], customIds: [], mixCustom: false };
  const first = selectDailyPoses(library, options);
  assert.deepEqual(first, selectDailyPoses(library, options));
  assert.equal(first.length, 6);
  assert.equal(new Set(first).size, 6);
});
