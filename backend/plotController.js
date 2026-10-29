import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadAIModels,
  getAIStatus,
  runYOLOv8Inference,
  runMobileNetV2Inference,
  scanLeafDiseaseEnsemble,
} from './inferenceService.js';
import {
  calculateYield,
  calibratePrediction,
  VALID_COFFEE_TYPES,
  MLR_MODEL_VERSION,
  PREDICTION_RANGE,
} from './mlrService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export { loadAIModels, getAIStatus };

const CURRENT_YEAR = () => new Date().getFullYear();

// Empty input means "tahun tanam belum diketahui", so it is stored as NULL.
const parsePlantingYear = (value) => {
  if (value === undefined || value === null || value === '') {
    return { year: null };
  }
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > CURRENT_YEAR()) {
    return { error: `Tahun tanam harus berupa tahun antara 1900 dan ${CURRENT_YEAR()}.` };
  }
  return { year };
};

const loadHarvestSeasons = async (plotId = null) => {
  const result = await pool.query(
    `SELECT plot_id, EXTRACT(YEAR FROM harvest_date)::int AS season, SUM(weight_kg)::float8 AS harvested_kg
     FROM harvest_batches
     WHERE deleted_at IS NULL AND harvest_date IS NOT NULL
       AND ($1::int IS NULL OR plot_id = $1)
     GROUP BY plot_id, EXTRACT(YEAR FROM harvest_date)
     ORDER BY plot_id, season ASC`,
    [plotId]
  );
  const seasonsByPlot = new Map();
  result.rows.forEach((row) => {
    if (!seasonsByPlot.has(row.plot_id)) seasonsByPlot.set(row.plot_id, []);
    seasonsByPlot.get(row.plot_id).push({ season: row.season, harvested_kg: Number(row.harvested_kg) });
  });
  return seasonsByPlot;
};

const withCalibration = (plot, seasons) => {
  const baseline = Number(plot.predicted_yield) || 0;
  const { ratio, seasons: usedSeasons, calibrated_kg } = calibratePrediction(baseline, seasons);
  return {
    ...plot,
    calibrated_yield: calibrated_kg,
    calibration_ratio: Math.round(ratio * 100) / 100,
    calibration_seasons: usedSeasons,
    range_low: Math.round(calibrated_kg * PREDICTION_RANGE.low),
    range_high: Math.round(calibrated_kg * PREDICTION_RANGE.high),
  };
};

export const getPlots = async (req, res) => {
  try {
    const [queryResult, seasonsByPlot] = await Promise.all([
      pool.query(
        `SELECT id, farmer_name, (geom)[1] AS lat, (geom)[0] AS lng, coffee_type, tree_count,
                elevation, land_area, planting_year, predicted_yield, status, description, created_by, created_at
         FROM coffee_plots WHERE deleted_at IS NULL ORDER BY id ASC`
      ),
      loadHarvestSeasons(),
    ]);
    return res.status(200).json(
      queryResult.rows.map((plot) => withCalibration(plot, seasonsByPlot.get(plot.id) || []))
    );
  } catch (err) {
    console.error('Fetch spatial plots query exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching coffee plots.' });
  }
};

