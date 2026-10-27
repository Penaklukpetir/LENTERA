"""
==========================================================================================
  LENTERA AI - MOBILENETV2 CLASSIFICATION FOR COFFEE & CITRUS LEAF DISEASE DETECTION
  Script Siap Dijalankan di Google Colab
==========================================================================================
  Tujuan     : Klasifikasi Gambar Penyakit Daun Kopi & Jeruk (Multi-class Classification)
  Model      : MobileNetV2 (Ringan, Cocok untuk Edge Device / Web Browser)
  Framework  : TensorFlow 2.x + Keras
  Output     : Model (.h5 / .keras) + TF.js Model (untuk frontend) + ONNX Model
==========================================================================================
"""

# ======================================================================================
# CELL 1: SETUP LINGKUNGAN DAN DEPENDENSI
# ======================================================================================
print("=" * 80)
print(" [LENTERA AI] Inisialisasi Environment Google Colab")
print("=" * 80)

import os
import subprocess
import sys

def install_package(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

print("\n[1/6] Memeriksa GPU Runtime Colab...")
import tensorflow as tf
device_name = tf.test.gpu_device_name()
if device_name:
    print(f"   GPU Terdeteksi: {device_name}")
    print("   Aktifkan runtime GPU: Runtime > Change Runtime Type > GPU (T4)")
else:
    print("   PERINGATAN: Runtime CPU terdeteksi. Training akan lambat.")
    print("   Silakan ganti ke GPU T4 untuk kecepatan optimal.")

print("\n[2/6] Menginstal dependensi tambahan...")
install_package("kaggle")
install_package("roboflow")
install_package("onnxruntime")
install_package("tf2onnx")
install_package("seaborn")
install_package("scikit-learn")
install_package("gdown")

print("\n[3/6] Impor semua library...")
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from glob import glob
import json
import zipfile
import gdown
import cv2

from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model, Sequential, load_model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint,
    TensorBoard, CSVLogger
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.utils import to_categorical
from tensorflow.keras import backend as K

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, f1_score, precision_score, recall_score
)

print("   Semua library berhasil dimuat.")
print(f"   TensorFlow version: {tf.__version__}")

# ======================================================================================
# CELL 2: KONFIGURASI DATASET (PILIH SALAH SATU: KAGGLE ATAU ROBOFLOW ATAU SAMPLE)
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Konfigurasi Sumber Dataset")
print("=" * 80)

"""
==========================================================================================
  OPSI 1: DOWNLOAD DATASET DARI KAGGLE (Direkomendasikan)
==========================================================================================
  Daftar Dataset Kaggle yang bisa digunakan:

  a) Coffee Leaf Disease:
     -> "arjunshenoy123/coffee-leaf-diseases"
        (Kelas: Healthy, Rust, Miner, Cercospora)
     -> "patrykmaking/coffee-plant-diseases"
        (Kelas: Healthy, Leaf Rust, Red Spider Mite, Cercospora Leaf Spot)

  b) Citrus Leaf Disease:
     -> "sssmanik/citrus-leaves-diseases-dataset"
        (Kelas: Healthy, Blackspot, Canker, Greening)
     -> "shashwatwork/plant-disease-dataset-citrus"
        (Kelas: Healthy, Black spot, Canker, Scab, Greening)

  c) Plant Village Umum (Kopi + Jeruk ada di dalamnya):
     -> "emmarex/plantdisease"
     -> "saroz014/plant-disease-detection-dataset"
==========================================================================================

CARA MENDAPATKAN KAGGLE API KEY:
1. Buka kaggle.com -> Login -> Profile (ikon foto) -> Settings
2. Scroll ke "API" -> Klik "Create New API Token" -> kaggle.json terdownload
3. Upload kaggle.json ke folder /content/ di Colab, atau isi value di bawah ini
"""

# --- SETTING KAGGLE (ISI KREDENSIAL ANDA DI SINI ATAU UPLOAD kaggle.json) ---
USE_KAGGLE = True  # Ubah ke False jika ingin pakai Roboflow atau sample data

KAGGLE_USERNAME = ""   # TODO: isi username Kaggle Anda
KAGGLE_KEY = ""        # TODO: isi Kaggle Key Anda

