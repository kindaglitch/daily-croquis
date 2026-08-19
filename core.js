export const APP_VERSION = "5.0.0";
export const STORE_KEY = "dailyCroquisV5";

export const CURRICULUM = [
  { a: 1, b: 7, id: "gesture", title: "ジェスチャーと重心", focus: "輪郭より先に、頭から足へ流れる一本の動きを取る。" },
  { a: 8, b: 14, id: "torso", title: "胸郭と骨盤", focus: "胸郭を卵、骨盤を箱として捉え、傾きの差を見る。" },
  { a: 15, b: 21, id: "proportion", title: "人体比率", focus: "頭身、肩幅、肘・手首・膝の高さを観察する。" },
  { a: 22, b: 30, id: "foreshortening", title: "手足と短縮", focus: "手前に来る部分を大きく、重なりを明確に捉える。" },
  { a: 31, b: 45, id: "twist", title: "ひねりと奥行き", focus: "肩と骨盤を別々の立体として回転させる。" },
  { a: 46, b: 60, id: "dynamic", title: "動きの強いポーズ", focus: "正確さだけでなく、勢いとリズムを短時間で残す。" }
];

export const POSE_TIMES = [30, 30, 60, 60, 120, 300];
export const POSE_LABELS = ["30秒", "30秒", "1分", "1分", "2分", "5分"];
export const POSE_INSTRUCTIONS = [
  "一本のLine of Actionを最優先。",
  "頭・胸郭・骨盤を大きく置く。",
  "肩と骨盤の傾きを比較する。",
  "腕脚を線ではなく円柱で捉える。",
  "胸郭と骨盤の向きを立体で表す。",
  "全身比率・重心・接地まで確認する。"
];

export const AXES = ["動き", "比率", "立体感", "重心・接地", "簡略化", "線"];

