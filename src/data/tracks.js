import "../../wilds-reel-song.js?v=20260912c";
import "../../goodnews-wave.js?v=20260912b";
import "../../grass-puzzle-fix.js?v=20260912c";
import "../../author-letter.js?v=20260912a";
import "../../brand-credit.js?v=20260912b";

export const tracks = [
  {
    id: "deng-huo", order: 1, title: "灯火",
    snippetSrc: "./denghuo.mp3?v=20260909a", fullAudioSrc: null,
    fragment: { experience: "lamp", audioDurationMs: 25783, visualDurationMs: 25783, postAudioHoldMs: 0, dismissOnBackground: true, autoDismiss: true },
    visualMood: { name: "lamp", accent: "#ffd99a", accentRgb: "255, 217, 154", secondary: "#18335d" },
    nodeBehavior: { x: 38, y: 62, depth: 1, driftX: 12, driftY: -9, driftSeconds: 9.5 },
    glowStyle: { rgb: "255, 211, 137", size: "150px", intensity: 1.2 },
    placeholderTone: { baseFrequency: 110, intervals: [1, 1.5, 2], duration: 8 }
  },
  {
    id: "fragment-02", order: 2, title: "青草地",
    snippetSrc: "./qingcaodi-qingmeiguo.mp3?v=20260909a", fullAudioSrc: null,
    fragment: { experience: "grass", audioDurationMs: 24686, visualDurationMs: 24686, postAudioHoldMs: 0, dismissOnBackground: true, autoDismiss: true },
    visualMood: { name: "retinal", accent: "#a9c2ff", accentRgb: "169, 194, 255", secondary: "#102a5d" },
    nodeBehavior: { x: 32, y: 31, depth: .76, driftX: -14, driftY: 8, driftSeconds: 12 },
    glowStyle: { rgb: "143, 180, 255", size: "120px", intensity: .92 },
    placeholderTone: { baseFrequency: 138.59, intervals: [1, 1.333, 2], duration: 7 }
  },
  {
    id: "fragment-03", order: 3, title: "走出荒野",
    snippetSrc: "./zouchu-huangye.mp3?v=20260909a", fullAudioSrc: null,
    fragment: { experience: "wilds", audioDurationMs: 18312, visualDurationMs: 23312, postAudioHoldMs: 5000, dismissOnBackground: true, autoDismiss: true },
    visualMood: { name: "deep", accent: "#7f9fe8", accentRgb: "127, 159, 232", secondary: "#0b2149" },
    nodeBehavior: { x: 75, y: 27, depth: .63, driftX: 9, driftY: 13, driftSeconds: 10.5 },
    glowStyle: { rgb: "116, 154, 236", size: "105px", intensity: .8 },
    placeholderTone: { baseFrequency: 164.81, intervals: [1, 1.25, 1.75], duration: 7.5 }
  },
  {
    id: "fragment-04", order: 4, title: "别害怕",
    snippetSrc: "./biehaipa.mp3?v=20260909a", fullAudioSrc: null,
    fragment: { experience: "shelter", audioDurationMs: 10057, visualDurationMs: 15057, postAudioHoldMs: 5000, dismissOnBackground: true, autoDismiss: true },
    visualMood: { name: "blue", accent: "#91b5ff", accentRgb: "145, 181, 255", secondary: "#142d61" },
    nodeBehavior: { x: 82, y: 63, depth: .9, driftX: -12, driftY: -7, driftSeconds: 13 },
    glowStyle: { rgb: "134, 174, 255", size: "135px", intensity: .96 },
    placeholderTone: { baseFrequency: 196, intervals: [1, 1.2, 1.5], duration: 8 }
  },
  {
    id: "fragment-05", order: 5, title: "凌晨",
    snippetSrc: "./lingchen.mp3?v=20260909a", fullAudioSrc: null,
    fragment: { experience: "dawn", audioDurationMs: 16222, visualDurationMs: 16222, postAudioHoldMs: 0, dismissOnBackground: true, autoDismiss: true },
    visualMood: { name: "glass", accent: "#cfdeff", accentRgb: "207, 222, 255", secondary: "#182c4c" },
    nodeBehavior: { x: 51, y: 18, depth: .63, driftX: 8, driftY: 9, driftSeconds: 15 },
    glowStyle: { rgb: "190, 211, 255", size: "105px", intensity: .76 },
    placeholderTone: { baseFrequency: 220, intervals: [1, 1.125, 1.5], duration: 6.5 }
  },
  {
    id: "fragment-06", order: 6, title: "goodnews",
    snippetSrc: "./goodnews.mp3?v=20260909a", fullAudioSrc: null,
    fragment: { experience: "goodnews", audioDurationMs: 13636, visualDurationMs: 13636, postAudioHoldMs: 0, dismissOnBackground: true, autoDismiss: true },
    visualMood: { name: "afterimage", accent: "#94a8dd", accentRgb: "148, 168, 221", secondary: "#111c39" },
    nodeBehavior: { x: 61, y: 77, depth: .72, driftX: -10, driftY: -11, driftSeconds: 11.5 },
    glowStyle: { rgb: "132, 154, 218", size: "115px", intensity: .82 },
    placeholderTone: { baseFrequency: 261.63, intervals: [1, 1.333, 1.667], duration: 7 }
  }
];
