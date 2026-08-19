const NS = "http://www.w3.org/2000/svg";
const KEYS = ["head", "neck", "ls", "le", "lw", "rs", "re", "rw", "chest", "pelvis", "lh", "lk", "la", "rh", "rk", "ra"];

const PALETTES = [
  { bg: "#fff0e7", glow: "#ffd3bd", skin: "#b85f45", top: "#ef8354", bottom: "#4059ad", ink: "#26304a" },
  { bg: "#edf7f0", glow: "#c8ebd5", skin: "#704c3b", top: "#4f9d69", bottom: "#f2b134", ink: "#263c32" },
  { bg: "#f3efff", glow: "#dcd1ff", skin: "#9b5c45", top: "#7457c7", bottom: "#e26d5c", ink: "#332b55" },
  { bg: "#fff8dc", glow: "#f6dea2", skin: "#6e4434", top: "#e4572e", bottom: "#2e86ab", ink: "#293f4a" },
  { bg: "#eaf7fb", glow: "#bfe8f4", skin: "#c77d62", top: "#118ab2", bottom: "#ef476f", ink: "#213d4b" },
  { bg: "#f9edf3", glow: "#f2c6d8", skin: "#855c4a", top: "#d45079", bottom: "#4d7c8a", ink: "#3d3040" }
];

function points(values) {
  return Object.fromEntries(KEYS.map((key, index) => [key, values[index]]));
}

function base(id, title, tags, values, lineBend = 0) {
  return { id, title, tags, points: points(values), lineBend };
}

