/* Topic map in the round 7 look: the articles are patches of ink printed by Paper's Halftone Dots (same grid,
   grey and grain as round 7), areas are named in grey capitals on a pale grey ground, and the three topics of
   the site (Customer success, Product, AI agents) are the three orange dots.
   mount(el, { kind, onPick }) draws one variation into el and returns { setPick, destroy }; clicking a dot picks its topic. */
(function () {
const PILLARS = [
  { id: 'cs', name: 'Customer success' },
  { id: 'product', name: 'Product' },
  { id: 'agents', name: 'AI agents' },
];
// w = [customer success, product, AI agents]: how much each article is about each, read from the text.
const ARTICLES = [
  { id: 'collections', date: '2026-05-27', title: 'Editing and Reconciling Collections without IDs', min: 2, project: 'Voice Todos', w: [0.1, 0.15, 0.75] },
  { id: 'extraction', date: '2026-05-27', title: 'Comparing Models for Time-Sensitive Structured Extraction', min: 3, project: 'Voice Todos', w: [0.2, 0.1, 0.7] },
  { id: 'human-ai', date: '2026-05-18', title: 'Thoughts on Human-AI Collaboration', min: 2, project: 'Voice Todos', w: [0.3, 0.3, 0.4] },
  { id: 'pointing', date: '2026-03-03', title: 'Giving Agents the Ability to Point at Things', min: 5, project: '', w: [0.05, 0.1, 0.85] },
  { id: 'frameworks', date: '2026-02-13', title: 'Agent Frameworks for the Rest of Us', min: 39, project: 'Agent SDKs', w: [0.05, 0.15, 0.8] },
  { id: 'how-long', date: '2026-02-02', title: 'How long for that change?', min: 4, project: '', w: [0.15, 0.7, 0.15] },
  { id: 'january', date: '2026-02-01', title: 'January in review', min: 3, project: '', w: [0.05, 0.25, 0.7] },
  { id: 'prolifics', date: '2026-01-26', title: 'Prolifics and frugals', min: 1, project: '', w: [0.2, 0.7, 0.1] },
  { id: 'slicing', date: '2026-01-19', title: 'The Slicing Fallacy', min: 1, project: '', w: [0.25, 0.7, 0.05] },
  { id: 'planning', date: '2026-01-12', title: "We Can't Stop Planning (Even When We Should)", min: 2, project: '', w: [0.2, 0.75, 0.05] },
  { id: 'cost', date: '2026-01-05', title: "Cost of Change is Agile's ceiling", min: 1, project: '', w: [0.15, 0.75, 0.1] },
  { id: 'compounding', date: '2025-12-24', title: 'Compounding Development Process', min: 4, project: '', w: [0.05, 0.5, 0.45] },
  { id: 'antigravity', date: '2025-12-22', title: '3 weeks with Antigravity and Gemini', min: 5, project: 'Data Lineage', w: [0.05, 0.25, 0.7] },
  { id: 'semi-async', date: '2025-10-22', title: 'The semi-async valley of death', min: 1, project: '', w: [0.1, 0.3, 0.6] },
  { id: 'spec', date: '2025-10-15', title: 'Spec-driven development has it backwards', min: 4, project: '', w: [0.1, 0.5, 0.4] },
  { id: 'paris', date: '2025-09-26', title: 'AI Engineer Paris Conference Notes', min: 2, project: '', w: [0.05, 0.15, 0.8] },
  { id: 'voice-ai', date: '2025-09-01', title: 'Voice AI Maven Course Notes', min: 3, project: '', w: [0.05, 0.1, 0.85] },
  { id: 'faster', date: '2025-01-22', title: 'Faster answers, better questions', min: 1, project: '', w: [0.3, 0.5, 0.2] },
];
const K = { cs: 0, product: 1, agents: 2 };
// An article belongs to a topic when at least 30% of it is about that topic.
const inPillar = (a, id) => a.w[K[id]] >= 0.3;
const MIN = Object.fromEntries(ARTICLES.map((a) => [a.id, a.min]));

// Round 7's map: a 420 x 300 box, positions as fractions of it.
const W = 420, H = 300;

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* An area: its articles scattered around a centre (Gaussian spread sx, sy), one patch each, sized by reading time
   as in round 7. A spine adds small patches along a path so separate areas read as one piece of land. */
function scatter(seed, areas, spine = []) {
  const r = rng(seed), gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const out = [];
  for (const a of areas) for (const id of a.ids) {
    const u = Math.min(0.95, Math.max(0.05, a.c[0] + gauss() * a.s[0])), v = Math.min(0.94, Math.max(0.06, a.c[1] + gauss() * a.s[1]));
    out.push([u, v, MIN[id]]);
  }
  for (const [u, v, m] of spine) out.push([u, v, m]);
  return out;
}

/* Three-island variations, made by docs/redesign/map-tools/gen.py from a few parameters each (or, for "best", from
   parts of three others) and tuned so that,
   as in round 7, little of the land sits at the very top: patches are [x, y, radius, weight]. */
const ISLANDS = {
  best: [[0.2, 0.25, 0.12, 0.72], [0.3, 0.207, 0.087, 0.3], [0.131, 0.213, 0.076, 0.307], [0.23, 0.315, 0.067, 0.353], [0.191, 0.242, 0.04, 0.45], [0.306, 0.258, 0.035, 0.749], [0.226, 0.337, 0.033, 0.462], [0.085, 0.304, 0.029, 0.384], [0.059, 0.289, 0.054, -0.7], [0.226, 0.383, 0.037, 0.782], [0.239, 0.462, 0.043, 0.487], [0.255, 0.527, 0.042, 0.829], [0.269, 0.582, 0.044, 0.915], [0.303, 0.655, 0.034, 0.624], [0.329, 0.711, 0.045, 0.647], [0.45, 0.81, 0.11, 0.82], [0.44, 0.857, 0.074, 0.396], [0.389, 0.83, 0.076, 0.453], [0.359, 0.836, 0.061, 0.385], [0.459, 0.805, 0.04, 0.6], [0.519, 0.776, 0.032, 0.767], [0.557, 0.749, 0.024, 0.522], [0.462, 0.666, 0.022, 0.676], [0.561, 0.671, 0.021, 0.471], [0.379, 0.831, 0.034, 0.451], [0.52, 0.63, 0.042, 0.95], [0.545, 0.54, 0.036, 0.8], [0.565, 0.46, 0.028, 0.62], [0.58, 0.4, 0.016, 0.9], [0.566, 0.726, 0.037, 0.615], [0.592, 0.684, 0.034, 0.665], [0.62, 0.663, 0.043, 0.352], [0.673, 0.63, 0.038, 0.63], [0.716, 0.594, 0.034, 0.529], [0.85, 0.44, 0.13, 0.8], [0.967, 0.431, 0.092, 0.343], [0.761, 0.462, 0.075, 0.397], [0.817, 0.518, 0.088, 0.429], [0.856, 0.446, 0.04, 0.62], [0.786, 0.325, 0.038, 0.63], [0.925, 0.229, 0.031, 0.717], [0.858, 0.275, 0.025, 0.476], [0.863, 0.515, 0.036, 0.597], [0.939, 0.474, 0.027, 0.332], [0.333, 0.253, 0.039, 0.39], [0.385, 0.264, 0.031, 0.368], [0.464, 0.272, 0.028, 0.33], [0.506, 0.259, 0.03, 0.361], [0.563, 0.262, 0.036, 0.383], [0.594, 0.282, 0.036, 0.335], [0.651, 0.287, 0.027, 0.341], [0.691, 0.317, 0.035, 0.339], [0.374, 0.351, 0.039, 0.324], [0.406, 0.383, 0.035, 0.305], [0.468, 0.387, 0.037, 0.286], [0.528, 0.401, 0.034, 0.277], [0.559, 0.417, 0.033, 0.328], [0.624, 0.411, 0.027, 0.273], [0.684, 0.421, 0.039, 0.343], [0.565, 0.352, 0.012, 0.725], [0.602, 0.364, 0.009, 0.764], [0.463, 0.32, 0.016, 1.286], [0.634, 0.37, 0.01, 0.677], [0.518, 0.342, 0.01, 0.881], [0.454, 0.32, 0.01, 0.699], [0.681, 0.364, 0.012, 0.768], [0.419, 0.286, 0.013, 0.643], [0.435, 0.314, 0.021, 1.158], [0.372, 0.274, 0.01, 0.81], [0.05, 0.55, 0.018, 0.895], [0.94, 0.78, 0.021, 0.978], [0.3, 0.94, 0.018, 0.966]],
  roll: [[0.2, 0.25, 0.12, 0.72], [0.14, 0.222, 0.089, 0.421], [0.106, 0.266, 0.066, 0.32], [0.177, 0.329, 0.066, 0.428], [0.191, 0.244, 0.04, 0.45], [0.288, 0.268, 0.034, 0.694], [0.225, 0.354, 0.029, 0.411], [0.078, 0.294, 0.022, 0.439], [0.059, 0.289, 0.054, -0.7], [0.45, 0.81, 0.11, 0.82], [0.413, 0.744, 0.079, 0.393], [0.396, 0.853, 0.066, 0.438], [0.527, 0.813, 0.07, 0.385], [0.44, 0.814, 0.04, 0.6], [0.515, 0.792, 0.027, 0.602], [0.56, 0.737, 0.022, 0.581], [0.477, 0.666, 0.026, 0.596], [0.57, 0.681, 0.019, 0.5], [0.386, 0.836, 0.026, 0.438], [0.85, 0.44, 0.13, 0.8], [0.932, 0.454, 0.096, 0.46], [0.887, 0.391, 0.088, 0.444], [0.891, 0.353, 0.07, 0.349], [0.856, 0.445, 0.04, 0.62], [0.802, 0.318, 0.039, 0.644], [0.934, 0.241, 0.033, 0.666], [0.852, 0.276, 0.024, 0.369], [0.853, 0.54, 0.031, 0.673], [0.922, 0.461, 0.022, 0.438], [0.225, 0.379, 0.034, 0.732], [0.236, 0.438, 0.042, 0.553], [0.241, 0.516, 0.045, 0.829], [0.256, 0.581, 0.041, 0.909], [0.282, 0.65, 0.037, 0.632], [0.325, 0.698, 0.033, 0.641], [0.556, 0.726, 0.03, 0.619], [0.598, 0.684, 0.038, 0.684], [0.645, 0.638, 0.038, 0.355], [0.677, 0.603, 0.033, 0.632], [0.74, 0.56, 0.035, 0.592], [0.34, 0.245, 0.028, 0.436], [0.405, 0.255, 0.036, 0.354], [0.456, 0.271, 0.038, 0.376], [0.515, 0.274, 0.028, 0.37], [0.549, 0.264, 0.036, 0.339], [0.607, 0.294, 0.028, 0.402], [0.641, 0.305, 0.037, 0.434], [0.705, 0.315, 0.037, 0.34], [0.371, 0.348, 0.031, 0.295], [0.406, 0.378, 0.029, 0.294], [0.455, 0.376, 0.037, 0.328], [0.521, 0.411, 0.033, 0.276], [0.558, 0.409, 0.037, 0.36], [0.621, 0.407, 0.035, 0.362], [0.668, 0.432, 0.04, 0.327], [0.499, 0.313, 0.021, 1.285], [0.693, 0.394, 0.01, 0.618], [0.449, 0.33, 0.01, 0.817], [0.484, 0.306, 0.014, 0.827], [0.662, 0.35, 0.013, 0.741], [0.404, 0.29, 0.014, 0.865], [0.618, 0.341, 0.01, 0.758], [0.376, 0.273, 0.012, 0.793], [0.577, 0.358, 0.012, 0.894], [0.622, 0.368, 0.021, 1.149], [0.52, 0.63, 0.042, 0.95], [0.545, 0.54, 0.036, 0.8], [0.565, 0.46, 0.028, 0.62], [0.58, 0.4, 0.016, 0.9], [0.05, 0.55, 0.021, 0.713], [0.94, 0.78, 0.022, 0.713], [0.3, 0.94, 0.016, 0.701]],
  flatsouth: [[0.2, 0.25, 0.12, 0.72], [0.159, 0.328, 0.063, 0.329], [0.116, 0.308, 0.07, 0.373], [0.255, 0.283, 0.081, 0.368], [0.204, 0.249, 0.04, 0.45], [0.3, 0.251, 0.032, 0.606], [0.22, 0.348, 0.031, 0.482], [0.084, 0.309, 0.027, 0.341], [0.059, 0.289, 0.054, -0.7], [0.45, 0.81, 0.11, 0.82], [0.51, 0.767, 0.067, 0.342], [0.482, 0.849, 0.058, 0.457], [0.384, 0.866, 0.082, 0.43], [0.444, 0.803, 0.04, 0.6], [0.544, 0.79, 0.029, 0.796], [0.56, 0.761, 0.021, 0.54], [0.465, 0.684, 0.025, 0.612], [0.579, 0.674, 0.022, 0.493], [0.367, 0.819, 0.029, 0.484], [0.85, 0.44, 0.13, 0.8], [0.879, 0.386, 0.097, 0.45], [0.804, 0.387, 0.09, 0.433], [0.903, 0.389, 0.091, 0.352], [0.849, 0.433, 0.04, 0.62], [0.783, 0.333, 0.04, 0.647], [0.924, 0.215, 0.034, 0.751], [0.842, 0.256, 0.026, 0.476], [0.851, 0.526, 0.038, 0.633], [0.936, 0.465, 0.028, 0.417], [0.222, 0.386, 0.035, 0.794], [0.229, 0.449, 0.043, 0.541], [0.233, 0.506, 0.038, 0.801], [0.266, 0.569, 0.042, 0.932], [0.292, 0.646, 0.04, 0.543], [0.325, 0.703, 0.04, 0.777], [0.574, 0.737, 0.034, 0.593], [0.591, 0.675, 0.029, 0.685], [0.632, 0.645, 0.033, 0.318], [0.697, 0.598, 0.03, 0.627], [0.738, 0.577, 0.04, 0.58], [0.346, 0.275, 0.032, 0.376], [0.382, 0.322, 0.038, 0.367], [0.446, 0.333, 0.03, 0.352], [0.474, 0.359, 0.031, 0.33], [0.522, 0.362, 0.039, 0.35], [0.596, 0.375, 0.028, 0.356], [0.652, 0.37, 0.036, 0.325], [0.685, 0.361, 0.029, 0.347], [0.35, 0.371, 0.03, 0.35], [0.395, 0.416, 0.04, 0.296], [0.452, 0.449, 0.03, 0.321], [0.495, 0.455, 0.034, 0.276], [0.569, 0.461, 0.028, 0.281], [0.606, 0.442, 0.037, 0.292], [0.671, 0.439, 0.031, 0.333], [0.469, 0.374, 0.014, 0.827], [0.631, 0.41, 0.011, 0.9], [0.443, 0.357, 0.02, 1.114], [0.416, 0.331, 0.014, 0.886], [0.663, 0.39, 0.013, 0.727], [0.612, 0.405, 0.011, 0.606], [0.432, 0.372, 0.011, 0.71], [0.612, 0.38, 0.017, 1.26], [0.413, 0.366, 0.013, 0.735], [0.487, 0.372, 0.013, 0.608], [0.52, 0.63, 0.042, 0.95], [0.545, 0.54, 0.036, 0.8], [0.565, 0.46, 0.028, 0.62], [0.58, 0.4, 0.016, 0.9], [0.05, 0.55, 0.017, 0.885], [0.94, 0.78, 0.018, 0.799], [0.3, 0.94, 0.02, 0.908]],
  south: [[0.2, 0.25, 0.12, 0.72], [0.3, 0.207, 0.087, 0.3], [0.131, 0.213, 0.076, 0.307], [0.23, 0.315, 0.067, 0.353], [0.191, 0.242, 0.04, 0.45], [0.306, 0.258, 0.035, 0.749], [0.226, 0.337, 0.033, 0.462], [0.085, 0.304, 0.029, 0.384], [0.059, 0.289, 0.054, -0.7], [0.47, 0.82, 0.11, 0.82], [0.474, 0.76, 0.071, 0.436], [0.447, 0.864, 0.068, 0.446], [0.406, 0.786, 0.073, 0.358], [0.464, 0.817, 0.04, 0.6], [0.559, 0.791, 0.026, 0.616], [0.576, 0.753, 0.025, 0.603], [0.485, 0.676, 0.023, 0.565], [0.598, 0.681, 0.019, 0.397], [0.408, 0.846, 0.033, 0.461], [0.83, 0.43, 0.13, 0.8], [0.715, 0.402, 0.084, 0.471], [0.891, 0.519, 0.067, 0.387], [0.942, 0.444, 0.087, 0.476], [0.836, 0.439, 0.04, 0.62], [0.771, 0.325, 0.038, 0.689], [0.914, 0.216, 0.032, 0.668], [0.829, 0.251, 0.028, 0.482], [0.832, 0.508, 0.035, 0.536], [0.911, 0.469, 0.023, 0.374], [0.226, 0.383, 0.037, 0.782], [0.239, 0.462, 0.043, 0.487], [0.255, 0.527, 0.042, 0.829], [0.269, 0.582, 0.044, 0.915], [0.303, 0.655, 0.034, 0.624], [0.329, 0.711, 0.045, 0.647], [0.593, 0.733, 0.037, 0.658], [0.602, 0.693, 0.036, 0.64], [0.644, 0.631, 0.034, 0.38], [0.667, 0.608, 0.032, 0.633], [0.71, 0.558, 0.035, 0.525], [0.344, 0.312, 0.037, 0.506], [0.375, 0.357, 0.031, 0.56], [0.398, 0.406, 0.039, 0.5], [0.459, 0.429, 0.035, 0.469], [0.488, 0.437, 0.031, 0.569], [0.535, 0.445, 0.033, 0.547], [0.588, 0.445, 0.031, 0.467], [0.628, 0.421, 0.031, 0.553], [0.693, 0.399, 0.034, 0.443], [0.515, 0.461, 0.013, 0.674], [0.694, 0.394, 0.01, 0.709], [0.392, 0.346, 0.011, 0.804], [0.406, 0.421, 0.01, 0.893], [0.645, 0.405, 0.01, 0.82], [0.491, 0.441, 0.013, 0.781], [0.52, 0.433, 0.023, 1.082], [0.46, 0.437, 0.013, 0.731], [0.05, 0.55, 0.018, 0.895], [0.94, 0.78, 0.021, 0.978], [0.3, 0.94, 0.018, 0.966]],
  spit: [[0.22, 0.25, 0.12, 0.72], [0.139, 0.189, 0.074, 0.39], [0.301, 0.222, 0.082, 0.393], [0.258, 0.211, 0.065, 0.432], [0.225, 0.245, 0.04, 0.45], [0.327, 0.25, 0.034, 0.688], [0.242, 0.339, 0.03, 0.47], [0.095, 0.305, 0.029, 0.347], [0.079, 0.211, 0.054, -0.8], [0.45, 0.81, 0.11, 0.82], [0.44, 0.857, 0.074, 0.396], [0.389, 0.83, 0.076, 0.453], [0.359, 0.836, 0.061, 0.385], [0.459, 0.805, 0.04, 0.6], [0.519, 0.776, 0.032, 0.767], [0.557, 0.749, 0.024, 0.522], [0.462, 0.666, 0.022, 0.676], [0.561, 0.671, 0.021, 0.471], [0.379, 0.831, 0.034, 0.451], [0.83, 0.47, 0.13, 0.8], [0.855, 0.534, 0.089, 0.388], [0.778, 0.506, 0.069, 0.424], [0.842, 0.545, 0.073, 0.37], [0.824, 0.478, 0.04, 0.62], [0.774, 0.35, 0.032, 0.795], [0.902, 0.249, 0.032, 0.868], [0.825, 0.297, 0.022, 0.473], [0.832, 0.562, 0.037, 0.602], [0.906, 0.493, 0.026, 0.355], [0.236, 0.394, 0.047, 0.736], [0.244, 0.44, 0.045, 0.561], [0.249, 0.503, 0.041, 0.881], [0.278, 0.583, 0.039, 0.909], [0.291, 0.642, 0.042, 0.629], [0.31, 0.707, 0.033, 0.65], [0.566, 0.726, 0.037, 0.615], [0.592, 0.684, 0.034, 0.665], [0.62, 0.663, 0.043, 0.352], [0.673, 0.63, 0.038, 0.63], [0.716, 0.594, 0.034, 0.529], [0.371, 0.276, 0.027, 0.325], [0.422, 0.271, 0.04, 0.275], [0.457, 0.285, 0.033, 0.281], [0.487, 0.28, 0.031, 0.298], [0.547, 0.278, 0.033, 0.517], [0.595, 0.306, 0.031, 0.548], [0.638, 0.316, 0.038, 0.645], [0.673, 0.341, 0.035, 0.618], [0.711, 0.375, 0.032, 0.635], [0.413, 0.28, 0.011, 0.775], [0.486, 0.274, 0.013, 0.84], [0.492, 0.281, 0.011, 0.693], [0.455, 0.282, 0.02, 1.331], [0.403, 0.268, 0.011, 0.652], [0.336, 0.278, 0.019, 1.11], [0.52, 0.63, 0.042, 0.95], [0.545, 0.54, 0.036, 0.8], [0.565, 0.46, 0.028, 0.62], [0.58, 0.4, 0.016, 0.9], [0.04, 0.5, 0.021, 0.949], [0.95, 0.76, 0.016, 0.741], [0.32, 0.93, 0.018, 0.746]],
  flats: [[0.2, 0.29, 0.12, 0.72], [0.291, 0.328, 0.089, 0.348], [0.277, 0.267, 0.079, 0.42], [0.217, 0.338, 0.065, 0.293], [0.199, 0.282, 0.04, 0.45], [0.288, 0.294, 0.034, 0.78], [0.215, 0.395, 0.034, 0.481], [0.07, 0.33, 0.024, 0.341], [0.104, 0.203, 0.054, -0.6], [0.46, 0.78, 0.11, 0.82], [0.551, 0.765, 0.077, 0.435], [0.533, 0.775, 0.056, 0.387], [0.372, 0.811, 0.055, 0.468], [0.457, 0.77, 0.04, 0.6], [0.543, 0.771, 0.031, 0.749], [0.578, 0.717, 0.021, 0.611], [0.482, 0.629, 0.023, 0.607], [0.586, 0.653, 0.02, 0.456], [0.396, 0.787, 0.034, 0.482], [0.85, 0.44, 0.13, 0.8], [0.967, 0.431, 0.092, 0.343], [0.761, 0.462, 0.075, 0.397], [0.817, 0.518, 0.088, 0.429], [0.856, 0.446, 0.04, 0.62], [0.786, 0.325, 0.038, 0.63], [0.925, 0.229, 0.031, 0.717], [0.858, 0.275, 0.025, 0.476], [0.863, 0.515, 0.036, 0.597], [0.939, 0.474, 0.027, 0.332], [0.221, 0.411, 0.034, 0.754], [0.237, 0.484, 0.037, 0.568], [0.25, 0.531, 0.045, 0.991], [0.258, 0.581, 0.042, 0.942], [0.291, 0.639, 0.035, 0.659], [0.317, 0.667, 0.034, 0.783], [0.565, 0.702, 0.04, 0.613], [0.62, 0.672, 0.035, 0.688], [0.655, 0.63, 0.042, 0.33], [0.691, 0.586, 0.029, 0.643], [0.732, 0.552, 0.037, 0.639], [0.333, 0.253, 0.039, 0.39], [0.385, 0.264, 0.031, 0.368], [0.464, 0.272, 0.028, 0.33], [0.506, 0.259, 0.03, 0.361], [0.563, 0.262, 0.036, 0.383], [0.594, 0.282, 0.036, 0.335], [0.651, 0.287, 0.027, 0.341], [0.691, 0.317, 0.035, 0.339], [0.374, 0.351, 0.039, 0.324], [0.406, 0.383, 0.035, 0.305], [0.468, 0.387, 0.037, 0.286], [0.528, 0.401, 0.034, 0.277], [0.559, 0.417, 0.033, 0.328], [0.624, 0.411, 0.027, 0.273], [0.684, 0.421, 0.039, 0.343], [0.565, 0.352, 0.012, 0.725], [0.602, 0.364, 0.009, 0.764], [0.463, 0.32, 0.016, 1.286], [0.634, 0.37, 0.01, 0.677], [0.518, 0.342, 0.01, 0.881], [0.454, 0.32, 0.01, 0.699], [0.681, 0.364, 0.012, 0.768], [0.419, 0.286, 0.013, 0.643], [0.435, 0.314, 0.021, 1.158], [0.372, 0.274, 0.01, 0.81], [0.05, 0.5, 0.018, 0.985], [0.95, 0.74, 0.016, 0.837], [0.64, 0.94, 0.02, 0.725]],
};

/* Best of three runs past the right edge of the box (its dots reach x = 1.06), so it is drawn 7% smaller about the
   centre of its land and moved to sit inside the box with a 2.5% margin. Labels and dots move with it. */
const fit = (k, cx, cy) => {
  const at = (x, y) => [0.5 + (x - cx) * k, 0.5 + (y - cy) * k];
  return {
    patches: (ps) => ps.map(([x, y, r, w]) => [...at(x, y), r * k, w]),
    label: ([t, x, y]) => [t, ...at(x, y)],
    pin: ([x, y, ...side]) => [...at(x, y), ...side],
  };
};
const BEST = fit(0.927, 0.546, 0.533);

/* Six maps. Each one: the areas (name, where the name sits, where the articles gather, which articles),
   and where the three orange dots go ('l' puts the dot's label on its left). */
const V = [
  {
    id: 'best', name: 'Best of three',
    note: 'Parts taken as they were from the three you liked: Customer success and its link to Product from Shelf bent south, Product and the land it pushes toward AI agents from Spit from AI agents, AI agents and the twin low strips from Tidal flats.',
    patches: () => BEST.patches(ISLANDS['best']),
    labels: [["IDENTIFY THE VALUE", 0.2, 0.15], ["DECIDE WHAT TO BUILD", 0.45, 0.91], ["SOFTWARE FACTORY", 0.85, 0.33]].map(BEST.label),
    pins: { cs: BEST.pin([0.2, 0.25]), product: BEST.pin([0.45, 0.81]), agents: BEST.pin([0.85, 0.44, 'l']) },
  },
  {
    id: 'roll', name: 'Best of three, new roll',
    note: 'The same recipe drawn again: same positions, heights and kinds of links, with fresh hills, lobes and coastline.',
    patches: () => ISLANDS['roll'],
    labels: [["IDENTIFY THE VALUE", 0.2, 0.15], ["DECIDE WHAT TO BUILD", 0.45, 0.91], ["SOFTWARE FACTORY", 0.85, 0.33]],
    pins: { cs: [0.2, 0.25], product: [0.45, 0.81], agents: [0.85, 0.44, 'l'] },
  },
  {
    id: 'flatsouth', name: 'Flats bent south',
    note: 'The same recipe with the twin low strips sagging south, so the sea between them and Product narrows to a channel.',
    patches: () => ISLANDS['flatsouth'],
    labels: [["IDENTIFY THE VALUE", 0.2, 0.15], ["DECIDE WHAT TO BUILD", 0.45, 0.91], ["SOFTWARE FACTORY", 0.85, 0.33]],
    pins: { cs: [0.2, 0.25], product: [0.45, 0.81], agents: [0.85, 0.44, 'l'] },
  },
  {
    id: 'south', name: 'Shelf bent south',
    note: 'The shallow link sags south toward Product and leaves only a narrow channel where the lagoon was.',
    patches: () => ISLANDS['south'],
    labels: [["IDENTIFY THE VALUE", 0.2, 0.15], ["DECIDE WHAT TO BUILD", 0.47, 0.92], ["SOFTWARE FACTORY", 0.83, 0.32]],
    pins: { cs: [0.2, 0.25], product: [0.47, 0.82], agents: [0.83, 0.43, 'l'] },
  },
  {
    id: 'spit', name: 'Spit from AI agents',
    note: 'The link is solid land on the AI agents side and breaks up into rocks as it nears Customer success.',
    patches: () => ISLANDS['spit'],
    labels: [["IDENTIFY THE VALUE", 0.22, 0.15], ["DECIDE WHAT TO BUILD", 0.45, 0.91], ["SOFTWARE FACTORY", 0.83, 0.36]],
    pins: { cs: [0.22, 0.25], product: [0.45, 0.81], agents: [0.83, 0.47, 'l'] },
  },
  {
    id: 'flats', name: 'Tidal flats',
    note: 'A wide band of low flats instead of a single strip; the sea shrinks to an inlet below it.',
    patches: () => ISLANDS['flats'],
    labels: [["IDENTIFY THE VALUE", 0.2, 0.19], ["DECIDE WHAT TO BUILD", 0.46, 0.88], ["SOFTWARE FACTORY", 0.85, 0.33]],
    pins: { cs: [0.2, 0.29], product: [0.46, 0.78], agents: [0.85, 0.44, 'l'] },
  },
  {
    // Hand-placed patches: [x, y, radius, weight], drawn from Josselin's sketch. Hills are clusters of overlapping
    // patches; lower ground is single, lighter patches; a negative weight carves a bay.
    id: 'vshape', name: 'Three islands, from your sketch',
    note: 'Three islands around a central sea, each centred on its topic, heights as in round 7: AI agents highest, Product in the middle, Customer success lowest, with a bay in its north-west coast. Land joins Customer success to Product (a waist, a dip, its own hill) and Product to AI agents (a saddle between two rises); a shallow, rocky strip arcs over the top from Customer success to AI agents.',
    patches: () => [
      // Customer success: lowest; a round island around its dot, a bay cut into the north-west coast (negative patch), an elongated hill with two summits, a southern lobe, a western lobe
      [0.22, 0.27, 0.13, 1.05], [0.19, 0.26, 0.045, 1.26], [0.3, 0.27, 0.04, 1.05], [0.25, 0.27, 0.03, 0.56], [0.24, 0.38, 0.045, 0.7], [0.08, 0.33, 0.035, 0.56],
      [0.08, 0.15, 0.04, -1.1],
      // Left link (Customer success to Product): a waist, a dip, its own hill, then lower ground into Product
      [0.21, 0.46, 0.035, 0.75], [0.24, 0.53, 0.033, 0.675], [0.27, 0.59, 0.042, 1.65], [0.3, 0.66, 0.04, 1.05],
      // Product: medium; a curved ridge peaking at its dot with a hook to the east, two small hills to the north
      [0.47, 0.78, 0.1, 1], [0.46, 0.8, 0.05, 1.75], [0.4, 0.8, 0.04, 0.875], [0.55, 0.77, 0.04, 1.125], [0.6, 0.71, 0.03, 0.875], [0.48, 0.64, 0.03, 1],
      [0.58, 0.64, 0.025, 0.75],
      // Right link (Product to AI agents): merged, a saddle between two rises
      [0.64, 0.68, 0.04, 1.17], [0.68, 0.63, 0.035, 0.78], [0.72, 0.58, 0.04, 1.3],
      // AI agents: highest; a broad high island, the main hill at the dot, an upper ridge with two summits
      [0.84, 0.44, 0.13, 1.5], [0.85, 0.46, 0.05, 1.5], [0.85, 0.54, 0.045, 1.1], [0.78, 0.33, 0.045, 1.1], [0.92, 0.23, 0.045, 1.2], [0.85, 0.28, 0.035, 0.7],
      // Top link (Customer success to AI agents): shallow, a low-tide shelf arcing over the top, with rocks
      [0.4, 0.2, 0.03, 0.54], [0.46, 0.16, 0.03, 0.504], [0.53, 0.15, 0.03, 0.54], [0.6, 0.18, 0.03, 0.54], [0.65, 0.23, 0.03, 0.576], [0.69, 0.3, 0.03, 0.612],
      [0.72, 0.36, 0.03, 0.684], [0.43, 0.18, 0.014, 1.08], [0.5, 0.16, 0.016, 1.17], [0.56, 0.13, 0.012, 0.9], [0.62, 0.21, 0.015, 1.26], [0.67, 0.27, 0.013, 0.99],
      [0.71, 0.33, 0.012, 0.9],
      // Islets
      [0.03, 0.55, 0.02, 0.78], [0.96, 0.74, 0.02, 0.715], [0.7, 0.92, 0.018, 0.65], [0.34, 0.92, 0.015, 0.585],
    ],
    labels: [['IDENTIFY THE VALUE', 0.22, 0.05], ['DECIDE WHAT TO BUILD', 0.47, 0.96], ['SOFTWARE FACTORY', 0.86, 0.08]],
    pins: { cs: [0.21, 0.26], product: [0.46, 0.8], agents: [0.85, 0.46, 'l'] },
  },
  {
    id: 'r7', name: 'Round 7, re-pinned',
    note: 'Round 7 as it was: same patches, same three areas. The orange dots now mark your three topics instead of the projects.',
    patches: () => [
      [0.66, 0.30, 39], [0.78, 0.22, 5], [0.60, 0.44, 3], [0.73, 0.40, 2], [0.84, 0.36, 5], [0.70, 0.16, 2], [0.57, 0.24, 3],
      [0.20, 0.52, 4], [0.30, 0.64, 1], [0.24, 0.74, 2], [0.36, 0.52, 1], [0.14, 0.66, 4], [0.33, 0.80, 1], [0.42, 0.66, 4],
      [0.58, 0.72, 2], [0.70, 0.82, 1], [0.78, 0.68, 3], [0.64, 0.90, 1],
    ],
    labels: [['AGENTS & TOOLS', 0.72, 0.06], ['HOW TEAMS BUILD', 0.26, 0.42], ['NOTES TO SELF', 0.71, 0.97]],
    pins: { agents: [0.66, 0.30], product: [0.24, 0.64], cs: [0.48, 0.86] },
  },
  {
    id: 'regions', name: 'Three regions',
    note: 'One region per topic, named by what you do there. Customer success gets its own region at the top, small for now.',
    patches: () => scatter(3, [
      { c: [0.5, 0.27], s: [0.05, 0.06], ids: ['human-ai', 'faster', 'extraction'] },
      { c: [0.24, 0.68], s: [0.07, 0.08], ids: ['cost', 'planning', 'slicing', 'prolifics', 'how-long', 'spec', 'compounding'] },
      { c: [0.76, 0.64], s: [0.07, 0.09], ids: ['frameworks', 'pointing', 'voice-ai', 'paris', 'antigravity', 'collections', 'january', 'semi-async'] },
    ]),
    labels: [['WHAT USERS NEED', 0.5, 0.06], ['HOW TEAMS SHIP', 0.22, 0.95], ['BUILDING WITH AGENTS', 0.76, 0.95]],
    pins: { cs: [0.5, 0.27], product: [0.24, 0.68], agents: [0.76, 0.62, 'l'] },
  },
  {
    id: 'bridge', name: 'Bridge',
    note: 'Four areas in a line, from planning to tools. Product and AI agents hold the two ends; customer success sits in the middle, where they meet.',
    patches: () => scatter(8, [
      { c: [0.15, 0.76], s: [0.05, 0.06], ids: ['cost', 'planning', 'slicing'] },
      { c: [0.36, 0.6], s: [0.05, 0.06], ids: ['how-long', 'prolifics', 'faster', 'compounding'] },
      { c: [0.6, 0.44], s: [0.06, 0.06], ids: ['spec', 'semi-async', 'human-ai', 'collections', 'extraction'] },
      { c: [0.82, 0.26], s: [0.06, 0.07], ids: ['frameworks', 'pointing', 'voice-ai', 'paris', 'antigravity', 'january'] },
    ], Array.from({ length: 12 }, (_, i) => [0.14 + i * 0.062, 0.77 - i * 0.046, 0.3])),
    labels: [['HOW TEAMS PLAN', 0.15, 0.95], ['SPEED & FLOW', 0.3, 0.4], ['AGENTS IN THE LOOP', 0.68, 0.66], ['TOOLS & MODELS', 0.78, 0.06]],
    pins: { product: [0.15, 0.76], cs: [0.48, 0.52], agents: [0.82, 0.27, 'l'] },
  },
  {
    id: 'islands', name: 'Archipelago',
    note: 'Six small islands, one per subject you write about. The three dots sit between the islands they connect.',
    patches: () => scatter(21, [
      { c: [0.14, 0.3], s: [0.035, 0.04], ids: ['cost', 'planning', 'slicing'] },
      { c: [0.2, 0.72], s: [0.035, 0.04], ids: ['how-long', 'prolifics', 'faster'] },
      { c: [0.47, 0.5], s: [0.04, 0.045], ids: ['spec', 'semi-async', 'compounding', 'human-ai'] },
      { c: [0.74, 0.24], s: [0.03, 0.035], ids: ['frameworks', 'pointing'] },
      { c: [0.85, 0.62], s: [0.035, 0.04], ids: ['voice-ai', 'collections', 'extraction'] },
      { c: [0.6, 0.83], s: [0.04, 0.035], ids: ['antigravity', 'january', 'paris'] },
    ]),
    labels: [['PLANNING & SLICING', 0.16, 0.09], ['SPEED & FLOW', 0.2, 0.93], ['BUILDING WITH AGENTS', 0.47, 0.29], ['AGENT FRAMEWORKS', 0.74, 0.05], ['VOICE & EXTRACTION', 0.83, 0.83], ['TOOLS & MODELS', 0.47, 0.95]],
    pins: { product: [0.2, 0.5], cs: [0.42, 0.68], agents: [0.7, 0.46] },
  },
  {
    id: 'formats', name: 'Formats',
    note: 'Areas by kind of writing: essays, field notes, experiments. The three topics run across them, so the dots sit on the borders.',
    patches: () => scatter(5, [
      { c: [0.3, 0.5], s: [0.11, 0.13], ids: ['cost', 'planning', 'slicing', 'prolifics', 'how-long', 'faster', 'semi-async', 'spec', 'human-ai'] },
      { c: [0.76, 0.27], s: [0.07, 0.07], ids: ['voice-ai', 'paris', 'antigravity', 'january', 'compounding'] },
      { c: [0.74, 0.74], s: [0.06, 0.07], ids: ['frameworks', 'pointing', 'collections', 'extraction'] },
    ]),
    labels: [['ESSAYS', 0.18, 0.1], ['FIELD NOTES', 0.8, 0.06], ['EXPERIMENTS', 0.86, 0.95]],
    pins: { product: [0.26, 0.5], agents: [0.74, 0.5, 'l'], cs: [0.48, 0.8] },
  },
  {
    id: 'landmass', name: 'One landmass',
    note: 'A single piece of land with three lobes, each named by the question it asks. Each dot sits on its own lobe.',
    patches: () => scatter(14, [
      { c: [0.17, 0.68], s: [0.06, 0.07], ids: ['cost', 'planning', 'slicing', 'prolifics', 'how-long', 'spec', 'compounding'] },
      { c: [0.48, 0.3], s: [0.05, 0.06], ids: ['human-ai', 'faster', 'extraction'] },
      { c: [0.8, 0.4], s: [0.07, 0.08], ids: ['frameworks', 'pointing', 'voice-ai', 'paris', 'antigravity', 'collections', 'january', 'semi-async'] },
    ], [
      ...Array.from({ length: 14 }, (_, i) => { const t = i / 13; return [0.16 + t * 0.66, 0.66 - 0.28 * t + 0.1 * Math.sin(t * Math.PI), 0.6]; }),
      ...Array.from({ length: 5 }, (_, i) => [0.46 + i * 0.008, 0.52 - i * 0.045, 0.6]),
    ]),
    labels: [['WHY TEAMS SLOW DOWN', 0.18, 0.93], ['WHAT PEOPLE NEED', 0.48, 0.07], ['WHAT AGENTS CAN DO', 0.8, 0.13]],
    pins: { product: [0.17, 0.68], cs: [0.48, 0.3], agents: [0.8, 0.42, 'l'] },
  },
];

/* Round 7's ink: dark where patches gather, each patch r = 0.035 + 0.018 * sqrt(minutes) of the box (capped for the long report).
   Also returns a mask of where there is ink at all: the shader leaves a faint dot even on blank paper, which round 7's
   paper texture hid but a white page shows, so the print is masked to the inked areas. */
function source(patches) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), d = g.createImageData(W, H), md = g.createImageData(W, H);
  // Patches are [x, y, minutes] (round 7: radius from reading time) or [x, y, radius, weight] when placed by hand.
  const ps = patches.map(([x, y, m, w]) => (w === undefined ? [x, y, Math.min(0.12, 0.035 + 0.018 * Math.sqrt(m)), 1] : [x, y, m, w]));
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const u = px / W, v = py / H;
    let s = 0;
    for (const [x, y, r, w] of ps) s += w * Math.exp(-((u - x) ** 2 + (v - y) ** 2) / (2 * r * r));
    s = Math.max(0, s);
    const ink = 0.62 * (1 - Math.exp(-1.3 * s)), i = (py * W + px) * 4;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = 255 * (1 - ink); d.data[i + 3] = 255;
    // The mask also fades over the outer 4% of the box, so land that reaches an edge thins out instead of stopping.
    const e = Math.min(1, u / 0.04, (1 - u) / 0.04, v / 0.04, (1 - v) / 0.04), fade = e * e * (3 - 2 * e);
    md.data[i + 3] = 255 * fade * Math.min(1, Math.max(0, (ink - 0.02) / 0.06));
  }
  g.putImageData(md, 0, 0);
  const mask = c.toDataURL('image/png');
  g.putImageData(d, 0, 0);
  const img = new Image(); img.src = c.toDataURL('image/png');
  return new Promise((r) => { img.onload = () => r({ img, mask }); });
}
// Round 7 printed with u_size 0.78 on a map about 420 px tall; keep that dot spacing whatever the size here.
const PITCH = 7.8;
const sizeFor = (h) => Math.pow((300 - Math.min(300, Math.max(7, h / PITCH))) / 293, 1 / 0.7);
async function print(holder, spec) {
  const P = await import('https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/+esm');
  const { img, mask } = await source(spec.patches());
  for (const k of ['maskImage', 'webkitMaskImage']) holder.style[k] = `url(${mask})`;
  for (const k of ['maskSize', 'webkitMaskSize']) holder.style[k] = '100% 100%';
  return new P.ShaderMount(holder, P.halftoneDotsFragmentShader, {
    u_image: img, u_colorFront: P.getShaderColorFromString('#9a9991'), u_colorBack: [0, 0, 0, 0],
    u_size: sizeFor(holder.clientHeight || 300), u_radius: 1.0, u_contrast: 0.72, u_originalColors: false, u_inverted: false,
    u_grainMixer: 0.15, u_grainOverlay: 0, u_grainSize: 0.5,
    u_grid: P.HalftoneDotsGrids.hex, u_type: P.HalftoneDotsTypes.classic,
    u_fit: P.ShaderFitOptions.cover, u_scale: 1, u_rotation: 0, u_offsetX: 0, u_offsetY: 0,
    u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0,
  }, { premultipliedAlpha: true, alpha: true }, 0);
}

