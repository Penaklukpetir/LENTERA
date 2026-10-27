/**
 * =====================================================================================
 *  LENTERA AI INFERENCE SERVICE v2
 *  - ONNX Runtime (jika model .onnx ada di backend/models/)
 *  - atau Built-in Random-Weight Neural Net via pure JS (AUTO-MODE: REAL_PSEUDO_ONNX)
 *    -> Tanpa perlu install Python, tanpa perlu training dulu.
 *    -> Pipeline preprocessing gambar (sharp) 100% REAL, prediksi dari weight matrix random
 *       yang konsisten (pakai seed deterministic).
 *
 *  Fitur unik terbaru:
 *   - SMART INFERENCE: Periksa histogram warna dominan hijau/kuning/coklat untuk estimasi
 *     kesehatan daun. Hasil prediksi LEBIH realistis daripada cek nama file.
 * =====================================================================================
 */

import ort from 'onnxruntime-node';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, 'models');
const DEFAULT_CONF_YOLO = 0.45;
const DEFAULT_IOU_YOLO = 0.5;

/* -------------------------------------------------------------------------- */
/*                    SEEDED RANDOM (deterministic per session)              */
/* -------------------------------------------------------------------------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const RAND = mulberry32(20260825); // Seed LENTERA: tanggal setup

function randn() {
  // Box-Muller untuk normal(0,1)
  let u = 0, v = 0;
  while (u === 0) u = RAND();
  while (v === 0) v = RAND();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* -------------------------------------------------------------------------- */
/*                   PSEUDO MODEL: BUILT-IN NEURAL NET (NO ONNX NEEDED)      */
/* -------------------------------------------------------------------------- */

const PSEUDO = {
  initialized: false,
  mn: {
    // MobileNet-style: 2 layer MLP atas 32 global feature bins
    w1: null, b1: null,
    w2: null, b2: null,
  },
  yolo: {
    // Proyeksi 64 feature -> 8400 x 8 detections
    w_proj: null, b_proj: null,
  },
  colorBins: 32,
};

function initPseudoModels() {
  if (PSEUDO.initialized) return;
  const F = PSEUDO.colorBins * 3; // RGB
  // MobileNet: [F, 16] + [16, 4]
  PSEUDO.mn.w1 = new Float32Array(F * 16);
  PSEUDO.mn.b1 = new Float32Array(16);
  for (let i = 0; i < PSEUDO.mn.w1.length; i++) PSEUDO.mn.w1[i] = randn() * 0.15;
  for (let i = 0; i < 16; i++) PSEUDO.mn.b1[i] = randn() * 0.05;

  PSEUDO.mn.w2 = new Float32Array(16 * 4);
  PSEUDO.mn.b2 = new Float32Array(4);
  for (let i = 0; i < PSEUDO.mn.w2.length; i++) PSEUDO.mn.w2[i] = randn() * 0.2;
  PSEUDO.mn.b2[0] = 1.5; // Bias healthy besar
  PSEUDO.mn.b2[1] = -0.5;
  PSEUDO.mn.b2[2] = -0.5;
  PSEUDO.mn.b2[3] = -0.5;

  // YOLO: F -> 8 * 8400 (kita gunakan pooling sederhana: F -> 256 -> 8*21, lalu tile ke 8400 /21 = 400)
  PSEUDO.yolo.w_proj = new Float32Array(F * 168);  // 8 * 21 = 168
  PSEUDO.yolo.b_proj = new Float32Array(168);
  for (let i = 0; i < PSEUDO.yolo.w_proj.length; i++) PSEUDO.yolo.w_proj[i] = randn() * 0.1;
  for (let i = 0; i < 168; i++) {
    const mod8 = i % 8;
    PSEUDO.yolo.b_proj[i] = mod8 < 4 ? 0.45 : (mod8 === 4 ? 1.0 : -0.5);
  }

  PSEUDO.initialized = true;
}

function relu(arr) {
  for (let i = 0; i < arr.length; i++) if (arr[i] < 0) arr[i] = 0;
  return arr;
}

function softmax(arr) {
  const out = new Float32Array(arr.length);
  let m = -Infinity;
  for (let i = 0; i < arr.length; i++) if (arr[i] > m) m = arr[i];
  let s = 0;
  for (let i = 0; i < arr.length; i++) {
    out[i] = Math.exp(arr[i] - m);
    s += out[i];
  }
  for (let i = 0; i < arr.length; i++) out[i] = (s === 0 ? (1 / arr.length) : out[i] / s);
  return out;
}

function sigmoid(x) { return 1.0 / (1.0 + Math.exp(-x)); }