# Pilih salah satu dataset (hilangkan komentar pada salah satu):
# KAGGLE_DATASET = "arjunshenoy123/coffee-leaf-diseases"
# KAGGLE_DATASET = "patrykmaking/coffee-plant-diseases"
# KAGGLE_DATASET = "sssmanik/citrus-leaves-diseases-dataset"
KAGGLE_DATASET = "saroz014/plant-disease-detection-dataset"  # Plant Village, ada kopi & jeruk

"""
==========================================================================================
  OPSI 2: DOWNLOAD DATASET DARI ROBOFLOW (Bounding Box untuk YOLO, tapi bisa untuk klasifikasi)
==========================================================================================
  Daftar Dataset Roboflow Terkait:
  1. Coffee Leaf Disease (Karat Daun)
     -> Universe: "plant-disease-i0tfd/coffee-leaf-disease-hl0wo"
  2. Citrus Plant Disease
     -> Universe: "citrus-diseases/citrus-diseases-final"
  3. Plant Disease Comprehensive
     -> Universe: "workspace-plant-disease/plant-disease-gw4te"

  Cara dapatkan Roboflow API Key: roboflow.com -> Settings -> API Keys
"""
USE_ROBOFLOW = False  # Ubah ke True jika pakai Roboflow
ROBOFLOW_API_KEY = ""  # TODO: isi API key Roboflow
ROBOFLOW_WORKSPACE = "plant-disease-i0tfd"
ROBOFLOW_PROJECT = "coffee-leaf-disease-hl0wo"
ROBOFLOW_VERSION = 1

"""
==========================================================================================
  OPSI 3: SAMPLE DATASET KECIL (Jika Tidak Ingin Download Besar - untuk Testing)
==========================================================================================
  Akan dibuat dataset sintetis dummy dengan 4 kelas:
  Sehat, Karat Daun (Rust), Cercospora, Miner
"""
USE_SAMPLE_DATA = False  # Ubah ke True jika hanya ingin test pipeline cepat

# --- Setting Path ---
DATASET_DIR = "/content/lentera_dataset"
MODEL_DIR = "/content/lentera_models"
os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# ======================================================================================
# CELL 3: DOWNLOAD & PERSIAPAN DATASET
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Download & Persiapan Dataset")
print("=" * 80)

def setup_kaggle_api():
    """Setup Kaggle API dengan kredensial."""
    if KAGGLE_USERNAME and KAGGLE_KEY:
        os.environ['KAGGLE_USERNAME'] = KAGGLE_USERNAME
        os.environ['KAGGLE_KEY'] = KAGGLE_KEY
    else:
        print("   [!] Kredensial Kaggle kosong. Mencoba upload file kaggle.json...")
        from google.colab import files
        print("   Silakan upload file kaggle.json Anda:")
        uploaded = files.upload()
        for fn in uploaded.keys():
            os.rename(fn, "/root/.kaggle/kaggle.json")
            os.system("chmod 600 /root/.kaggle/kaggle.json")
    print("   Kaggle API siap digunakan.")

def download_kaggle_dataset():
    """Download dataset dari Kaggle."""
    print(f"\n   Mendownload dataset Kaggle: {KAGGLE_DATASET}")
    setup_kaggle_api()
    import kaggle
    kaggle.api.authenticate()
    kaggle.api.dataset_download_files(
        KAGGLE_DATASET,
        path=DATASET_DIR,
        unzip=True
    )
    print("   Dataset selesai di-download dan diekstrak.")

def download_roboflow_dataset():
    """Download dataset dari Roboflow Universe."""
    from roboflow import Roboflow
    print(f"\n   Mendownload dataset Roboflow: {ROBOFLOW_WORKSPACE}/{ROBOFLOW_PROJECT}")
    rf = Roboflow(api_key=ROBOFLOW_API_KEY)
    project = rf.workspace(ROBOFLOW_WORKSPACE).project(ROBOFLOW_PROJECT)
    dataset = project.version(ROBOFLOW_VERSION).download("folder")
    return dataset.location

