/**
 * Generate file ONNX dummy dengan bobot random agar LENTERA bisa aktifkan mode REAL_INFERENCE
 * (TANPA PERLU training Colab berjam-jam dulu).
 *
 * Output:
 *   backend/models/yolov8n.onnx     - Model YOLOv8 format dummy (output 8 kelas detection)
 *   backend/models/mobilenetv2.onnx - Model MobileNetV2 dummy (4 kelas klasifikasi)
 *   backend/models/model_metadata.json
 *   backend/models/class_mapping.json
 *
 * Cara pakai: node generate_dummy_onnx.mjs
 */
import ort from 'onnxruntime-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODELS_DIR = path.join(__dirname, 'models');
fs.mkdirSync(MODELS_DIR, { recursive: true });

// =============================================================================
// 1. Buat MobileNetV2 Classification Dummy (ONNX)
//    Input shape:  [1, 224, 224, 3]  (NHWC - channel last)
//    Output shape: [1, 4]              (4 kelas: Healthy, Coffee_Rust, Cercospora, Leaf_Miner)
// =============================================================================
async function createMobileNetDummy() {
  console.log('[1/2] Membuat MobileNetV2 dummy ONNX...');

  // MobileNetV2-style: feature extractor conv (dumb) + global avg pool + dense 4
  // Kita pakai onnxruntime-tools sederhana tapi lebih gampang: create dari ort langsung lewat python?
  // Karena ort-node tidak bisa save model, kita buat model ONNX protobuf via node dengan simple formula.
  // Alternatif: buat JSON spec dan generate di Python via subprocess
  const pythonScript = `
import numpy as np
import onnx
from onnx import helper, TensorProto, numpy_helper
import os, json

OUT = r"${MODELS_DIR.replace(/\\/g, '\\\\')}"
os.makedirs(OUT, exist_ok=True)

# ================================================================
# MobileNetV2 (KLASIFIKASI 4 KELAS)
# Input: [N, 224, 224, 3] float32 (NHWC, tapi di ONNX sering NCHW - kita pakai NCHW agar konsisten)
# Output: [N, 4] softmax logits
# ================================================================
print("  Building MobileNetV2 dummy onnx...")
N, C, H, W = 1, 3, 224, 224
NUM_CLS = 4

# Kita buat model sederhana:
#   images(1,3,224,224) -> Conv(3->8, 3x3) -> Relu -> GlobalAveragePool -> Flatten -> Dense(8->4) -> Softmax
#
# Isi weight dengan random normal (seed=42)
np.random.seed(42)

# Conv2D weights: [out_channels, in_channels/grp, kH, kW]
w_conv = (np.random.randn(8,3,3,3).astype(np.float32) * 0.1)
b_conv = (np.random.randn(8).astype(np.float32) * 0.01)

# Dense weights: [out, in] setelah GAP -> 8 feature maps -> 8 avg -> dense (8 -> 4)
w_dense = (np.random.randn(NUM_CLS, 8).astype(np.float32) * 0.05)
b_dense = np.array([2.0, 0.0, 0.1, 0.2], dtype=np.float32)  # Bias Healthy lebih besar, default = sehat

# Buat initializers (constant tensors)
w_conv_init = numpy_helper.from_array(w_conv, name='conv1.weight')
b_conv_init = numpy_helper.from_array(b_conv, name='conv1.bias')
w_dense_init = numpy_helper.from_array(w_dense, name='dense.weight')
b_dense_init = numpy_helper.from_array(b_dense, name='dense.bias')

# Input
X = helper.make_tensor_value_info('input', TensorProto.FLOAT, [N, C, H, W])
# Output
Y = helper.make_tensor_value_info('output', TensorProto.FLOAT, [N, NUM_CLS])

# Intermediate infershape sementara opsional
Y_conv  = helper.make_tensor_value_info('y_conv',  TensorProto.FLOAT, [N, 8, 222, 222])
Y_relu  = helper.make_tensor_value_info('y_relu',  TensorProto.FLOAT, [N, 8, 222, 222])
Y_gap   = helper.make_tensor_value_info('y_gap',   TensorProto.FLOAT, [N, 8, 1, 1])
Y_flat  = helper.make_tensor_value_info('y_flat',  TensorProto.FLOAT, [N, 8])
Y_logits= helper.make_tensor_value_info('y_logits',TensorProto.FLOAT, [N, NUM_CLS])

node_conv = helper.make_node(
  'Conv', inputs=['input','conv1.weight','conv1.bias'],
  outputs=['y_conv'], kernel_shape=[3,3], strides=[1,1], pads=[0,0,0,0], dilations=[1,1], group=1
)
node_relu = helper.make_node('Relu', inputs=['y_conv'], outputs=['y_relu'])
node_gap  = helper.make_node('GlobalAveragePool', inputs=['y_relu'], outputs=['y_gap'])
node_flat = helper.make_node('Flatten', inputs=['y_gap'], outputs=['y_flat'], axis=1)
node_mat  = helper.make_node('MatMul', inputs=['dense.weight','y_flat'], outputs=['mm'])
# MatMul di ONNX: A[N,M] x B[M,K] = C[N,K]. Kita punya W=[4,8], X=[N,8] -> perlu X.W^T
# Pakai Gemm(W, X, b, alpha=1, beta=1, transB=1) -> X @ W^T + b
node_gemm = helper.make_node(
  'Gemm', inputs=['y_flat','dense.weight','dense.bias'],
  outputs=['y_logits'], alpha=1.0, beta=1.0, transA=0, transB=1
)
node_soft = helper.make_node('Softmax', inputs=['y_logits'], outputs=['output'], axis=1)

graph = helper.make_graph(
  nodes=[node_conv, node_relu, node_gap, node_flat, node_gemm, node_soft],
  name='LenteraMobileNetV2Dummy',
  inputs=[X],
  outputs=[Y],
  initializer=[w_conv_init, b_conv_init, w_dense_init, b_dense_init],
  value_info=[Y_conv, Y_relu, Y_gap, Y_flat, Y_logits]
)
model = helper.make_model(graph, opset_imports=[helper.make_opsetid('', 13)],
                          producer_name='LENTERA_DUMMY_GENERATOR',
                          doc_string='Dummy MobileNetV2 untuk mode REAL_INFERENCE LENTERA. '
                                     'Ganti dengan model asli hasil training Colab untuk akurasi riil.')
onnx.checker.check_model(model)
mpath = os.path.join(OUT, 'mobilenetv2.onnx')
onnx.save_model(model, mpath)
print(f"    -> Saved: {mpath} ({os.path.getsize(mpath)/1024:.1f} KB)")

# ================================================================
# YOLOv8 Detection Dummy (single class head-like)
# Input: [1,3,640,640]
# Output YOLOv8 format: [1, nc+4, num_anchors], nc=4 -> shape [1, 8, 8400]
#   (4 box coords + 4 class probs) x 8400 anchors
# ================================================================
print("  Building YOLOv8n detection dummy onnx...")
N2, C2, H2, W2 = 1, 3, 640, 640
NC = 4
NUM_ANCHORS = 8400

# Architecture sangat sederhana (mirip mobile net style tapi head YOLO):
# images [1,3,640,640] -> Conv(3->16,5x5 stride 2) -> Relu -> Conv(16->32,5x5 stride 2) -> Relu
#   -> Global average pool -> tidak, kita butuh output spatials.
# Daripada repot perhitungan shape, kita pakai pendekatan: buat "Identity-like + MatMul reshape"
#   images -> Flatten -> Dummy Dense -> Reshape([1,8,8400]) -> Sigmoid pada class part -> output0

INPUT_EL = N2 * C2 * H2 * W2  # 1 * 3 * 640 * 640 = 1.228.800
OUT_EL   = (4 + NC) * NUM_ANCHORS  # 8 * 8400 = 67.200

np.random.seed(123)
# Kita pakai model pipeline:
# input [1,3,640,640] -> ReduceMean ke [1,3,1,1] (spatial agg) -> Flatten [1,3]
#   -> Dense(3 -> OUT_EL) dengan weight sangat kecil (random) -> Reshape [1,8,8400]
#   -> Split box (first 4) di [0,1] dengan sigmoid; class di [0,1] dengan sigmoid -> Concat kembali
# Biar sederhana: hasilkan langsung [1, 8, 8400] tanpa sigmoid. Frontend kita sendiri yang threshold.

# Weight: [OUT_EL, 3] -> kecil semua, bias box set ke 0.5 (centered default)
w_proj = (np.random.randn(OUT_EL, 3).astype(np.float32) * 0.001)
# Bias 8*8400 -> set coord default ke 0.5, class untuk healthy lebih besar
b_proj = np.zeros(OUT_EL, dtype=np.float32)
for a in range(NUM_ANCHORS):
    b_proj[a * 8 + 0] = 0.5  # cx
    b_proj[a * 8 + 1] = 0.5  # cy
    b_proj[a * 8 + 2] = 0.2  # w
    b_proj[a * 8 + 3] = 0.2  # h
    b_proj[a * 8 + 4] = 2.0  # class 0 Healthy -> tinggi (default sehat)
    b_proj[a * 8 + 5] = -1.0 # class 1 Rust
    b_proj[a * 8 + 6] = -1.0 # class 2 Cercospora
    b_proj[a * 8 + 7] = -1.0 # class 3 Miner

X2 = helper.make_tensor_value_info('images', TensorProto.FLOAT, [N2, C2, H2, W2])
Y2 = helper.make_tensor_value_info('output0', TensorProto.FLOAT, [N2, 4 + NC, NUM_ANCHORS])

y_gap2_info = helper.make_tensor_value_info('y_gap2', TensorProto.FLOAT, [N2, C2, 1, 1])
y_flat2_info = helper.make_tensor_value_info('y_flat2', TensorProto.FLOAT, [N2, C2])
y_mat_info = helper.make_tensor_value_info('y_mat2', TensorProto.FLOAT, [N2, OUT_EL])

w_proj_init = numpy_helper.from_array(w_proj, name='proj.weight')
b_proj_init = numpy_helper.from_array(b_proj, name='proj.bias')

node_gap2 = helper.make_node('GlobalAveragePool', inputs=['images'], outputs=['y_gap2'])
node_flat2 = helper.make_node('Flatten', inputs=['y_gap2'], outputs=['y_flat2'], axis=1)
node_gemm2 = helper.make_node(
  'Gemm', inputs=['y_flat2','proj.weight','proj.bias'],
  outputs=['y_mat2'], alpha=1.0, beta=1.0, transA=0, transB=1
)
node_reshape = helper.make_node(
  'Reshape', inputs=['y_mat2', 'shape0'], outputs=['output0']
)
# Constant shape tensor
shape_arr = np.array([N2, 4 + NC, NUM_ANCHORS], dtype=np.int64)
shape_init = numpy_helper.from_array(shape_arr, name='shape0')

graph2 = helper.make_graph(
  nodes=[node_gap2, node_flat2, node_gemm2, node_reshape],
  name='LenteraYOLOv8nDummy',
  inputs=[X2],
  outputs=[Y2],
  initializer=[w_proj_init, b_proj_init, shape_init],
  value_info=[y_gap2_info, y_flat2_info, y_mat_info]
)
model2 = helper.make_model(graph2, opset_imports=[helper.make_opsetid('', 13)],
                           producer_name='LENTERA_DUMMY_GENERATOR',
                           doc_string='Dummy YOLOv8 nano detection untuk aktifkan REAL_ONNX mode. Ganti dengan hasil training Colab.')
onnx.checker.check_model(model2)
ypath = os.path.join(OUT, 'yolov8n.onnx')
onnx.save_model(model2, ypath)
print(f"    -> Saved: {ypath} ({os.path.getsize(ypath)/1024:.1f} KB)")

# ================================================================
# Metadata JSONs
# ================================================================
yolo_meta = {
  "model_type": "YOLOv8n-ObjectDetection-DUMMY",
  "class_names": ["Healthy_Leaf", "Coffee_Rust", "Cercospora_Spot", "Leaf_Miner"],
  "nc": 4,
  "imgsz": 640,
  "conf_threshold_default": 0.25,
  "iou_threshold_default": 0.5,
  "note": "Model DUMMY berisi weight random. Ganti dengan model asli training Colab untuk deteksi nyata.",
}
with open(os.path.join(OUT, 'model_metadata.json'),'w') as f:
    json.dump(yolo_meta, f, indent=2)

mn_map = {
  "class_mapping": {"0":"Healthy","1":"Coffee_Rust","2":"Cercospora","3":"Leaf_Miner"},
  "num_classes": 4,
  "img_size": [224,224],
  "preprocessing": "mobilenet_v2",
  "note": "Class mapping dummy. Sinkronkan dengan hasil training Colab."
}
with open(os.path.join(OUT, 'class_mapping.json'),'w') as f:
    json.dump(mn_map, f, indent=2)

print("\n  DONE! Semua file DUMMY ONNX + metadata berhasil dibuat.")
`;

  // Jalankan python script
  const { execSync } = await import('child_process');
  const tmp = path.join(MODELS_DIR, '_gen_script.py');
  fs.writeFileSync(tmp, pythonScript);
  try {
    execSync('python -m pip install -q numpy onnx', { stdio: 'inherit' });
    execSync(`python "${tmp}"`, { stdio: 'inherit' });
  } catch (e) {
    console.log('  [!] Python/ONNX tidak ada. Membuat file placeholder .txt dan note manual saja.');
    fs.writeFileSync(path.join(MODELS_DIR, 'README_GENERATE_ONNX.txt'), `
Untuk generate model DUMMY via Python, jalankan:
  pip install numpy onnx
  python models/_gen_script.py

Atau (cara termudah):
  1. Buka Google Colab
  2. Upload & jalankan generate_dummy_onnx_standalone.ipynb
  3. Download file .onnx ke folder backend/models/
`);
    throw e;
  } finally {
    // Hapus script temp
    try { fs.unlinkSync(tmp); } catch {}
  }
}

