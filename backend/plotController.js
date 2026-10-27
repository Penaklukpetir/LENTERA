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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export { loadAIModels, getAIStatus };

export const getPlots = async (req, res) => {
  try {
    const queryResult = await pool.query(
      'SELECT id, farmer_name, ST_Y(geom) AS lat, ST_X(geom) AS lng, coffee_type, tree_count, elevation, land_area, predicted_yield, status, description, created_by, created_at FROM coffee_plots ORDER BY id ASC'
    );
    return res.status(200).json(queryResult.rows);
  } catch (err) {
    console.error('Fetch spatial plots query exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching coffee plots.' });
  }
};

export const createPlot = async (req, res) => {
  const { farmer_name, lat, lng, coffee_type, tree_count, elevation, land_area, description } = req.body;

  if (!farmer_name || lat === undefined || lng === undefined || !coffee_type || tree_count === undefined || elevation === undefined || land_area === undefined) {
    return res.status(400).json({ error: 'Missing parameters. All plot details, including land area, are required.' });
  }

  if (!['Robusta', 'Arabica', 'Liberica', 'Excelsa'].includes(coffee_type)) {
    return res.status(400).json({ error: 'Invalid coffee type variety selection.' });
  }

  try {
    const creatorId = req.user ? req.user.id : null;
    const calculatedYield = Math.max(0, -245.50 + (0.12 * parseFloat(land_area)) + (1.85 * parseInt(tree_count)) - (0.08 * parseInt(elevation)));

    const queryResult = await pool.query(
      'INSERT INTO coffee_plots (farmer_name, geom, coffee_type, tree_count, elevation, land_area, predicted_yield, status, description, created_by) VALUES ($1, ST_SetSRID(ST_Point($2, $3), 4326), $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, farmer_name, ST_Y(geom) AS lat, ST_X(geom) AS lng, coffee_type, tree_count, elevation, land_area, predicted_yield, status, description, created_by, created_at',
      [farmer_name, lng, lat, coffee_type, tree_count, elevation, land_area, calculatedYield.toFixed(2), 'Sehat', description, creatorId]
    );

    return res.status(201).json({
      message: 'Plot registered successfully.',
      plot: queryResult.rows[0]
    });

  } catch (err) {
    console.error('Insert spatial plot coordinate database exception:', err);
    return res.status(500).json({ error: 'Internal server error while registering coffee plot.' });
  }
};

export const scanPlotLeaf = async (req, res) => {
  const { id } = req.params;

  try {
    const plotCheck = await pool.query('SELECT id, farmer_name FROM coffee_plots WHERE id = $1', [id]);
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
    const plotCheck = await pool.query('SELECT id FROM coffee_plots WHERE id = $1', [id]);
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
    const plotCheck = await pool.query('SELECT id FROM coffee_plots WHERE id = $1', [id]);
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
  const { farmer_name, coffee_type, tree_count, elevation, land_area, description } = req.body;

  try {
    const area = parseFloat(land_area) || 0;
    const trees = parseInt(tree_count) || 0;
    const elev = parseInt(elevation) || 0;
    // Official MLR Yield Formula: Y = -245.50 + 0.12*X1 + 1.85*X2 - 0.08*X3
    const calculatedYield = Math.max(0, -245.50 + (0.12 * area) + (1.85 * trees) - (0.08 * elev));

    const result = await pool.query(
      `UPDATE coffee_plots 
       SET farmer_name = $1, coffee_type = $2, tree_count = $3, elevation = $4, land_area = $5, predicted_yield = $6, description = $7, updated_at = NOW() 
       WHERE id = $8 
       RETURNING id, farmer_name, ST_Y(geom) AS lat, ST_X(geom) AS lng, coffee_type, tree_count, elevation, land_area, predicted_yield, status, description, created_by, created_at`,
      [farmer_name, coffee_type, trees, elev, area, calculatedYield.toFixed(2), description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plot tidak ditemukan.' });
    }

    return res.status(200).json({
      message: 'Plot lahan dan prediksi hasil panen MLR berhasil diperbarui.',
      plot: result.rows[0]
    });
  } catch (err) {
    console.error('Update plot error:', err);
    return res.status(500).json({ error: 'Internal server error while updating plot.' });
  }
};

export const deletePlot = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM coffee_plots WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plot tidak ditemukan.' });
    }
    return res.status(200).json({ message: 'Plot lahan berhasil dihapus.' });
  } catch (err) {
    console.error('Delete plot error:', err);
    return res.status(500).json({ error: 'Internal server error while deleting plot.' });
  }
};