def create_sample_dataset():
    """Buat dataset sintetis untuk testing pipeline (mode cepat)."""
    print("\n   Membuat dataset sintetis sample untuk testing...")
    classes = ["Healthy", "Coffee_Rust", "Cercospora", "Leaf_Miner"]
    samples_per_class = 50
    img_size = (224, 224)

    for cls in classes:
        cls_dir = os.path.join(DATASET_DIR, cls)
        os.makedirs(cls_dir, exist_ok=True)
        for i in range(samples_per_class):
            seed = hash(f"{cls}_{i}") % (2**32)
            rng = np.random.default_rng(seed)
            base_color = {
                "Healthy": (30, 120, 30),
                "Coffee_Rust": (180, 100, 40),
                "Cercospora": (150, 150, 50),
                "Leaf_Miner": (100, 80, 60)
            }[cls]
            img = rng.integers(0, 40, (*img_size, 3), dtype=np.uint8)
            img[:, :, 0] += base_color[0]
            img[:, :, 1] += base_color[1]
            img[:, :, 2] += base_color[2]
            # Tambah noise pattern
            noise = rng.normal(0, 15, (*img_size, 3)).astype(np.int16)
            img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            cv2.imwrite(os.path.join(cls_dir, f"{cls.lower()}_{i:03d}.jpg"), img)
    print(f"   Dataset sample dibuat: {len(classes)} kelas x {samples_per_class} gambar")
    return classes

# --- Eksekusi download sesuai opsi ---
if USE_SAMPLE_DATA:
    class_names = create_sample_dataset()
elif USE_KAGGLE:
    try:
        download_kaggle_dataset()
    except Exception as e:
        print(f"   Error download Kaggle: {e}")
        print("   Beralih ke mode sample dataset untuk test pipeline.")
        class_names = create_sample_dataset()
elif USE_ROBOFLOW:
    try:
        rf_path = download_roboflow_dataset()
        DATASET_DIR = rf_path if rf_path else DATASET_DIR
    except Exception as e:
        print(f"   Error download Roboflow: {e}")
        print("   Beralih ke mode sample dataset untuk test pipeline.")
        class_names = create_sample_dataset()

# --- Deteksi struktur folder dataset ---
def detect_dataset_structure(base_dir):
    """Mendeteksi apakah dataset punya train/val/test atau flat classes."""
    print(f"\n   Memindai struktur dataset di: {base_dir}")
    all_dirs = [d for d in os.listdir(base_dir)
                if os.path.isdir(os.path.join(base_dir, d))]
    train_dir = val_dir = test_dir = None

    if set(["train", "valid", "test"]).issubset(set(map(str.lower, all_dirs))):
        d_map = {d.lower(): d for d in all_dirs}
        train_dir = os.path.join(base_dir, d_map.get("train", "train"))
        val_dir = os.path.join(base_dir, d_map.get("valid", "valid"))
        test_dir = os.path.join(base_dir, d_map.get("test", "test"))
        detected_classes = sorted([c for c in os.listdir(train_dir)
                                   if os.path.isdir(os.path.join(train_dir, c))])
    elif set(["train", "val", "test"]).issubset(set(map(str.lower, all_dirs))):
        d_map = {d.lower(): d for d in all_dirs}
        train_dir = os.path.join(base_dir, d_map.get("train", "train"))
        val_dir = os.path.join(base_dir, d_map.get("val", "val"))
        test_dir = os.path.join(base_dir, d_map.get("test", "test"))
        detected_classes = sorted([c for c in os.listdir(train_dir)
                                   if os.path.isdir(os.path.join(train_dir, c))])
    else:
        # Flat: bagi jadi train/val/test secara otomatis
        detected_classes = sorted(all_dirs)
        print(f"   Dataset flat terdeteksi. Membagi train(80)/val(10)/test(10)...")
        import shutil
        train_dir = os.path.join("/content/dataset_split", "train")
        val_dir = os.path.join("/content/dataset_split", "val")
        test_dir = os.path.join("/content/dataset_split", "test")
        for split_dir in [train_dir, val_dir, test_dir]:
            os.makedirs(split_dir, exist_ok=True)
        for cls in detected_classes:
            cls_path = os.path.join(base_dir, cls)
            files = sorted(glob(os.path.join(cls_path, "*.*")))
            files = [f for f in files if f.lower().endswith(
                (".jpg", ".jpeg", ".png", ".bmp", ".webp"))]
            n = len(files)
            rng = np.random.default_rng(42)
            rng.shuffle(files)
            n_train = int(0.8 * n)
            n_val = int(0.1 * n)
            splits = {
                train_dir: files[:n_train],
                val_dir: files[n_train:n_train + n_val],
                test_dir: files[n_train + n_val:]
            }
            for dest_dir, split_files in splits.items():
                dest_cls = os.path.join(dest_dir, cls)
                os.makedirs(dest_cls, exist_ok=True)
                for f in split_files:
                    try:
                        shutil.copy2(f, dest_cls)
                    except Exception:
                        pass

    detected_classes = sorted([c for c in detected_classes
                               if os.path.isdir(os.path.join(train_dir, c))])
    print(f"   Kelas terdeteksi ({len(detected_classes)}): {detected_classes}")
    return train_dir, val_dir, test_dir, detected_classes

