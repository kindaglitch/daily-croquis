const NS = "http://www.w3.org/2000/svg";

const pose = (id, title, tags, overlay) => ({
  id,
  title,
  tags,
  image: `./assets/poses/${id}.webp`,
  overlay
});

// The standard library uses locally bundled, original figure-study illustrations.
// Overlay coordinates use a 100 x 133.5 viewBox matching the source image ratio.
export const POSE_LIBRARY = [
  pose("contrapposto", "片脚に体重を預ける", ["gesture", "proportion", "torso"], { line: "M50 10 Q44 46 52 68 T50 121", chest: [50, 43, 11, 15, -4], pelvis: [51, 68, 18, 12, 6], gravity: [51, 68, 50, 122] }),
  pose("long-stride", "大きく歩く", ["gesture", "dynamic", "proportion"], { line: "M47 12 Q45 45 53 68 T50 120", chest: [47, 43, 11, 15, 2], pelvis: [53, 69, 18, 12, -5], gravity: [53, 69, 56, 121] }),
  pose("overhead-reach", "両腕を高く伸ばす", ["gesture", "torso", "proportion"], { line: "M50 23 Q49 49 50 76 T50 124", chest: [50, 49, 11, 15, 0], pelvis: [50, 77, 18, 12, 1], gravity: [50, 77, 50, 124] }),
  pose("side-stretch", "横へ大きく伸びる", ["gesture", "torso", "twist"], { line: "M59 21 Q52 48 49 73 T50 122", chest: [55, 48, 11, 15, 18], pelvis: [50, 73, 18, 12, 1], gravity: [50, 73, 50, 123] }),
  pose("deep-lunge", "深く踏み込む", ["dynamic", "gesture", "foreshortening"], { line: "M48 52 Q45 67 50 82 T52 108", chest: [47, 66, 11, 15, 6], pelvis: [51, 82, 18, 12, -3], gravity: [51, 82, 58, 108] }),
  pose("one-leg-balance", "片脚でバランスを取る", ["gesture", "proportion"], { line: "M50 20 Q51 49 51 76 T51 121", chest: [51, 49, 11, 15, 0], pelvis: [51, 76, 18, 12, 1], gravity: [51, 76, 51, 121] }),
  pose("look-back", "歩きながら振り返る", ["twist", "torso", "gesture"], { line: "M47 18 Q47 46 53 71 T55 121", chest: [48, 45, 11, 15, -8], pelvis: [53, 71, 18, 12, 9], gravity: [53, 71, 56, 121] }),
  pose("sprint-start", "走り出す", ["dynamic", "gesture", "foreshortening"], { line: "M64 40 Q55 59 46 79 T50 119", chest: [56, 59, 11, 15, -32], pelvis: [46, 79, 18, 12, -17], gravity: [46, 79, 52, 119] }),

  pose("seated-knee", "床で片膝を立てる", ["torso", "twist", "foreshortening"], { line: "M35 23 Q38 54 49 78 T55 103", chest: [39, 53, 11, 15, -12], pelvis: [49, 78, 18, 12, 8], gravity: [49, 78, 55, 104] }),
  pose("crouch-turn", "しゃがんで振り向く", ["twist", "foreshortening", "dynamic"], { line: "M45 27 Q49 51 51 73 T50 108", chest: [49, 51, 11, 15, 20], pelvis: [51, 73, 18, 12, -11], gravity: [51, 73, 50, 109] }),
  pose("kneeling-reach", "膝立ちで斜めへ伸びる", ["gesture", "torso", "foreshortening"], { line: "M47 35 Q48 59 41 77 T46 105", chest: [48, 59, 11, 15, -22], pelvis: [41, 77, 18, 12, 10], gravity: [41, 77, 45, 105] }),
  pose("crawl", "四点で身体を支える", ["foreshortening", "dynamic", "proportion"], { line: "M31 48 Q42 66 56 73 T70 89", chest: [42, 66, 11, 15, -55], pelvis: [56, 74, 18, 12, 8], gravity: [56, 74, 54, 104] }),
  pose("low-side-lunge", "低い横踏み込み", ["dynamic", "gesture", "foreshortening"], { line: "M38 57 Q42 72 49 84 T55 99", chest: [42, 72, 11, 15, -35], pelvis: [49, 84, 18, 12, -8], gravity: [49, 84, 53, 100] }),
  pose("recline", "片肘で横たわる", ["foreshortening", "torso", "proportion"], { line: "M30 58 Q42 75 58 85 T75 95", chest: [42, 75, 11, 15, -63], pelvis: [58, 85, 18, 12, -8], gravity: [58, 85, 58, 103] }),
  pose("long-leap", "空中で大きく跳ぶ", ["dynamic", "gesture", "proportion"], { line: "M40 44 Q44 62 50 77 T68 88", chest: [44, 62, 11, 15, -20], pelvis: [50, 77, 18, 12, 15], gravity: [50, 77, 52, 106] }),

  pose("back-view", "背面で腕を組む", ["proportion", "torso"], { line: "M50 13 Q50 44 50 68 T50 124", chest: [50, 43, 11, 15, 0], pelvis: [50, 68, 18, 12, 0], gravity: [50, 68, 50, 124] }),
  pose("profile-stand", "横向きに立つ", ["proportion", "torso"], { line: "M50 18 Q49 47 50 70 T51 122", chest: [50, 47, 9, 15, 0], pelvis: [50, 70, 15, 12, 2], gravity: [50, 70, 51, 122] }),
  pose("chest-open", "胸を開く", ["torso", "gesture", "proportion"], { line: "M50 16 Q50 49 50 76 T50 124", chest: [50, 49, 11, 15, 0], pelvis: [50, 76, 18, 12, 0], gravity: [50, 76, 50, 124] }),
  pose("forward-fold", "上体を深く折る", ["torso", "foreshortening"], { line: "M59 42 Q55 54 54 67 T51 116", chest: [55, 54, 11, 15, -62], pelvis: [54, 68, 18, 12, 5], gravity: [54, 68, 51, 116] }),
  pose("punch-forward", "拳を手前へ出す", ["foreshortening", "dynamic", "twist"], { line: "M45 29 Q46 52 49 72 T50 117", chest: [46, 52, 11, 15, -9], pelvis: [49, 72, 18, 12, 9], gravity: [49, 72, 50, 117] }),
  pose("side-kick", "高く横へ蹴る", ["dynamic", "foreshortening", "proportion"], { line: "M32 46 Q39 63 50 74 T43 119", chest: [39, 63, 11, 15, -45], pelvis: [50, 74, 18, 12, -20], gravity: [50, 74, 43, 119] }),
  pose("throw-windup", "投げる直前にひねる", ["dynamic", "twist", "torso"], { line: "M50 40 Q49 59 53 74 T51 116", chest: [49, 59, 11, 15, 21], pelvis: [53, 74, 18, 12, -12], gravity: [53, 74, 51, 116] }),
  pose("soft-landing", "着地を受け止める", ["dynamic", "gesture", "proportion"], { line: "M51 35 Q50 54 50 76 T50 112", chest: [50, 54, 11, 15, 0], pelvis: [50, 76, 18, 12, 0], gravity: [50, 76, 50, 112] })
];