export const createPlot = async (req, res) => {
  const { farmer_name, lat, lng, coffee_type, tree_count, elevation, land_area, planting_year, description } = req.body;

  if (!farmer_name || lat === undefined || lng === undefined || !coffee_type || tree_count === undefined || elevation === undefined || land_area === undefined) {
    return res.status(400).json({ error: 'Missing parameters. All plot details, including land area, are required.' });
  }

  if (!VALID_COFFEE_TYPES.includes(coffee_type)) {
    return res.status(400).json({ error: 'Invalid coffee type variety selection.' });
  }

  const planting = parsePlantingYear(planting_year);
  if (planting.error) {
    return res.status(400).json({ error: planting.error });
  }

  let mlr;
  try {
    mlr = calculateYield({ land_area, tree_count, elevation, coffee_type });
  } catch (validationError) {
    return res.status(400).json({ error: validationError.message });
  }

  try {
    const creatorId = req.user ? req.user.id : null;
    const queryResult = await pool.query(
      `INSERT INTO coffee_plots
         (farmer_name, geom, coffee_type, tree_count, elevation, land_area, planting_year, predicted_yield, status, description, created_by)
       VALUES ($1, ST_SetSRID(ST_Point($2, $3), 4326), $4, $5, $6, $7, $8, $9, 'Sehat', $10, $11)
       RETURNING id, farmer_name, (geom)[1] AS lat, (geom)[0] AS lng, coffee_type, tree_count,
                 elevation, land_area, planting_year, predicted_yield, status, description, created_by, created_at`,
      [farmer_name, lng, lat, coffee_type, mlr.inputs.tree_count, mlr.inputs.elevation,
        mlr.inputs.land_area, planting.year, mlr.predicted_yield, description, creatorId]
    );

    const plot = queryResult.rows[0];
    const history = await pool.query(
      `INSERT INTO mlr_yield_predictions
         (plot_id, land_area_input, elevation_input, tree_count_input, mlr_formula_version, predicted_kg, calculated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [plot.id, mlr.inputs.land_area, mlr.inputs.elevation, mlr.inputs.tree_count,
        mlr.model_version, mlr.predicted_yield, creatorId]
    );

    return res.status(201).json({
      message: 'Plot registered successfully.',
      plot: withCalibration(plot, []),
      mlr_prediction: history.rows[0],
    });
  } catch (err) {
    console.error('Insert spatial plot coordinate database exception:', err);
    return res.status(500).json({ error: 'Internal server error while registering coffee plot.' });
  }
};

export const scanPlotLeaf = async (req, res) => {
  const { id } = req.params;

  try {
    const plotCheck = await pool.query('SELECT id, farmer_name FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (plotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Coffee plot location not found.' });
    }

    const filename = req.file ? req.file.filename : 'mock_leaf_scan.jpg';
    const filePath = req.file ? path.join(UPLOAD_DIR, req.file.filename) : null;

    let scanResult;
    if (filePath && fs.existsSync(filePath)) {
      scanResult = await scanLeafDiseaseEnsemble(filePath);
    } else {
      scanResult = await scanLeafDiseaseEnsemble(filename);
    }

    const isRustFound = scanResult.rust_found;
    const confidenceScore = scanResult.confidence;

    if (isRustFound) {
      await pool.query("UPDATE coffee_plots SET status = 'Waspada', updated_at = NOW() WHERE id = $1", [id]);
      await pool.query(
        "INSERT INTO disease_detections (plot_id, image_url, confidence_score) VALUES ($1, $2, $3)",
        [id, filename, confidenceScore]
      );
    }

    return res.status(200).json({
      rust_found: isRustFound,
      confidence: confidenceScore,
      mode: scanResult.yolo_detection?.mode || scanResult.mobilenet_classification?.mode || 'UNKNOWN',
      ensemble_votes: scanResult.ensemble_votes,
      detected_class: scanResult.detected_class,
      message: scanResult.message,
      mobilenet_predictions: scanResult.mobilenet_classification?.predictions || [],
      boxes: (scanResult.boxes || []).map(b => ({
        xmin: b.x1,
        ymin: b.y1,
        xmax: b.x2,
        ymax: b.y2,
        label: b.class_name,
        confidence: b.confidence,
      })),
    });

  } catch (err) {
    console.error('Scan AI processor database exception:', err);
    return res.status(500).json({ error: 'Internal server error during Leaf scan inference: ' + err.message });
  }
};

export const getDiseaseDetectionsForPlot = async (req, res) => {
  const { id } = req.params;
  try {
    const plotCheck = await pool.query('SELECT id FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (plotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Plot not found.' });
    }
    const result = await pool.query(
      'SELECT id, image_url, confidence_score, detected_at FROM disease_detections WHERE plot_id = $1 ORDER BY detected_at DESC LIMIT 20',
      [id]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Detections query error:', err);
    return res.status(500).json({ error: 'Internal error fetching detection history.' });
  }
};

export const resolvePlotLeaf = async (req, res) => {
  const { id } = req.params;

  try {
    const plotCheck = await pool.query('SELECT id FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (plotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Coffee plot location not found.' });
    }

    await pool.query("UPDATE coffee_plots SET status = 'Sehat', updated_at = NOW() WHERE id = $1", [id]);
    return res.status(200).json({ message: 'Status lahan berhasil diubah kembali menjadi Sehat.' });

  } catch (err) {
    console.error('Resolve status database exception:', err);
    return res.status(500).json({ error: 'Internal server error while resolving plot status.' });
  }
};

export const updatePlot = async (req, res) => {
  const { id } = req.params;
  const { farmer_name, coffee_type, tree_count, elevation, land_area, planting_year, description } = req.body;

  if (!farmer_name || !coffee_type) {
    return res.status(400).json({ error: 'Nama petani dan varietas kopi wajib diisi.' });
  }
  if (!VALID_COFFEE_TYPES.includes(coffee_type)) {
    return res.status(400).json({ error: 'Invalid coffee type variety selection.' });
  }

  const hasPlantingYear = Object.prototype.hasOwnProperty.call(req.body, 'planting_year');
  const planting = parsePlantingYear(planting_year);
  if (planting.error) {
    return res.status(400).json({ error: planting.error });
  }

  let mlr;
  try {
    mlr = calculateYield({ land_area, tree_count, elevation, coffee_type });
  } catch (validationError) {
    return res.status(400).json({ error: validationError.message });
  }

  try {
    const result = await pool.query(
      `UPDATE coffee_plots
       SET farmer_name = $1, coffee_type = $2, tree_count = $3, elevation = $4, land_area = $5,
           predicted_yield = $6, description = $7,
           planting_year = CASE WHEN $8::boolean THEN $9::smallint ELSE planting_year END,
           updated_at = NOW()
       WHERE id = $10 AND deleted_at IS NULL
       RETURNING id, farmer_name, (geom)[1] AS lat, (geom)[0] AS lng, coffee_type, tree_count,
                 elevation, land_area, planting_year, predicted_yield, status, description, created_by, created_at`,
      [farmer_name, coffee_type, mlr.inputs.tree_count, mlr.inputs.elevation, mlr.inputs.land_area,
        mlr.predicted_yield, description, hasPlantingYear, planting.year, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plot tidak ditemukan.' });
    }

    const history = await pool.query(
      `INSERT INTO mlr_yield_predictions
         (plot_id, land_area_input, elevation_input, tree_count_input, mlr_formula_version, predicted_kg, calculated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, mlr.inputs.land_area, mlr.inputs.elevation, mlr.inputs.tree_count,
        mlr.model_version, mlr.predicted_yield, req.user ? req.user.id : null]
    );

    const seasons = (await loadHarvestSeasons(id)).get(Number(id)) || [];

    return res.status(200).json({
      message: 'Plot lahan dan prediksi hasil panen MLR berhasil diperbarui.',
      plot: withCalibration(result.rows[0], seasons),
      mlr_prediction: history.rows[0],
    });
  } catch (err) {
    console.error('Update plot error:', err);
    return res.status(500).json({ error: 'Internal server error while updating plot.' });
  }
};

