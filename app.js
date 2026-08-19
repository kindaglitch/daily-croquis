import {
  APP_VERSION, STORE_KEY, AXES, POSE_TIMES, POSE_LABELS, POSE_INSTRUCTIONS,
  ymd, shiftYmd, safeParse, dayNumberFromStart, curriculumForDay, migrateState,
  normalizeStateForImport, mergeStates, selectDailyPoses, completedCount,
  calculateStreak, parseGrade, recentDayKeys
} from "./core.js";
import { POSE_LIBRARY, POSE_BY_ID, renderPoseSvg } from "./poses.js";

const $ = (id) => document.getElementById(id);
const TODAY = new Date();
const TODAY_KEY = ymd(TODAY);
const legacyStart = localStorage.getItem("dailyCroquisStart") || TODAY_KEY;
const currentRaw = safeParse(localStorage.getItem(STORE_KEY));
const legacyRaw = safeParse(localStorage.getItem("dailyCroquisV2"));
let state = migrateState(currentRaw || legacyRaw, TODAY_KEY, legacyStart);
let customRefs = [];
let customUrls = new Map();
let currentCurriculum;
let currentCycle;
let noteSaveTimer;
let toastTimer;
let sessionTicker;
let sessionOverlay = false;
let deferredInstallPrompt = null;
let waitingWorker = null;

const DB_NAME = "dailyCroquisFiles";
const DB_STORE = "references";

function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 2200);
}

function persist({ quiet = false } = {}) {
  try {
    state.version = 5;
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    if (!quiet) {
      $("autoSaveState").textContent = "保存済み";
      setTimeout(() => { $("autoSaveState").textContent = "自動保存"; }, 1000);
    }
    return true;
  } catch {
    toast("保存容量が足りません。バックアップを書き出してください");
    return false;
  }
}

function blankDay() {
  return { poseIds: [], poseStats: {}, legacyPoses: null, note: "", saved: false, score: null, comment: "", weakness: "", updatedAt: "" };
}

function day() {
  if (!state.days[TODAY_KEY]) state.days[TODAY_KEY] = blankDay();
  return state.days[TODAY_KEY];
}

function customId(id) {
  return id.startsWith("custom:") ? id.slice(7) : null;
}

function customById(id) {
  const rawId = customId(id) || id;
  return customRefs.find((item) => item.id === rawId) || null;
}