const BASES = [
  base("weight-shift", "片脚に体重を預ける", ["gesture", "proportion"], [[49,17],[49,29],[38,34],[34,55],[38,74],[61,34],[66,54],[70,72],[50,47],[52,72],[45,75],[43,101],[40,130],[59,75],[64,100],[69,128]], 6),
  base("long-walk", "大きく歩く", ["gesture", "dynamic"], [[43,18],[44,30],[34,35],[24,52],[16,68],[55,33],[66,48],[76,61],[45,48],[51,72],[44,75],[34,96],[20,122],[58,74],[69,94],[82,113]], 10),
  base("high-reach", "高く手を伸ばす", ["gesture", "torso"], [[49,18],[48,30],[37,35],[28,24],[24,8],[59,34],[69,22],[73,7],[49,49],[50,73],[43,76],[39,103],[37,132],[57,76],[61,102],[66,130]], -3),
  base("side-stretch", "横へ伸びる", ["gesture", "torso"], [[61,20],[57,31],[47,33],[37,25],[28,15],[66,38],[76,51],[86,60],[56,49],[50,72],[44,74],[39,101],[34,129],[57,76],[65,99],[73,125]], -10),
  base("low-lean", "前へ踏み込む", ["gesture", "foreshortening"], [[39,27],[44,38],[35,41],[25,55],[17,71],[55,39],[67,48],[78,53],[47,54],[53,76],[45,78],[35,99],[24,123],[61,77],[72,91],[84,107]], 12),
  base("balance", "片脚でバランス", ["gesture", "proportion"], [[50,17],[50,29],[39,34],[29,48],[20,59],[61,34],[72,47],[82,58],[50,48],[49,73],[43,76],[43,104],[42,132],[56,76],[68,90],[78,83]], -4),

  base("contrapposto", "肩と骨盤の逆傾斜", ["torso", "proportion"], [[51,17],[50,29],[38,36],[33,57],[30,76],[62,32],[69,51],[74,69],[50,49],[52,72],[44,76],[42,102],[39,130],[59,74],[64,100],[68,128]], 4),
  base("arms-behind", "腕を後ろへ組む", ["torso", "proportion"], [[48,17],[49,29],[37,34],[31,53],[44,70],[61,35],[68,54],[54,70],[49,48],[50,73],[43,76],[41,103],[40,131],[57,76],[61,102],[64,130]], 0),
  base("chest-open", "胸を開く", ["torso", "gesture"], [[49,19],[49,31],[37,37],[23,41],[10,37],[62,37],[76,41],[90,36],[50,50],[50,74],[43,77],[37,103],[34,131],[57,77],[64,103],[69,131]], -2),
  base("torso-fold", "上体を折る", ["torso", "foreshortening"], [[68,42],[59,45],[50,40],[35,44],[22,53],[66,51],[77,62],[87,68],[57,55],[50,75],[43,77],[36,101],[29,128],[58,77],[66,98],[73,124]], 15),
  base("back-arch", "背中を反らす", ["torso", "gesture"], [[58,18],[54,30],[42,35],[31,50],[23,67],[65,36],[75,53],[84,68],[53,49],[48,72],[41,75],[36,101],[32,130],[55,75],[64,98],[72,125]], -13),
  base("shoulder-drop", "片肩を落とす", ["torso", "twist"], [[46,18],[47,30],[34,40],[28,59],[28,77],[60,32],[67,50],[70,68],[48,49],[52,73],[45,76],[41,102],[38,130],[59,75],[65,101],[71,128]], 8),

  base("front-neutral", "正面の基本立ち", ["proportion", "gesture"], [[50,16],[50,29],[38,34],[34,56],[32,77],[62,34],[66,56],[68,77],[50,48],[50,73],[43,76],[42,103],[41,132],[57,76],[58,103],[59,132]], 0),
  base("profile-neutral", "横向きの基本立ち", ["proportion", "torso"], [[53,17],[51,29],[45,34],[42,55],[44,75],[57,35],[59,55],[58,74],[51,48],[50,73],[46,76],[44,103],[42,132],[54,76],[58,102],[62,130]], 1),
  base("hands-hips", "両手を腰に置く", ["proportion", "torso"], [[50,17],[50,29],[38,34],[28,49],[42,70],[62,34],[72,49],[58,70],[50,48],[50,73],[43,76],[39,103],[36,131],[57,76],[61,103],[64,131]], 0),
  base("wide-stance", "足幅を広く立つ", ["proportion", "gesture"], [[50,17],[50,29],[38,34],[31,54],[27,74],[62,34],[69,54],[73,74],[50,48],[50,72],[42,76],[31,102],[19,128],[58,76],[69,102],[82,128]], 0),
  base("one-arm-up", "片腕を上げる", ["proportion", "gesture"], [[49,17],[49,29],[37,34],[28,53],[22,72],[61,34],[67,20],[65,5],[49,48],[50,73],[43,76],[39,103],[36,131],[57,76],[62,102],[66,130]], -3),
  base("relaxed-cross", "脚を交差して立つ", ["proportion", "twist"], [[50,17],[50,29],[38,35],[34,56],[38,75],[62,34],[66,55],[62,74],[50,49],[51,73],[44,76],[53,101],[60,129],[58,76],[49,102],[43,130]], 4),

  base("front-lunge", "手前へ踏み込む", ["foreshortening", "dynamic"], [[45,19],[46,31],[35,35],[24,48],[16,57],[58,36],[70,48],[81,55],[47,49],[53,73],[45,76],[32,94],[17,109],[61,75],[72,99],[78,129]], 11),
  base("forward-punch", "手前へ拳を出す", ["foreshortening", "dynamic"], [[49,18],[49,30],[36,36],[29,53],[21,65],[61,34],[73,42],[89,48],[49,49],[50,73],[43,76],[37,102],[33,130],[57,76],[64,101],[69,129]], 5),
  base("knee-forward", "膝を手前へ上げる", ["foreshortening", "gesture"], [[48,18],[49,30],[37,35],[29,54],[25,73],[61,35],[70,54],[75,72],[49,49],[50,72],[43,76],[35,102],[31,130],[57,75],[70,88],[76,105]], -5),
  base("deep-reach", "低く手を伸ばす", ["foreshortening", "torso"], [[35,38],[42,44],[34,48],[22,58],[10,69],[54,42],[68,46],[84,47],[45,57],[51,76],[43,79],[31,100],[18,123],[59,77],[69,99],[80,121]], 14),
  base("seated-extend", "座って脚を伸ばす", ["foreshortening", "twist"], [[42,39],[44,50],[34,55],[25,69],[18,84],[55,53],[66,65],[73,80],[45,63],[50,83],[43,85],[28,96],[12,103],[57,85],[73,96],[91,103]], 5),
  base("crawl", "四点で支える", ["foreshortening", "dynamic"], [[30,52],[39,57],[33,63],[23,78],[15,96],[51,58],[63,73],[72,91],[43,67],[58,79],[51,82],[40,99],[30,117],[65,81],[75,98],[87,113]], 10),

  base("look-back", "振り返る", ["twist", "torso"], [[58,17],[53,30],[39,35],[31,53],[29,72],[64,38],[73,56],[77,74],[51,49],[48,73],[41,76],[37,103],[34,131],[55,76],[61,102],[66,130]], -8),
  base("cross-body", "腕を体の前で交差", ["twist", "torso"], [[48,18],[49,30],[36,35],[45,49],[62,60],[62,34],[55,49],[37,61],[49,49],[52,73],[45,76],[41,103],[38,131],[59,75],[65,101],[71,128]], 7),
  base("spiral-reach", "螺旋状に伸びる", ["twist", "gesture"], [[55,18],[52,30],[39,37],[29,53],[21,69],[64,33],[73,21],[78,7],[50,49],[47,72],[40,75],[34,101],[29,129],[54,75],[62,99],[69,126]], -12),
  base("crouch-turn", "しゃがんでひねる", ["twist", "foreshortening"], [[60,35],[54,45],[41,46],[31,58],[23,72],[64,51],[75,62],[84,76],[52,58],[50,78],[42,81],[30,99],[20,119],[58,81],[72,96],[84,115]], 12),
  base("seated-twist", "座って振り向く", ["twist", "torso"], [[58,35],[53,46],[40,50],[31,64],[25,80],[63,53],[73,68],[78,84],[51,61],[49,82],[42,85],[29,99],[16,108],[56,85],[68,99],[81,107]], -6),
  base("throw-ready", "投げる直前", ["twist", "dynamic"], [[47,19],[48,31],[35,36],[26,24],[18,14],[61,35],[72,45],[81,57],[48,50],[53,73],[45,76],[35,99],[23,124],[61,75],[72,96],[84,114]], 14),

  base("star-jump", "大きく跳ぶ", ["dynamic", "gesture"], [[50,15],[50,27],[38,33],[25,22],[12,9],[62,33],[75,22],[88,9],[50,46],[50,68],[43,72],[31,92],[17,111],[57,72],[69,92],[83,111]], 0),
  base("sprint", "走り出す", ["dynamic", "gesture"], [[38,29],[43,39],[34,43],[22,52],[12,59],[55,40],[67,50],[78,55],[46,54],[53,75],[45,78],[31,96],[18,119],[61,77],[73,96],[86,112]], 14),
  base("high-kick", "高く蹴る", ["dynamic", "foreshortening"], [[48,18],[49,30],[37,35],[27,51],[18,64],[61,35],[70,51],[77,65],[49,49],[50,72],[43,75],[38,102],[34,130],[57,75],[69,59],[83,39]], -6),
  base("long-leap", "前へ跳ぶ", ["dynamic", "gesture"], [[37,24],[42,34],[32,39],[20,44],[8,43],[54,35],[68,31],[82,24],[44,49],[51,67],[44,70],[30,78],[16,89],[58,69],[72,80],[87,94]], 8),
  base("swing", "大きく振り下ろす", ["dynamic", "twist"], [[58,24],[54,35],[42,38],[31,28],[21,17],[65,42],[75,57],[82,73],[53,51],[49,73],[42,76],[33,101],[25,128],[56,76],[66,99],[75,123]], -14),
  base("soft-landing", "着地する", ["dynamic", "foreshortening"], [[49,31],[49,42],[37,47],[25,57],[14,66],[61,47],[73,57],[84,66],[49,59],[50,80],[42,83],[30,101],[18,119],[58,83],[71,101],[83,120]], 5)
];