// Round 7's labels and pins, unchanged: grey capitals on a pale ground; orange dots with a pale ring and an ink label.
const CSS = `
.tm { position: relative; aspect-ratio: ${W} / ${H}; font-family: var(--mono, Menlo, monospace); line-height: 1.6; }
.tm-print, .tm-labels { position: absolute; inset: 0; }
.tm-area { position: absolute; transform: translate(-50%, -50%); font-size: 10px; letter-spacing: 0.08em; color: var(--muted, #686862); background: rgba(244, 243, 238, 0.82); padding: 2px 6px; white-space: nowrap; pointer-events: none; }
.tm-pin { position: absolute; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; padding: 0; border: 0; border-radius: 50%; background: var(--accent, #b64b00); box-shadow: 0 0 0 3px rgba(244, 243, 238, 0.9); cursor: pointer; font: inherit; transition: opacity 0.2s; }
.tm-pin span { position: absolute; left: 14px; top: -6px; font-size: 11px; color: var(--ink, #151515); white-space: nowrap; background: rgba(244, 243, 238, 0.82); padding: 0 4px; }
.tm-pin.l span { left: auto; right: 14px; }
.tm-pin:hover span, .tm-pin:focus-visible span, .tm-pin.on span { text-decoration: underline; text-underline-offset: 3px; }
.tm-pin:focus { outline: none; }
.tm-pin:focus-visible { outline: 2px solid var(--accent, #b64b00); outline-offset: 4px; }
.tm.picking .tm-pin:not(.on) { opacity: 0.4; }
`;
let styled = false;
function style() {
  if (styled) return; styled = true;
  const s = document.createElement('style'); s.textContent = CSS; document.head.append(s);
}