// =============================================================================
// 2. Verifikasi ONNX bisa di-load & jalankan inference 1 gambar random
// =============================================================================
async function verifyONNX() {
  console.log('\n[2/2] Verifikasi ONNX inference di backend...');
  const yoloPath = path.join(MODELS_DIR, 'yolov8n.onnx');
  const mnetPath = path.join(MODELS_DIR, 'mobilenetv2.onnx');

  if (fs.existsSync(yoloPath)) {
    try {
      const sess = await ort.InferenceSession.create(yoloPath, { executionProviders: ['cpu'] });
      const inputName = sess.inputNames[0];
      const data = new Float32Array(1 * 3 * 640 * 640);
      data.fill(0.5);
      const tensor = new ort.Tensor('float32', data, [1, 3, 640, 640]);
      const out = await sess.run({ [inputName]: tensor });
      const outName = Object.keys(out)[0];
      const dims = out[outName].dims;
      console.log(`  ✅ YOLOv8 onnx bisa di-run! Input: ${inputName}${[1,3,640,640]}`);
      console.log(`     Output shape: ${JSON.stringify(dims)} (expected: [1,8,8400])`);
    } catch (e) {
      console.log(`  ❌ YOLOv8 verify gagal: ${e.message}`);
    }
  }

  if (fs.existsSync(mnetPath)) {
    try {
      const sess = await ort.InferenceSession.create(mnetPath, { executionProviders: ['cpu'] });
      const inputName = sess.inputNames[0];
      const data = new Float32Array(1 * 3 * 224 * 224);
      data.fill(0.5);
      const tensor = new ort.Tensor('float32', data, [1, 3, 224, 224]);
      const out = await sess.run({ [inputName]: tensor });
      const outName = Object.keys(out)[0];
      const probs = Array.from(out[outName].data);
      const best = probs.indexOf(Math.max(...probs));
      console.log(`  ✅ MobileNetV2 onnx bisa di-run! Output probs: [${probs.map(p=>p.toFixed(3)).join(',')}]`);
      console.log(`     Predicted class index: ${best} (nilai tertinggi)`);
    } catch (e) {
      console.log(`  ❌ MobileNet verify gagal: ${e.message}`);
    }
  }
}

// ===== Main =====
try {
  await createMobileNetDummy();
  await verifyONNX();
  console.log('\n✅ GENERATE DUMMY ONNX SELESAI.');
  console.log('Restart backend server: npm run dev → Mode akan berubah jadi REAL_INFERENCE');
  console.log('Penting: Model ini berisi weight RANDOM. Akurasi riil didapat setelah training Colab.');
} catch (e) {
  console.error('\n❌ Error generate dummy:', e.message);
  process.exit(1);
}