function customUrl(item) {
  if (!item) return "";
  if (!customUrls.has(item.id)) customUrls.set(item.id, URL.createObjectURL(item.blob));
  return customUrls.get(item.id);
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbAction(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, mode);
    const request = action(transaction.objectStore(DB_STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

const listCustomRefs = () => dbAction("readonly", (store) => store.getAll());
const putCustomRef = (item) => dbAction("readwrite", (store) => store.put(item));
const removeCustomRef = (id) => dbAction("readwrite", (store) => store.delete(id));

function recentPoseIds(daysBack = 7) {
  return recentDayKeys(shiftYmd(TODAY_KEY, -1), daysBack).flatMap((key) => state.days[key]?.poseIds || []);
}

function chooseTodayPoses(extraRecent = []) {
  return selectDailyPoses(POSE_LIBRARY, {
    dayKey: TODAY_KEY,
    themeId: currentCurriculum.id,
    recentIds: [...recentPoseIds(), ...extraRecent],
    customIds: customRefs.map((item) => item.id),
    mixCustom: state.settings.mixCustom
  });
}

function ensureToday() {
  const today = day();
  if (today.poseIds.length < 6) today.poseIds = chooseTodayPoses();
  const missingCustom = today.poseIds.filter((id) => customId(id) && !customById(id));
  if (missingCustom.length) {
    const replacements = selectDailyPoses(POSE_LIBRARY, {
      dayKey: `${TODAY_KEY}:repair`, themeId: currentCurriculum.id,
      recentIds: [...recentPoseIds(), ...today.poseIds], customIds: [], mixCustom: false
    });
    let replacementIndex = 0;
    today.poseIds = today.poseIds.map((id) => {
      if (!missingCustom.includes(id)) return id;
      const replacement = replacements[replacementIndex++] || POSE_LIBRARY[replacementIndex]?.id;
      if (replacement && today.poseStats[id]?.completed) today.poseStats[replacement] = { ...today.poseStats[id] };
      return replacement || id;
    });
  }
  today.poseIds.forEach((id) => {
    if (!today.poseStats[id]) today.poseStats[id] = { completed: false, seconds: 0, completedAt: "" };
  });
  if (today.legacyPoses) {
    today.legacyPoses.forEach((completed, index) => {
      const id = today.poseIds[index];
      if (completed && id) today.poseStats[id] = { completed: true, seconds: POSE_TIMES[index], completedAt: "" };
    });
    today.legacyPoses = null;
  }
  persist({ quiet: true });
}

function formatTimer(milliseconds) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderReference(container, id, overlay = false) {
  container.replaceChildren();
  const ref = customById(id);
  if (ref) {
    const img = new Image();
    img.src = customUrl(ref);
    img.alt = ref.name || "端末内の参考画像";
    container.append(img);
    return;
  }
  const pose = POSE_BY_ID.get(id);
  if (pose) container.append(renderPoseSvg(pose, { overlay, label: pose.title }));
}

function renderHeader() {
  const count = completedCount(day());
  const seconds = Object.values(day().poseStats).reduce((sum, item) => sum + (Number(item.seconds) || 0), 0);
  $("dateLabel").textContent = `${TODAY.getFullYear()}年${TODAY.getMonth() + 1}月${TODAY.getDate()}日`;
  $("theme").textContent = currentCurriculum.title;
  $("focus").textContent = currentCurriculum.focus;
  $("dayNo").textContent = `Day ${currentCycle}`;
  $("done").textContent = `${count} / 6`;
  $("practiceTime").textContent = seconds < 60 ? `${seconds}秒` : `${Math.round(seconds / 60)}分`;
  $("progressBar").style.width = `${(count / 6) * 100}%`;
  $("streak").textContent = `🔥 ${calculateStreak(state.days, TODAY_KEY)}日連続`;
  $("startAll").textContent = count === 6 ? "6ポーズをもう一度" : "今日の6ポーズを始める";
  $("resumeSession").hidden = !(state.session && state.session.date === TODAY_KEY);
}

function renderPoseGrid() {
  const grid = $("poseGrid");
  grid.replaceChildren();
  day().poseIds.forEach((id, index) => {
    const stats = day().poseStats[id] || {};
    const pose = POSE_BY_ID.get(id);
    const ref = customById(id);
    const card = createElement("article", "pose-card");
    const visual = createElement("div", "pose-visual");
    renderReference(visual, id, false);
    if (stats.completed) visual.append(createElement("span", "pose-complete", "完了 ✓"));
    const body = createElement("div", "pose-body");
    const head = createElement("div", "pose-head");
    head.append(createElement("b", "", ref?.name || pose?.title || `Pose ${index + 1}`));
    head.append(createElement("span", "pose-time", POSE_LABELS[index]));
    const instruction = createElement("p", "pose-instruction", POSE_INSTRUCTIONS[index]);
    const actions = createElement("div", "pose-actions");
    const start = createElement("button", `button ${stats.completed ? "" : "button-primary"}`, stats.completed ? "もう一度" : "スタート");
    start.type = "button";
    start.addEventListener("click", () => beginSession([{ id, slot: index }]));
    actions.append(start);
    if (!ref) {
      const overlay = createElement("button", "button", stats.completed ? "構造を見る" : "完了後に構造");
      overlay.type = "button";
      overlay.disabled = !stats.completed;
      overlay.addEventListener("click", () => {
        const shown = overlay.dataset.shown === "true";
        renderReference(visual, id, !shown);
        if (stats.completed) visual.append(createElement("span", "pose-complete", "完了 ✓"));
        overlay.dataset.shown = String(!shown);
        overlay.textContent = shown ? "構造を見る" : "構造を隠す";
      });
      actions.append(overlay);
    }
    body.append(head, instruction, actions);
    card.append(visual, body);
    grid.append(card);
  });
}

function renderHeatmap() {
  const heatmap = $("heatmap");
  heatmap.replaceChildren();
  const keys = recentDayKeys(TODAY_KEY, 42).reverse();
  keys.forEach((key) => {
    const count = completedCount(state.days[key]);
    const cell = createElement("span", "heat-cell");
    cell.dataset.level = count === 0 ? "0" : count < 3 ? "1" : count < 6 ? "2" : "3";
    cell.title = `${key}: ${count}/6`;
    heatmap.append(cell);
  });

  const weekKeys = recentDayKeys(TODAY_KEY, 7);
  const active = weekKeys.filter((key) => completedCount(state.days[key]) > 0).length;
  const poses = weekKeys.reduce((sum, key) => sum + completedCount(state.days[key]), 0);
  const full = weekKeys.filter((key) => completedCount(state.days[key]) === 6).length;
  const seconds = weekKeys.reduce((sum, key) => sum + Object.values(state.days[key]?.poseStats || {}).reduce((total, item) => total + (Number(item.seconds) || 0), 0), 0);
  const stats = [
    [`${active}日`, "練習した日"], [`${poses}体`, "描いたポーズ"], [`${Math.round(seconds / 60)}分`, "練習時間"], [`${full}日`, "6/6達成"]
  ];
  const box = $("weekStats");
  box.replaceChildren();
  stats.forEach(([value, label]) => {
    const item = createElement("div", "stat-box");
    item.append(createElement("strong", "", value), createElement("span", "", label));
    box.append(item);
  });
  renderScoreChart();
}

function renderScoreChart() {
  const root = $("scoreChart");
  root.replaceChildren();
  const entries = Object.entries(state.days).filter(([, item]) => item.score !== null).sort(([a], [b]) => a.localeCompare(b)).slice(-10);
  root.append(createElement("div", "chart-title", "採点の推移"));
  if (entries.length < 2) {
    root.append(createElement("div", "chart-empty", "2回以上採点を登録するとグラフが表示されます。"));
    return;
  }
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 420 105");
  const coords = entries.map(([, item], index) => [18 + index * (384 / (entries.length - 1)), 92 - item.score * .78]);
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", coords.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" "));
  path.setAttribute("fill", "none"); path.setAttribute("stroke", "#ef6a47"); path.setAttribute("stroke-width", "3"); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  coords.forEach(([x, y], index) => {
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", x); circle.setAttribute("cy", y); circle.setAttribute("r", "4"); circle.setAttribute("fill", "#20211f");
    const title = document.createElementNS(ns, "title");
    title.textContent = `${entries[index][0]}: ${entries[index][1].score}点`;
    circle.append(title); svg.append(circle);
  });
  root.append(svg);
}

function renderHistory() {
  const root = $("history");
  root.replaceChildren();
  const entries = Object.entries(state.days)
    .filter(([, item]) => completedCount(item) || item.saved || item.score !== null)
    .sort(([a], [b]) => b.localeCompare(a)).slice(0, 20);
  if (!entries.length) {
    root.append(createElement("div", "empty-state", "まだ記録がありません"));
    return;
  }
  entries.forEach(([key, item]) => {
    const row = createElement("div", "history-item");
    const copy = createElement("div");
    const time = createElement("time", "", key);
    const detail = createElement("p", "", item.comment || item.note || (item.weakness ? `次: ${item.weakness}` : "記録済み"));
    copy.append(time, detail);
    row.append(copy, createElement("span", "history-score", item.score !== null ? `${item.score}点` : `${completedCount(item)}/6`));
    root.append(row);
  });
}

function renderWeakness() {
  const root = $("weaknessChips");
  root.replaceChildren();
  AXES.forEach((axis) => {
    const label = createElement("label", "chip");
    const input = document.createElement("input");
    input.type = "radio"; input.name = "weakness"; input.value = axis; input.checked = day().weakness === axis;
    label.append(input, createElement("span", "", axis));
    root.append(label);
  });
}

function renderCustomGallery() {
  const root = $("customGallery");
  root.replaceChildren();
  if (!customRefs.length) {
    root.append(createElement("div", "empty-state", "追加画像はまだありません"));
    return;
  }
  customRefs.forEach((item) => {
    const box = createElement("div", "custom-item");
    const image = new Image(); image.src = customUrl(item); image.alt = item.name || "追加した参考画像";
    const start = createElement("button", "custom-start", "▶"); start.type = "button"; start.title = "60秒で描く";
    start.addEventListener("click", () => beginSession([{ id: `custom:${item.id}`, slot: 2 }]));
    const remove = createElement("button", "custom-delete", "×"); remove.type = "button"; remove.title = "端末から削除";
    remove.addEventListener("click", async () => {
      if (!confirm(`「${item.name}」をこの端末から削除しますか？`)) return;
      await removeCustomRef(item.id);
      if (customUrls.has(item.id)) URL.revokeObjectURL(customUrls.get(item.id));
      customUrls.delete(item.id);
      customRefs = customRefs.filter((ref) => ref.id !== item.id);
      ensureToday(); renderAll();
      toast("端末内の参考画像を削除しました");
    });
    box.append(image, start, remove); root.append(box);
  });
}

function renderAll() {
  renderHeader(); renderPoseGrid(); renderHeatmap(); renderHistory(); renderWeakness(); renderCustomGallery();
  $("note").value = day().note || "";
  $("mixCustom").checked = Boolean(state.settings.mixCustom);
  $("soundToggle").textContent = state.settings.sound ? "♪" : "×";
  $("soundToggle").title = state.settings.sound ? "音あり" : "音なし";
}

function refreshUnfinishedPoses() {
  const today = day();
  const replacements = chooseTodayPoses(today.poseIds);
  let cursor = 0;
  today.poseIds = today.poseIds.map((id) => {
    if (today.poseStats[id]?.completed) return id;
    let next = replacements[cursor++];
    while (today.poseIds.includes(next) && cursor < replacements.length) next = replacements[cursor++];
    if (!next) return id;
    if (!today.poseStats[next]) today.poseStats[next] = { completed: false, seconds: 0, completedAt: "" };
    return next;
  });
  today.updatedAt = new Date().toISOString();
  persist(); renderAll(); toast("未完了のポーズを入れ替えました");
}

function showDialog() {
  const dialog = $("sessionDialog");
  if (!dialog.open) dialog.showModal?.();
  if (!dialog.open) dialog.setAttribute("open", "");
}

function closeDialog() {
  const dialog = $("sessionDialog");
  dialog.close?.();
  if (dialog.open) dialog.removeAttribute("open");
}

function currentSessionEntry() {
  return state.session?.entries?.[state.session.cursor] || null;
}

function sessionDuration(entry) {
  return (POSE_TIMES[entry?.slot] || 60) * 1000;
}

function startPhase(phase, duration) {
  if (!state.session) return;
  state.session.phase = phase;
  state.session.resumePhase = phase;
  state.session.remainingMs = duration;
  state.session.targetAt = Date.now() + duration;
  persist({ quiet: true });
  updateSessionVisual(); tickSession();
}

function beginSession(entries, resume = false) {
  if (!entries.length) return;
  if (!resume) {
    state.session = { date: TODAY_KEY, entries, cursor: 0, phase: "prep", resumePhase: "prep", remainingMs: 3000, targetAt: Date.now() + 3000 };
    persist({ quiet: true });
  } else if (state.session?.phase === "paused") {
    state.session.phase = state.session.resumePhase || "prep";
    state.session.targetAt = Date.now() + Math.max(0, state.session.remainingMs || 0);
  }
  sessionOverlay = false;
  showDialog();
  $("finishFlash").hidden = true;
  updateSessionVisual();
  clearInterval(sessionTicker);
  sessionTicker = setInterval(tickSession, 100);
  tickSession();
}

function updateSessionVisual() {
  if (!state.session) return;
  const entry = currentSessionEntry();
  if (!entry) return;
  const pose = POSE_BY_ID.get(entry.id);
  const ref = customById(entry.id);
  $("sessionStep").textContent = `POSE ${state.session.cursor + 1} / ${state.session.entries.length}`;
  $("sessionTitle").textContent = ref?.name || pose?.title || "参考ポーズ";
  $("sessionInstruction").textContent = POSE_INSTRUCTIONS[entry.slot] || POSE_INSTRUCTIONS[2];
  renderReference($("sessionVisual"), entry.id, sessionOverlay);
  const completed = Boolean(day().poseStats[entry.id]?.completed);
  $("toggleOverlay").hidden = Boolean(ref) || !completed;
  $("toggleOverlay").textContent = sessionOverlay ? "構造線を隠す" : "構造線を表示";
  $("pauseSession").hidden = state.session.phase === "finished" || state.session.phase === "complete";
  $("restartPose").hidden = state.session.phase === "finished";
  $("skipPose").hidden = state.session.phase === "finished";
}

function tickSession() {
  const session = state.session;
  if (!session) return;
  let remaining = session.remainingMs || 0;
  if (session.targetAt) remaining = Math.max(0, session.targetAt - Date.now());
  session.remainingMs = remaining;
  const label = session.phase === "prep" ? "準備" : session.phase === "paused" ? "一時停止" : session.phase === "complete" ? "完了" : session.phase === "finished" ? "セッション完了" : "描画中";
  $("phaseLabel").textContent = label;
  $("sessionTimer").textContent = session.phase === "finished" ? "DONE" : formatTimer(remaining);
  $("floatingLabel").textContent = `${label}・Pose ${session.cursor + 1}`;
  $("floatingTime").textContent = session.phase === "finished" ? "DONE" : formatTimer(remaining);
  $("floatingTimer").hidden = false;
  $("pauseSession").textContent = session.phase === "paused" ? "再開" : "一時停止";
  if (remaining > 0 || session.phase === "paused" || session.phase === "finished") return;
  if (session.phase === "prep") startPhase("running", sessionDuration(currentSessionEntry()));
  else if (session.phase === "running") completeCurrentPose();
  else if (session.phase === "complete") advanceSession();
}

function completeCurrentPose() {
  const entry = currentSessionEntry();
  if (!entry) return;
  const stats = day().poseStats[entry.id] || { completed: false, seconds: 0, completedAt: "" };
  stats.completed = true;
  stats.seconds = (Number(stats.seconds) || 0) + Math.round(sessionDuration(entry) / 1000);
  stats.completedAt = new Date().toISOString();
  day().poseStats[entry.id] = stats;
  day().saved = true;
  day().updatedAt = new Date().toISOString();
  state.session.phase = "complete";
  state.session.remainingMs = 1300;
  state.session.targetAt = Date.now() + 1300;
  $("finishFlash").hidden = false;
  const finishStrong = $("finishFlash").querySelector("strong");
  const finishSpan = $("finishFlash").querySelector("span");
  finishStrong.textContent = "終了！"; finishSpan.textContent = "このポーズは完了です";
  navigator.vibrate?.([120, 70, 120]);
  beep();
  persist({ quiet: true }); renderHeader(); renderPoseGrid(); renderHeatmap(); renderHistory();
}

function advanceSession() {
  $("finishFlash").hidden = true;
  if (!state.session) return;
  if (state.session.cursor + 1 < state.session.entries.length) {
    state.session.cursor += 1;
    sessionOverlay = false;
    startPhase("prep", 3000);
    return;
  }
  state.session.phase = "finished";
  state.session.targetAt = null;
  state.session.remainingMs = 0;
  $("finishFlash").hidden = false;
  $("finishFlash").querySelector("strong").textContent = "完了！";
  $("finishFlash").querySelector("span").textContent = `${state.session.entries.length}ポーズ、おつかれさまでした`;
  setTimeout(() => { if ($("finishFlash")) $("finishFlash").hidden = true; }, 1600);
  $("phaseLabel").textContent = "セッション完了";
  $("sessionTimer").textContent = "DONE";
  state.session = null;
  clearInterval(sessionTicker);
  $("floatingTimer").hidden = true;
  persist({ quiet: true }); renderAll();
}

function pauseSession() {
  const session = state.session;
  if (!session) return;
  if (session.phase === "paused") {
    session.phase = session.resumePhase || "running";
    session.targetAt = Date.now() + Math.max(0, session.remainingMs || 0);
  } else if (["prep", "running"].includes(session.phase)) {
    session.remainingMs = Math.max(0, session.targetAt - Date.now());
    session.resumePhase = session.phase;
    session.phase = "paused";
    session.targetAt = null;
  }
  persist({ quiet: true }); tickSession();
}

function stopAndCloseSession() {
  if (state.session && ["prep", "running"].includes(state.session.phase)) pauseSession();
  closeDialog(); renderHeader();
}

function skipCurrentPose() {
  if (!state.session) return;
  if (state.session.cursor + 1 < state.session.entries.length) {
    state.session.cursor += 1; sessionOverlay = false; startPhase("prep", 3000);
  } else {
    state.session = null; clearInterval(sessionTicker); $("floatingTimer").hidden = true; closeDialog(); persist({ quiet: true }); renderAll(); toast("セッションを終了しました");
  }
}

function beep() {
  if (!state.settings.sound) return;
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.frequency.value = 740; oscillator.type = "sine";
    gain.gain.setValueAtTime(.12, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .35);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .36);
  } catch { /* vibration and visual feedback remain available */ }
}

async function addCustomFiles(files) {
  let added = 0;
  for (const file of [...files]) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > 12 * 1024 * 1024) { toast(`${file.name}は12MBを超えるため追加できません`); continue; }
    const item = { id: crypto.randomUUID(), name: file.name, type: file.type, blob: file, createdAt: new Date().toISOString() };
    try { await putCustomRef(item); customRefs.push(item); added += 1; } catch { toast("画像を端末内に保存できませんでした"); }
  }
  renderCustomGallery();
  if (added) toast(`${added}枚を端末内に追加しました`);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(body); const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

