import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { registerUser, loginUser, changePassword } from './authController.js';
import {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  scanPlotLeaf,
  resolvePlotLeaf,
  getDiseaseDetectionsForPlot,
  getMlrHistory,
  loadAIModels,
  getAIStatus,
} from './plotController.js';
import {
  getSponsorships,
  createSponsorship,
  curateSponsorship,
  approveSponsorship,
  rejectSponsorship,
  rejectCuratedSponsorship,
  disburseSponsorship,
} from './sponsorController.js';
import { getEResources, createEResource, updateEResource, deleteEResource } from './eresourceController.js';
import { getEducationModules, createEducationModule, deleteEducationModule } from './educationController.js';
import { getAdminUsers, createAdminUser, deleteAdminUser } from './userController.js';
import { getReviews, createReview, toggleApproveReview, deleteReview } from './reviewController.js';
import { getScmBatches, createScmBatch, getTraceability, getOfftakers, createOfftaker, getForecast } from './scmController.js';
import { getDestinations, createDestination, updateDestination, deleteDestination } from './destinationController.js';
import { getTourGuides, createGuideBooking, getGuideBookings, updateGuideBookingStatus } from './guideController.js';
import { createSosAlert, getSosAlerts, updateSosStatus } from './sosController.js';
import { getDashboardSummary } from './dashboardController.js';
import { createFarmer, deleteFarmer, getFarmersList, updateFarmer } from './farmerController.js';
import { authenticateToken, optionalAuth, requireRole } from './authMiddleware.js';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const proposalUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('PROPOSAL_FORMAT_INVALID'));
    }
    cb(null, true);
  },
});

const handleProposalUpload = (req, res, next) => {
  proposalUpload.single('proposal')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Ukuran berkas proposal melebihi batas 5 MB.' });
    }
    if (err.message === 'PROPOSAL_FORMAT_INVALID') {
      return res.status(400).json({ error: 'Berkas proposal wajib berformat PDF.' });
    }
    return res.status(400).json({ error: err.message });
  });
};

const handleGenericUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Ukuran berkas melebihi batas 5 MB.' });
    }
    return res.status(400).json({ error: err.message });
  });
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

// ==========================================
// RESTful API Routes Definition
// ==========================================

// Generic File Upload Endpoint (Images, Videos, PDFs)
app.post('/api/upload', authenticateToken, requireRole(['admin', 'village']), handleGenericUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
  }
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  return res.status(200).json({ status: 'SUCCESS', url: fileUrl, filename: req.file.filename });
});

app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.post('/api/auth/change-password', authenticateToken, changePassword);

app.get('/api/plots', getPlots);
app.get('/api/farmers', authenticateToken, requireRole(['admin', 'village']), getFarmersList);
app.post('/api/farmers', authenticateToken, requireRole(['admin']), createFarmer);
app.put('/api/farmers/:id', authenticateToken, requireRole(['admin']), updateFarmer);
app.delete('/api/farmers/:id', authenticateToken, requireRole(['admin']), deleteFarmer);
app.post('/api/plots', authenticateToken, requireRole(['admin']), createPlot);
app.put('/api/plots/:id', authenticateToken, requireRole(['admin', 'village']), updatePlot);
app.delete('/api/plots/:id', authenticateToken, requireRole(['admin']), deletePlot);
app.post('/api/plots/:id/scan', authenticateToken, upload.single('leaf'), scanPlotLeaf);
app.get('/api/plots/:id/detections', authenticateToken, getDiseaseDetectionsForPlot);
app.get('/api/plots/:id/mlr-history', getMlrHistory);
app.put('/api/plots/:id/resolve', authenticateToken, requireRole(['admin', 'village']), resolvePlotLeaf);

app.get('/api/sponsorships', getSponsorships);
app.post('/api/sponsorships', handleProposalUpload, optionalAuth, createSponsorship);
app.put('/api/sponsorships/:id/curate', authenticateToken, requireRole(['admin']), curateSponsorship);
app.put('/api/sponsorships/:id/approve', authenticateToken, requireRole(['village']), approveSponsorship);
app.put('/api/sponsorships/:id/reject', authenticateToken, requireRole(['admin', 'village']), rejectSponsorship);
app.put('/api/sponsorships/:id/reject-curated', authenticateToken, requireRole(['village']), rejectCuratedSponsorship);
app.put('/api/sponsorships/:id/disburse', authenticateToken, requireRole(['village']), disburseSponsorship);

// E-Resource Routes
app.get('/api/eresources', getEResources);
app.post('/api/eresources', authenticateToken, requireRole(['admin', 'village']), createEResource);
app.put('/api/eresources/:id', authenticateToken, requireRole(['admin', 'village']), updateEResource);
app.delete('/api/eresources/:id', authenticateToken, requireRole(['admin', 'village']), deleteEResource);

// Education Modules Routes
app.get('/api/education', getEducationModules);
app.post('/api/education', authenticateToken, requireRole(['admin', 'village']), createEducationModule);
app.delete('/api/education/:id', authenticateToken, requireRole(['admin', 'village']), deleteEducationModule);

// Admin Users Management Routes (Kepala Desa provisions accounts)
app.get('/api/users/admins', authenticateToken, requireRole(['admin', 'village']), getAdminUsers);
app.post('/api/users/admins', authenticateToken, requireRole(['village']), createAdminUser);
app.delete('/api/users/admins/:id', authenticateToken, requireRole(['village']), deleteAdminUser);

