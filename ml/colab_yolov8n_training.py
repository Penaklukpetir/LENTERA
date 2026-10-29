"""
==========================================================================================
  LENTERA AI - YOLOv8 NANO OBJECT DETECTION FOR COFFEE & CITRUS LEAF DISEASE
  Script Siap Dijalankan di Google Colab (Versi Lengkap v2)
==========================================================================================
  Tujuan     : Deteksi Objek Penyakit Daun Kopi & Jeruk (Object Detection dengan BBox)
  Model      : YOLOv8n (Nano - Ultra Ringan, ~3MB, Cepat untuk Web/Edge)
  Framework  : Ultralytics YOLO + PyTorch
  Output     : best.pt (PyTorch) .onnx (ONNX) .tflite (TensorFlow Lite) WebModel (TF.js)
==========================================================================================
"""

# ======================================================================================
# CELL 1: SETUP LINGKUNGAN GOOGLE COLAB
# ======================================================================================
import os
import sys
import subprocess
import shutil
import json
import zipfile
from glob import glob
from pathlib import Path

print("=" * 85)
print("  LENTERA AI - YOLOv8 NANO TRAINING PIPELINE")
print("  Coffee & Citrus Leaf Disease Object Detection")
print("=" * 85)

# --- 1. Cek GPU Runtime ---
print("\n[1/8] Memeriksa GPU Runtime Colab...")
import torch
if torch.cuda.is_available():
    gpu_name = torch.cuda.get_device_name(0)
    vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    print(f"   GPU Terdeteksi: {gpu_name}")
    print(f"   VRAM Tersedia  : {vram_gb:.1f} GB")
    if "T4" in gpu_name:
        print("   Rekomendasi: Runtime T4 sudah optimal untuk YOLOv8n!")
else:
    print("   PERINGATAN: Tidak ada GPU terdeteksi!")
    print("   Silakan: Runtime > Change Runtime Type > Hardware Accelerator > GPU (T4)")
    print("   Training di CPU akan ~10-20x lebih lambat.")

# --- 2. Install Ultralytics & dependency ---
print("\n[2/8] Menginstal Ultralytics YOLO + dependencies...")
def pip_install(pkg):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", pkg], check=False)

pip_install("ultralytics")
pip_install("roboflow")
pip_install("kaggle")
pip_install("onnxruntime")
pip_install("gdown")

from ultralytics import YOLO
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import cv2
from PIL import Image

print(f"   Ultralytics version: {YOLO.__version__ if hasattr(YOLO, '__version__') else 'OK'}")