export const getMlrHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const plot = await pool.query(
      'SELECT id FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (plot.rows.length === 0) {
      return res.status(404).json({ error: 'Plot tidak ditemukan.' });
    }

    const result = await pool.query(
      `SELECT m.id, m.plot_id, m.land_area_input, m.elevation_input, m.tree_count_input,
              m.mlr_formula_version, m.predicted_kg, m.calculated_at, u.full_name AS calculated_by_name
       FROM mlr_yield_predictions m
       LEFT JOIN users u ON m.calculated_by = u.id
       WHERE m.plot_id = $1
       ORDER BY m.calculated_at DESC, m.id DESC
       LIMIT 20`,
      [id]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('MLR history query error:', err);
    return res.status(500).json({ error: 'Gagal mengambil riwayat prediksi MLR.' });
  }
};

const ACCURACY_TOLERANCE_PCT = 25;

const round1 = (value) => Math.round(value * 10) / 10;

// Akurasi dinilai pada musim panen terakhir tiap lahan. Prediksi untuk musim itu
// hanya boleh memakai musim-musim sebelumnya, sehingga kalibrasi tidak menilai
// dirinya sendiri. Lahan tanpa batch panen tidak dihitung.
export const getPredictionAccuracy = async (req, res) => {
  try {
    const [plotRows, totals, seasonsByPlot] = await Promise.all([
      pool.query(
        `SELECT id, farmer_name, coffee_type, planting_year, predicted_yield::float8 AS baseline_kg
         FROM coffee_plots
         WHERE deleted_at IS NULL AND COALESCE(predicted_yield, 0) > 0
         ORDER BY id ASC`
      ),
      pool.query('SELECT COUNT(*)::int AS total_plots FROM coffee_plots WHERE deleted_at IS NULL'),
      loadHarvestSeasons(),
    ]);

    const rows = plotRows.rows.flatMap((row) => {
      const seasons = seasonsByPlot.get(row.id) || [];
      const latest = seasons[seasons.length - 1];
      if (!latest || latest.harvested_kg <= 0) return [];

      const baseline = Number(row.baseline_kg);
      const { ratio, seasons: usedSeasons, calibrated_kg } = calibratePrediction(baseline, seasons, latest.season);
      const harvested = latest.harvested_kg;

      return [{
        plot_id: row.id,
        farmer_name: row.farmer_name,
        coffee_type: row.coffee_type,
        planting_year: row.planting_year,
        season: latest.season,
        baseline_kg: baseline,
        predicted_kg: calibrated_kg,
        harvested_kg: harvested,
        calibration_seasons: usedSeasons,
        calibration_ratio: Math.round(ratio * 100) / 100,
        error_pct: (Math.abs(harvested - calibrated_kg) / harvested) * 100,
      }];
    });

    const measured = rows.length;
    const totalPredicted = rows.reduce((sum, row) => sum + row.predicted_kg, 0);
    const totalHarvested = rows.reduce((sum, row) => sum + row.harvested_kg, 0);
    const mae = measured > 0
      ? rows.reduce((sum, row) => sum + Math.abs(row.harvested_kg - row.predicted_kg), 0) / measured
      : null;

    const sortedApe = rows.map((row) => row.error_pct).sort((a, b) => a - b);
    let medianApe = null;
    if (measured > 0) {
      const mid = Math.floor(measured / 2);
      medianApe = measured % 2 === 0 ? (sortedApe[mid - 1] + sortedApe[mid]) / 2 : sortedApe[mid];
    }

    const mape = measured > 0
      ? rows.reduce((sum, row) => sum + row.error_pct, 0) / measured
      : null;
    const withinTolerance = measured > 0
      ? (rows.filter((row) => row.error_pct <= ACCURACY_TOLERANCE_PCT).length / measured) * 100
      : null;

    return res.status(200).json({
      formula_version: MLR_MODEL_VERSION,
      tolerance_pct: ACCURACY_TOLERANCE_PCT,
      total_plots: totals.rows[0]?.total_plots || 0,
      measured_plots: measured,
      calibrated_plots: rows.filter((row) => row.calibration_seasons > 0).length,
      median_ape_pct: medianApe === null ? null : round1(medianApe),
      mape_pct: mape === null ? null : round1(mape),
      within_tolerance_pct: withinTolerance === null ? null : round1(withinTolerance),
      mae_kg: mae === null ? null : Math.round(mae),
      total_predicted_kg: Math.round(totalPredicted),
      total_harvested_kg: Math.round(totalHarvested),
      plots: rows.map(({ error_pct, ...rest }) => ({ ...rest, error_pct: round1(error_pct) })),
    });
  } catch (err) {
    console.error('Prediction accuracy query error:', err);
    return res.status(500).json({ error: 'Gagal menghitung akurasi prediksi.' });
  }
};