TRAIN_DIR, VAL_DIR, TEST_DIR, class_names = detect_dataset_structure(DATASET_DIR)
NUM_CLASSES = len(class_names)
print(f"\n   Training   Dir: {TRAIN_DIR}")
print(f"   Validation Dir: {VAL_DIR}")
print(f"   Test       Dir: {TEST_DIR}")

# Hitung jumlah gambar
def count_images(d):
    n = 0
    if os.path.exists(d):
        for cls in class_names:
            cdir = os.path.join(d, cls)
            if os.path.exists(cdir):
                n += len([f for f in os.listdir(cdir)
                         if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp"))])
    return n

print(f"\n   Jumlah gambar:")
print(f"     Train     : {count_images(TRAIN_DIR)}")
print(f"     Validation: {count_images(VAL_DIR)}")
print(f"     Test      : {count_images(TEST_DIR)}")

# ======================================================================================
# CELL 4: AUGMENTASI DATA & DATA GENERATOR
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Persiapan Data Augmentasi & Generator")
print("=" * 80)

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
INPUT_SHAPE = (224, 224, 3)

# Augmentasi untuk training (mencegah overfit)
train_datagen = ImageDataGenerator(
    preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
    rotation_range=30,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    vertical_flip=False,
    fill_mode='nearest',
    brightness_range=[0.7, 1.3]
)

# Val & Test: hanya preprocessing, tidak ada augmentasi
val_datagen = ImageDataGenerator(
    preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input
)
test_datagen = ImageDataGenerator(
    preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input
)

print("\n   Membuat ImageDataGenerator...")
train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True,
    seed=42
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False,
    seed=42
)

test_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False,
    seed=42
)

# Simpan mapping kelas untuk dipakai di inference
class_indices = train_generator.class_indices
class_mapping = {v: k for k, v in class_indices.items()}
print(f"\n   Class Mapping (Index -> Nama Kelas):")
for k, v in sorted(class_mapping.items()):
    print(f"     {k:2d} : {v}")

with open(os.path.join(MODEL_DIR, "class_mapping.json"), "w") as f:
    json.dump({
        "class_mapping": {str(k): v for k, v in class_mapping.items()},
        "num_classes": NUM_CLASSES,
        "img_size": list(IMG_SIZE),
        "preprocessing": "mobilenet_v2"
    }, f, indent=2)
print("   Class mapping disimpan: class_mapping.json")

# Visualisasi sample batch
def plot_sample_images():
    sample_imgs, sample_labels = next(train_generator)
    fig, axes = plt.subplots(3, 5, figsize=(15, 9))
    axes = axes.flatten()
    for i in range(min(15, len(sample_imgs))):
        img = ((sample_imgs[i] + 1) * 127.5).astype(np.uint8)
        ax = axes[i]
        ax.imshow(img)
        ax.set_title(class_mapping[np.argmax(sample_labels[i])],
                     fontsize=9, color='white',
                     bbox=dict(facecolor='green', alpha=0.7))
        ax.axis('off')
    plt.suptitle("[LENTERA AI] Sample Training Images Setelah Augmentasi",
                 fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, "sample_training_images.png"), dpi=100)
    plt.show()
    plt.close()

plot_sample_images()

# ======================================================================================
# CELL 5: ARSITEKTUR MODEL MOBILENETV2 (TRANSFER LEARNING)
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Membangun Arsitektur MobileNetV2 + Transfer Learning")
print("=" * 80)

print("\n   [Langkah 1] Memuat base model MobileNetV2 (pre-trained ImageNet)...")
base_model = MobileNetV2(
    input_shape=INPUT_SHAPE,
    include_top=False,
    weights='imagenet',
    alpha=1.0  # 1.0 = Full MobileNetV2, 0.75/0.5 = Lebih kecil
)

print(f"   Base model layers: {len(base_model.layers)}")

# --- Transfer Learning Phase 1: Bekukan base model, hanya train classifier head ---
print("\n   [Langkah 2] Membangun classification head (Transfer Learning)...")
base_model.trainable = False  # Bekukan seluruh lapisan backbone