# --- 3. Setting Direktori ---
BASE_DIR = Path("/content/lentera_yolov8")
DATASET_DIR = BASE_DIR / "dataset"
MODEL_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"
for d in [BASE_DIR, DATASET_DIR, MODEL_DIR, RESULTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ======================================================================================
# CELL 2: KONFIGURASI DATASET SUMBER
# ======================================================================================
print("\n[3/8] Konfigurasi Sumber Dataset (YOLO Format)")
print("   Format dataset YOLO: train/images/, train/labels/, valid/images/, valid/labels/")
print("   + file data.yaml (daftar kelas & path)")
print("-" * 85)

"""
==========================================================================================
  OPSI 1: DOWNLOAD DATASET DARI ROBOFLOW UNIVERSE (DIREKOMENDASIKAN UNTUK YOLO)
==========================================================================================
  Roboflow menyediakan dataset dengan bounding box annotation dalam format YOLO langsung!

  Daftar Dataset Rekomendasi (sudah dalam format YOLO):
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │ # │ Workspace / Project                     │ Link / Keyword                    │
  ├───┼─────────────────────────────────────────┼───────────────────────────────────┤
  │ 1 │ coffee-leaf-disease-hl0wo               │ Karat Daun Kopi (Hemileia)       │
  │ 2 │ coffee-rust-leaf-disease                │ Rust + Miner + Cercospora        │
  │ 3 │ citrus-diseases-final                   │ Jeruk: Blackspot+Canker+Greening │
  │ 4 │ plant-disease-gw4te                     │ Komprehensif 30+ kelas tanaman   │
  │ 5 │ coffee-leaf-annotations                 │ Label BBox manual Indonesia      │
  └───┴─────────────────────────────────────────┴───────────────────────────────────┘

  Cara dapatkan Roboflow API Key:
  1. Login ke https://app.roboflow.com
  2. Klik foto profile (kanan atas) > Settings > Roboflow API > Copy Private API Key
"""

# ============================== [ KONFIGURASI ROBOFLOW ] ============================
USE_ROBOFLOW = True   # Default: Pakai Roboflow (paling mudah untuk YOLO format)
ROBOFLOW_API_KEY = "" # TODO: Isi API key Anda (contoh: "aB1cDeFgHiJkLmNoPqRs")

# Pilih salah satu project (hilangkan tanda # pada salah satu):
ROBOFLOW_CONFIG = {
    "workspace": "plant-disease-i0tfd",
    "project":   "coffee-leaf-disease-hl0wo",
    "version":   1,
}
# ROBOFLOW_CONFIG = {
#     "workspace": "citrus-diseases",
#     "project":   "citrus-diseases-final",
#     "version":   2,
# }
# ROBOFLOW_CONFIG = {
#     "workspace": "coffee-rust",
#     "project":   "coffee-rust-leaf-disease",
#     "version":   3,
# }

"""
==========================================================================================
  OPSI 2: DOWNLOAD DATASET DARI KAGGLE (PERLU KONVERSI KEYPOINT/CSV -> YOLO BBOX)
==========================================================================================
  Beberapa dataset Kaggle yang relevan:
  1. "arjunshenoy123/coffee-leaf-diseases"  (Klasifikasi - tanpa BBox -> kurang cocok YOLO)
  2. "patrykmaking/coffee-plant-diseases"   (Klasifikasi)
  3. "plantvillage-dataset"  (Gambar daun tanpa BBox -> pakai MobileNetV2 saja lebih baik)

  Untuk Object Detection YOLO, LEBIH BAIK PAKAI ROBOFLOW karena annotation sudah BBox.
"""

USE_KAGGLE = False  # Tidak direkomendasikan untuk YOLO (annotation jarang ada)
KAGGLE_USERNAME = ""
KAGGLE_KEY = ""
KAGGLE_DATASET = "arjunshenoy123/coffee-leaf-diseases"

"""
==========================================================================================
  OPSI 3: DATASET DUMMY SYNTHETIC (UNTUK TEST PIPELINE CEPAT TANPA DOWNLOAD)
==========================================================================================
"""
USE_DUMMY_DATA = False  # Ubah ke True hanya untuk test flow cepat

# ======================================================================================
# CELL 3: DOWNLOAD DATASET OTOMATIS
# ======================================================================================
print("\n[4/8] Download & Persiapan Dataset YOLO Format...")

YAML_PATH = None  # Path ke file data.yaml (akan diisi otomatis setelah download)

def download_roboflow_yolo():
    global YAML_PATH
    from roboflow import Roboflow
    print(f"\n   Mengunduh dari Roboflow: {ROBOFLOW_CONFIG['workspace']}/{ROBOFLOW_CONFIG['project']}")
    if not ROBOFLOW_API_KEY:
        print("   [!] ROBOFLOW_API_KEY kosong!")
        try:
            from google.colab import files
            print("   Silakan paste Roboflow API Key di bawah, atau upload .txt:")
            yOpf2rQ3YIFhl9ADYT5N = input("   Masukkan Roboflow Private API Key: ").strip()
        except Exception:
            raise RuntimeError("ROBOFLOW_API_KEY harus diisi!")
        rf = Roboflow(api_key=yOpf2rQ3YIFhl9ADYT5N)
    else:
        rf = Roboflow(api_key=ROBOFLOW_API_KEY)

    project = rf.workspace(ROBOFLOW_CONFIG["workspace"]).project(ROBOFLOW_CONFIG["project"])
    version = project.version(ROBOFLOW_CONFIG["version"])
    dataset = version.download("yolov8", location=str(DATASET_DIR))
    YAML_PATH = Path(dataset.location) / "data.yaml"
    if not YAML_PATH.exists():
        yaml_candidates = list(Path(dataset.location).rglob("data.yaml"))
        if yaml_candidates:
            YAML_PATH = yaml_candidates[0]
    print(f"   Dataset tersimpan di: {dataset.location}")
    print(f"   data.yaml lokasi    : {YAML_PATH}")
    return dataset.location

def setup_kaggle_and_download():
    global YAML_PATH
    os.environ['KAGGLE_USERNAME'] = KAGGLE_USERNAME or input("Kaggle Username: ").strip()
    os.environ['KAGGLE_KEY'] = KAGGLE_KEY or input("Kaggle Key: ").strip()
    import kaggle
    kaggle.api.authenticate()
    kaggle.api.dataset_download_files(KAGGLE_DATASET, path=str(DATASET_DIR), unzip=True)
    print("   Kaggle dataset downloaded. Membuat pseudo-BBox YOLO format...")
    # Karena Kaggle kebanyakan klasifikasi (tanpa BBox), kita buat BBox seluruh gambar
    YAML_PATH = _create_yolo_from_classification_folder(DATASET_DIR)

def _create_yolo_from_classification_folder(src_dir: Path):
    """Helper: Konversi folder klasifikasi -> pseudo YOLO detection (BBox = seluruh gambar)."""
    train_dir = src_dir / "train"
    class_names = sorted([d.name for d in train_dir.iterdir() if d.is_dir()]) if train_dir.exists() else \
                  sorted([d.name for d in src_dir.iterdir() if d.is_dir()])
    yaml_path = DATASET_DIR / "data.yaml"

    # Split train/val/test
    import random
    random.seed(42)
    split_ratios = {"train": 0.7, "valid": 0.2, "test": 0.1}

    for split_name in split_ratios:
        (DATASET_DIR / split_name / "images").mkdir(parents=True, exist_ok=True)
        (DATASET_DIR / split_name / "labels").mkdir(parents=True, exist_ok=True)

    # Tulis data.yaml
    with open(yaml_path, "w") as f:
        f.write(f"path: {DATASET_DIR.resolve()}\n")
        f.write(f"train: train/images\n")
        f.write(f"val: valid/images\n")
        f.write(f"test: test/images\n\n")
        f.write(f"names:\n")
        for i, c in enumerate(class_names):
            f.write(f"  {i}: {c}\n")

    # Proses setiap kelas
    for cls_idx, cls_name in enumerate(class_names):
        folder_candidates = [
            src_dir / cls_name,
            src_dir / "train" / cls_name,
        ]
        src_cls = next((p for p in folder_candidates if p.exists()), None)
        if not src_cls: continue
        images = [p for p in src_cls.iterdir() if p.suffix.lower() in (".jpg",".jpeg",".png",".bmp",".webp")]
        random.shuffle(images)
        n = len(images)
        splits = {
            "train": images[:int(n*0.7)],
            "valid": images[int(n*0.7):int(n*0.9)],
            "test":  images[int(n*0.9):],
        }
        for split_name, imgs in splits.items():
            for img_path in imgs:
                try:
                    with Image.open(img_path) as im:
                        w, h = im.size
                    new_img = DATASET_DIR / split_name / "images" / f"{cls_name}_{img_path.stem}.jpg"
                    shutil.copy2(img_path, new_img)
                    # Buat label YOLO (BBox = seluruh gambar, normalized [cx, cy, w, h] = [0.5,0.5,1.0,1.0])
                    label_path = DATASET_DIR / split_name / "labels" / f"{cls_name}_{img_path.stem}.txt"
                    label_path.write_text(f"{cls_idx} 0.5 0.5 1.0 1.0\n")
                except Exception:
                    pass
    return yaml_path

def create_dummy_yolo_dataset():
    """Buat dataset sintetis dengan 4 kelas (untuk test pipeline)."""
    global YAML_PATH
    print("\n   Membuat dataset sintetis YOLO dummy (4 kelas)...")
    CLASSES = ["Healthy_Leaf", "Coffee_Rust", "Cercospora_Spot", "Leaf_Miner"]
    SYN_DIR = DATASET_DIR / "synthetic"
    SYN_DIR.mkdir(exist_ok=True)

    for split in ["train", "valid", "test"]:
        (SYN_DIR / split / "images").mkdir(parents=True, exist_ok=True)
        (SYN_DIR / split / "labels").mkdir(parents=True, exist_ok=True)
        n_samples = {"train": 40, "valid": 10, "test": 10}[split]

        for cls_idx, cls in enumerate(CLASSES):
            rng_base = np.random.default_rng(hash(cls) % 2**32)
            for i in range(n_samples):
                # Buat gambar dummy 640x640
                base_bgr = {
                    "Healthy_Leaf":      (30, 130, 40),
                    "Coffee_Rust":       (40, 90, 180),
                    "Cercospora_Spot":   (60, 160, 160),
                    "Leaf_Miner":        (70, 120, 150),
                }[cls]
                img = np.zeros((640, 640, 3), dtype=np.uint8)
                # Background daun
                cv2.ellipse(img, (320, 320), (260, 180), 0, 0, 360, base_bgr, -1)
                # Tambah pattern spot untuk penyakit
                if cls != "Healthy_Leaf":
                    for _ in range(30):
                        cx = rng_base.integers(120, 520)
                        cy = rng_base.integers(140, 500)
                        r = rng_base.integers(10, 40)
                        spot_color = tuple(np.clip(np.array(base_bgr) + rng_base.integers(-40, 40, 3), 0, 255))
                        cv2.circle(img, (cx, cy), r, tuple(int(c) for c in spot_color), -1)
                # Tambah noise
                img = np.clip(img.astype(np.int16) + rng_base.integers(-20, 20, img.shape), 0, 255).astype(np.uint8)

                fname = f"{cls}_{i:03d}"
                img_path = SYN_DIR / split / "images" / f"{fname}.jpg"
                cv2.imwrite(str(img_path), img)
                # Label YOLO: satu objek di tengah (normalized)
                label_path = SYN_DIR / split / "labels" / f"{fname}.txt"
                # Tambah 2-3 bounding box random
                n_boxes = rng_base.integers(1, 4)
                lines = []
                for _ in range(n_boxes):
                    cx = rng_base.uniform(0.3, 0.7)
                    cy = rng_base.uniform(0.3, 0.7)
                    bw = rng_base.uniform(0.08, 0.25)
                    bh = rng_base.uniform(0.08, 0.25)
                    lines.append(f"{cls_idx} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}")
                label_path.write_text("\n".join(lines) + "\n")

    # Tulis data.yaml
    YAML_PATH = SYN_DIR / "data.yaml"
    with open(YAML_PATH, "w") as f:
        f.write(f"path: {SYN_DIR.resolve()}\n")
        f.write(f"train: train/images\n")
        f.write(f"val: valid/images\n")
        f.write(f"test: test/images\n\n")
        f.write(f"nc: {len(CLASSES)}\n")
        f.write(f"names: {CLASSES}\n")
    print(f"   Dataset dummy dibuat: {len(CLASSES)} kelas, ~{4*60*640*640/1e6:.1f} sampel")

# --- Eksekusi Download sesuai opsi ---
try:
    if USE_DUMMY_DATA:
        create_dummy_yolo_dataset()
    elif USE_ROBOFLOW:
        try:
            download_roboflow_yolo()
        except Exception as e:
            print(f"   [!] Roboflow download gagal: {e}")
            print("   Beralih ke dataset dummy untuk test pipeline.")
            create_dummy_yolo_dataset()
            USE_DUMMY_DATA = True
    elif USE_KAGGLE:
        setup_kaggle_and_download()
except Exception as e:
    print(f"   [!] Semua opsi download gagal. Pakai dummy dataset. Error: {e}")
    create_dummy_yolo_dataset()

# --- Verifikasi data.yaml & hitung statistik dataset ---
print(f"\n   Verifikasi data.yaml: {YAML_PATH}")
print("=" * 85)
with open(YAML_PATH) as f:
    yaml_raw = f.read()
print(yaml_raw)

# Parse class names dari data.yaml
import yaml
try:
    with open(YAML_PATH) as f:
        yaml_data = yaml.safe_load(f)
    NAMES = yaml_data.get("names", [])
    NC = yaml_data.get("nc", len(NAMES) if isinstance(NAMES, list) else len(NAMES))
    print(f"\n   Daftar Kelas (nc={NC}):")
    if isinstance(NAMES, list):
        for i, c in enumerate(NAMES): print(f"     {i:2d}: {c}")
    elif isinstance(NAMES, dict):
        for k, v in sorted(NAMES.items()): print(f"     {k:2d}: {v}")
        NAMES = [v for _, v in sorted(NAMES.items())]
except Exception as e:
    print(f"   Parse yaml error: {e}. Membaca manual...")
    NAMES = [f"class_{i}" for i in range(4)]
    NC = 4

# Hitung jumlah gambar per split
def count_split(split_name, yaml_path):
    root = yaml_path.parent
    # Coba beberapa pola path
    candidates = [
        root / split_name / "images",
        root / ".." / split_name / "images",
        Path(yaml_data.get("path", root)) / split_name / "images",
    ]
    for c in candidates:
        if c.exists():
            return len(list(c.glob("*.*")))
    return 0

n_train = count_split("train", YAML_PATH)
n_val   = count_split("valid", YAML_PATH) or count_split("val", YAML_PATH)
n_test  = count_split("test", YAML_PATH)
print(f"\n   Jumlah gambar: Train={n_train}, Val={n_val}, Test={n_test}")
print(f"   Total         : {n_train+n_val+n_test}")

# ======================================================================================
# CELL 4: INSPEKSI SAMPLE DATASET (VISUALISASI BBOX)
# ======================================================================================
print("\n[5/8] Inspeksi & Visualisasi Sample Dataset dengan BBox...")

def find_split_dirs(yaml_path):
    root = yaml_path.parent
    result = {}
    for s in ["train", "valid", "val", "test"]:
        cands = [root / s / "images", Path(yaml_data.get("path", root)) / s / "images"]
        for c in cands:
            if c.exists():
                result[s if s != "val" else "valid"] = c
                break
    return result

split_dirs = find_split_dirs(YAML_PATH)
TRAIN_IMGS = split_dirs.get("train")

def visualize_yolo_samples(img_dir, class_names, ncols=4, nrows=3):
    imgs = sorted(img_dir.glob("*.jpg")) + sorted(img_dir.glob("*.png"))
    if not imgs:
        print(f"   Tidak ada gambar di {img_dir}")
        return
    chosen = np.random.choice(imgs, min(ncols*nrows, len(imgs)), replace=False)
    fig, axes = plt.subplots(nrows, ncols, figsize=(4*ncols, 4*nrows))
    axes = axes.flatten()
    colors = plt.cm.tab10(np.linspace(0, 1, max(10, len(class_names))))

    for ax, img_path in zip(axes, chosen):
        img = cv2.imread(str(img_path))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img.shape[:2]
        label_path = img_path.parents[1] / "labels" / (img_path.stem + ".txt")
        if label_path.exists():
            for line in label_path.read_text().strip().split("\n"):
                if not line.strip(): continue
                parts = line.split()
                cls_id = int(float(parts[0]))
                cx, cy, bw, bh = map(float, parts[1:5])
                # Convert YOLO normalized -> pixel absolute
                x1 = int((cx - bw/2) * w)
                y1 = int((cy - bh/2) * h)
                x2 = int((cx + bw/2) * w)
                y2 = int((cy + bh/2) * h)
                color = colors[cls_id % len(colors)][:3] * 255
                cv2.rectangle(img, (x1,y1), (x2,y2), tuple(int(c) for c in color), 3)
                cls_name = class_names[cls_id] if cls_id < len(class_names) else f"cls_{cls_id}"
                cv2.putText(img, cls_name, (x1, max(y1-10, 20)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, tuple(int(c) for c in color), 2)
        ax.imshow(img)
        ax.set_title(img_path.name[:25], fontsize=8)
        ax.axis('off')
    for j in range(len(chosen), len(axes)):
        axes[j].set_visible(False)
    plt.suptitle("[LENTERA AI] Sample Training Images + YOLO Bounding Boxes",
                 fontsize=14, fontweight='bold')
    plt.tight_layout()
    out_png = RESULTS_DIR / "01_dataset_samples.png"
    plt.savefig(out_png, dpi=110)
    plt.show(); plt.close()
    print(f"   Visualisasi disimpan: {out_png}")

if TRAIN_IMGS:
    visualize_yolo_samples(TRAIN_IMGS, NAMES)

# ======================================================================================
# CELL 5: PELATIHAN MODEL YOLOv8 NANO
# ======================================================================================
print("\n[6/8] Pelatihan YOLOv8 Nano - Transfer Learning")
print("=" * 85)

# --- Hyperparameter Training ---
CONFIG = {
    "MODEL_SIZE":   "yolov8n.pt",  # Nano (tercepat, terkecil ~3MB). Alternatif: yolov8s.pt (Small)
    "IMG_SIZE":     640,           # Resolusi input standar YOLOv8
    "BATCH_SIZE":   16,            # Batch (sesuaikan VRAM: T4 = 16-32, CPU = 2-4)
    "EPOCHS":       100,           # Epoch (cukup untuk konvergensi)
    "PATIENCE":     20,            # Early stopping patience
    "LR0":          0.01,          # Initial learning rate (SGD default)
    "OPTIMIZER":    "auto",        # auto, SGD, Adam, AdamW, RMSProp
    "AUGMENT":      True,          # Mosaic, MixUp, CopyPaste dll (built-in YOLO)
    "PROJECT":      str(RESULTS_DIR),
    "NAME":         "lentera_coffee_rust_yolov8n",
    "DEVICE":       0 if torch.cuda.is_available() else "cpu",
    "SEED":         42,
}
# Override batch untuk CPU
if CONFIG["DEVICE"] == "cpu":
    CONFIG["BATCH_SIZE"] = 4
    CONFIG["EPOCHS"] = 20
    print("   Mode CPU terdeteksi: batch=4, epochs=20 (test pipeline saja)")

# Print konfigurasi
print("\n   Hyperparameter Training:")
for k, v in CONFIG.items():
    print(f"     {k:14s}: {v}")

# --- Load pre-trained model ---
print(f"\n   Memuat pre-trained model: {CONFIG['MODEL_SIZE']}")
model = YOLO(CONFIG["MODEL_SIZE"])

# --- Jalankan Training ---
print("\n" + "-" * 85)
print("   MEMULAI TRAINING... (silakan tunggu, progress muncul di bawah)")
print("   Log tersimpan otomatis oleh Ultralytics di folder results/")
print("-" * 85)

results = model.train(
    data=str(YAML_PATH),
    imgsz=CONFIG["IMG_SIZE"],
    batch=CONFIG["BATCH_SIZE"],
    epochs=CONFIG["EPOCHS"],
    patience=CONFIG["PATIENCE"],
    lr0=CONFIG["LR0"],
    optimizer=CONFIG["OPTIMIZER"],
    augment=CONFIG["AUGMENT"],
    project=CONFIG["PROJECT"],
    name=CONFIG["NAME"],
    device=CONFIG["DEVICE"],
    seed=CONFIG["SEED"],
    save=True,
    plots=True,        # Generate confusion matrix, PR curve, F1 curve
    val=True,          # Validasi setiap epoch
    verbose=True,
)

print("   TRAINING SELESAI!")

# --- Lokasi model terbaik ---
RUN_DIR = Path(results.save_dir)
BEST_PT = RUN_DIR / "weights" / "best.pt"
LAST_PT = RUN_DIR / "weights" / "last.pt"
print(f"\n   Run Dir        : {RUN_DIR}")
print(f"   Best Weights   : {BEST_PT} (exists={BEST_PT.exists()})")
print(f"   Last Weights   : {LAST_PT}")

# Copy best.pt ke MODEL_DIR
if BEST_PT.exists():
    shutil.copy2(BEST_PT, MODEL_DIR / "lentera_yolov8n_best.pt")
    shutil.copy2(BEST_PT, MODEL_DIR / "best.pt")
    print(f"   best.pt dicopy ke: {MODEL_DIR / 'lentera_yolov8n_best.pt'}")

# ======================================================================================
# CELL 6: VISUALISASI HASIL TRAINING
# ======================================================================================
print("\n[7/8] Visualisasi Hasil Training & Evaluasi...")

# YOLOv8 otomatis menghasilkan plot berikut di RUN_DIR:
# - results.png (kurva loss, precision, recall, mAP)
# - confusion_matrix.png, confusion_matrix_normalized.png
# - F1_curve.png, P_curve.png, R_curve.png, PR_curve.png
# - val_batch0_pred.jpg, val_batch1_pred.jpg (prediksi vs GT)
# - train_batch*.jpg (sample training dengan augmentasi)

auto_plots = [
    "results.png", "confusion_matrix_normalized.png",
    "PR_curve.png", "F1_curve.png",
]
for p in auto_plots:
    full = RUN_DIR / p
    if full.exists():
        try:
            img = Image.open(full)
            plt.figure(figsize=(14, 8))
            plt.imshow(img)
            plt.title(f"[LENTERA AI] {p.replace('.png','').replace('_','','')}",
                      fontsize=13, fontweight='bold')
            plt.axis('off')
            plt.tight_layout()
            plt.show(); plt.close()
        except Exception as e:
            print(f"   Gagal tampilkan {p}: {e}")

# Print metrik kuantitatif
csv_metrics = RUN_DIR / "results.csv"
if csv_metrics.exists():
    df = pd.read_csv(csv_metrics)
    df.columns = [c.strip() for c in df.columns]
    latest = df.iloc[-1]
    print("\n   " + "=" * 70)
    print("   METRIK TERAKHIR (EPOCH AKHIR)")
    print("   " + "=" * 70)
    key_metrics = [c for c in df.columns if any(k in c.lower() for k in
                   ["map50","map95","precision","recall","f1","accuracy","loss"])]
    for c in key_metrics:
        print(f"     {c:35s}: {latest[c]:.5f}")
    best_epoch_idx = df.iloc[:, df.columns.str.contains('metrics/mAP50(B)')].idxmax() \
                     if any('mAP50(B)' in c for c in df.columns) else -1
    if isinstance(best_epoch_idx, (list, np.ndarray)): best_epoch_idx = best_epoch_idx[0] if len(best_epoch_idx) else -1
    print(f"\n   Best epoch (berdasarkan mAP50): epoch {int(best_epoch_idx)+1 if best_epoch_idx!=-1 else 'N/A'}")

# ======================================================================================
# CELL 7: EKSPOR MODEL KE FORMAT PRODUKSI (ONNX / TFLITE / TF.JS)
# ======================================================================================
print("\n[8/8] Ekspor Model ke Format Produksi")
print("=" * 85)

EXPORT_FORMATS = [
    ("onnx",   "ONNX Runtime (Backend Node.js / Python)"),
    ("torchscript", "TorchScript (LibTorch C++/Mobile)"),
]
# Tambah TF.js dan TFLite jika memungkinkan
try:
    import tensorflow as tf
    EXPORT_FORMATS += [
        ("tflite", "TensorFlow Lite (Android/iOS/Edge TPU)"),
        ("tfjs",   "TensorFlow.js (Frontend Web Browser LENTERA)"),
    ]
except Exception:
    print("   TensorFlow tidak terinstall. Skip TFLite & TF.js export.")

best_model = YOLO(str(BEST_PT if BEST_PT.exists() else LAST_PT))
exported_paths = {}

for fmt, desc in EXPORT_FORMATS:
    try:
        print(f"\n   Mengekspor ke {fmt.upper():8s} - {desc}")
        out = best_model.export(format=fmt, imgsz=CONFIG["IMG_SIZE"], simplify=True)
        out_path = Path(out)
        exported_paths[fmt] = out_path
        size_mb = out_path.stat().st_size / (1024**2)
        print(f"     OK! Path: {out_path}")
        print(f"     Ukuran: {size_mb:.2f} MB")
        # Copy ke MODEL_DIR
        dest = MODEL_DIR / f"lentera_yolov8n_best.{fmt}"
        if out_path.is_dir():
            if dest.exists(): shutil.rmtree(dest)
            shutil.copytree(out_path, dest)
        else:
            shutil.copy2(out_path, dest)
    except Exception as e:
        print(f"     Gagal: {type(e).__name__}: {str(e)[:120]}")

# Simpan metadata kelas
metadata = {
    "model_type": "YOLOv8n-ObjectDetection",
    "class_names": list(NAMES),
    "nc": NC,
    "imgsz": CONFIG["IMG_SIZE"],
    "conf_threshold_default": 0.45,
    "iou_threshold_default": 0.5,
    "training_date": str(pd.Timestamp.now()),
    "hyperparameters": CONFIG,
}
with open(MODEL_DIR / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
(MODEL_DIR / "model_metadata.json").write_text(json.dumps(metadata, indent=2))
print(f"\n   Metadata model disimpan: {MODEL_DIR / 'model_metadata.json'}")

# ======================================================================================
# CELL 8: INFERENCE TEST DENGAN IMAGE TEST
# ======================================================================================
print("\n" + "=" * 85)
print("  DEMO INFERENCE - Prediksi Gambar Test Menggunakan Model Terbaik")
print("=" * 85)

test_dir = split_dirs.get("test") or split_dirs.get("valid")
if test_dir and BEST_PT.exists():
    model_test = YOLO(str(BEST_PT))
    test_imgs = sorted(test_dir.glob("*.jpg")) + sorted(test_dir.glob("*.png"))
    chosen_test = np.random.choice(test_imgs, min(9, len(test_imgs)), replace=False)

    fig, axes = plt.subplots(3, 3, figsize=(15, 15))
    axes = axes.flatten()
    for i, img_path in enumerate(chosen_test):
        results_list = model_test.predict(
            source=str(img_path),
            conf=0.45,
            iou=0.5,
            verbose=False
        )
        res_plotted = results_list[0].plot()  # Gambar dengan BBox prediksi
        axes[i].imshow(cv2.cvtColor(res_plotted, cv2.COLOR_BGR2RGB))
        n_det = len(results_list[0].boxes)
        axes[i].set_title(f"Prediksi: {n_det} objek terdeteksi", fontsize=10, color='white',
                          bbox=dict(facecolor='#2E86AB', alpha=0.8))
        axes[i].axis('off')
    for j in range(len(chosen_test), len(axes)):
        axes[j].set_visible(False)
    plt.suptitle("[LENTERA AI] YOLOv8n Inference Demo - Test Set",
                 fontsize=15, fontweight='bold')
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "02_inference_demo.png", dpi=120)
    plt.show(); plt.close()

# ======================================================================================
# CELL 9: PAKET DOWNLOAD HASIL TRAINING
# ======================================================================================
print("\n" + "=" * 85)
print("  PAKET OUTPUT & DOWNLOAD")
print("=" * 85)

ZIP_OUTPUT = Path("/content/LENTERA_YOLOv8n_Training_Output.zip")
print(f"\n   Mengkompres hasil training ke: {ZIP_OUTPUT}")
with zipfile.ZipFile(ZIP_OUTPUT, 'w', zipfile.ZIP_DEFLATED) as zf:
    # Tambah semua file dari MODEL_DIR
    for f in MODEL_DIR.rglob("*"):
        if f.is_file():
            zf.write(f, "models/" + str(f.relative_to(MODEL_DIR)))
    # Tambah plot penting dari RUN_DIR
    important = ["results.png","confusion_matrix_normalized.png","PR_curve.png",
                 "F1_curve.png","args.yaml","results.csv"]
    for name in important:
        fp = RUN_DIR / name
        if fp.exists(): zf.write(fp, f"training_plots/{name}")
    # Tambah plot dari RESULTS_DIR
    for fp in RESULTS_DIR.glob("0*.png"):
        zf.write(fp, f"output_images/{fp.name}")
    # Tambah README
    readme = f"""
================================================================================
LENTERA AI - YOLOv8 NANO OUTPUT PACKAGE
================================================================================
Dihasilkan otomatis pada: {pd.Timestamp.now()}

KONTEN FOLDER:
1. models/
   ├─ best.pt / lentera_yolov8n_best.pt     <- PyTorch model (backup training)
   ├─ lentera_yolov8n_best.onnx             <- ONNX Runtime (Backend Node.js)
   ├─ lentera_yolov8n_best.tflite           <- TensorFlow Lite (Mobile)
   ├─ tfjs_model/                           <- TensorFlow.js (Frontend LENTERA)
   ├─ model_metadata.json                   <- Label kelas + config

2. training_plots/
   ├─ results.png                           <- Grafik loss, precision, recall, mAP
   ├─ confusion_matrix_normalized.png       <- Confusion Matrix
   ├─ PR_curve.png / F1_curve.png           <- Precision-Recall Curve
   ├─ results.csv                           <- Log per epoch (buka di Excel)

3. output_images/
   ├─ 01_dataset_samples.png                <- Sample training data
   └─ 02_inference_demo.png                 <- Demo prediksi test set

CARA PAKAI DI BACKEND LENTERA:
  1. Copy models/lentera_yolov8n_best.onnx + model_metadata.json
     ke backend/models/
  2. npm install onnxruntime-node
  3. Gunakan fungsi di yolov8_inference.js untuk prediksi

CARA PAKAI DI FRONTEND LENTERA:
  1. Upload seluruh folder tfjs_model/ ke lentera-app/public/ai_models/
  2. Gunakan @tensorflow/tfjs untuk loadLayersModel() dari path tsjf model.json
================================================================================
"""
    zf.writestr("README_LENTERA_YOLOv8.txt", readme)

zip_size = ZIP_OUTPUT.stat().st_size / (1024**2)
print(f"   Selesai! Ukuran ZIP: {zip_size:.2f} MB")
print(f"   Klik folder di sidebar kiri Colab > Download {ZIP_OUTPUT}")

# List isi zip
print("\n   Isi ZIP:")
with zipfile.ZipFile(ZIP_OUTPUT) as zf:
    total_files = len(zf.namelist())
    total_comp = sum(zf.getinfo(n).compress_size for n in zf.namelist()) / 1024**2
    for n in zf.namelist()[:25]:
        size_kb = zf.getinfo(n).file_size / 1024
        print(f"     - {n:55s} {size_kb:8.1f} KB")
    if total_files > 25:
        print(f"     ... (+{total_files-25} file lainnya)")

print("\n" + "=" * 85)
print("  TRAINING & EKSPOR YOLOv8 NANO SELESAI!")
print("  Integrasikan file output dengan Backend/Frontend LENTERA.")
print("=" * 85)
