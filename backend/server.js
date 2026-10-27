import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { registerUser, loginUser } from './authController.js';
import {
  getPlots,
  createPlot,
  updatePlot,
  deletePlot,
  scanPlotLeaf,
  resolvePlotLeaf,
  getDiseaseDetectionsForPlot,
  loadAIModels,
  getAIStatus,
} from './plotController.js';
import { getSponsorships, createSponsorship, approveSponsorship } from './sponsorController.js';
import { getEResources, createEResource, updateEResource, deleteEResource } from './eresourceController.js';
import { getEducationModules, createEducationModule, deleteEducationModule } from './educationController.js';
import { getAdminUsers, createAdminUser, deleteAdminUser } from './userController.js';
import { getReviews, createReview, toggleApproveReview, deleteReview } from './reviewController.js';
import { getScmBatches, createScmBatch, getTraceability, getOfftakers, createOfftaker, getForecast } from './scmController.js';
import { authenticateToken, requireRole } from './authMiddleware.js';

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
const upload = multer({ storage });

// ==========================================
// RESTful API Routes Definition
// ==========================================

// Generic File Upload Endpoint (Images, Videos, PDFs)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
  }
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  return res.status(200).json({ status: 'SUCCESS', url: fileUrl, filename: req.file.filename });
});

app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

app.get('/api/plots', getPlots);
app.post('/api/plots', authenticateToken, requireRole(['admin']), createPlot);
app.put('/api/plots/:id', authenticateToken, requireRole(['admin', 'village']), updatePlot);
app.delete('/api/plots/:id', authenticateToken, requireRole(['admin']), deletePlot);
app.post('/api/plots/:id/scan', authenticateToken, upload.single('leaf'), scanPlotLeaf);
app.get('/api/plots/:id/detections', authenticateToken, getDiseaseDetectionsForPlot);
app.put('/api/plots/:id/resolve', authenticateToken, requireRole(['admin', 'village']), resolvePlotLeaf);

app.get('/api/sponsorships', getSponsorships);
app.post('/api/sponsorships', authenticateToken, requireRole(['sponsor', 'admin']), createSponsorship);
app.put('/api/sponsorships/:id/approve', authenticateToken, requireRole(['village']), approveSponsorship);

// E-Resource Routes
app.get('/api/eresources', getEResources);
app.post('/api/eresources', createEResource);
app.put('/api/eresources/:id', updateEResource);
app.delete('/api/eresources/:id', deleteEResource);

// Education Modules Routes
app.get('/api/education', getEducationModules);
app.post('/api/education', createEducationModule);
app.delete('/api/education/:id', deleteEducationModule);

// Admin Users Management Routes
app.get('/api/users/admins', getAdminUsers);
app.post('/api/users/admins', createAdminUser);
app.delete('/api/users/admins/:id', deleteAdminUser);

// Visitor Reviews Moderation Routes
app.get('/api/reviews', getReviews);
app.post('/api/reviews', createReview);
app.put('/api/reviews/:id/approve', toggleApproveReview);
app.delete('/api/reviews/:id', deleteReview);

// SCM Supply Chain Management Hub Routes
app.get('/api/scm/batches', getScmBatches);
app.post('/api/scm/batches', createScmBatch);
app.get('/api/scm/traceability/:batchCode', getTraceability);

// Destinations Agrowisata Routes
app.get('/api/destinations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tourist_destinations ORDER BY created_at DESC');
    res.status(200).json({ status: 'SUCCESS', data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tour Guide Requests Routes
app.post('/api/guides', async (req, res) => {
  const { visitor_name, phone, visit_date, visitors_count, target_dest, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO guide_requests (visitor_name, phone, visit_date, visitors_count, target_dest, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [visitor_name, phone, visit_date, visitors_count || 1, target_dest, notes]
    );
    res.status(201).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency SOS Call Logs Routes
app.post('/api/sos', async (req, res) => {
  const { latitude, longitude, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO emergency_sos_logs (latitude, longitude, notes) VALUES ($1, $2, $3) RETURNING *',
      [latitude || -7.9150, longitude || 112.5230, notes]
    );
    res.status(201).json({ status: 'SUCCESS', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