inputs = tf.keras.Input(shape=INPUT_SHAPE)
x = base_model(inputs, training=False)  # training=False = BatchNorm inference mode
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.5)(x)
x = BatchNormalization()(x)
x = Dense(256, activation='relu')(x)
x = Dropout(0.3)(x)
outputs = Dense(NUM_CLASSES, activation='softmax')(x)

model = Model(inputs=inputs, outputs=outputs, name="LENTERA_MobileNetV2")

print("\n   [Ringkasan Model Tahap 1 (Head Only)]:")
model.summary()

# Hitung total parameter
trainable_params = sum([K.count_params(w) for w in model.trainable_weights])
non_trainable_params = sum([K.count_params(w) for w in model.non_trainable_weights])
print(f"\n   Trainable params    : {trainable_params:,}")
print(f"   Non-trainable params: {non_trainable_params:,}")

# ======================================================================================
# CELL 6: PELATIHAN TAHAP 1 (CLASSIFIER HEAD SAJA)
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Training Tahap 1 - Hanya Classifier Head (5-10 Epochs)")
print("=" * 80)

INITIAL_EPOCHS = 10
INITIAL_LR = 1e-3

model.compile(
    optimizer=Adam(learning_rate=INITIAL_LR),
    loss='categorical_crossentropy',
    metrics=['accuracy',
             tf.keras.metrics.Precision(name='precision'),
             tf.keras.metrics.Recall(name='recall'),
             tf.keras.metrics.AUC(name='auc')]
)

# Callbacks
checkpoint_path1 = os.path.join(MODEL_DIR, "mobilenetv2_stage1_best.h5")
callbacks_stage1 = [
    EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7, verbose=1),
    ModelCheckpoint(checkpoint_path1, monitor='val_accuracy', save_best_only=True, verbose=1),
    CSVLogger(os.path.join(MODEL_DIR, "training_log_stage1.csv"))
]

steps_per_epoch = max(1, train_generator.n // train_generator.batch_size)
validation_steps = max(1, val_generator.n // val_generator.batch_size)

print(f"\n   Steps per epoch    : {steps_per_epoch}")
print(f"   Validation steps   : {validation_steps}")
print(f"   Initial Learning Rate: {INITIAL_LR}")

history_stage1 = model.fit(
    train_generator,
    steps_per_epoch=steps_per_epoch,
    validation_data=val_generator,
    validation_steps=validation_steps,
    epochs=INITIAL_EPOCHS,
    callbacks=callbacks_stage1,
    verbose=1
)

# ======================================================================================
# CELL 7: PELATIHAN TAHAP 2 - FINE-TUNING (UNFREEZE LAPISAN AKHIR)
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Training Tahap 2 - Fine Tuning (20-30 Epochs, LR kecil)")
print("=" * 80)

FINE_TUNE_EPOCHS = 25
FINE_TUNE_LR = 1e-5
FINE_TUNE_FROM_LAYER = 100  # Unfreeze 100 lapisan terakhir MobileNetV2

print(f"\n   Membuka (unfreeze) lapisan ke-{FINE_TUNE_FROM_LAYER} hingga akhir dari base model...")
base_model.trainable = True
for layer in base_model.layers[:FINE_TUNE_FROM_LAYER]:
    layer.trainable = False

total_trainable_after = sum([K.count_params(w) for w in model.trainable_weights])
print(f"   Trainable params setelah unfreeze: {total_trainable_after:,}")

# Re-compile dengan LR yang lebih kecil
model.compile(
    optimizer=Adam(learning_rate=FINE_TUNE_LR),
    loss='categorical_crossentropy',
    metrics=['accuracy',
             tf.keras.metrics.Precision(name='precision'),
             tf.keras.metrics.Recall(name='recall'),
             tf.keras.metrics.AUC(name='auc')]
)

checkpoint_path2 = os.path.join(MODEL_DIR, "mobilenetv2_stage2_best.keras")
checkpoint_path2_h5 = os.path.join(MODEL_DIR, "mobilenetv2_stage2_best.h5")
callbacks_stage2 = [
    EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, verbose=1),
    ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-8, verbose=1),
    ModelCheckpoint(checkpoint_path2, monitor='val_accuracy', save_best_only=True, verbose=1),
    CSVLogger(os.path.join(MODEL_DIR, "training_log_stage2.csv"), append=True)
]