// Panen riil per lahan. Tabel harvest_batches dipakai ulang agar KPI dashboard
// dan panel akurasi tetap membaca satu sumber data yang sama.
export const getPlotHarvests = async (req, res) => {
  const { id } = req.params;
  try {
    const plot = await pool.query(
      'SELECT id, farmer_name, coffee_type, predicted_yield FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (plot.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan.' });
    }

    const result = await pool.query(
      `SELECT id, batch_code, plot_id, weight_kg::float8 AS weight_kg, harvest_date, created_at
       FROM harvest_batches
       WHERE plot_id = $1 AND deleted_at IS NULL
       ORDER BY harvest_date DESC, id DESC
       LIMIT 100`,
      [id]
    );

    const totalKg = result.rows.reduce((sum, row) => sum + Number(row.weight_kg || 0), 0);

    // Profil musim dipakai kartu panen: membandingkan panen musim terakhir
    // dengan prediksi musim itu (dikalibrasi hanya dari musim sebelumnya).
    const seasons = (await loadHarvestSeasons(Number(id))).get(Number(id)) || [];
    const latest = seasons[seasons.length - 1] || null;
    const baseline = Number(plot.rows[0].predicted_yield) || 0;
    const seasonCalibration = latest
      ? calibratePrediction(baseline, seasons, latest.season)
      : calibratePrediction(baseline, seasons);

    return res.status(200).json({
      status: 'SUCCESS',
      data: result.rows,
      total_kg: Math.round(totalKg * 100) / 100,
      baseline_kg: baseline,
      seasons,
      latest_season: latest ? latest.season : null,
      latest_kg: latest ? latest.harvested_kg : 0,
      season_predicted_kg: seasonCalibration.calibrated_kg,
      calibration_seasons: seasonCalibration.seasons,
      calibration_ratio: Math.round(seasonCalibration.ratio * 100) / 100,
    });
  } catch (err) {
    console.error('Fetch plot harvests error:', err);
    return res.status(500).json({ error: 'Gagal mengambil catatan panen lahan.' });
  }
};

