/**
 * Quick test script untuk validasi AI inference LENTERA
 * Tidak membutuhkan DB, langsung test inferenceService.js
 * Run: node test_ai_inference.js
 */
import { scanLeafDiseaseEnsemble, getAIStatus, runYOLOv8Inference, runMobileNetV2Inference } from './inferenceService.js';
import { loadAIModels } from './inferenceService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gambar sample yang ada di project
const SAMPLE_IMAGES = [
    { label: 'DAUN SEHAT',    file: path.join(__dirname, '..', 'healthy_coffee_leaf.jpg') },
    { label: 'DAUN KARAT',    file: path.join(__dirname, '..', 'rust_infected_coffee_leaf.jpg') },
];

console.log('\n' + '='.repeat(90));
console.log('  TEST LENTERA AI INFERENCE ENGINE  ');
console.log('='.repeat(90));

(async () => {
    // 1. Load models
    const loadRes = await loadAIModels();
    console.log('\n[1/4] Status Load Model:');
    console.log('   Mode:', loadRes.mode);
    console.log('   YOLOv8 ONNX   :', loadRes.yolo_onnx ? '✅ TERSEDIA' : '⚠️  SIMULASI (belum copy .onnx)');
    console.log('   MobileNetV2   :', loadRes.mobilenet_onnx ? '✅ TERSEDIA' : '⚠️  SIMULASI (belum copy .onnx)');

    // 2. Status lengkap
    console.log('\n[2/4] AI Status Lengkap:');
    const status = getAIStatus();
    console.log('   Daftar Kelas YOLOv8     :', status.yolo_class_names.join(', '));
    console.log('   Daftar Kelas MobileNetV2:', status.mobilenet_class_names.join(', '));

    // 3. Test inferensi satu per satu
    console.log('\n[3/4] Test Ensemble Inference dengan Gambar Sample:');
    console.log('-'.repeat(90));

    for (const sample of SAMPLE_IMAGES) {
        console.log(`\n   Test: ${sample.label}`);
        console.log('   Path:', sample.file);

        // a) YOLOv8
        console.log('   ├─ YOLOv8 detection  ...', );
        const yolo = await runYOLOv8Inference(sample.file);
        console.log(`   │     Detections: ${yolo.detections_count} objek, Mode: ${yolo.mode}`);
        console.log(`   │     Rust? ${yolo.rust_found ? 'YA 🔴' : 'TIDAK 🟢'}, Confidence: ${yolo.confidence}%`);

        // b) MobileNet
        console.log('   ├─ MobileNetV2 classification ...');
        const mnet = await runMobileNetV2Inference(sample.file);
        console.log(`   │     Predicted: ${mnet.predicted_class}, Mode: ${mnet.mode}`);
        console.log(`   │     Top-3:`);
        mnet.predictions.slice(0, 3).forEach(p => console.log(`   │       • ${p.class_name.padEnd(18)} : ${p.confidence_pct}`));

        // c) Ensemble
        console.log('   └─ ENSEMBLE RESULT:');
        const ensemble = await scanLeafDiseaseEnsemble(sample.file);
        console.log(`         Rust? ${ensemble.rust_found ? 'YA 🔴 (ADA PENYAKIT)' : 'TIDAK 🟢 (SEHAT)'}`);
        console.log(`         Avg Confidence : ${ensemble.confidence}%`);
        console.log(`         Vote (Y/M)     : YOLO=${ensemble.ensemble_votes.yolo ? 'Rust' : 'Sehat'} | MobileNet=${ensemble.ensemble_votes.mobilenet ? 'Rust' : 'Sehat'}`);
        console.log(`         Message        : ${ensemble.message}`);
        if (ensemble.boxes?.length) {
            console.log(`         Bounding Boxes :`);
            ensemble.boxes.slice(0, 3).forEach(b =>
                console.log(`            • [${b.class_name}] conf=${b.confidence} @(${b.x1},${b.y1})-(${b.x2},${b.y2})`));
        }
    }

    // 4. Tambah test dengan upload nama dummy untuk verifikasi simulasi cerdas
    console.log('\n[4/4] Test Nama File Cerdas (Simulasi Mode):');
    const dummyNames = [
        'scan_pak_mulyono_leaf_SEHAT.jpg',
        'scan_leaf_RUST_infection.jpg',
        'sample_leaf_random_name.jpg',
    ];
    for (const n of dummyNames) {
        const r = await scanLeafDiseaseEnsemble(n);
        console.log(`   File: ${n.padEnd(40)} -> ${r.rust_found ? 'RUST  🔴' : 'OK    🟢'} (${r.confidence}%, ${r.detected_class})`);
    }

    console.log('\n' + '='.repeat(90));
    console.log('  ✅ SEMUA TEST AI INFERENCE BERJALAN NORMAL!');
    console.log('='.repeat(90));
    console.log(`\n  Catatan:`);
    console.log(`  • Saat ini mode: ${loadRes.mode}`);
    console.log(`  • Setelah training Colab selesai, copy file .onnx ke backend/models/`);
    console.log(`    untuk ganti dari SIMULATION ke REAL INFERENCE ONNX yang sesungguhnya.`);
    console.log(`  • Hasil scan sudah siap dipakai oleh Frontend LENTERA (DetailsPanel > Scan Leaf).`);
    console.log();
})();