// Visitor Reviews Moderation Routes
app.get('/api/reviews', optionalAuth, getReviews);
app.post('/api/reviews', createReview);
app.put('/api/reviews/:id/approve', authenticateToken, requireRole(['admin', 'village']), toggleApproveReview);
app.delete('/api/reviews/:id', authenticateToken, requireRole(['admin', 'village']), deleteReview);

// SCM Supply Chain Management Hub Routes
app.get('/api/scm/batches', getScmBatches);
app.post('/api/scm/batches', authenticateToken, requireRole(['admin', 'village']), createScmBatch);
app.get('/api/scm/traceability/:batchCode', getTraceability);
app.get('/api/scm/offtakers', getOfftakers);
app.post('/api/scm/offtakers', authenticateToken, requireRole(['admin', 'village']), createOfftaker);
app.get('/api/scm/forecast', getForecast);

// Destinations Agrowisata Routes
app.get('/api/destinations', getDestinations);
app.post('/api/destinations', authenticateToken, requireRole(['admin', 'village']), createDestination);
app.put('/api/destinations/:id', authenticateToken, requireRole(['admin', 'village']), updateDestination);
app.delete('/api/destinations/:id', authenticateToken, requireRole(['admin', 'village']), deleteDestination);

// Tour Guide & Booking Routes
app.get('/api/guides', getTourGuides);
app.post('/api/guides', createGuideBooking);
app.get('/api/guides/bookings', authenticateToken, requireRole(['admin', 'village']), getGuideBookings);
app.put('/api/guides/bookings/:id', authenticateToken, requireRole(['admin', 'village']), updateGuideBookingStatus);

// Emergency SOS Routes
app.post('/api/sos', createSosAlert);
app.get('/api/sos', authenticateToken, requireRole(['admin', 'village']), getSosAlerts);
app.put('/api/sos/:id', authenticateToken, requireRole(['admin', 'village']), updateSosStatus);

// Dashboard Summary (real aggregated data)
app.get('/api/dashboard/summary', authenticateToken, requireRole(['admin', 'village']), getDashboardSummary);

// Public QR trace page referenced by each harvest batch QR code
app.get('/trace/:batchCode', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.batch_code, b.weight_kg, b.drying_days, b.grade, b.process_method,
              b.cupping_score, b.status, b.harvest_date, b.created_at,
              p.farmer_name, p.coffee_type, p.elevation
       FROM harvest_batches b
       LEFT JOIN coffee_plots p ON b.plot_id = p.id
       WHERE LOWER(b.batch_code) = LOWER($1) AND b.deleted_at IS NULL`,
      [req.params.batchCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('<h1 style="font-family:sans-serif">Batch tidak ditemukan</h1>');
    }

    const b = result.rows[0];
    const rows = [
      ['Kode Batch', b.batch_code],
      ['Petani', b.farmer_name || '-'],
      ['Varietas', b.coffee_type || '-'],
      ['Ketinggian', b.elevation ? `${b.elevation} MDPL` : '-'],
      ['Berat Panen', `${Number(b.weight_kg)} kg`],
      ['Metode Proses', b.process_method || '-'],
      ['Lama Pengeringan', `${b.drying_days} hari`],
      ['Grade', b.grade || '-'],
      ['Skor Cupping', b.cupping_score ?? '-'],
      ['Status SCM', b.status || '-'],
      ['Tanggal Panen', b.harvest_date ? new Date(b.harvest_date).toISOString().slice(0, 10) : '-'],
    ];

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(`<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Traceability ${escapeHtml(b.batch_code)} - LENTERA</title></head>
<body style="margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif">
  <main style="max-width:640px;margin:0 auto;padding:32px 20px">
    <p style="letter-spacing:.2em;color:#facc15;font-weight:800;font-size:12px">LENTERA · TRACEABILITY</p>
    <h1 style="margin:8px 0 4px;font-size:26px">${escapeHtml(b.batch_code)}</h1>
    <p style="color:#94a3b8;margin:0 0 24px">Desa Kucur, Kec. Dau, Kab. Malang</p>
    <section style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:20px">
      ${rows.map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid #334155"><span style="color:#94a3b8">${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}
    </section>
    <p style="color:#64748b;font-size:12px;margin-top:20px">Halaman ini dirender langsung dari database LENTERA.</p>
  </main>
</body></html>`);
  } catch (err) {
    console.error('Trace page error:', err);
    return res.status(500).send('<h1 style="font-family:sans-serif">Gagal memuat traceability</h1>');
  }
});

app.get('/api/ai/status', (req, res) => {
  res.status(200).json(getAIStatus());
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LENTERA GIS RESTful API with AI inference is fully operational.',
    ai: getAIStatus(),
  });
});

// --- Boot server + async load AI models ---
(async function boot() {
  try {
    await loadAIModels();
  } catch (err) {
    console.warn('Load AI models warning (may fall back to simulation):', err.message);
  }
  app.listen(PORT, () => {
    console.log(`LENTERA GIS Backend server started successfully on port ${PORT}`);
    console.log(`-> Visit http://localhost:${PORT}/ for API health check & AI status`);
  });
})();