function mirrorPoints(source) {
  return Object.fromEntries(Object.entries(source).map(([key, [x, y]]) => [key, [100 - x, y]]));
}

export const POSE_LIBRARY = BASES.flatMap((item, index) => [
  { ...item, id: `${item.id}-a`, palette: PALETTES[index % PALETTES.length], body: index % 3, mirrored: false },
  { ...item, id: `${item.id}-b`, title: `${item.title}（反転）`, points: mirrorPoints(item.points), palette: PALETTES[(index + 3) % PALETTES.length], body: (index + 1) % 3, mirrored: true, lineBend: -item.lineBend }
]);

export const POSE_BY_ID = new Map(POSE_LIBRARY.map((pose) => [pose.id, pose]));

function node(name, attrs = {}) {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  return element;
}

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function angle(a, b) {
  return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
}

function limb(group, a, b, color, width) {
  group.append(node("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, "stroke-width": width, "stroke-linecap": "round" }));
}

export function renderPoseSvg(pose, { overlay = false, label = "クロッキー参考ポーズ" } = {}) {
  const svg = node("svg", { viewBox: "0 0 100 140", width: 100, height: 140, role: "img", "aria-label": label, preserveAspectRatio: "xMidYMid meet" });
  const p = pose.points;
  const palette = pose.palette;
  const width = [7.2, 8.5, 6.4][pose.body] || 7.2;
  const shoulderMid = midpoint(p.ls, p.rs);
  const hipMid = midpoint(p.lh, p.rh);

  const defs = node("defs");
  const gradient = node("linearGradient", { id: `bg-${pose.id}`, x1: "0", y1: "0", x2: "1", y2: "1" });
  gradient.append(node("stop", { offset: "0", "stop-color": palette.bg }));
  gradient.append(node("stop", { offset: "1", "stop-color": palette.glow }));
  defs.append(gradient);
  svg.append(defs);
  svg.append(node("rect", { width: 100, height: 140, rx: 8, fill: `url(#bg-${pose.id})` }));
  svg.append(node("circle", { cx: 77, cy: 25, r: 19, fill: palette.glow, opacity: .55 }));
  svg.append(node("ellipse", { cx: midpoint(p.la, p.ra)[0], cy: Math.max(p.la[1], p.ra[1]) + 3, rx: 29, ry: 3.2, fill: palette.ink, opacity: .14 }));

  const body = node("g", { "stroke-linejoin": "round" });
  limb(body, p.lh, p.lk, palette.bottom, width + 2);
  limb(body, p.lk, p.la, palette.bottom, width + 1);
  limb(body, p.rh, p.rk, palette.bottom, width + 2);
  limb(body, p.rk, p.ra, palette.bottom, width + 1);
  limb(body, p.ls, p.le, palette.skin, width);
  limb(body, p.le, p.lw, palette.skin, width - 1);
  limb(body, p.rs, p.re, palette.skin, width);
  limb(body, p.re, p.rw, palette.skin, width - 1);

  body.append(node("path", {
    d: `M ${p.ls[0]} ${p.ls[1]} Q ${p.chest[0] + pose.lineBend * .2} ${p.chest[1]} ${p.rs[0]} ${p.rs[1]} L ${p.rh[0]} ${p.rh[1]} Q ${p.pelvis[0]} ${p.pelvis[1] + 6} ${p.lh[0]} ${p.lh[1]} Z`,
    fill: palette.top,
    stroke: palette.ink,
    "stroke-width": 1.2
  }));
  body.append(node("path", {
    d: `M ${p.lh[0]} ${p.lh[1]} Q ${p.pelvis[0]} ${p.pelvis[1] + 5} ${p.rh[0]} ${p.rh[1]}`,
    fill: "none", stroke: palette.ink, "stroke-width": 1.3, "stroke-linecap": "round"
  }));
  limb(body, p.neck, shoulderMid, palette.skin, width - 2);
  body.append(node("ellipse", {
    cx: p.head[0], cy: p.head[1], rx: pose.body === 1 ? 7.2 : 6.3, ry: 8.2,
    fill: palette.skin, stroke: palette.ink, "stroke-width": 1.1,
    transform: `rotate(${angle(p.neck, p.head) + 90} ${p.head[0]} ${p.head[1]})`
  }));
  body.append(node("path", { d: `M ${p.head[0] - 4.5} ${p.head[1] - 4} Q ${p.head[0]} ${p.head[1] - 10} ${p.head[0] + 4.5} ${p.head[1] - 4}`, fill: "none", stroke: palette.ink, "stroke-width": 2.2, "stroke-linecap": "round" }));
  [p.lw, p.rw, p.la, p.ra].forEach((point, index) => body.append(node("circle", { cx: point[0], cy: point[1], r: index < 2 ? 2.8 : 3.4, fill: index < 2 ? palette.skin : palette.bottom }))); 
  svg.append(body);

  if (overlay) {
    const analysis = node("g", { class: "pose-analysis", "pointer-events": "none" });
    const feet = midpoint(p.la, p.ra);
    const controlX = p.chest[0] + pose.lineBend;
    analysis.append(node("path", {
      d: `M ${p.head[0]} ${p.head[1] - 7} Q ${controlX} ${p.chest[1]} ${p.pelvis[0]} ${p.pelvis[1]} T ${feet[0]} ${feet[1]}`,
      fill: "none", stroke: "#ff3b5c", "stroke-width": 2.2, "stroke-linecap": "round"
    }));
    analysis.append(node("ellipse", {
      cx: p.chest[0], cy: p.chest[1], rx: 11, ry: 15, fill: "#fff", "fill-opacity": .3, stroke: "#0b84f3", "stroke-width": 1.8,
      transform: `rotate(${angle(p.ls, p.rs)} ${p.chest[0]} ${p.chest[1]})`
    }));
    analysis.append(node("rect", {
      x: p.pelvis[0] - 9, y: p.pelvis[1] - 7, width: 18, height: 13, rx: 2,
      fill: "#fff", "fill-opacity": .3, stroke: "#8a3ffc", "stroke-width": 1.8,
      transform: `rotate(${angle(p.lh, p.rh)} ${p.pelvis[0]} ${p.pelvis[1]})`
    }));
    analysis.append(node("line", { x1: p.ls[0], y1: p.ls[1], x2: p.rs[0], y2: p.rs[1], stroke: "#0b84f3", "stroke-width": 1.6 }));
    analysis.append(node("line", { x1: p.lh[0], y1: p.lh[1], x2: p.rh[0], y2: p.rh[1], stroke: "#8a3ffc", "stroke-width": 1.6 }));
    analysis.append(node("line", { x1: p.pelvis[0], y1: p.pelvis[1], x2: p.pelvis[0], y2: Math.max(p.la[1], p.ra[1]) + 2, stroke: "#ff9f0a", "stroke-width": 1.4, "stroke-dasharray": "3 2" }));
    svg.append(analysis);
  }
  return svg;
}