total_epochs = INITIAL_EPOCHS + FINE_TUNE_EPOCHS
history_stage2 = model.fit(
    train_generator,
    steps_per_epoch=steps_per_epoch,
    validation_data=val_generator,
    validation_steps=validation_steps,
    epochs=total_epochs,
    initial_epoch=history_stage1.epoch[-1] + 1,
    callbacks=callbacks_stage2,
    verbose=1
)

# Simpan model final
final_model_path = os.path.join(MODEL_DIR, "lentera_mobilenetv2_final.keras")
final_model_path_h5 = os.path.join(MODEL_DIR, "lentera_mobilenetv2_final.h5")
model.save(final_model_path)
model.save(final_model_path_h5)
print(f"\n   Model final disimpan: {final_model_path}")

# ======================================================================================
# CELL 8: EVALUASI MODEL DI TEST SET
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Evaluasi Model pada Test Set (Unseen Data)")
print("=" * 80)

print("\n   Mengevaluasi model final di data test...")
test_results = model.evaluate(test_generator, verbose=1)
metrics_names = ["Loss", "Accuracy", "Precision", "Recall", "AUC"]
print("\n   " + "-" * 50)
print("   HASIL EVALUASI TEST SET (MobileNetV2 Fine-Tuned)")
print("   " + "-" * 50)
for name, val in zip(metrics_names, test_results):
    print(f"   {name:12s}: {val:.4f}  ({val*100:.2f}%)" if "Loss" not in name
          else f"   {name:12s}: {val:.4f}")
print("   " + "-" * 50)

# Prediksi untuk classification report dan confusion matrix
print("\n   Membuat prediksi untuk Classification Report...")
test_generator.reset()
y_pred_probs = model.predict(test_generator, verbose=1)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = test_generator.classes

acc = accuracy_score(y_true, y_pred)
prec = precision_score(y_true, y_pred, average='weighted', zero_division=0)
rec = recall_score(y_true, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)

print("\n   Sklearn Metrics (Weighted Average):")
print(f"     Accuracy : {acc:.4f} ({acc*100:.2f}%)")
print(f"     Precision: {prec:.4f} ({prec*100:.2f}%)")
print(f"     Recall   : {rec:.4f} ({rec*100:.2f}%)")
print(f"     F1-Score : {f1:.4f} ({f1*100:.2f}%)")

print("\n   Classification Report per Kelas:")
print(classification_report(y_true, y_pred, target_names=class_names, zero_division=0))

# --- Plot Confusion Matrix ---
plt.figure(figsize=(10, 8))
cm = confusion_matrix(y_true, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=class_names,
            yticklabels=class_names,
            cbar_kws={'label': 'Jumlah Sampel'})
plt.title("[LENTERA AI] Confusion Matrix - Test Set (MobileNetV2)",
          fontsize=14, fontweight='bold')
plt.xlabel("Predicted Label", fontsize=11)
plt.ylabel("True Label", fontsize=11)
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
plt.savefig(os.path.join(MODEL_DIR, "confusion_matrix_test.png"), dpi=120)
plt.show()
plt.close()
print("   Confusion matrix disimpan.")

# ======================================================================================
# CELL 9: PLOT GRAFIK TRAINING HISTORY
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Visualisasi Grafik Training History")
print("=" * 80)

# Gabung history dari 2 stage
hist = {}
for key in history_stage1.history.keys():
    hist[key] = history_stage1.history.get(key, []) + history_stage2.history.get(key, [])

