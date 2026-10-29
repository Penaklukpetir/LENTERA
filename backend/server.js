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
  getPredictionAccuracy,
  getPlotHarvests,
  createPlotHarvest,
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

import { getDestinations, createDestination, updateDestination, deleteDestination } from './destinationController.js';
import { getTourGuides, createGuideBooking, getGuideBookings, updateGuideBookingStatus } from './guideController.js';
import { createSosAlert, getSosAlerts, updateSosStatus } from './sosController.js';
import { getDashboardSummary } from './dashboardController.js';
import { createFarmer, deleteFarmer, getFarmerOptions, getFarmersList, updateFarmer } from './farmerController.js';
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

// ==========================================// RESTful API Routes Definition
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
app.get('/api/plots/accuracy', authenticateToken, requireRole(['admin', 'village']), getPredictionAccuracy);
app.get('/api/farmers', authenticateToken, requireRole(['admin', 'village']), getFarmersList);
app.get('/api/farmers/options', authenticateToken, requireRole(['admin', 'village']), getFarmerOptions);
app.post('/api/farmers', authenticateToken, requireRole(['admin']), createFarmer);
app.put('/api/farmers/:id', authenticateToken, requireRole(['admin']), updateFarmer);
app.delete('/api/farmers/:id', authenticateToken, requireRole(['admin']), deleteFarmer);
app.post('/api/plots', authenticateToken, requireRole(['admin']), createPlot);
app.put('/api/plots/:id', authenticateToken, requireRole(['admin', 'village']), updatePlot);
app.delete('/api/plots/:id', authenticateToken, requireRole(['admin']), deletePlot);
app.post('/api/plots/:id/scan', authenticateToken, upload.single('leaf'), scanPlotLeaf);
app.get('/api/plots/:id/detections', authenticateToken, getDiseaseDetectionsForPlot);
app.get('/api/plots/:id/harvests', getPlotHarvests);
app.post('/api/plots/:id/harvests', authenticateToken, requireRole(['admin', 'village']), createPlotHarvest);
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

// SCM Supply Chain Management Hub Routes removed: harvest data now lives per plot.

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