function matmul(A, B, C, M, N, K, bias) {
  // C = A [M,K] x B [K,N] + bias [N]
  for (let m = 0; m < M; m++) {
    for (let n = 0; n < N; n++) {
      let s = bias ? bias[n] : 0;
      for (let k = 0; k < K; k++) s += A[m * K + k] * B[k * N + n];
      C[m * N + n] = s;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                          IMAGE FEATURE EXTRACTION (SHARP)                 */
/* -------------------------------------------------------------------------- */

async function extractColorHistFeature(imgBuffer) {
  // Resize -> 64x64 -> raw pixel -> compute 32-bin histogram per channel (0..1 normalized)
  const raw = await sharp(imgBuffer).resize(64, 64, { fit: 'fill' }).raw().toBuffer();
  const BINS = PSEUDO.colorBins;
  const histR = new Float32Array(BINS);
  const histG = new Float32Array(BINS);
  const histB = new Float32Array(BINS);
  const N = 64 * 64;
  // Hitung rata-rata warna untuk logic boost
  let sumR = 0, sumG = 0, sumB = 0;
  // Pixel-level disease spot detection:
  // Hitung % pixel yang menunjukkan warna bercak penyakit (kuning/coklat/orange/krem)
  let sickPixelCount = 0;
  let healthyPixelCount = 0;  // Hijau dominan
  let sumSickR = 0, sumSickG = 0, sumSickB = 0;
  // Yellowness: R+G tinggi, B rendah, dan R ≈ G
  let yellowishCount = 0;
  // Brownish/darkspot: R > G > B dan terang sedang
  let brownishCount = 0;

  for (let i = 0; i < N; i++) {
    const idx = i * 3;
    const r = raw[idx], g = raw[idx + 1], b = raw[idx + 2];
    sumR += r; sumG += g; sumB += b;
    histR[Math.min(BINS - 1, (r * BINS) >> 8)]++;
    histG[Math.min(BINS - 1, (g * BINS) >> 8)]++;
    histB[Math.min(BINS - 1, (b * BINS) >> 8)]++;

    const rn = r / 255, gn = g / 255, bn = b / 255;
    // Healthy: hijau mendominasi
    const isHealthyGreen = gn > rn + 0.05 && gn > bn + 0.08 && rn < 0.65;
    // Yellowish: R dan G hampir setara, keduanya cukup tinggi, B rendah
    const isYellowish = (Math.abs(rn - gn) < 0.12) && (rn > 0.32) && (bn < 0.32);
    // Brownish: R > G > B dan rata2 di mid-low (bukan terlalu terang/putih)
    const avg = (rn + gn + bn) / 3;
    const isBrownish = (rn > gn + 0.02) && (gn > bn + 0.01) && (avg > 0.18) && (avg < 0.62);
    // Orange rust spot (khusus karat daun): R > G >> B, R agak tinggi
    const isOrangeSpot = (rn > 0.4) && (rn - gn > 0.06) && (gn - bn > 0.04) && (bn < 0.3);

    if (isHealthyGreen) healthyPixelCount++;
    if (isYellowish || isBrownish || isOrangeSpot) {
      sickPixelCount++;
      sumSickR += rn; sumSickG += gn; sumSickB += bn;
      if (isYellowish) yellowishCount++;
      if (isBrownish || isOrangeSpot) brownishCount++;
    }
  }
  const norm = 1 / N;
  for (let i = 0; i < BINS; i++) {
    histR[i] *= norm; histG[i] *= norm; histB[i] *= norm;
  }
  // Concat features: [R bins | G bins | B bins] length F = BINS * 3
  const F = BINS * 3;
  const feat = new Float32Array(F);
  for (let i = 0; i < BINS; i++) {
    feat[i] = histR[i];
    feat[i + BINS] = histG[i];
    feat[i + 2 * BINS] = histB[i];
  }

  const sickRatio = sickPixelCount * norm;     // % pixel "sakit"
  const healthyRatio = healthyPixelCount * norm;
  const deltaGR = (sumG - sumR) / N / 255;     // Selisih G-R rata2
  const deltaGB = (sumG - sumB) / N / 255;

  // Ambang heuristik: Jika rasio kuning/coklat > 18% -> kuat indikasi penyakit
  const strongDiseaseSignal = sickRatio > 0.18;
  const mildDiseaseSignal = sickRatio > 0.09;
  const veryStrongGreen = healthyRatio > 0.45;
  const avgSickR = sickPixelCount ? sumSickR / sickPixelCount : 0;
  const avgSickG = sickPixelCount ? sumSickG / sickPixelCount : 0;
  const avgSickB = sickPixelCount ? sumSickB / sickPixelCount : 0;

  return {
    feature: feat,
    avg: { r: sumR / N / 255, g: sumG / N / 255, b: sumB / N / 255 },
    disease: {
      sick_ratio: Number(sickRatio.toFixed(4)),
      healthy_ratio: Number(healthyRatio.toFixed(4)),
      yellowish_pct: Number((yellowishCount * norm * 100).toFixed(2)),
      brownish_pct: Number((brownishCount * norm * 100).toFixed(2)),
      strong_signal: strongDiseaseSignal,
      mild_signal: mildDiseaseSignal,
      very_strong_green: veryStrongGreen,
      avg_sick_rgb: {
        r: Number(avgSickR.toFixed(3)),
        g: Number(avgSickG.toFixed(3)),
        b: Number(avgSickB.toFixed(3)),
      },
      delta_green_minus_red: Number(deltaGR.toFixed(4)),
      delta_green_minus_blue: Number(deltaGB.toFixed(4)),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                         INISIALISASI DAN LOAD SEMUA MODEL                 */
/* -------------------------------------------------------------------------- */

let yoloSession = null;
let yoloMetadata = null;
let mobileNetSession = null;
let mobileNetMapping = null;
let modelsLoaded = false;
let loadError = null;
let aiMode = 'UNKNOWN';

async function _safeReadJson(p, fallback = null) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { }
  return fallback;
}

export async function loadAIModels() {
  if (modelsLoaded) return { ok: true, mode: aiMode, yolo: !!yoloSession, mobilenet: !!mobileNetSession };
  initPseudoModels();

  console.log('\n============================================================');
  console.log(' [LENTERA AI v2] Memuat Model Inference...');
  console.log('============================================================');
  console.log(` Model dir: ${MODELS_DIR}`);

  if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

  // Load metadata JSON
  yoloMetadata = await _safeReadJson(path.join(MODELS_DIR, 'model_metadata.json'), {
    model_type: 'YOLOv8n-ObjectDetection',
    class_names: ['Healthy_Leaf', 'Coffee_Rust', 'Cercospora_Spot', 'Leaf_Miner'],
    nc: 4, imgsz: 640,
    conf_threshold_default: DEFAULT_CONF_YOLO,
    iou_threshold_default: DEFAULT_IOU_YOLO,
  });

  mobileNetMapping = await _safeReadJson(path.join(MODELS_DIR, 'class_mapping.json'), {
    class_mapping: { '0': 'Healthy', '1': 'Coffee_Rust', '2': 'Cercospora', '3': 'Leaf_Miner' },
    num_classes: 4, img_size: [224, 224], preprocessing: 'mobilenet_v2'
  });

  // Coba cari file .onnx
  const findFirstExist = (names) => {
    for (const n of names) { const p = path.join(MODELS_DIR, n); if (fs.existsSync(p)) return p; }
    return null;
  };
  const yoloPath = findFirstExist(['yolov8n.onnx', 'lentera_yolov8n_best.onnx', 'best.onnx', 'model.onnx']);
  const mnetPath = findFirstExist(['mobilenetv2.onnx', 'lentera_mobilenetv2_final.onnx', 'classification.onnx']);

  if (yoloPath) {
    try {
      yoloSession = await ort.InferenceSession.create(yoloPath, { executionProviders: ['cpu'], graphOptimizationLevel: 'all' });
      const mb = (fs.statSync(yoloPath).size / 1024 / 1024).toFixed(2);
      console.log(` [✅] YOLOv8 ONNX REAL: ${path.basename(yoloPath)} (${mb} MB)`);
    } catch (err) { console.error(` [FAIL] Load YOLO ONNX: ${err.message}`); loadError = err.message; }
  }
  if (mnetPath) {
    try {
      mobileNetSession = await ort.InferenceSession.create(mnetPath, { executionProviders: ['cpu'], graphOptimizationLevel: 'all' });
      const mb = (fs.statSync(mnetPath).size / 1024 / 1024).toFixed(2);
      console.log(` [✅] MobileNetV2 ONNX REAL: ${path.basename(mnetPath)} (${mb} MB)`);
    } catch (err) { console.error(` [FAIL] Load MobileNet ONNX: ${err.message}`); }
  }

  // Jika ONNX tidak ada -> aktifkan REAL_PSEUDO_ONNX (sharp extract gambar + NN random di memori)
  // Ini jauh lebih bagus daripada simulasi berbasis nama file, karena preprocessing gambar beneran dijalankan.
  if (!yoloSession && !mobileNetSession) {
    aiMode = 'REAL_PSEUDO_ONNX';
    console.log(' [⚠️ ] Tidak ada file .onnx di models/.');
    console.log('       -> Aktifkan mode REAL_PSEUDO_ONNX (pipeline gambar via SHARP + Weight random di memori).');
    console.log('       -> Copy .onnx hasil training Colab untuk ganti ke ONNX sesungguhan kapan saja.');
  } else if (yoloSession || mobileNetSession) {
    aiMode = (yoloSession && mobileNetSession) ? 'ONNX_FULL' : 'ONNX_PARTIAL';
  }

  modelsLoaded = true;
  console.log('------------------------------------------------------------');
  console.log(` Mode inference     : ${aiMode}`);
  console.log(` YOLOv8 engine      : ${yoloSession ? 'ONNX Runtime' : aiMode === 'REAL_PSEUDO_ONNX' ? 'Pseudo NN (sharp+js)' : 'N/A'}`);
  console.log(` MobileNetV2 engine : ${mobileNetSession ? 'ONNX Runtime' : aiMode === 'REAL_PSEUDO_ONNX' ? 'Pseudo NN (sharp+js)' : 'N/A'}`);
  console.log(` YOLOv8 classes     : ${yoloMetadata?.class_names?.length || 0}`);
  console.log(` MobileNet classes  : ${Object.keys(mobileNetMapping?.class_mapping || {}).length || 0}`);
  console.log('============================================================\n');

  return {
    ok: true, mode: aiMode, yolo_onnx: !!yoloSession, mobilenet_onnx: !!mobileNetSession,
    yolo_classes: yoloMetadata?.class_names?.length || 0,
    mobilenet_classes: Object.keys(mobileNetMapping?.class_mapping || {}).length || 0
  };
}

export function getAIStatus() {
  return {
    models_loaded: modelsLoaded,
    load_error: loadError,
    ai_mode: aiMode,
    yolo_available: !!yoloSession || aiMode === 'REAL_PSEUDO_ONNX',
    mobilenet_available: !!mobileNetSession || aiMode === 'REAL_PSEUDO_ONNX',
    yolo_class_names: yoloMetadata?.class_names || [],
    mobilenet_class_names: Object.values(mobileNetMapping?.class_mapping || {}),
    yolo_metadata: yoloMetadata,
    mobilenet_mapping: mobileNetMapping,
    note: aiMode === 'REAL_PSEUDO_ONNX' ? 'Mode Pseudo: Preprocessing gambar REAL via sharp + bobot random seeded. Ganti .onnx untuk model terlatih.' : null,
  };
}

/* -------------------------------------------------------------------------- */
/*                          MOBILENET (KLASIFIKASI)                          */
/* -------------------------------------------------------------------------- */

async function pseudoMobileNetInfer(imgBuffer) {
  const { feature, avg, disease } = await extractColorHistFeature(imgBuffer);
  const F = feature.length;
  const K = 16;

  // Layer 1
  const h1 = new Float32Array(K);
  matmul(new Float32Array(feature), PSEUDO.mn.w1, h1, 1, K, F, PSEUDO.mn.b1);
  relu(h1);

  // Layer 2
  const logits = new Float32Array(4);
  matmul(h1, PSEUDO.mn.w2, logits, 1, 4, K, PSEUDO.mn.b2);

  // Smart heuristic boost berdasar rata-rata warna
  const greenDominant = disease.very_strong_green ||
    (disease.delta_green_minus_red > 0.05 && disease.delta_green_minus_blue > 0.08);
  const rustyYellowTone = disease.strong_signal ||
    (disease.yellowish_pct > 8) ||
    (disease.brownish_pct > 6);
  if (greenDominant && !disease.mild_signal) {
    logits[0] += 3.0; // Healthy
  } else {
    logits[0] -= 0.5;
  }
  if (rustyYellowTone) {
    logits[1] += 2.5; // Rust
    logits[2] += 1.2; // Cercospora
    if (disease.brownish_pct > disease.yellowish_pct) logits[2] += 0.8;
  }
  if (disease.sick_ratio > 0.12 && disease.brownish_pct < 3) {
    logits[3] += 1.5; // Miner (agak gelap)
  }
  // Kalau strong signal -> turunkan Healthy drastis
  if (disease.strong_signal) logits[0] -= 2.5;

  const probs = softmax(logits);
  const classes = Object.values(mobileNetMapping?.class_mapping || { 0: 'Healthy', 1: 'Coffee_Rust', 2: 'Cercospora', 3: 'Leaf_Miner' });
  const preds = [];
  for (let i = 0; i < 4; i++) {
    preds.push({
      class_id: i,
      class_name: classes[i] || `class_${i}`,
      confidence: Number(probs[i].toFixed(6)),
      confidence_pct: `${(probs[i] * 100).toFixed(2)}%`,
    });
  }
  preds.sort((a, b) => b.confidence - a.confidence);
  const top = preds[0];
  const rustFound = /rust|miner|cercospora|spot|disease|sick/i.test(top.class_name);
  return {
    ok: true, mode: aiMode + '_MOBILENET',
    rust_found: rustFound, confidence: Number((top.confidence * 100).toFixed(2)),
    predicted_class: top.class_name, predictions: preds,
    color_analysis: {
      avg_r: Number(avg.r.toFixed(3)),
      avg_g: Number(avg.g.toFixed(3)),
      avg_b: Number(avg.b.toFixed(3)),
      green_dominant: greenDominant,
      rusty_yellow_tone: rustyYellowTone,
      brightness: Number(((avg.r + avg.g + avg.b) / 3).toFixed(3)),
      sick_pixel_ratio_pct: Number((disease.sick_ratio * 100).toFixed(2)),
      healthy_pixel_ratio_pct: Number((disease.healthy_ratio * 100).toFixed(2)),
      yellowish_pct: disease.yellowish_pct,
      brownish_pct: disease.brownish_pct,
      strong_disease_signal: disease.strong_signal,
      mild_disease_signal: disease.mild_signal,
    },
  };
}

async function onnxMobileNetInfer(imgBuffer) {
  const [H, W] = mobileNetMapping?.img_size || [224, 224];
  const raw = await sharp(imgBuffer).resize(W, H, { fit: 'fill' }).raw().toBuffer();
  // MobileNet preprocess: [-1, 1]
  const N = H * W * 3;
  const data = new Float32Array(N);
  for (let i = 0; i < N; i++) data[i] = (raw[i] / 127.5) - 1.0;
  const inputName = mobileNetSession.inputNames[0];
  const inputShapeGuess = mobileNetSession.inputs?.[inputName]?.dimensions;
  const shape = (inputShapeGuess && inputShapeGuess.length === 4 && inputShapeGuess[1] === 3)
    ? [1, 3, H, W] : [1, H, W, 3];
  // Jika shape NCHW tapi data kita NHWC -> permute
  let tensorData = data;
  if (shape[1] === 3 && shape[3] === W) {
    // Need NHWC -> NCHW
    const chw = new Float32Array(N);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const hwcIdx = (y * W + x) * 3;
        const pixel = y * W + x;
        chw[pixel] = data[hwcIdx];
        chw[pixel + H * W] = data[hwcIdx + 1];
        chw[pixel + 2 * H * W] = data[hwcIdx + 2];
      }
    }
    tensorData = chw;
  }
  const tensor = new ort.Tensor('float32', tensorData, shape);
  const out = await mobileNetSession.run({ [inputName]: tensor });
  const outName = Object.keys(out)[0];
  const probsArr = Array.from(out[outName].data);
  const num = probsArr.length;
  const total = probsArr.reduce((s, x) => s + x, 0);
  let probsNorm;
  if (Math.abs(total - 1) > 0.01 && Math.abs(total - num) > 0.01) {
    // Belum softmax -> jalankan
    probsNorm = Array.from(softmax(new Float32Array(probsArr)));
  } else probsNorm = probsArr;

  const classes = Object.values(mobileNetMapping?.class_mapping || {});
  const preds = [];
  for (let i = 0; i < Math.min(num, classes.length || num); i++) {
    preds.push({
      class_id: i,
      class_name: classes[i] || `class_${i}`,
      confidence: Number(Number(probsNorm[i]).toFixed(6)),
      confidence_pct: `${(Number(probsNorm[i]) * 100).toFixed(2)}%`,
    });
  }
  preds.sort((a, b) => b.confidence - a.confidence);
  const top = preds[0];
  const rustFound = /rust|miner|cercospora|spot|disease|sick/i.test(top.class_name);
  return {
    ok: true, mode: 'ONNX_MOBILENET',
    rust_found: rustFound,
    confidence: Number((top.confidence * 100).toFixed(2)),
    predicted_class: top.class_name, predictions: preds,
  };
}

export async function runMobileNetV2Inference(imgSrc, opts = {}) {
  const buffer = Buffer.isBuffer(imgSrc) ? imgSrc : fs.readFileSync(imgSrc);
  try {
    if (mobileNetSession) return await onnxMobileNetInfer(buffer);
    return await pseudoMobileNetInfer(buffer);
  } catch (e) {
    console.error('MobileNet error:', e);
    return { ok: false, error: e.message, ...(await pseudoMobileNetInfer(buffer)) };
  }
}

/* -------------------------------------------------------------------------- */
/*                         YOLOv8 OBJECT DETECTION                           */
/* -------------------------------------------------------------------------- */

function _iou(b1, b2) {
  const x1 = Math.max(b1.x1, b2.x1), y1 = Math.max(b1.y1, b2.y1);
  const x2 = Math.min(b1.x2, b2.x2), y2 = Math.min(b1.y2, b2.y2);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const a1 = (b1.x2 - b1.x1) * (b1.y2 - b1.y1);
  const a2 = (b2.x2 - b2.x1) * (b2.y2 - b2.y1);
  return inter / (a1 + a2 - inter + 1e-6);
}

function _nms(boxes, iouThr = 0.5) {
  boxes.sort((a, b) => b.confidence - a.confidence);
  const out = [];
  while (boxes.length > 0) {
    const best = boxes.shift(); out.push(best);
    boxes = boxes.filter(b => _iou(best, b) <= iouThr);
  }
  return out;
}

async function pseudoYOLOInfer(imgBuffer) {
  const imgMeta = await sharp(imgBuffer).metadata();
  const W = imgMeta.width, H = imgMeta.height;
  const SZ = yoloMetadata?.imgsz || 640;
  const NC = yoloMetadata?.nc || 4;
  const classNames = yoloMetadata?.class_names || ['Healthy_Leaf', 'Coffee_Rust', 'Cercospora_Spot', 'Leaf_Miner'];

  // Step 1: feature extraction
  const { feature, avg, disease } = await extractColorHistFeature(imgBuffer);
  const F = feature.length;

  // Step 2: Proyeksi ke [1, 168] -> reshape [21, 8] -> tile 400x -> total 8400 anchor
  const projOut = new Float32Array(1 * 168);
  matmul(new Float32Array(feature), PSEUDO.yolo.w_proj, projOut, 1, 168, F, PSEUDO.yolo.b_proj);

  // Apply sigmoid ke semua value agar di (0,1)
  for (let i = 0; i < projOut.length; i++) projOut[i] = sigmoid(projOut[i]);

  // Smart heuristic berdasar analisis warna pixel
  const greenDominant = disease.very_strong_green ||
    (disease.delta_green_minus_red > 0.05 && disease.delta_green_minus_blue > 0.08);
  const diseaseSignal = disease.strong_signal || disease.mild_signal ||
    (disease.yellowish_pct > 6) || (disease.brownish_pct > 4);

  // Tentukan class utama
  let mainClassId = 0; // default Healthy
  if (disease.strong_signal || disease.yellowish_pct > 10) {
    mainClassId = (disease.brownish_pct > disease.yellowish_pct) ? 2 : 1; // Cercospora vs Rust
  } else if (disease.sick_ratio > 0.12 && disease.brownish_pct < 3) {
    mainClassId = 3; // Leaf Miner
  } else if (!greenDominant && disease.mild_signal) {
    mainClassId = 1;
  }

  const NUM_TILES = 400;
  const ANCHOR_PER_TILE = 21;
  const DETECTIONS = [];
  // Target jumlah box: 0-5 jika healthy, 3-12 jika ada penyakit
  const wantBoxes = mainClassId === 0
    ? Math.floor(RAND() * 2)  // Healthy -> 0 atau 1 box
    : 3 + Math.floor(RAND() * 8); // Penyakit -> 3-10 box

  let madeBoxes = 0;
  for (let t = 0; t < NUM_TILES && madeBoxes < wantBoxes; t++) {
    // Pilih tile yang "berpotensi" untuk taruh box
    // Jika healthy, jarang sekali dapat box
    const keepProb = mainClassId === 0 ? 0.002 : (0.01 + disease.sick_ratio * 0.3);
    if (RAND() > keepProb && madeBoxes === 0 ? RAND() > 0.001 : RAND() > keepProb) continue;

    const anchorIdx = Math.floor(RAND() * ANCHOR_PER_TILE);
    const base = anchorIdx * 8;

    // Ukuran box random wajar
    const bw = 0.06 + RAND() * 0.12;
    const bh = 0.06 + RAND() * 0.12;

    // Posisi anchor: terkait tile index (grid 20x20)
    const gridX = (t % 20) / 20 + 0.025;
    const gridY = Math.floor(t / 20) / 20 + 0.025;
    const finalCx = Math.min(0.95, gridX + (RAND() - 0.5) * 0.05);
    const finalCy = Math.min(0.95, gridY + (RAND() - 0.5) * 0.05);

    // Class scores
    const cls = new Float32Array(NC);
    for (let c = 0; c < NC; c++) cls[c] = 0.02 + RAND() * 0.05;
    // Boost class utama
    cls[mainClassId] = disease.strong_signal
      ? 0.68 + RAND() * 0.28
      : 0.48 + RAND() * 0.28;
    if (mainClassId !== 0) cls[0] *= 0.1;

    const bestCls = mainClassId;
    const bestScore = cls[bestCls];
    const confThr = yoloMetadata?.conf_threshold_default || DEFAULT_CONF_YOLO;
    if (bestScore >= confThr) {
      const scale = Math.min(W, H);
      const padX = W > H ? (W - H) / 2 : 0;
      const padY = H > W ? (H - W) / 2 : 0;
      const absCx = padX + finalCx * scale;
      const absCy = padY + finalCy * scale;
      const absW = bw * scale;
      const absH = bh * scale;
      DETECTIONS.push({
        class_id: bestCls,
        class_name: classNames[bestCls] || `class_${bestCls}`,
        confidence: Number(bestScore.toFixed(4)),
        x1: Math.max(0, Math.round(absCx - absW / 2)),
        y1: Math.max(0, Math.round(absCy - absH / 2)),
        x2: Math.min(W, Math.round(absCx + absW / 2)),
        y2: Math.min(H, Math.round(absCy + absH / 2)),
      });
      madeBoxes++;
    }
  }

  // Pastikan jika disease signal, ada minimal box
  if (diseaseSignal && DETECTIONS.length === 0) {
    const scale = Math.min(W, H);
    DETECTIONS.push({
      class_id: mainClassId,
      class_name: classNames[mainClassId],
      confidence: disease.strong_signal ? 0.74 + RAND() * 0.2 : 0.48 + RAND() * 0.15,
      x1: Math.round(0.3 * W), y1: Math.round(0.3 * H),
      x2: Math.round(0.55 * W), y2: Math.round(0.55 * H),
    });
  }

  const finalBoxes = _nms(DETECTIONS, yoloMetadata?.iou_threshold_default || DEFAULT_IOU_YOLO);
  const rustCls = ['rust', 'coffee_rust', 'cercospora', 'spot', 'miner', 'disease'];
  const rustFound = finalBoxes.some(b => rustCls.includes(b.class_name.toLowerCase()));
  const topConf = finalBoxes.length ? Math.max(...finalBoxes.map(b => b.confidence)) :
    (greenDominant ? 0.94 : (diseaseSignal ? 0.68 : 0.88));

  return {
    ok: true, mode: aiMode + '_YOLO',
    detections_count: finalBoxes.length,
    rust_found: rustFound,
    confidence: Number((topConf * 100).toFixed(2)),
    boxes: finalBoxes,
    image_info: { width: W, height: H, resized_to: SZ },
    color_analysis: {
      green_dominant: greenDominant, rusty_yellow_tone: diseaseSignal,
      avg_r: Number(avg.r.toFixed(3)), avg_g: Number(avg.g.toFixed(3)), avg_b: Number(avg.b.toFixed(3)),
      sick_pct: Number((disease.sick_ratio * 100).toFixed(2)),
      yellowish_pct: disease.yellowish_pct,
      brownish_pct: disease.brownish_pct,
      strong_signal: disease.strong_signal,
      mild_signal: disease.mild_signal,
    },
  };
}

async function onnxYOLOInfer(imgBuffer) {
  const SZ = yoloMetadata?.imgsz || 640;
  const NC = yoloMetadata?.nc || 4;
  const classNames = yoloMetadata?.class_names || ['Healthy_Leaf', 'Coffee_Rust', 'Cercospora_Spot', 'Leaf_Miner'];
  const confThr = yoloMetadata?.conf_threshold_default || DEFAULT_CONF_YOLO;
  const iouThr = yoloMetadata?.iou_threshold_default || DEFAULT_IOU_YOLO;

  const meta = await sharp(imgBuffer).metadata();
  const W = meta.width, H = meta.height;
  const scale = Math.min(SZ / W, SZ / H);
  const nw = Math.round(W * scale);
  const nh = Math.round(H * scale);
  const padX = Math.floor((SZ - nw) / 2);
  const padY = Math.floor((SZ - nh) / 2);

  const padded = await sharp(imgBuffer)
    .resize(nw, nh, { fit: 'fill' })
    .extend({
      top: padY, bottom: SZ - nh - padY,
      left: padX, right: SZ - nw - padX,
      background: { r: 114, g: 114, b: 114 }
    }).raw().toBuffer();

  const data = new Float32Array(3 * SZ * SZ);
  for (let y = 0; y < SZ; y++) {
    for (let x = 0; x < SZ; x++) {
      const idx = (y * SZ + x) * 3;
      const pixel = y * SZ + x;
      data[pixel] = padded[idx] / 255.0;
      data[pixel + SZ * SZ] = padded[idx + 1] / 255.0;
      data[pixel + 2 * SZ * SZ] = padded[idx + 2] / 255.0;
    }
  }
  const inputName = yoloSession.inputNames[0];
  const tensor = new ort.Tensor('float32', data, [1, 3, SZ, SZ]);
  const out = await yoloSession.run({ [inputName]: tensor });
  const outName = Object.keys(out)[0];
  const raw = out[outName].data;
  const dims = out[outName].dims;
  const numAnchors = dims[2];
  const nCols = dims[1];

  const DETS = [];
  const scaleFactor = 1 / scale;
  for (let i = 0; i < numAnchors; i++) {
    const cx = (raw[i] - padX) * scaleFactor;
    const cy = (raw[i + numAnchors] - padY) * scaleFactor;
    const w = raw[i + 2 * numAnchors] * scaleFactor;
    const h = raw[i + 3 * numAnchors] * scaleFactor;
    let bestCls = 0, bestScore = -1;
    for (let c = 0; c < nCols - 4; c++) {
      const sc = raw[i + (4 + c) * numAnchors];
      if (sc > bestScore) { bestScore = sc; bestCls = c; }
    }
    if (bestScore >= confThr) {
      DETS.push({
        class_id: bestCls,
        class_name: classNames[bestCls] || `class_${bestCls}`,
        confidence: Number(bestScore.toFixed(4)),
        x1: Math.max(0, Math.round(cx - w / 2)),
        y1: Math.max(0, Math.round(cy - h / 2)),
        x2: Math.min(W, Math.round(cx + w / 2)),
        y2: Math.min(H, Math.round(cy + h / 2)),
      });
    }
  }

  const finalBoxes = _nms(DETS, iouThr);
  const rustCls = ['rust', 'coffee_rust', 'cercospora', 'spot', 'miner', 'disease'];
  const rustFound = finalBoxes.some(b => rustCls.includes(b.class_name.toLowerCase()));
  const topConf = finalBoxes.length ? Math.max(...finalBoxes.map(b => b.confidence)) : 0;
  return {
    ok: true, mode: 'ONNX_YOLOv8',
    detections_count: finalBoxes.length,
    rust_found: rustFound,
    confidence: Number((topConf * 100).toFixed(2)),
    boxes: finalBoxes,
    image_info: { width: W, height: H, resized_to: SZ, scale, padX, padY },
  };
}

export async function runYOLOv8Inference(imgSrc, opts = {}) {
  const buffer = Buffer.isBuffer(imgSrc) ? imgSrc : fs.readFileSync(imgSrc);
  try {
    if (yoloSession) return await onnxYOLOInfer(buffer);
    return await pseudoYOLOInfer(buffer);
  } catch (e) {
    console.error('YOLO error:', e);
    return { ok: false, error: e.message, ...(await pseudoYOLOInfer(buffer)) };
  }
}

/* -------------------------------------------------------------------------- */
/*                         ENSEMBLE (YOLO + MobileNet)                       */
/* -------------------------------------------------------------------------- */

export async function scanLeafDiseaseEnsemble(imgSrc) {
  const [yoloRes, mnetRes] = await Promise.all([
    runYOLOv8Inference(imgSrc),
    runMobileNetV2Inference(imgSrc),
  ]);

  const votesRust = (yoloRes.rust_found ? 1 : 0) + (mnetRes.rust_found ? 1 : 0);
  const rustFound = votesRust >= 1;
  const avgConf = (yoloRes.confidence + mnetRes.confidence) / 2;

  // Gabungkan analisis warna
  const color = mnetRes.color_analysis || yoloRes.color_analysis || null;

  // Pilih predicted_class: ambil confidence tertinggi dari keduanya
  let detectedClass;
  if (yoloRes.boxes?.length && mnetRes.predicted_class) {
    detectedClass = (yoloRes.confidence >= mnetRes.confidence)
      ? yoloRes.boxes.find(b => b.confidence === Math.max(...yoloRes.boxes.map(x => x.confidence)))?.class_name
      : mnetRes.predicted_class;
  } else if (mnetRes.predicted_class) {
    detectedClass = mnetRes.predicted_class;
  } else {
    detectedClass = rustFound ? 'Penyakit_Terdeteksi' : 'Sehat';
  }

  let message;
  if (aiMode === 'ONNX_FULL' || aiMode === 'ONNX_PARTIAL') {
    message = rustFound
      ? `🔴 TERDETEKSI: Penyakit daun ditemukan (keyakinan rata-rata ${avgConf.toFixed(1)}%). Disarankan segera lakukan penanganan.`
      : `🟢 SEHAT: Daun tidak menunjukkan gejala penyakit utama (keyakinan rata-rata ${avgConf.toFixed(1)}%).`;
  } else {
    message = rustFound
      ? `🔴 [PSEUDO-AI] TERDETEKSI: Penyakit daun ditemukan (keyakinan rata-rata ${avgConf.toFixed(1)}%). Model berbasis ekstraksi warna + pseudo-weight. Copy .onnx hasil training Colab untuk AI riil.`
      : `🟢 [PSEUDO-AI] SEHAT: Daun tidak menunjukkan gejala penyakit. (keyakinan rata-rata ${avgConf.toFixed(1)}%).`;
  }

  return {
    rust_found: rustFound,
    confidence: Number(avgConf.toFixed(2)),
    ensemble_votes: { yolo: yoloRes.rust_found, mobilenet: mnetRes.rust_found },
    message,
    yolo_detection: yoloRes,
    mobilenet_classification: mnetRes,
    boxes: yoloRes.boxes || [],
    detected_class: detectedClass,
    color_analysis: color,
    ai_mode: aiMode,
  };
}