def plot_training_curves():
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))

    # Akurasi
    axes[0, 0].plot(hist.get('accuracy', []), label='Training Accuracy', color='#2E86AB', linewidth=2)
    axes[0, 0].plot(hist.get('val_accuracy', []), label='Val Accuracy', color='#E63946', linewidth=2)
    axes[0, 0].set_title('Training vs Validation Accuracy', fontweight='bold')
    axes[0, 0].set_xlabel('Epoch'); axes[0, 0].set_ylabel('Accuracy')
    axes[0, 0].legend(); axes[0, 0].grid(True, alpha=0.3)

    # Loss
    axes[0, 1].plot(hist.get('loss', []), label='Training Loss', color='#2E86AB', linewidth=2)
    axes[0, 1].plot(hist.get('val_loss', []), label='Val Loss', color='#E63946', linewidth=2)
    axes[0, 1].set_title('Training vs Validation Loss', fontweight='bold')
    axes[0, 1].set_xlabel('Epoch'); axes[0, 1].set_ylabel('Loss (CCE)')
    axes[0, 1].legend(); axes[0, 1].grid(True, alpha=0.3)

    # Precision & Recall
    if 'precision' in hist:
        axes[1, 0].plot(hist.get('precision', []), label='Train Precision', color='#06A77D', linewidth=2)
        axes[1, 0].plot(hist.get('val_precision', []), label='Val Precision', color='#F4A261', linewidth=2)
        axes[1, 0].set_title('Training vs Validation Precision', fontweight='bold')
        axes[1, 0].set_xlabel('Epoch'); axes[1, 0].set_ylabel('Precision')
        axes[1, 0].legend(); axes[1, 0].grid(True, alpha=0.3)
    else:
        axes[1, 0].text(0.5, 0.5, 'Data precision tidak tersedia', ha='center', transform=axes[1, 0].transAxes)

    if 'recall' in hist:
        axes[1, 1].plot(hist.get('recall', []), label='Train Recall', color='#06A77D', linewidth=2)
        axes[1, 1].plot(hist.get('val_recall', []), label='Val Recall', color='#F4A261', linewidth=2)
        axes[1, 1].set_title('Training vs Validation Recall', fontweight='bold')
        axes[1, 1].set_xlabel('Epoch'); axes[1, 1].set_ylabel('Recall')
        axes[1, 1].legend(); axes[1, 1].grid(True, alpha=0.3)
    else:
        axes[1, 1].text(0.5, 0.5, 'Data recall tidak tersedia', ha='center', transform=axes[1, 1].transAxes)

    plt.suptitle("[LENTERA AI] MobileNetV2 Training History (Stage 1 + 2)",
                 fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, "training_curves.png"), dpi=120)
    plt.show()
    plt.close()

plot_training_curves()
print("   Grafik training history disimpan.")

# ======================================================================================
# CELL 10: EKSPOR MODEL KE FORMAT PRODUKSI (TF.JS + ONNX)
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Ekspor Model ke Format Produksi")
print("=" * 80)

# --- Ekspor ke TensorFlow.js (untuk client-side inference di browser LENTERA) ---
TFJS_DIR = os.path.join(MODEL_DIR, "tfjs_model")
print(f"\n   [1/2] Mengekspor ke TensorFlow.js -> {TFJS_DIR}")
try:
    os.makedirs(TFJS_DIR, exist_ok=True)
    import subprocess
    result = subprocess.run([
        "tensorflowjs_converter",
        "--input_format", "keras",
        "--output_format", "tfjs_layers_model",
        final_model_path,
        TFJS_DIR
    ], capture_output=True, text=True)
    if result.returncode == 0:
        tfjs_files = os.listdir(TFJS_DIR)
        print(f"   Berhasil! File TF.js: {tfjs_files}")
        print("   -> Upload folder tfjs_model ke lentera-app/public/ untuk client-side inference")
    else:
        print(f"   TF.js converter gagal: {result.stderr}")
except Exception as e:
    print(f"   TF.js export error: {e}")
    print("   -> Pakai metode alternatif: pip install tensorflowjs && jalankan ulang")

# --- Ekspor ke ONNX (untuk backend inference dengan onnxruntime) ---
ONNX_PATH = os.path.join(MODEL_DIR, "lentera_mobilenetv2_final.onnx")
print(f"\n   [2/2] Mengekspor ke ONNX -> {ONNX_PATH}")
try:
    import tf2onnx
    spec = (tf.TensorSpec((None, 224, 224, 3), tf.float32, name="input"),)
    model_proto, _ = tf2onnx.convert.from_keras(
        model, input_signature=spec, opset=13, output_path=ONNX_PATH)
    onnx_size_mb = os.path.getsize(ONNX_PATH) / (1024 * 1024)
    print(f"   Berhasil! Ukuran model ONNX: {onnx_size_mb:.2f} MB")
    print(f"   -> Copy file .onnx ke backend LENTERA untuk inference via onnxruntime")
except Exception as e:
    print(f"   ONNX export error: {e}")

# ======================================================================================
# CELL 11: INFERENCE TEST (DEMO SINGLE IMAGE)
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] Demo Inference - Single Image Prediction")
print("=" * 80)

