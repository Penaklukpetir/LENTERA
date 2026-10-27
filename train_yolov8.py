# train_yolov8.py
# Naskah Python untuk melatih model YOLOv8n (Nano) dalam mendeteksi Penyakit Karat Daun Kopi (Hemileia vastatrix)
# Naskah ini siap dijalankan di Google Colab (disarankan menggunakan runtime T4 GPU)

import os
try:
    from ultralytics import YOLO
except ImportError:
    print("Menginstal pustaka Ultralytics YOLO...")
    os.system("pip install ultralytics")
    from ultralytics import YOLO

def main():
    print("==================================================================")
    print("Mempersiapkan Pipeline Pelatihan YOLOv8n - Karat Daun Kopi")
    print("==================================================================")

    # 1. Inisialisasi Model YOLOv8n (Nano)
    # Kami memuat pre-trained model .pt untuk melakukan Transfer Learning agar konvergensi lebih cepat
    print("\n[INFO] Memuat pre-trained weights YOLOv8n...")
    model = YOLO('yolov8n.pt') 

    # 2. Memulai Proses Pelatihan (Training)
    # Pastikan Anda telah mengunduh dataset dalam format YOLO v8 dari Roboflow/Kaggle
    # Ubah nilai parameter 'data' ke lokasi path berkas 'data.yaml' hasil ekstraksi dataset Anda
    print("\n[INFO] Memulai training model...")
    results = model.train(
        data='dataset/data.yaml',    # Path ke berkas konfigurasi yaml dataset Anda
        epochs=100,                  # Rekomendasi epoch untuk konvergensi awal
        imgsz=640,                   # Resolusi gambar input standar YOLOv8
        batch=16,                    # Ukuran batch (sesuaikan dengan VRAM GPU Colab T4)
        device=0,                    # Menggunakan GPU pertama (Cuda device 0)
        workers=4,                   # Jumlah thread pemuat data
        name='coffee_rust_yolov8n',  # Nama direktori penyimpanan output training
        save=True,                   # Simpan berkas checkpoint dan best weights (.pt)
        plots=True                   # Hasilkan visualisasi grafik performa (loss, mAP)
    )

    print("\n==================================================================")
    print("Proses Pelatihan Selesai!")
    print("==================================================================")

    # 3. Evaluasi Performa Model pada Validation Set
    print("\n[INFO] Mengevaluasi performa model di data validasi...")
    metrics = model.val()
    print(f"Hasil Evaluasi - Mean Average Precision (mAP) 50-95: {metrics.box.map:.4f}")

    # 4. Ekspor Model ke Format ONNX & TensorFlow.js untuk integrasi web/mobile
    # Format ONNX mempermudah porting ke server backend Node.js
    # Format TF.js sangat cocok untuk client-side browser inference di masa depan
    print("\n[INFO] Mengekspor model terbaik (best.pt) ke format web...")
    onnx_path = model.export(format='onnx')
    print(f"Model berhasil diekspor ke ONNX: {onnx_path}")
    
    try:
        tfjs_path = model.export(format='tfjs')
        print(f"Model berhasil diekspor ke TensorFlow.js: {tfjs_path}")
    except Exception as e:
        print("[PERINGATAN] Ekspor ke TF.js membutuhkan paket tensorflowjs tambahan (pip install tensorflowjs).")

if __name__ == '__main__':
    main()