export const createPlotHarvest = async (req, res) => {
  const { id } = req.params;
  const { weight_kg, harvest_date } = req.body;

  const weight = Number(weight_kg);
  if (!Number.isFinite(weight) || weight <= 0) {
    return res.status(400).json({ error: 'Berat panen harus lebih besar dari nol.' });
  }

  let harvestDate = null;
  if (harvest_date !== undefined && harvest_date !== null && harvest_date !== '') {
    const parsed = new Date(harvest_date);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ error: 'Tanggal panen tidak valid.' });
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsed > today) {
      return res.status(400).json({ error: 'Tanggal panen tidak boleh melebihi hari ini.' });
    }
    harvestDate = parsed.toISOString().slice(0, 10);
  }

  try {
    const plot = await pool.query(
      'SELECT id FROM coffee_plots WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (plot.rows.length === 0) {
      return res.status(404).json({ error: 'Lahan tidak ditemukan.' });
    }

    const seq = await pool.query("SELECT nextval('harvest_batch_code_seq') AS seq");
    const batchCode = `KCR-${new Date().getFullYear()}-${String(seq.rows[0].seq).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO harvest_batches
         (batch_code, plot_id, weight_kg, harvest_date, process_method, status, grade, drying_days)
       VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), 'Natural Process', 'Terjual', NULL, NULL)
       RETURNING id, batch_code, plot_id, weight_kg::float8 AS weight_kg, harvest_date, created_at`,
      [batchCode, id, weight, harvestDate]
    );

    return res.status(201).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    console.error('Create plot harvest error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan catatan panen.' });
  }
};

export const deletePlot = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE coffee_plots SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plot tidak ditemukan.' });
    }
    return res.status(200).json({ message: 'Plot lahan berhasil dihapus (soft delete).' });
  } catch (err) {
    console.error('Delete plot error:', err);
    return res.status(500).json({ error: 'Internal server error while deleting plot.' });
  }
};