def predict_single_image(img_path, model, class_mapping, top_k=3):
    """Fungsi inferensi satu gambar."""
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    img = tf.keras.preprocessing.image.load_img(img_path, target_size=IMG_SIZE)
    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_batch = np.expand_dims(img_array, axis=0)
    img_preprocessed = preprocess_input(img_batch)
    probs = model.predict(img_preprocessed, verbose=0)[0]
    top_indices = np.argsort(probs)[::-1][:top_k]
    results = []
    for idx in top_indices:
        results.append({
            "class": class_mapping[idx],
            "confidence": float(probs[idx]),
            "confidence_pct": f"{probs[idx]*100:.2f}%"
        })
    return results, img

# Cari sample gambar dari test set
sample_test_images = []
for cls in class_names:
    cls_dir = os.path.join(TEST_DIR, cls)
    if os.path.exists(cls_dir):
        files = [f for f in os.listdir(cls_dir)
                 if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        if files:
            sample_test_images.append(os.path.join(cls_dir, files[0]))

def plot_inference_demo(sample_paths, max_samples=8):
    n = min(max_samples, len(sample_paths))
    fig, axes = plt.subplots(2, (n + 1) // 2, figsize=(16, 9))
    axes = axes.flatten()
    for i in range(n):
        results, img = predict_single_image(sample_paths[i], model, class_mapping)
        true_cls = sample_paths[i].split(os.sep)[-2]
        pred_cls = results[0]['class']
        pred_conf = results[0]['confidence_pct']
        color = 'green' if pred_cls == true_cls else 'red'
        ax = axes[i]
        ax.imshow(img)
        title = f"True: {true_cls}\nPred: {pred_cls} ({pred_conf})"
        ax.set_title(title, fontsize=10, color='white',
                     bbox=dict(facecolor=color, alpha=0.8))
        # Tambahkan top-3 di subtitle
        sub = " | ".join([f"{r['class'][:8]}:{r['confidence_pct']}" for r in results[:3]])
        ax.set_xlabel(sub, fontsize=7)
        ax.set_xticks([]); ax.set_yticks([])
    for j in range(n, len(axes)):
        axes[j].set_visible(False)
    plt.suptitle("[LENTERA AI] Demo Inference - Top-3 Predictions (MobileNetV2)",
                 fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, "inference_demo.png"), dpi=120)
    plt.show()
    plt.close()

if sample_test_images:
    plot_inference_demo(sample_test_images)

# ======================================================================================
# CELL 12: RINGKASAN HASIL & DOWNLOAD
# ======================================================================================
print("\n" + "=" * 80)
print(" [LENTERA AI] PELATIHAN SELESAI - RINGKASAN HASIL")
print("=" * 80)

output_files = sorted(glob(os.path.join(MODEL_DIR, "*")))
print("\n   Output file yang dihasilkan:")
total_size = 0
for f in output_files:
    fsize = os.path.getsize(f) / (1024 * 1024)
    total_size += fsize
    print(f"     - {os.path.basename(f):40s} ({fsize:7.2f} MB)")
print(f"\n   Total ukuran keseluruhan: {total_size:.2f} MB")

print("\n   File-file PENTING untuk integrasi dengan LENTERA:")
print("   1. lentera_mobilenetv2_final.h5/.keras -> Model TensorFlow Keras (backup)")
print("   2. tfjs_model/                         -> Untuk inference di Frontend (Browser)")
print("   3. lentera_mobilenetv2_final.onnx      -> Untuk inference di Backend (onnxruntime)")
print("   4. class_mapping.json                  -> Label kelas + metadata")
print("   5. confusion_matrix_test.png           -> Laporan evaluasi")
print("   6. training_curves.png                 -> Grafik history training")

# --- Zip semua output untuk di-download ---
ZIP_PATH = "/content/LENTERA_MobileNetV2_Output.zip"
print(f"\n   Mengkompres semua output ke: {ZIP_PATH}")
with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(MODEL_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            arc_name = os.path.relpath(full_path, MODEL_DIR)
            zipf.write(full_path, arc_name)

zip_size = os.path.getsize(ZIP_PATH) / (1024 * 1024)
print(f"   Selesai! Ukuran ZIP: {zip_size:.2f} MB")

print("\n" + "=" * 80)
print("  LANJUTKAN KE BACKEND INTEGRASI:")
print("  - Upload .onnx & class_mapping.json ke folder backend/models/")
print("  - Upload folder tfjs_model/ ke lentera-app/public/ai_models/")
print("  - Jalankan pip install onnxruntime di backend untuk inference")
print("=" * 80)