export const POSE_BY_ID = new Map(POSE_LIBRARY.map((item) => [item.id, item]));

function node(name, attrs = {}) {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  return element;
}

export function renderPoseOverlay(item, label = "構造分析") {
  const { line, chest, pelvis, gravity } = item.overlay;
  const svg = node("svg", {
    class: "pose-analysis-overlay",
    viewBox: "0 0 100 133.5",
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-label": label
  });
  const analysis = node("g", { "pointer-events": "none" });
  analysis.append(node("path", { d: line, fill: "none", stroke: "#ff3155", "stroke-width": 2.2, "stroke-linecap": "round" }));
  analysis.append(node("ellipse", {
    cx: chest[0], cy: chest[1], rx: chest[2], ry: chest[3],
    fill: "#fff", "fill-opacity": .22, stroke: "#0b84f3", "stroke-width": 1.8,
    transform: `rotate(${chest[4]} ${chest[0]} ${chest[1]})`
  }));
  analysis.append(node("rect", {
    x: pelvis[0] - pelvis[2] / 2, y: pelvis[1] - pelvis[3] / 2,
    width: pelvis[2], height: pelvis[3], rx: 2,
    fill: "#fff", "fill-opacity": .22, stroke: "#8a3ffc", "stroke-width": 1.8,
    transform: `rotate(${pelvis[4]} ${pelvis[0]} ${pelvis[1]})`
  }));
  analysis.append(node("line", {
    x1: gravity[0], y1: gravity[1], x2: gravity[2], y2: gravity[3],
    stroke: "#ff9f0a", "stroke-width": 1.4, "stroke-dasharray": "3 2"
  }));
  svg.append(analysis);
  return svg;
}