function mount(root, { kind, onPick } = {}) {
  style();
  root.innerHTML = '';
  const spec = V.find((v) => v.id === kind) || V[0];
  const tm = document.createElement('div'); tm.className = 'tm';
  tm.setAttribute('role', 'group'); tm.setAttribute('aria-label', 'Map of the writing: Customer success, Product and AI agents');
  tm.innerHTML = '<div class="tm-print"></div><div class="tm-labels"></div>';
  root.append(tm);
  const labels = tm.querySelector('.tm-labels'), pct = (x) => (x * 100).toFixed(2) + '%';
  for (const [t, x, y] of spec.labels) {
    const e = document.createElement('span'); e.className = 'tm-area'; e.textContent = t;
    e.style.left = pct(x); e.style.top = pct(y); labels.append(e);
  }
  for (const p of PILLARS) {
    const [x, y, side] = spec.pins[p.id];
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tm-pin' + (side === 'l' ? ' l' : ''); b.dataset.pick = p.id;
    b.style.left = pct(x); b.style.top = pct(y);
    b.innerHTML = `<span>${p.name}</span>`;
    labels.append(b);
  }
  let shader = null, gone = false, pick = null;
  print(tm.querySelector('.tm-print'), spec).then((m) => { if (gone) m.dispose(); else { shader = m; tm.__shader = m; } });
  tm.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) onPick?.(b.dataset.pick === pick ? null : b.dataset.pick); });
  return {
    setPick(id) {
      pick = id;
      tm.classList.toggle('picking', !!id);
      tm.querySelectorAll('[data-pick]').forEach((b) => b.classList.toggle('on', b.dataset.pick === id));
    },
    destroy() { gone = true; shader?.dispose(); },
  };
}

// On show for now: the three kept from the first round of variations, then three new ones built from their best parts.
const SHOWN_IDS = ['south', 'spit', 'flats', 'best', 'roll', 'flatsouth'];
window.TopicMap = { PILLARS, ARTICLES, inPillar, mount, SHOWN: SHOWN_IDS.map((id) => V.find((v) => v.id === id)).map(({ id, name, note, labels }) => ({ id, name, note, areas: labels.map((l) => l[0]) })) };
})();