async function exportBackup() {
  const references = [];
  for (const item of customRefs) references.push({ id: item.id, name: item.name, type: item.type, createdAt: item.createdAt, dataUrl: await blobToDataUrl(item.blob) });
  const payload = { schema: "daily-croquis-backup", version: APP_VERSION, exportedAt: new Date().toISOString(), state, references };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `daily-croquis-${TODAY_KEY}.json`; link.click(); URL.revokeObjectURL(url);
  toast("バックアップを書き出しました");
}

async function importBackup(file) {
  try {
    const raw = JSON.parse(await file.text());
    const incoming = normalizeStateForImport(raw, TODAY_KEY);
    state = mergeStates(state, incoming);
    for (const item of raw.references || []) {
      if (!item.id || !item.dataUrl?.startsWith("data:image/")) continue;
      await putCustomRef({ id: item.id, name: item.name || "参考画像", type: item.type || "image/jpeg", createdAt: item.createdAt || new Date().toISOString(), blob: dataUrlToBlob(item.dataUrl) });
    }
    persist({ quiet: true });
    customRefs = await listCustomRefs();
    ensureToday(); renderAll(); toast("バックアップを統合しました");
  } catch { toast("このバックアップを読み込めませんでした"); }
}

function setupInputs() {
  $("note").addEventListener("input", (event) => {
    day().note = event.target.value; day().updatedAt = new Date().toISOString();
    $("autoSaveState").textContent = "保存中…";
    clearTimeout(noteSaveTimer); noteSaveTimer = setTimeout(() => persist(), 350);
  });
  $("saveDay").addEventListener("click", () => { day().saved = true; day().updatedAt = new Date().toISOString(); persist(); renderAll(); toast("今日の記録を保存しました"); });
  $("copyPrompt").addEventListener("click", async () => {
    const text = `クロッキー採点お願いします。\n${TODAY_KEY} / Day ${currentCycle}\nテーマ: ${currentCurriculum.title}\n完了: ${completedCount(day())}/6\n振り返り: ${day().note || "なし"}\n\n動き25・比率20・立体感20・重心/接地15・簡略化10・線10で100点満点。短いコメントも「点数|コメント」の形式でお願いします。`;
    try { await navigator.clipboard.writeText(text); toast("提出文をコピーしました"); } catch { prompt("この文章をコピーしてください", text); }
  });
  $("gradeSave").addEventListener("click", () => {
    const result = parseGrade($("gradeInput").value);
    if (!result.ok) return toast(result.error);
    day().score = result.score; if (result.comment) day().comment = result.comment;
    day().weakness = document.querySelector('input[name="weakness"]:checked')?.value || "";
    day().saved = true; day().updatedAt = new Date().toISOString();
    $("gradeInput").value = ""; persist(); renderAll(); toast("採点を登録しました");
  });
  $("startAll").addEventListener("click", () => {
    const incomplete = day().poseIds.map((id, slot) => ({ id, slot })).filter(({ id }) => !day().poseStats[id]?.completed);
    beginSession(incomplete.length ? incomplete : day().poseIds.map((id, slot) => ({ id, slot })));
  });
  $("resumeSession").addEventListener("click", () => beginSession(state.session.entries, true));
  $("refreshPoses").addEventListener("click", refreshUnfinishedPoses);
  $("pauseSession").addEventListener("click", pauseSession);
  $("restartPose").addEventListener("click", () => startPhase("prep", 3000));
  $("skipPose").addEventListener("click", skipCurrentPose);
  $("closeSession").addEventListener("click", stopAndCloseSession);
  $("toggleOverlay").addEventListener("click", () => { sessionOverlay = !sessionOverlay; updateSessionVisual(); });
  $("soundToggle").addEventListener("click", () => { state.settings.sound = !state.settings.sound; persist({ quiet: true }); $("soundToggle").textContent = state.settings.sound ? "♪" : "×"; toast(state.settings.sound ? "終了音をオンにしました" : "終了音をオフにしました"); });
  $("customFiles").addEventListener("change", async (event) => { await addCustomFiles(event.target.files); event.target.value = ""; });
  $("mixCustom").addEventListener("change", (event) => { state.settings.mixCustom = event.target.checked; persist(); toast(event.target.checked ? "次の入れ替えから端末画像を混ぜます" : "標準ポーズだけを使います"); });
  $("exportData").addEventListener("click", exportBackup);
  $("importData").addEventListener("change", async (event) => { if (event.target.files[0]) await importBackup(event.target.files[0]); event.target.value = ""; });
  $("sessionDialog").addEventListener("cancel", (event) => { event.preventDefault(); stopAndCloseSession(); });
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); deferredInstallPrompt = event; $("installApp").hidden = false; });
  $("installApp").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $("installApp").hidden = true;
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register("./sw.js");
    const showUpdate = (worker) => { waitingWorker = worker; $("updateBanner").hidden = false; };
    if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => { if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdate(worker); });
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (!refreshing) { refreshing = true; location.reload(); } });
    $("applyUpdate").addEventListener("click", () => waitingWorker?.postMessage({ type: "SKIP_WAITING" }));
  } catch { /* the app still works online without the service worker */ }
}

async function init() {
  const number = dayNumberFromStart(state.startDate, TODAY_KEY);
  ({ cycle: currentCycle, curriculum: currentCurriculum } = curriculumForDay(number));
  try { customRefs = await listCustomRefs(); } catch { customRefs = []; }
  ensureToday();
  if (state.session?.date !== TODAY_KEY) { state.session = null; persist({ quiet: true }); }
  $("appVersion").textContent = `v${APP_VERSION}`;
  setupInputs(); setupInstallPrompt(); renderAll(); registerServiceWorker();
  if (state.session) tickSession();
}

init();