export function ymd(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateFromYmd(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function shiftYmd(value, amount) {
  const date = dateFromYmd(value);
  date.setDate(date.getDate() + amount);
  return ymd(date);
}

export function safeParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function hashString(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededShuffle(items, seed) {
  let state = hashString(seed) || 1;
  const result = [...items];
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function curriculumForDay(dayNumber) {
  const cycle = ((Math.max(1, dayNumber) - 1) % 60) + 1;
  return {
    cycle,
    curriculum: CURRICULUM.find((item) => cycle >= item.a && cycle <= item.b) || CURRICULUM[0]
  };
}

export function dayNumberFromStart(startDate, todayKey) {
  const elapsed = dateFromYmd(todayKey) - dateFromYmd(startDate);
  return Math.max(1, Math.floor(elapsed / 86400000) + 1);
}

export function createDefaultState(todayKey) {
  return {
    version: 5,
    startDate: todayKey,
    settings: { sound: true, mixCustom: false },
    days: {},
    session: null
  };
}

function normalizeDay(day = {}) {
  return {
    poseIds: Array.isArray(day.poseIds) ? day.poseIds.filter((id) => typeof id === "string") : [],
    poseStats: day.poseStats && typeof day.poseStats === "object" ? day.poseStats : {},
    legacyPoses: Array.isArray(day.legacyPoses) ? day.legacyPoses.map(Boolean).slice(0, 6) : null,
    note: typeof day.note === "string" ? day.note : "",
    saved: Boolean(day.saved),
    score: Number.isFinite(Number(day.score)) && day.score !== null ? Number(day.score) : null,
    comment: typeof day.comment === "string" ? day.comment : "",
    weakness: AXES.includes(day.weakness) ? day.weakness : "",
    updatedAt: typeof day.updatedAt === "string" ? day.updatedAt : ""
  };
}

export function migrateState(raw, todayKey, legacyStartDate = todayKey) {
  if (!raw || typeof raw !== "object") return createDefaultState(todayKey);
  if (raw.version === 5) {
    const state = createDefaultState(todayKey);
    state.startDate = /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate || "") ? raw.startDate : todayKey;
    state.settings = { ...state.settings, ...(raw.settings || {}) };
    state.session = raw.session && typeof raw.session === "object" ? raw.session : null;
    for (const [key, day] of Object.entries(raw.days || {})) state.days[key] = normalizeDay(day);
    return state;
  }

  const migrated = createDefaultState(todayKey);
  migrated.startDate = /^\d{4}-\d{2}-\d{2}$/.test(legacyStartDate || "") ? legacyStartDate : todayKey;
  for (const [key, day] of Object.entries(raw.days || {})) {
    migrated.days[key] = normalizeDay({
      legacyPoses: Array.isArray(day.poses) ? day.poses : null,
      note: day.note,
      saved: day.saved,
      score: day.score,
      comment: day.comment
    });
  }
  return migrated;
}

export function normalizeStateForImport(raw, todayKey) {
  const candidate = raw?.schema === "daily-croquis-backup" ? raw.state : raw;
  return migrateState(candidate, todayKey, candidate?.startDate || todayKey);
}

export function mergeStates(current, incoming) {
  const merged = {
    ...current,
    startDate: [current.startDate, incoming.startDate].filter(Boolean).sort()[0] || current.startDate,
    settings: { ...current.settings, ...incoming.settings },
    days: { ...current.days },
    session: current.session
  };
  for (const [key, incomingDay] of Object.entries(incoming.days || {})) {
    const localDay = merged.days[key];
    if (!localDay) {
      merged.days[key] = normalizeDay(incomingDay);
      continue;
    }
    merged.days[key] = normalizeDay({
      ...localDay,
      ...incomingDay,
      poseIds: localDay.poseIds?.length ? localDay.poseIds : incomingDay.poseIds,
      poseStats: { ...(incomingDay.poseStats || {}), ...(localDay.poseStats || {}) },
      note: localDay.note || incomingDay.note,
      score: localDay.score ?? incomingDay.score,
      comment: localDay.comment || incomingDay.comment,
      weakness: localDay.weakness || incomingDay.weakness,
      saved: localDay.saved || incomingDay.saved
    });
  }
  return merged;
}

export function selectDailyPoses(library, { dayKey, themeId, recentIds = [], customIds = [], mixCustom = false }) {
  const recent = new Set(recentIds);
  const available = library.filter((pose) => !recent.has(pose.id));
  const pool = available.length >= 6 ? available : library;
  const preferred = seededShuffle(pool.filter((pose) => pose.tags.includes(themeId)), `${dayKey}:${themeId}:preferred`);
  const remainder = seededShuffle(pool.filter((pose) => !preferred.some((item) => item.id === pose.id)), `${dayKey}:${themeId}:remainder`);
  const selected = [...preferred.slice(0, 4), ...remainder].slice(0, 6).map((pose) => pose.id);

  if (mixCustom && customIds.length) {
    const custom = seededShuffle(customIds, `${dayKey}:custom`).slice(0, Math.min(2, customIds.length));
    custom.forEach((id, index) => {
      selected[selected.length - 1 - index] = `custom:${id}`;
    });
  }
  return [...new Set(selected)].slice(0, 6);
}

export function completedCount(day) {
  if (!day) return 0;
  return (day.poseIds || []).filter((id) => day.poseStats?.[id]?.completed).length;
}

export function activeDay(day) {
  return Boolean(day && (completedCount(day) > 0 || day.saved || day.score !== null));
}

export function calculateStreak(days, todayKey) {
  let cursor = activeDay(days[todayKey]) ? todayKey : shiftYmd(todayKey, -1);
  let streak = 0;
  while (activeDay(days[cursor])) {
    streak += 1;
    cursor = shiftYmd(cursor, -1);
  }
  return streak;
}

export function parseGrade(raw) {
  const normalized = String(raw || "").trim().replace(/[｜]/g, "|");
  const match = normalized.match(/^(\d{1,3})(?:\s*(?:\||点|\/100)\s*(.*))?$/);
  if (!match) return { ok: false, error: "「64|コメント」または点数だけを入力してください" };
  const score = Number(match[1]);
  if (score < 0 || score > 100) return { ok: false, error: "点数は0〜100で入力してください" };
  return { ok: true, score, comment: (match[2] || "").trim() };
}

export function recentDayKeys(todayKey, count) {
  return Array.from({ length: count }, (_, index) => shiftYmd(todayKey, -index));
}
