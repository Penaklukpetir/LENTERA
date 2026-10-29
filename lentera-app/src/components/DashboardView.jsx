import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './Sidebar';
import DetailsPanel from './DetailsPanel';
import AdminPlotForm from './AdminPlotForm';
import Pagination from './Pagination';
import PlotDirectory from './PlotDirectory';
import { getPredictionRange } from '../lib/mlr';
import { API_BASE_URL, resolveServerUrl } from '../lib/api';

const CoffeeMap = React.lazy(() => import('./CoffeeMap'));
const Profile = React.lazy(() => import('./Profile'));

const CHART_RANGES = [
  { id: 7, label: '7 Hari' },
  { id: 30, label: '30 Hari' },
  { id: 365, label: '1 Tahun' }
];

const formatKg = (value) =>
  `${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

const formatPct = (value) =>
  value === null || value === undefined
    ? '—'
    : `${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;

const FARMER_PAGE_SIZE = 10;
const DESTINATION_PAGE_SIZE = 5;
const ERESOURCE_PAGE_SIZE = 6;
const EDU_MODULE_PAGE_SIZE = 6;
const REVIEW_PAGE_SIZE = 6;
const SPONSORSHIP_PAGE_SIZE = 5;

const GUIDE_STATUS_LABELS = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan'
};

const SOS_STATUS_LABELS = {
  ALERT_ACTIVE: 'Darurat Aktif',
  DISPATCHED: 'Tim Dikirim',
  RESOLVED: 'Selesai'
};

const SPONSORSHIP_STATUS_LABELS = {
  PENDING: 'Menunggu',
  CURATED: 'Dikurasi',
  APPROVED: 'Disetujui',
  DISBURSED: 'Dana Disalurkan',
  REJECTED: 'Ditolak'
};

const proposalHref = (url) => (url ? resolveServerUrl(url) : null);

export default function DashboardView({ 
  setActiveView, 
  role, 
  handleLogout, 
  theme, 
  toggleTheme, 
  sponsorships, 
  setSponsorships,
  approveSponsorship,
  curateSponsorship,
  rejectSponsorship,
  disburseSponsorship,

  // GIS Props
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filteredPlots,
  selectedPlot,
  setSelectedPlot,
  handleMapClick,
  showAddForm,
  setShowAddForm,
  newPlotCoords,
  setNewPlotCoords,
  formFarmer,
  setFormFarmer,
  formType,
  setFormType,
  formCount,
  setFormCount,
  formElevation,
  setFormElevation,
  formArea,
  setFormArea,
  formPlantingYear,
  setFormPlantingYear,
  formDesc,
  setFormDesc,
  handleAddPlot,
  token,
  plots,
  setPlots,
  destinations = [],
  setDestinations
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assetSidebarCollapsed, setAssetSidebarCollapsed] = useState(false);
  const [chartRange, setChartRange] = useState(7);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [accuracyLoading, setAccuracyLoading] = useState(true);
  const [accuracyError, setAccuracyError] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Free up horizontal space for the registration panel (which docks next to the map)
  useEffect(() => {
    if (showAddForm) setAssetSidebarCollapsed(true);
  }, [showAddForm]);

  // Helper Toast
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // E-Resource State
  const [eresources, setEresources] = useState([]);
  const [eTitle, setETitle] = useState('');
  const [eType, setEType] = useState('Text');
  const [eStatus, setEStatus] = useState('Aktif');
  const [eContent, setEContent] = useState('');

  // Kelola Edukasi State
  const [eduModules, setEduModules] = useState([]);
  const [eduSlug, setEduSlug] = useState('');
  const [eduTitle, setEduTitle] = useState('');
  const [eduCategory, setEduCategory] = useState('');
  const [eduSubInfo, setEduSubInfo] = useState('');
  const [eduDesc, setEduDesc] = useState('');

  // Admin Account State
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('Admin Desa');
  const [newAdminCredential, setNewAdminCredential] = useState(null);

  // Guide Bookings & SOS State
  const [guideBookings, setGuideBookings] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);

  // Aggregated Farmer Registry State
  const [farmerList, setFarmerList] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerPage, setFarmerPage] = useState(1);
  const [farmerPagination, setFarmerPagination] = useState({ page: 1, pageCount: 1, total: 0 });
  const [farmerSummary, setFarmerSummary] = useState({
    total_farmers: 0,
    total_land_area: 0,
    total_trees: 0,
    predicted_yield: 0,
    harvest_kg: 0,
  });
  const [farmersLoading, setFarmersLoading] = useState(true);
  const [farmersError, setFarmersError] = useState('');
  const [farmerOptions, setFarmerOptions] = useState([]);
  const [showFarmerForm, setShowFarmerForm] = useState(false);
  const [editingFarmerId, setEditingFarmerId] = useState(null);
  const [farmerForm, setFarmerForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [farmerSaving, setFarmerSaving] = useState(false);

  const [destPage, setDestPage] = useState(1);
  const [eresourcePage, setEresourcePage] = useState(1);
  const [eduModulePage, setEduModulePage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [sponsorshipPage, setSponsorshipPage] = useState(1);

  // Visitor Reviews Moderation State
  const [allReviews, setAllReviews] = useState([]);

  // Destinasi Wisata CRUD State
  const [editingDestId, setEditingDestId] = useState(null);
  const [destName, setDestName] = useState('');
  const [destTag, setDestTag] = useState('Alam & Fotografi');
  const [destElevation, setDestElevation] = useState('950 MDPL');
  const [destPrice, setDestPrice] = useState('Rp 15.000 / orang');
  const [destHours, setDestHours] = useState('08:00 - 18:00 WIB');
  const [destImg, setDestImg] = useState('https://images.unsplash.com/photo-1578507065211-17b2d564c20f?w=600');
  const [destDesc, setDestDesc] = useState('');
  const [destHighlights, setDestHighlights] = useState('Spot Foto, Udara Segar, Parkir');

  const refreshDestinations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/destinations`);
      if (res.ok) {
        const payload = await res.json();
        if (setDestinations) setDestinations(payload.data || []);
      }
    } catch (err) {
      console.error('Fetch destinations failed:', err);
    }
  };

  const handleAddOrUpdateDestination = async (e) => {
    e.preventDefault();
    if (!destName) return;
    if (!token) {
      showToast('⚠️ Sesi login tidak tersedia. Silakan masuk kembali.');
      return;
    }

    const hlArray = destHighlights.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      name: destName,
      tag: destTag,
      elevation: destElevation,
      price: destPrice,
      hours: destHours,
      img_url: destImg,
      description: destDesc || destName,
      highlights: hlArray.length > 0 ? hlArray : ['Wisata Desa Kucur']
    };

    try {
      const res = await fetch(
        editingDestId ? `${API_BASE_URL}/destinations/${editingDestId}` : `${API_BASE_URL}/destinations`,
        {
          method: editingDestId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal menyimpan destinasi.'}`);
        return;
      }

      showToast(editingDestId ? '✓ Destinasi wisata diperbarui!' : '✓ Destinasi wisata ditambahkan!');
      setEditingDestId(null);
      setDestName('');
      setDestDesc('');
      await refreshDestinations();
    } catch (err) {
      showToast('⚠️ Koneksi terputus. Coba lagi.');
    }
  };

  const handleEditDestination = (dest) => {
    setEditingDestId(dest.id);
    setDestName(dest.name || '');
    setDestTag(dest.tag || 'Alam & Fotografi');
    setDestElevation(dest.elevation || '950 MDPL');
    setDestPrice(dest.price || 'Rp 15.000 / orang');
    setDestHours(dest.hours || '08:00 - 18:00 WIB');
    setDestImg(dest.img || 'https://images.unsplash.com/photo-1578507065211-17b2d564c20f?w=600');
    setDestDesc(dest.desc || '');
    setDestHighlights(Array.isArray(dest.highlights) ? dest.highlights.join(', ') : 'Spot Foto');
  };

  const handleDeleteDestination = async (id) => {
    if (!window.confirm('Arsipkan destinasi wisata ini dari portal publik?')) return;
    if (!token) {
      showToast('⚠️ Sesi login tidak tersedia. Silakan masuk kembali.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/destinations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal mengarsipkan destinasi.'}`);
        return;
      }
      showToast('✓ Destinasi wisata diarsipkan.');
      await refreshDestinations();
    } catch (err) {
      showToast('⚠️ Koneksi terputus. Coba lagi.');
    }
  };

  // Fetch initial data from PostgreSQL Backend
  useEffect(() => {
    fetchEResources();
    fetchEducationModules();
    fetchAdminUsers();
    fetchReviews();
  }, [token]);

  useEffect(() => {
    fetchDashboardSummary();
  }, [chartRange, token]);

  useEffect(() => {
    fetchGuideBookings();
    fetchSosAlerts();
    refreshSponsorships();
    fetchAccuracy();
  }, [token]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchDashboardSummary = async () => {
    if (!token) {
      setSummaryLoading(false);
      setSummaryError('Sesi login tidak tersedia.');
      return;
    }

    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary?range=${chartRange}`, {
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) {
        setSummaryError(data.error || 'Gagal memuat ringkasan dashboard.');
        return;
      }
      setDashboardSummary(data);
    } catch (err) {
      setSummaryError('Koneksi terputus. Coba lagi.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchAccuracy = async () => {
    if (!token) {
      setAccuracyLoading(false);
      setAccuracyError('Sesi login tidak tersedia.');
      return;
    }

    setAccuracyLoading(true);
    setAccuracyError('');
    try {
      const res = await fetch(`${API_BASE_URL}/plots/accuracy`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) {
        setAccuracyError(data.error || 'Gagal memuat akurasi perkiraan.');
        return;
      }
      setAccuracy(data);
    } catch (err) {
      setAccuracyError('Koneksi terputus. Coba lagi.');
    } finally {
      setAccuracyLoading(false);
    }
  };

  const fetchGuideBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/guides/bookings`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setGuideBookings(data.data || []);
      }
    } catch (err) {
      console.error('Fetch guide bookings failed:', err);
    }
  };

  const fetchSosAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/sos`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSosAlerts(data.data || []);
      }
    } catch (err) {
      console.error('Fetch SOS alerts failed:', err);
    }
  };

  const refreshSponsorships = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sponsorships`);
      if (res.ok) {
        const data = await res.json();
        setSponsorships(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Fetch sponsorships failed:', err);
    }
  };

  const fetchFarmers = useCallback(async () => {
    if (!token) {
      setFarmersLoading(false);
      return;
    }
    setFarmersLoading(true);
    setFarmersError('');
    try {
      const params = new URLSearchParams({
        page: String(farmerPage),
        pageSize: String(FARMER_PAGE_SIZE),
      });
      if (farmerSearch.trim()) params.set('search', farmerSearch.trim());

      const res = await fetch(`${API_BASE_URL}/farmers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setFarmersError(data.error || 'Gagal memuat daftar petani.');
        return;
      }
      setFarmerList(Array.isArray(data.data) ? data.data : []);
      if (data.pagination) {
        setFarmerPagination(data.pagination);
        if (data.pagination.page !== farmerPage) setFarmerPage(data.pagination.page);
      }
      if (data.summary) setFarmerSummary(data.summary);
    } catch {
      setFarmersError('Koneksi terputus. Coba lagi.');
    } finally {
      setFarmersLoading(false);
    }
  }, [token, farmerPage, farmerSearch]);

  useEffect(() => {
    if (!token) {
      setFarmersLoading(false);
      return undefined;
    }
    const timer = setTimeout(fetchFarmers, 250);
    return () => clearTimeout(timer);
  }, [fetchFarmers, token]);

  const fetchFarmerOptions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/farmers/options`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFarmerOptions(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.warn('Fetch farmer options failed:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchFarmerOptions();
  }, [fetchFarmerOptions]);

  const resetFarmerForm = () => {
    setFarmerForm({ name: '', phone: '', address: '', notes: '' });
    setEditingFarmerId(null);
    setShowFarmerForm(false);
  };

  const startEditFarmer = (farmer) => {
    setFarmerForm({
      name: farmer.farmer_name || '',
      phone: farmer.phone || '',
      address: farmer.address || '',
      notes: farmer.notes || '',
    });
    setEditingFarmerId(farmer.id);
    setShowFarmerForm(true);
  };

  const handleSaveFarmer = async (e) => {
    e.preventDefault();
    if (!farmerForm.name.trim()) {
      showToast('⚠️ Nama petani wajib diisi.');
      return;
    }
    setFarmerSaving(true);
    try {
      const res = await fetch(
        editingFarmerId ? `${API_BASE_URL}/farmers/${editingFarmerId}` : `${API_BASE_URL}/farmers`,
        {
          method: editingFarmerId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(farmerForm),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal menyimpan data petani.'}`);
        return;
      }
      showToast(editingFarmerId ? '✓ Data petani berhasil diperbarui.' : '✓ Data petani berhasil disimpan.');
      resetFarmerForm();
      fetchFarmers();
      fetchFarmerOptions();
    } catch (err) {
      showToast('⚠️ Koneksi terputus. Coba lagi.');
    } finally {
      setFarmerSaving(false);
    }
  };

  const handleDeleteFarmer = async (farmer) => {
    if (!farmer.id) return;
    if (!window.confirm(`Hapus petani "${farmer.farmer_name}" dari daftar?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/farmers/${farmer.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal menghapus petani.'}`);
        return;
      }
      showToast('✓ Data petani dihapus.');
      if (editingFarmerId === farmer.id) resetFarmerForm();
      fetchFarmers();
      fetchFarmerOptions();
    } catch (err) {
      showToast('⚠️ Koneksi terputus. Coba lagi.');
    }
  };

  const updateGuideBooking = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/guides/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal memperbarui status pemesanan.'}`);
        return;
      }
      showToast(`✓ Pemesanan pemandu ditandai ${GUIDE_STATUS_LABELS[status] || status}.`);
      fetchGuideBookings();
    } catch (err) {
      showToast('⚠️ Koneksi terputus. Coba lagi.');
    }
  };

  const updateSosStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal memperbarui status SOS.'}`);
        return;
      }
      showToast(`✓ Sinyal SOS ditandai ${SOS_STATUS_LABELS[status] || status}.`);
      fetchSosAlerts();
      fetchDashboardSummary();
    } catch (err) {
      showToast('⚠️ Koneksi terputus. Coba lagi.');
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAllReviews(data);
      }
    } catch (err) {
      console.error('Fetch Reviews failed:', err);
    }
  };

  const handleToggleApproveReviewDB = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}/approve`, { method: 'PUT', headers: authHeaders });
      if (res.ok) {
        showToast('✓ Status publikasi ulasan diperbarui!');
        fetchReviews();
      }
    } catch (err) {
      showToast('⚠️ Gagal memperbarui status ulasan.');
    }
  };

  const handleDeleteReviewDB = async (id) => {
    if (!window.confirm('Hapus ulasan pengunjung ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) {
        showToast('✓ Ulasan pengunjung berhasil dihapus!');
        fetchReviews();
      }
    } catch (err) {
      showToast('⚠️ Gagal menghapus ulasan.');
    }
  };

  const fetchEResources = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/eresources`);
      if (res.ok) {
        const data = await res.json();
        setEresources(data);
      }
    } catch (err) {
      console.error('Fetch EResources failed:', err);
    }
  };

  const fetchEducationModules = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/education`);
      if (res.ok) {
        const data = await res.json();
        setEduModules(data);
      }
    } catch (err) {
      console.error('Fetch Education failed:', err);
    }
  };

  const fetchAdminUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/admins`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAdminAccounts(data);
      }
    } catch (err) {
      console.error('Fetch Admins failed:', err);
    }
  };

  const sponsorshipList = Array.isArray(sponsorships) ? sponsorships : [];
  const pendingSponsorsCount = sponsorshipList.filter(s => ['PENDING', 'CURATED'].includes(String(s.status).toUpperCase())).length;
  const approvedSponsorsCount = sponsorshipList.filter(s => String(s.status).toUpperCase() === 'APPROVED').length;
  const rejectedSponsorsCount = sponsorshipList.filter(s => String(s.status).toUpperCase() === 'REJECTED').length;
  const disbursedSponsorsCount = sponsorshipList.filter(s => String(s.status).toUpperCase() === 'DISBURSED').length;

  const dashboardKpi = dashboardSummary?.kpi || {};
  const activeChart = dashboardSummary?.series || [];
  const maxChartKg = Math.max(...activeChart.map(d => d.harvest_kg), 1);

  const calibratedTotals = useMemo(() => {
    const list = Array.isArray(plots) ? plots : [];
    return list.reduce((acc, plot) => {
      const value = Number(plot.calibrated_yield ?? plot.predicted_yield ?? 0);
      const range = getPredictionRange(value);
      acc.predicted += value;
      acc.low += Number(plot.range_low ?? range.low);
      acc.high += Number(plot.range_high ?? range.high);
      if (Number(plot.calibration_seasons) > 0) acc.calibrated += 1;
      return acc;
    }, { predicted: 0, low: 0, high: 0, calibrated: 0 });
  }, [plots]);

  const hasPlotCalibration = calibratedTotals.predicted > 0;
  const dashboardPredictionKg = hasPlotCalibration
    ? calibratedTotals.predicted
    : Number(dashboardKpi.predicted_yield_kg || 0);
  const dashboardPredictionRange = hasPlotCalibration
    ? { low: calibratedTotals.low, high: calibratedTotals.high }
    : getPredictionRange(dashboardPredictionKg);

  const accuracyMeasured = accuracy?.measured_plots ?? 0;
  const accuracyScorePct = accuracy?.median_ape_pct === null || accuracy?.median_ape_pct === undefined
    ? null
    : Math.max(0, 100 - accuracy.median_ape_pct);
  const accuracyTone = accuracyScorePct === null
    ? 'text-slate-400'
    : accuracyScorePct >= 75
      ? 'text-emerald-500'
      : accuracyScorePct >= 50
        ? 'text-amber-500'
        : 'text-rose-500';

  const farmerRows = Array.isArray(farmerList) ? farmerList : [];
  const farmerTotal = farmerPagination.total;
  const farmerAll = Number(farmerSummary.total_farmers || 0);
  const farmerPageCount = farmerPagination.pageCount;
  const safeFarmerPage = farmerPagination.page;
  const pagedFarmers = farmerRows;
  const farmerTotals = farmerSummary;

  const paginate = (items, page, pageSize) => {
    const list = Array.isArray(items) ? items : [];
    const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
    const safePage = Math.min(page, pageCount);
    return {
      pageCount,
      safePage,
      rows: list.slice((safePage - 1) * pageSize, safePage * pageSize),
    };
  };

  const destinationPagination = paginate(destinations, destPage, DESTINATION_PAGE_SIZE);
  const eresourcePagination = paginate(eresources, eresourcePage, ERESOURCE_PAGE_SIZE);
  const eduModulePagination = paginate(eduModules, eduModulePage, EDU_MODULE_PAGE_SIZE);
  const reviewPagination = paginate(allReviews, reviewPage, REVIEW_PAGE_SIZE);
  const sponsorshipPagination = paginate(sponsorshipList, sponsorshipPage, SPONSORSHIP_PAGE_SIZE);

  // Add E-Resource (DB POST)
  const handleAddEResource = async (e) => {
    e.preventDefault();
    if (!eTitle) return;
    try {
      const res = await fetch(`${API_BASE_URL}/eresources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: eTitle,
          type: eType.toUpperCase(),
          status: eStatus.toUpperCase(),
          content: eContent
        })
      });
      if (res.ok) {
        showToast('✓ Informasi desa berhasil disimpan.');
        setETitle('');
        setEContent('');
        fetchEResources();
      }
    } catch (err) {
      showToast('⚠️ Gagal menyimpan E-Resource.');
    }
  };

  // Toggle/Update E-Resource Status (DB PUT)
  const handleToggleEResourceStatus = async (item) => {
    const newStatus = item.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    try {
      const res = await fetch(`${API_BASE_URL}/eresources/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`✓ Status informasi diubah menjadi ${newStatus === 'AKTIF' ? 'Aktif' : 'Nonaktif'}.`);
        fetchEResources();
      }
    } catch (err) {
      showToast('⚠️ Gagal memperbarui status.');
    }
  };

  // Delete E-Resource (DB DELETE)
  const handleDeleteEResource = async (id) => {
    if (!window.confirm('Hapus informasi desa ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/eresources/${id}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) {
        showToast('✓ Informasi desa berhasil dihapus.');
        fetchEResources();
      }
    } catch (err) {
      showToast('⚠️ Gagal menghapus item.');
    }
  };

  // Add Education Module (DB POST)
  const handleAddEducationModule = async (e) => {
    e.preventDefault();
    if (!eduTitle) return;
    try {
      const res = await fetch(`${API_BASE_URL}/education`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          slug: eduSlug || eduTitle.toLowerCase().replace(/\s+/g, '-'),
          title: eduTitle,
          category: eduCategory || 'KOPI',
          sub_info: eduSubInfo || '12 Modul',
          description: eduDesc,
          image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'
        })
      });
      if (res.ok) {
        showToast('✓ Modul Edukasi baru berhasil disimpan!');
        setEduTitle(''); setEduSlug(''); setEduCategory(''); setEduSubInfo(''); setEduDesc('');
        fetchEducationModules();
      }
    } catch (err) {
      showToast('⚠️ Gagal menyimpan modul.');
    }
  };

  // Delete Education Module (DB DELETE)
  const handleDeleteEduModule = async (id) => {
    if (!window.confirm('Hapus modul edukasi ini?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/education/${id}`, { method: 'DELETE', headers: authHeaders });
      if (res.ok) {
        showToast('✓ Modul edukasi berhasil dihapus.');
        fetchEducationModules();
      }
    } catch (err) {
      showToast('⚠️ Gagal menghapus modul.');
    }
  };

  // Add Admin Account (DB POST)
  const handleAddAdminAccount = async (e) => {
    e.preventDefault();
    if (!adminName || !adminEmail) return;
    if (!token) {
      showToast('⚠️ Sesi login tidak tersedia. Silakan masuk kembali.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          role: adminRole === 'Admin Desa' ? 'village' : 'admin'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal membuat akun admin.'}`);
        return;
      }

      setNewAdminCredential({
        username: data.user?.username,
        email: data.user?.email,
        password: data.temporary_password
      });
      showToast('✓ Akun admin dibuat dengan kata sandi sementara.');
      setAdminName('');
      setAdminEmail('');
      fetchAdminUsers();
    } catch (err) {
      showToast('⚠️ Gagal membuat akun admin.');
    }
  };

  // Delete Admin Account (DB DELETE / soft delete)
  const handleDeleteAdminAccount = async (id) => {
    if (!window.confirm('Arsipkan akun admin ini? Akun tidak dapat dipakai login setelah diarsipkan.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/admins/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`⚠️ ${data.error || 'Gagal mengarsipkan akun.'}`);
        return;
      }
      showToast('✓ Akun admin diarsipkan.');
      fetchAdminUsers();
    } catch (err) {
      showToast('⚠️ Gagal mengarsipkan akun.');
    }
  };

  const refreshDashboard = async () => {
    await Promise.all([
      fetchDashboardSummary(),
      fetchAccuracy(),
      fetchGuideBookings(),
      fetchSosAlerts(),
      refreshSponsorships(),
      fetchFarmers(),
      fetchEResources(),
      fetchEducationModules()
    ]);
    showToast('✓ Data dashboard dimuat ulang.');
  };

  const openFarmerPlot = (farmer) => {
    const plotId = Array.isArray(farmer.plot_ids) ? farmer.plot_ids[0] : null;
    const target = (plots || []).find((plot) => plot.id === plotId);
    if (!target) {
      showToast('⚠️ Lahan petani ini tidak ditemukan pada peta.');
      return;
    }
    setSelectedPlot(target);
    setActiveTab('gis');
  };

  const runSponsorshipAction = async (action, ...args) => {
    if (typeof action !== 'function') {
      showToast('⚠️ Aksi sponsorship tidak tersedia.');
      return;
    }
    const ok = await action(...args);
    if (ok) showToast('✓ Status sponsorship diperbarui.');
    fetchDashboardSummary();
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200 overflow-hidden">
      
      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-primary/30 font-extrabold text-xs flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-primary text-base">info</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* DESKTOP LEFT SIDEBAR: DASHBOARD PERANGKAT DESA (COLLAPSIBLE) */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-20' : 'w-72 lg:w-80'} bg-white dark:bg-slate-950 border-r border-primary/10 flex-col shrink-0 h-full transition-all duration-300 relative`}>
        
        {/* Brand Header with Collapse Toggle */}
        <div className="p-4 sm:p-5 border-b border-primary/10 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <span className="material-symbols-outlined text-slate-900 font-bold">shield_person</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
                  PERANGKAT DESA
                </div>
                <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  Dashboard LENTERA
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-primary dark:hover:text-primary flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-800 transition-colors shrink-0"
            title={sidebarCollapsed ? "Perlebar Sidebar" : "Lipat Sidebar (Maksimalkan Peta GIS)"}
          >
            <span className="material-symbols-outlined text-base">
              {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Sidebar Nav Buttons */}
        <div className="p-2.5 space-y-1 flex-1 overflow-y-auto">
          {[
            { id: 'dashboard',  label: 'Dashboard',             icon: 'dashboard' },
            { id: 'gis',        label: 'Peta Lahan & GIS',       icon: 'map' },
            { id: 'farmers',    label: 'Daftar Petani',          icon: 'agriculture' },
            { id: 'plots',      label: 'Daftar Lahan',          icon: 'landscape' },
            { id: 'navigation', label: 'Kelola Wisata & Pemandu', icon: 'explore' },
            { id: 'eresource',  label: 'E-Resource',            icon: 'folder_shared' },
            { id: 'education',  label: 'Kelola Edukasi',        icon: 'school' },
            { id: 'accounts',   label: 'Setting Akun',          icon: 'manage_accounts' },
            { id: 'sponsorship',label: 'Sponsorship',           icon: 'handshake', badge: pendingSponsorsCount },
            { id: 'settings',   label: 'Pengaturan Desa',       icon: 'settings' },
            { id: 'profile',    label: 'Profil Software House', icon: 'groups' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3.5'} py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left truncate ml-3">{item.label}</span>
                )}
                {item.badge > 0 && (
                  <span className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} inline-flex items-center justify-center px-1.5 py-0.5 bg-primary text-slate-900 text-[9px] font-extrabold rounded-full`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Account & Mode */}
        <div className={`mt-auto p-3.5 border-t border-primary/10 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">account_circle</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate capitalize">
                    Akun Perangkat Desa
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Eksekutif • Pemantau Sistem</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex-1 px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {theme === 'light' ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span>Mode</span>
                </button>

                <button
                  onClick={() => setActiveView('home')}
                  className="flex-1 px-2.5 py-2 rounded-xl bg-primary text-slate-900 font-extrabold text-xs text-center hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">public</span>
                  <span>Publik</span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full px-2.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1 cursor-pointer border border-rose-200/60 dark:border-rose-500/20"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Keluar dari Dasbor</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer"
                title="Ganti Tema"
              >
                <span className="material-symbols-outlined text-base">
                  {theme === 'light' ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
              <button
                onClick={() => setActiveView('home')}
                className="w-10 h-10 rounded-xl bg-primary text-slate-900 flex items-center justify-center cursor-pointer shadow-md shadow-primary/20"
                title="Ke Portal Publik"
              >
                <span className="material-symbols-outlined text-base font-bold">public</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center cursor-pointer border border-rose-200/60 dark:border-rose-500/20"
                title="Keluar dari Dasbor"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* MOBILE SLIDE-OVER DRAWER MODAL (< lg) */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileSidebarOpen(false)}>
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <aside 
            className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-slate-900 text-base">shield_person</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Menu Admin</span>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
              {[
                { id: 'dashboard',  label: 'Dashboard',             icon: 'dashboard' },
                { id: 'gis',        label: 'Peta Lahan & GIS',       icon: 'map' },
                { id: 'farmers',    label: 'Daftar Petani',          icon: 'agriculture' },
                { id: 'plots',      label: 'Daftar Lahan',          icon: 'landscape' },
                { id: 'navigation', label: 'Kelola Wisata & Pemandu', icon: 'explore' },
                { id: 'eresource',  label: 'E-Resource',            icon: 'folder_shared' },
                { id: 'education',  label: 'Kelola Edukasi',        icon: 'school' },
                { id: 'accounts',   label: 'Setting Akun',          icon: 'manage_accounts' },
                { id: 'sponsorship',label: 'Sponsorship',           icon: 'handshake', badge: pendingSponsorsCount },
                { id: 'settings',   label: 'Pengaturan Desa',       icon: 'settings' },
                { id: 'profile',    label: 'Profil Software House', icon: 'groups' },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-primary/10 space-y-2 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => { setActiveView('home'); setMobileSidebarOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-primary text-slate-900 font-extrabold text-xs text-center flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">public</span>
                <span>Portal Publik Desa</span>
              </button>
              <button
                onClick={() => { setMobileSidebarOpen(false); handleLogout(); }}
                className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs text-center flex items-center justify-center gap-2 border border-rose-200/60 dark:border-rose-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Keluar dari Dasbor</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-primary/10 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Toggle admin sidebar"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>

            <div className="min-w-0">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate">
                PEMANTAUAN &amp; PERSETUJUAN
              </div>
              <h1 className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white capitalize truncate">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'gis' ? 'Peta Lahan & GIS' :
                 activeTab === 'farmers' ? 'Daftar Petani' :
                 activeTab === 'plots' ? 'Daftar Lahan' :
                 activeTab === 'navigation' ? 'Kelola Wisata & Pemandu' :
                 activeTab === 'eresource' ? 'E-Resource' :
                 activeTab === 'education' ? 'Kelola Edukasi' :
                 activeTab === 'accounts' ? 'Setting Akun' :
                 activeTab === 'sponsorship' ? 'Sponsorship' :
                 activeTab === 'settings' ? 'Pengaturan Desa' : 'Profil Software House'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-primary/10 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-sm text-primary">schedule</span>
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>

            <button
              onClick={refreshDashboard}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-slate-900 font-extrabold text-xs shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Muat Ulang Data</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 overflow-y-auto relative flex flex-col">

          {/* 1. DASHBOARD OVERVIEW TAB */}
          {activeTab === 'dashboard' && (
            <div className="p-6 sm:p-8 space-y-8">
              {summaryError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{summaryError}</span>
                  <button onClick={fetchDashboardSummary} className="ml-auto px-3 py-1 bg-rose-500 text-white rounded-lg">Coba Lagi</button>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md card-hover">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-2xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">LAHAN KOPI</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-500 text-lg">forest</span>
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {summaryLoading ? '—' : formatNumber(dashboardKpi.plots)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">Plot terdaftar &amp; aktif</div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>Data resmi desa</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md card-hover">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-l-2xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">PERKIRAAN PANEN</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-500 text-lg">analytics</span>
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {summaryLoading ? '—' : formatNumber(dashboardPredictionKg)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">Kg/tahun perkiraan panen</div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-500">
                    <span className="material-symbols-outlined text-xs">functions</span>
                    <span>
                      Rentang {formatNumber(dashboardPredictionRange.low)}–{formatNumber(dashboardPredictionRange.high)} kg
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-400">
                    {calibratedTotals.calibrated > 0
                      ? `${calibratedTotals.calibrated} lahan disesuaikan dari panen sebelumnya`
                      : 'Belum ada riwayat panen'}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md card-hover">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-2xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">PANEN REALISASI</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-500 text-lg">scale</span>
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {summaryLoading ? '—' : formatNumber(dashboardKpi.harvest_kg)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">
                    Kg dalam {CHART_RANGES.find(r => r.id === chartRange)?.label.toLowerCase()}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-500">
                    <span className="material-symbols-outlined text-xs">inventory_2</span>
                    <span>{formatNumber(dashboardKpi.batches)} batch panen</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md card-hover">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-emerald-600 rounded-l-2xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">SPONSOR</span>
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg">handshake</span>
                    </div>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {summaryLoading ? '—' : formatNumber(dashboardKpi.pending_sponsorships)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">Menunggu kurasi / persetujuan</div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-primary">
                    <span className="material-symbols-outlined text-xs">payments</span>
                    <span>Dana aktif Rp {formatNumber(dashboardKpi.approved_funding)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ANALITIK SPASIAL & TRANSAKSI</span>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                        Ringkasan Sumberdaya & Hasil Panen
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-primary/10">
                      {CHART_RANGES.map(range => {
                        const isActive = chartRange === range.id;
                        return (
                          <button
                            key={range.id}
                            type="button"
                            onClick={() => setChartRange(range.id)}
                            className={`px-2.5 py-1 text-[10px] rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? 'bg-primary text-slate-900 font-bold shadow-sm'
                                : 'font-semibold text-slate-400 hover:text-primary'
                            }`}
                          >
                            {range.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 h-56 flex items-end gap-1.5 sm:gap-3 px-1">
                    {activeChart.length === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                        <span className="material-symbols-outlined text-3xl">bar_chart</span>
                        <span className="text-xs font-bold">
                          {summaryLoading ? 'Memuat data panen...' : 'Belum ada batch panen pada periode ini.'}
                        </span>
                      </div>
                    )}
                    {activeChart.map((bar, idx) => {
                      const heightPct = bar.harvest_kg > 0
                        ? Math.max(8, Math.round((bar.harvest_kg / maxChartKg) * 100))
                        : 2;
                      return (
                        <div key={`${chartRange}-${bar.period || idx}`} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group relative">
                          <div className="w-full h-full bg-primary/10 rounded-xl p-0.5 flex flex-col justify-end group-hover:bg-primary/20 transition-colors cursor-pointer">
                            <div className="relative w-full transition-all duration-300" style={{ height: `${heightPct}%` }}>
                              {/* Interactive Tooltip on Hover */}
                              <div className="opacity-0 group-hover:opacity-100 transition-all absolute -top-11 left-1/2 -translate-x-1/2 -translate-y-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-xl border border-primary/30 pointer-events-none z-30 duration-150">
                                {formatKg(bar.harvest_kg)} • {formatNumber(bar.batch_count)} batch
                              </div>
                              <div className="w-full h-full bg-gradient-to-t from-emerald-600 via-primary to-emerald-300 rounded-xl shadow-md origin-bottom transition-transform group-hover:scale-y-[1.02]" />
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 group-hover:text-primary transition-colors">{bar.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-4 text-[10px] font-semibold text-slate-400">
                    Total berat panen yang dicatat per periode, dihitung dari batch panen lahan.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">STATUS</span>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Persetujuan</h3>
                      </div>
                      <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SPONSOR</span>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{dashboardKpi.pending_sponsorships ?? 0}</div>
                        <div className="mt-1 text-xs text-amber-500 font-semibold">Menunggu</div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PEMANDU</span>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{dashboardKpi.pending_guides ?? 0}</div>
                        <div className="mt-1 text-xs text-blue-500 font-semibold">Menunggu konfirmasi</div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SOS AKTIF</span>
                        <div className="mt-2 text-3xl font-extrabold text-rose-500">{dashboardKpi.active_sos ?? 0}</div>
                        <div className="mt-1 text-xs text-rose-500 font-semibold">Perlu respons</div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LAHAN WASPADA</span>
                        <div className="mt-2 text-3xl font-extrabold text-amber-500">{dashboardKpi.alert_plots ?? 0}</div>
                        <div className="mt-1 text-xs text-amber-500 font-semibold">Perlu pemeriksaan</div>
                      </div>
                    </div>

                    {/* Enterprise-style approval status badges */}
                    <div className="mt-5 space-y-2">
                      {[
                        {
                          label: 'Menunggu Peninjauan',
                          count: pendingSponsorsCount,
                          pill: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
                          dot: 'bg-amber-500'
                        },
                        {
                          label: 'Disetujui',
                          count: approvedSponsorsCount,
                          pill: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
                          dot: 'bg-emerald-500'
                        },
                        {
                          label: 'Dicairkan',
                          count: disbursedSponsorsCount,
                          pill: 'bg-blue-500/10 text-blue-600 border-blue-500/25',
                          dot: 'bg-blue-500'
                        }
                      ].map((badge) => (
                        <div key={badge.label} className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">{badge.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('sponsorship')}
                    className="w-full bg-primary hover:bg-primary/90 text-slate-900 p-3.5 rounded-xl font-extrabold text-xs shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Buka Sponsorship</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

              </div>

              {/* Akurasi perkiraan panen per lahan dibandingkan total panen tercatat */}
              <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">AKURASI PERKIRAAN</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Akurasi Perkiraan vs Panen Nyata</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      Perkiraan panen dibandingkan dengan hasil panen tercatat — dinilai pada panen musim terakhir; perkiraan musim itu hanya disesuaikan dari musim sebelumnya.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-primary/25 bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-xs">target</span>
                    Toleransi ±{accuracy?.tolerance_pct ?? 25}%
                  </span>
                </div>

                {accuracyLoading && (
                  <div className="mt-6 h-20 flex items-center justify-center text-xs font-bold text-slate-400">
                    Menghitung akurasi dari catatan panen...
                  </div>
                )}

                {!accuracyLoading && accuracyError && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                    <span className="material-symbols-outlined text-base">error</span>
                    <span>{accuracyError}</span>
                    <button onClick={fetchAccuracy} className="ml-auto px-3 py-1 bg-rose-500 text-white rounded-lg">Coba Lagi</button>
                  </div>
                )}

                {!accuracyLoading && !accuracyError && accuracy && accuracyMeasured === 0 && (
                  <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold">
                    <span className="material-symbols-outlined text-base">info</span>
                    <span>Belum ada lahan yang punya perkiraan dan catatan panen sekaligus. Catat hasil panen lewat Detail Plot agar akurasi bisa dihitung; penyesuaian per lahan aktif otomatis mulai musim panen kedua.</span>
                  </div>
                )}

                {!accuracyLoading && !accuracyError && accuracyMeasured > 0 && (
                  <>
                    <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AKURASI PERKIRAAN</span>
                        <div className={`mt-2 text-3xl font-extrabold ${accuracyTone}`}>{formatPct(accuracyScorePct)}</div>
                        <div className="mt-1 text-[11px] text-slate-500 font-semibold">
                          Meleset {formatPct(accuracy.median_ape_pct)} (median)
                        </div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DALAM TOLERANSI</span>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{formatPct(accuracy.within_tolerance_pct)}</div>
                        <div className="mt-1 text-[11px] text-slate-500 font-semibold">
                          Selisih ≤ {accuracy.tolerance_pct}% dari panen nyata
                        </div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RATA-RATA SELISIH</span>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{formatKg(accuracy.mae_kg)}</div>
                        <div className="mt-1 text-[11px] text-slate-500 font-semibold">Per lahan per tahun</div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LAHAN TERUKUR</span>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                          {formatNumber(accuracyMeasured)}
                          <span className="text-base font-bold text-slate-400"> / {formatNumber(accuracy.total_plots)}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 font-semibold">Punya perkiraan &amp; catatan panen</div>
                      </div>
                    </div>

                    <p className="mt-4 text-[10px] font-semibold text-slate-400">
                      Total perkiraan {formatKg(accuracy.total_predicted_kg)} vs total panen musim terakhir {formatKg(accuracy.total_harvested_kg)}.
                      {accuracy.calibrated_plots > 0
                        ? ` ${accuracy.calibrated_plots} lahan memakai penyesuaian dari panen musim sebelumnya.`
                        : ' Belum ada lahan yang punya lebih dari satu musim panen; penyesuaian aktif mulai musim kedua.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. PETA LAHAN & GIS MANAGEMENT */}
          {activeTab === 'gis' && (
            <div className="flex-1 flex flex-row overflow-hidden relative">
              <Sidebar 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                filteredPlots={filteredPlots}
                selectedPlot={selectedPlot}
                setSelectedPlot={setSelectedPlot}
                role={role}
                collapsible
                collapsed={assetSidebarCollapsed}
                onToggleCollapse={() => setAssetSidebarCollapsed(v => !v)}
                onOpenAddPlot={() => {
                  setNewPlotCoords(newPlotCoords || { lat: -7.9152, lng: 112.5201 });
                  setShowAddForm(true);
                }}
              />

              <React.Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400">Memuat peta lahan...</div>}>
                <CoffeeMap 
                  filteredPlots={filteredPlots}
                  selectedPlot={selectedPlot}
                  setSelectedPlot={setSelectedPlot}
                  role={role}
                  handleMapClick={handleMapClick}
                  showAddForm={showAddForm}
                  newPlotCoords={newPlotCoords}
                  setNewPlotCoords={setNewPlotCoords}
                  onOpenAddPlot={() => {
                    setNewPlotCoords(newPlotCoords || { lat: -7.9152, lng: 112.5201 });
                    setShowAddForm(true);
                  }}
                />
              </React.Suspense>

              <AdminPlotForm 
                newPlotCoords={newPlotCoords}
                setNewPlotCoords={setNewPlotCoords}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
                farmerOptions={farmerOptions}
                formFarmer={formFarmer}
                setFormFarmer={setFormFarmer}
                formType={formType}
                setFormType={setFormType}
                formCount={formCount}
                setFormCount={setFormCount}
                formElevation={formElevation}
                setFormElevation={setFormElevation}
                formArea={formArea}
                setFormArea={setFormArea}
                formPlantingYear={formPlantingYear}
                setFormPlantingYear={setFormPlantingYear}
                formDesc={formDesc}
                setFormDesc={setFormDesc}
                handleAddPlot={handleAddPlot}
              />

              {!showAddForm && (
                <DetailsPanel 
                  selectedPlot={selectedPlot}
                  setSelectedPlot={setSelectedPlot}
                  role={role}
                  token={token}
                  plots={plots}
                  setPlots={setPlots}
                  inDashboard={true}
                />
              )}
            </div>
          )}

          {/* 1.4. DAFTAR PETANI (AGREGASI DARI DATA LAHAN) */}
          {activeTab === 'farmers' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">DAFTAR PETANI</span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Registry Petani Kucur</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Input data petani untuk melihat rekap lahan, perkiraan panen, dan catatan panen tiap pemilik.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {role === 'admin' && (
                    <button
                      onClick={() => {
                        const nextOpen = !showFarmerForm;
                        resetFarmerForm();
                        if (nextOpen) setShowFarmerForm(true);
                      }}
                      className="bg-primary hover:bg-primary/90 text-slate-900 px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">{showFarmerForm ? 'close' : 'person_add'}</span>
                      {showFarmerForm ? 'Batal' : 'Tambah Petani'}
                    </button>
                  )}
                  <button
                    onClick={fetchFarmers}
                    disabled={farmersLoading}
                    className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-sm ${farmersLoading ? 'animate-spin' : ''}`}>refresh</span>
                    {farmersLoading ? 'Memuat...' : 'Muat Ulang'}
                  </button>
                </div>
              </div>

              {role === 'admin' && showFarmerForm && (
                <form onSubmit={handleSaveFarmer} className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {editingFarmerId ? 'EDIT DATA PETANI' : 'TAMBAH PETANI'}
                    </span>
                    <span className="material-symbols-outlined text-primary">{editingFarmerId ? 'edit' : 'person_add'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NAMA PETANI *</label>
                      <input
                        type="text"
                        value={farmerForm.name}
                        onChange={(e) => setFarmerForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Pak Sugeng"
                        maxLength={100}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NO. HP / WHATSAPP</label>
                      <input
                        type="tel"
                        value={farmerForm.phone}
                        onChange={(e) => setFarmerForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="0812xxxxxxx"
                        maxLength={20}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ALAMAT / DUSUN</label>
                    <input
                      type="text"
                      value={farmerForm.address}
                      onChange={(e) => setFarmerForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Contoh: Dusun Krajan, Desa Kucur"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CATATAN</label>
                    <textarea
                      rows={2}
                      value={farmerForm.notes}
                      onChange={(e) => setFarmerForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Contoh: Anggota kelompok tani Sido Makmur"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold resize-none"
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Lahan didaftarkan terpisah lewat tab Peta Lahan. Pastikan nama petani sama agar rekap lahan otomatis tergabung.
                  </p>
                  <button
                    type="submit"
                    disabled={farmerSaving}
                    className="w-full bg-primary hover:bg-primary/90 text-slate-900 p-3 rounded-xl font-extrabold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {farmerSaving ? 'Menyimpan...' : editingFarmerId ? 'Simpan Perubahan' : 'Simpan Data Petani'}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TOTAL PETANI</span>
                    <span className="material-symbols-outlined text-primary text-lg">groups</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatNumber(farmerAll)}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">petani terdaftar</div>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TOTAL LAHAN</span>
                    <span className="material-symbols-outlined text-primary text-lg">landscape</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatNumber(farmerTotals.total_land_area)}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">m² luas lahan</div>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">TOTAL POHON</span>
                    <span className="material-symbols-outlined text-primary text-lg">park</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatNumber(farmerTotals.total_trees)}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">pohon kopi</div>
                </div>
                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">PERKIRAAN PANEN</span>
                    <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{formatNumber(farmerTotals.predicted_yield)}</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">kg / tahun</div>
                </div>
              </div>

              {farmersError && (
                <div className="flex items-center justify-between gap-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl px-5 py-3.5 text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    {farmersError}
                  </span>
                  <button onClick={fetchFarmers} className="underline font-extrabold">Coba lagi</button>
                </div>
              )}

              <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-900">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Data Petani <span className="text-slate-400 font-semibold">({farmerTotal} dari {farmerAll})</span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                    <input
                      type="text"
                      value={farmerSearch}
                      onChange={(e) => {
                        setFarmerSearch(e.target.value);
                        setFarmerPage(1);
                      }}
                      placeholder="Cari nama petani..."
                      className="w-full sm:w-64 pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                {farmersLoading ? (
                  <div className="p-10 text-center text-xs font-semibold text-slate-400">Memuat daftar petani...</div>
                ) : farmerTotal === 0 ? (
                  <div className="p-10 text-center text-xs font-semibold text-slate-400">
                    {farmerAll === 0
                      ? 'Belum ada petani terdaftar. Gunakan tombol Tambah Petani atau daftarkan lahan pada tab Peta Lahan.'
                      : 'Tidak ada petani yang cocok dengan pencarian.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/60">
                          <th className="px-5 py-3">Petani</th>
                          <th className="px-5 py-3">Varietas</th>
                          <th className="px-5 py-3 text-right">Lahan</th>
                          <th className="px-5 py-3 text-right">Luas (m²)</th>
                          <th className="px-5 py-3 text-right">Elevasi</th>
                          <th className="px-5 py-3 text-right">Perkiraan</th>
                          <th className="px-5 py-3 text-right">Panen</th>
                          <th className="px-5 py-3">Terakhir Panen</th>
                          <th className="px-5 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                        {pagedFarmers.map((farmer) => (
                          <tr key={farmer.farmer_name} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-extrabold text-slate-900 dark:text-white">{farmer.farmer_name || '-'}</div>
                              <div className="text-[10px] font-semibold text-slate-400">{formatNumber(farmer.plot_count)} lahan • {formatNumber(farmer.total_trees)} pohon</div>
                              {(farmer.phone || farmer.address) && (
                                <div className="text-[10px] font-semibold text-slate-400">{[farmer.phone, farmer.address].filter(Boolean).join(' • ')}</div>
                              )}
                              {!farmer.registered && (
                                <span className="inline-block mt-1 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">Belum terdaftar</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">{farmer.coffee_types || '-'}</td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-700 dark:text-slate-200">{formatNumber(farmer.plot_count)}</td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-700 dark:text-slate-200">{formatNumber(farmer.total_land_area)}</td>
                            <td className="px-5 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-300">
                              {farmer.min_elevation == null
                                ? '-'
                                : farmer.min_elevation === farmer.max_elevation
                                  ? `${formatNumber(farmer.min_elevation)}`
                                  : `${formatNumber(farmer.min_elevation)}–${formatNumber(farmer.max_elevation)}`}
                            </td>
                            <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">{formatNumber(farmer.predicted_yield)} kg</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="font-bold text-slate-700 dark:text-slate-200">{formatNumber(farmer.harvest_kg)} kg</div>
                              <div className="text-[10px] font-semibold text-slate-400">{formatNumber(farmer.batch_count)} batch</div>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-300">
                              {farmer.last_harvest_date
                                ? new Date(farmer.last_harvest_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1.5">
                                {Array.isArray(farmer.plot_ids) && farmer.plot_ids.length > 0 ? (
                                  <button
                                    onClick={() => openFarmerPlot(farmer)}
                                    className="bg-primary/10 hover:bg-primary/20 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-lg font-bold text-[10px] inline-flex items-center gap-1.5 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-sm">my_location</span>
                                    Lihat Lahan
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400">Belum ada lahan</span>
                                )}
                                {role === 'admin' && farmer.id && (
                                  <>
                                    <button
                                      onClick={() => startEditFarmer(farmer)}
                                      title="Edit data petani"
                                      aria-label="Edit data petani"
                                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFarmer(farmer)}
                                      title="Hapus petani"
                                      aria-label="Hapus petani"
                                      className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!farmersLoading && farmerTotal > 0 && (
                  <Pagination
                    page={safeFarmerPage}
                    pageCount={farmerPageCount}
                    total={farmerTotal}
                    pageSize={FARMER_PAGE_SIZE}
                    onPageChange={setFarmerPage}
                    itemLabel="petani"
                    className="border-t border-slate-100 dark:border-slate-900"
                  />
                )}
              </div>
            </div>
          )}

          {/* 1.5. DAFTAR LAHAN & PANEN RIIL TAB */}
          {activeTab === 'plots' && (
            <PlotDirectory
              plots={plots}
              accuracy={accuracy}
              onOpenPlot={(plot) => {
                if (plot) setSelectedPlot(plot);
                setActiveTab('gis');
              }}
            />
          )}

          {/* KELOLA WISATA & GUIDE TAB */}
          {activeTab === 'navigation' && (
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input / Edit Destinasi */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {editingDestId ? 'EDIT DESTINASI WISATA' : 'TAMBAH DESTINASI WISATA'}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {editingDestId ? 'Ubah Detail Destinasi' : 'Tambah Agrowisata Baru'}
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-primary">explore</span>
                </div>

                <form onSubmit={handleAddOrUpdateDestination} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NAMA DESTINASI</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Lembah Kopi Kucur" 
                      value={destName} 
                      onChange={e => setDestName(e.target.value)} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">KATEGORI / TAG</label>
                      <select 
                        value={destTag} 
                        onChange={e => setDestTag(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                      >
                        <option value="Alam & Fotografi">Alam & Fotografi</option>
                        <option value="Edukasi Tani">Edukasi Tani</option>
                        <option value="Pasca-Panen">Pasca-Panen</option>
                        <option value="Budaya & Belanja">Budaya & Belanja</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ELEVASI (MDPL)</label>
                      <input 
                        type="text" 
                        placeholder="1100 MDPL" 
                        value={destElevation} 
                        onChange={e => setDestElevation(e.target.value)} 
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HARGA TIKET</label>
                      <input 
                        type="text" 
                        placeholder="Rp 15.000 / orang" 
                        value={destPrice} 
                        onChange={e => setDestPrice(e.target.value)} 
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">JAM OPERASIONAL</label>
                      <input 
                        type="text" 
                        placeholder="08:00 - 17:00 WIB" 
                        value={destHours} 
                        onChange={e => setDestHours(e.target.value)} 
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UNGGAH FOTO DESTINASI (FILE GAMBAR)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*"
                        id="dest-file-input"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const localUrl = URL.createObjectURL(file);
                          setDestImg(localUrl);

                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', headers: authHeaders, body: formData });
                            if (res.ok) {
                              const data = await res.json();
                              setDestImg(data.url);
                            }
                          } catch(err) {
                            console.warn('Upload API fallback to local URL preview');
                          }
                        }}
                      />
                      <label 
                        htmlFor="dest-file-input" 
                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-primary/20 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-primary text-base">cloud_upload</span>
                        <span>{destImg ? 'Ganti Foto Destinasi' : 'Unggah File Foto (.jpg / .png)'}</span>
                      </label>
                    </div>
                    {destImg && (
                      <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border border-slate-700">
                        <img src={destImg} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">HIGHLIGHTS (DIPISAH KOMA)</label>
                    <input 
                      type="text" 
                      placeholder="Spot Foto, Udara Segar, Parkir" 
                      value={destHighlights} 
                      onChange={e => setDestHighlights(e.target.value)} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DESKRIPSI DESTINASI</label>
                    <textarea 
                      rows={3} 
                      placeholder="Tulis deskripsi singkat..." 
                      value={destDesc} 
                      onChange={e => setDestDesc(e.target.value)} 
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold resize-none" 
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-primary text-slate-900 font-extrabold py-3 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                      {editingDestId ? 'Simpan Perubahan' : 'Tambah Destinasi'}
                    </button>
                    {editingDestId && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingDestId(null); setDestName(''); setDestDesc(''); }}
                        className="px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List Destinasi Wisata */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">KATALOG WISATA TANI</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Daftar Destinasi Aktif</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{destinations.length} Destinasi</span>
                </div>

                <div className="space-y-3">
                  {destinationPagination.rows.map(dest => (
                    <div key={dest.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-4">
                      <img src={dest.img} alt={dest.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{dest.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-primary/10 text-primary">{dest.tag}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium truncate">{dest.price} • {dest.elevation}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{dest.desc}</p>
                      </div>

                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => handleEditDestination(dest)} className="px-3 py-1 bg-primary text-slate-900 rounded-lg font-extrabold text-[11px]">Edit</button>
                        <button onClick={() => handleDeleteDestination(dest.id)} className="px-3 py-1 bg-slate-900 text-white rounded-lg font-extrabold text-[11px]">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={destinationPagination.safePage}
                  pageCount={destinationPagination.pageCount}
                  total={destinations.length}
                  pageSize={DESTINATION_PAGE_SIZE}
                  onPageChange={setDestPage}
                  itemLabel="destinasi"
                  plain
                  className="pt-3 border-t border-slate-100 dark:border-slate-800"
                />
              </div>

              {/* PEMESANAN PEMANDU WISATA */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">PEMESANAN PEMANDU</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Permintaan Pemandu Wisata</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{guideBookings.length} Booking</span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {guideBookings.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-6 text-center">Belum ada permintaan pemandu wisata.</p>
                  )}
                  {guideBookings.map(booking => {
                    const status = String(booking.status || 'PENDING').toUpperCase();
                    return (
                      <div key={booking.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{booking.visitor_name}</h4>
                            <p className="text-[11px] text-slate-400 font-medium">{booking.phone} • {booking.visitors_count} orang</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${
                            status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                            status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-500' :
                            status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>{GUIDE_STATUS_LABELS[status] || status}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          {booking.guide_name || 'Pemandu belum ditentukan'} • {String(booking.visit_date).slice(0, 10)} • {booking.target_dest || 'Semua Destinasi'}
                        </p>
                        {booking.notes && <p className="text-[11px] text-slate-400 italic">"{booking.notes}"</p>}
                        <div className="flex gap-2 pt-1">
                          {status === 'PENDING' && (
                            <button onClick={() => updateGuideBooking(booking.id, 'CONFIRMED')} className="px-3 py-1 bg-primary text-slate-900 rounded-lg font-extrabold text-[10px]">Konfirmasi</button>
                          )}
                          {status === 'CONFIRMED' && (
                            <button onClick={() => updateGuideBooking(booking.id, 'COMPLETED')} className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-extrabold text-[10px]">Selesai</button>
                          )}
                          {['PENDING', 'CONFIRMED'].includes(status) && (
                            <button onClick={() => updateGuideBooking(booking.id, 'CANCELLED')} className="px-3 py-1 bg-slate-900 text-white rounded-lg font-extrabold text-[10px]">Batalkan</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SINYAL DARURAT SOS */}
              <div className="lg:col-span-6 bg-white dark:bg-slate-950 border border-rose-500/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest">DARURAT SOS</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Sinyal Darurat Pengunjung</h3>
                  </div>
                  <span className="text-xs font-extrabold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full">{sosAlerts.length} Sinyal</span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {sosAlerts.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-6 text-center">Tidak ada sinyal darurat tercatat.</p>
                  )}
                  {sosAlerts.map(alert => {
                    const status = String(alert.status || 'ALERT_ACTIVE').toUpperCase();
                    return (
                      <div key={alert.id} className={`p-4 rounded-xl border space-y-2 ${
                        status === 'ALERT_ACTIVE' ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {alert.visitor_name || 'Pengunjung Anonim'}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {alert.created_at ? new Date(alert.created_at).toLocaleString('id-ID') : '-'}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${
                            status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' :
                            status === 'DISPATCHED' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>{SOS_STATUS_LABELS[status] || status}</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-blue-500 hover:underline"
                        >
                          {Number(alert.latitude).toFixed(6)}, {Number(alert.longitude).toFixed(6)} — buka lokasi
                        </a>
                        {alert.notes && <p className="text-[11px] text-slate-400 italic">"{alert.notes}"</p>}
                        <div className="flex gap-2 pt-1">
                          {status === 'ALERT_ACTIVE' && (
                            <button onClick={() => updateSosStatus(alert.id, 'DISPATCHED')} className="px-3 py-1 bg-primary text-slate-900 rounded-lg font-extrabold text-[10px]">Kirim Tim</button>
                          )}
                          {status === 'DISPATCHED' && (
                            <button onClick={() => updateSosStatus(alert.id, 'RESOLVED')} className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-extrabold text-[10px]">Tandai Selesai</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. E-RESOURCE MANAGEMENT TAB */}
          {activeTab === 'eresource' && (
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">FORM INFORMASI</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Tambah Informasi Desa</h3>
                  </div>
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                </div>

                <form onSubmit={handleAddEResource} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">JUDUL</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Jadwal Pasar Minggu, Pengumuman, dll"
                      value={eTitle}
                      onChange={(e) => setETitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TIPE</label>
                      <select 
                        value={eType} 
                        onChange={(e) => setEType(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                      >
                        <option value="Text">Text</option>
                        <option value="Video">Video</option>
                        <option value="PDF">PDF</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">STATUS</label>
                      <select 
                        value={eStatus} 
                        onChange={(e) => setEStatus(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Nonaktif">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ISI TEXT</label>
                    <textarea 
                      rows={4}
                      placeholder="Tulis informasi umum desa..."
                      value={eContent}
                      onChange={(e) => setEContent(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 bg-primary text-slate-900 font-extrabold py-3 rounded-xl text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                      Simpan Informasi
                    </button>
                    <button type="button" onClick={() => { setETitle(''); setEContent(''); }} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl text-xs">
                      Reset
                    </button>
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">DAFTAR INFORMASI</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Daftar E-Resource</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{eresources.length} Items</span>
                </div>

                <div className="space-y-3">
                  {eresourcePagination.rows.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-sm">
                              {item.type === 'VIDEO' ? 'play_circle' : item.type === 'PDF' ? 'picture_as_pdf' : 'description'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{item.title}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '08 Jun 2026'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/10 text-blue-500">{item.type || 'TEXT'}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${item.status === 'AKTIF' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                            {item.status || 'AKTIF'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 text-xs">
                        <button onClick={() => alert(`Content Preview: ${item.content || item.title}`)} className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold text-[11px]">Preview</button>
                        <button onClick={() => handleToggleEResourceStatus(item)} className="px-3 py-1 bg-primary text-slate-900 rounded-lg font-bold text-[11px]">Status</button>
                        <button onClick={() => handleDeleteEResource(item.id)} className="px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white rounded-lg font-bold text-[11px]">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={eresourcePagination.safePage}
                  pageCount={eresourcePagination.pageCount}
                  total={eresources.length}
                  pageSize={ERESOURCE_PAGE_SIZE}
                  onPageChange={setEresourcePage}
                  itemLabel="e-resource"
                  plain
                  className="pt-3 border-t border-slate-100 dark:border-slate-800"
                />
              </div>

              {/* Review Moderation Card (Filter & Approvals for Public Portal) */}
              <div className="lg:col-span-12 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">MODERASI ULASAN</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Filter & Persetujuan Ulasan Pengunjung Publik</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Pilih ulasan pengunjung mana yang diizinkan untuk tampil di portal depan publik.</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {reviewPagination.rows.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{rev.visitor_name}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">{rev.visited_location || 'Kebun Kopi'}</p>
                          </div>
                          <div className="flex text-amber-400">
                            {Array.from({ length: rev.rating || 5 }).map((_, rIdx) => (
                              <span key={rIdx} className="material-symbols-outlined text-xs">star</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-2 line-clamp-3">"{rev.comment}"</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${rev.is_approved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {rev.is_approved ? 'TAMPIL PUBLIK' : 'DISEMBUNYIKAN'}
                        </span>

                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleToggleApproveReviewDB(rev.id)} 
                            className={`px-3 py-1 rounded-lg font-extrabold text-[10px] ${rev.is_approved ? 'bg-amber-500/20 text-amber-600' : 'bg-primary text-slate-900'}`}
                          >
                            {rev.is_approved ? 'Sembunyikan' : 'Tampilkan di Depan'}
                          </button>
                          <button 
                            onClick={() => handleDeleteReviewDB(rev.id)} 
                            className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-bold text-[10px]"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={reviewPagination.safePage}
                  pageCount={reviewPagination.pageCount}
                  total={allReviews.length}
                  pageSize={REVIEW_PAGE_SIZE}
                  onPageChange={setReviewPage}
                  itemLabel="ulasan"
                  plain
                  className="pt-3 border-t border-slate-100 dark:border-slate-800"
                />
              </div>
            </div>
          )}

          {/* 4. KELOLA EDUKASI TAB */}
          {activeTab === 'education' && (
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">FORM MODUL</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Tambah/Ubah Modul</h3>
                  </div>
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                </div>

                <form onSubmit={handleAddEducationModule} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">KODE MODUL</label>
                    <input type="text" placeholder="contoh: kopi, tani, jeruk" value={eduSlug} onChange={e => setEduSlug(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">JUDUL MODUL</label>
                    <input type="text" placeholder="Contoh: Pengetahuan Kopi" value={eduTitle} onChange={e => setEduTitle(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">KATEGORI</label>
                      <input type="text" placeholder="Contoh: Sejarah & Asal" value={eduCategory} onChange={e => setEduCategory(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SUB-INFO / META</label>
                      <input type="text" placeholder="Contoh: 12 Modul" value={eduSubInfo} onChange={e => setEduSubInfo(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RINGKASAN DESKRIPSI</label>
                    <textarea rows={3} placeholder="Tulis deskripsi singkat..." value={eduDesc} onChange={e => setEduDesc(e.target.value)} className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" />
                  </div>
                  <button type="submit" className="w-full bg-primary text-slate-900 font-extrabold py-3 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                    Simpan Modul
                  </button>
                </form>
              </div>

              {/* Module Cards List */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">DAFTAR MODUL</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Katalog Modul Aktif</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{eduModules.length} Modul</span>
                </div>

                <div className="space-y-3">
                  {eduModulePagination.rows.map(mod => (
                    <div key={mod.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-4">
                      <img src={mod.image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300'} alt={mod.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{mod.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-primary/10 text-primary">{mod.category || 'KOPI'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium truncate">{mod.sub_info || '12 Modul'}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{mod.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleDeleteEduModule(mod.id)} className="px-3 py-1 bg-slate-900 text-white rounded-lg font-extrabold text-[11px]">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={eduModulePagination.safePage}
                  pageCount={eduModulePagination.pageCount}
                  total={eduModules.length}
                  pageSize={EDU_MODULE_PAGE_SIZE}
                  onPageChange={setEduModulePage}
                  itemLabel="modul"
                  plain
                  className="pt-3 border-t border-slate-100 dark:border-slate-800"
                />
              </div>
            </div>
          )}

          {/* 5. SETTING AKUN TAB */}
          {activeTab === 'accounts' && (
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {newAdminCredential && (
                <div className="lg:col-span-12 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-amber-500 font-extrabold text-sm">
                      <span className="material-symbols-outlined">key</span>
                      Kata Sandi Sementara — tampil sekali
                    </div>
                    <button onClick={() => setNewAdminCredential(null)} className="px-3 py-1 bg-slate-900 text-white rounded-lg font-extrabold text-[10px]">Tutup</button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 font-semibold">
                    Sampaikan kredensial ini kepada pemilik akun. Sistem mewajibkan penggantian kata sandi saat login pertama.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Username</span>
                      <strong className="text-slate-900 dark:text-white">{newAdminCredential.username}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Email</span>
                      <strong className="text-slate-900 dark:text-white">{newAdminCredential.email}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase">Kata Sandi</span>
                      <strong className="text-amber-500">{newAdminCredential.password}</strong>
                    </div>
                  </div>
                </div>
              )}

              {role !== 'village' && (
                <div className="lg:col-span-12 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-bold">
                  <span className="material-symbols-outlined text-base">info</span>
                  <span>Hanya Kepala Desa yang dapat membuat atau mengarsipkan akun admin. Anda dapat melihat daftar akun di panel kanan.</span>
                </div>
              )}

              <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">AKUN ADMIN</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Buat Akun Admin</h3>
                  </div>
                  <span className="material-symbols-outlined text-primary">person_add</span>
                </div>

                <form onSubmit={handleAddAdminAccount} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NAMA</label>
                    <input type="text" placeholder="Nama admin" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">EMAIL</label>
                    <input type="email" placeholder="admin@desa.id" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ROLE</label>
                      <select value={adminRole} onChange={e => setAdminRole(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold">
                        <option value="Admin Desa">Admin Desa</option>
                        <option value="Karang Taruna">Karang Taruna</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">STATUS</label>
                      <div className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-extrabold text-emerald-500">Aktif</div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={role !== 'village'}
                    className="w-full bg-primary text-slate-900 font-extrabold py-3 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Simpan Akun
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">DAFTAR ADMIN</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Daftar Admin</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{adminAccounts.length} Admin</span>
                </div>

                <div className="space-y-3">
                  {adminAccounts.map(acc => (
                    <div key={acc.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{acc.full_name || acc.name || acc.username}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">{acc.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/10 text-blue-500">
                          {String(acc.role).toUpperCase() === 'VILLAGE' ? 'KEPALA DESA' : 'ADMIN'}
                        </span>
                        {acc.must_change_password && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/10 text-amber-500">Wajib Ganti Sandi</span>
                        )}
                        {role === 'village' && (
                          <button onClick={() => handleDeleteAdminAccount(acc.id)} className="px-3 py-1 bg-slate-900 text-white rounded-lg font-extrabold text-[11px]">Arsipkan</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. SPONSORSHIP MANAGEMENT TAB */}
          {activeTab === 'sponsorship' && (
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Proposals List */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ALUR KURASI &amp; PERSETUJUAN</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Sponsor Masuk</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{sponsorshipList.length} Proposal</span>
                </div>

                <div className="space-y-3">
                  {sponsorshipList.length === 0 && (
                    <div className="py-10 text-center">
                      <span className="material-symbols-outlined text-3xl text-slate-300">inbox</span>
                      <p className="text-xs font-bold text-slate-400 mt-2">Belum ada proposal sponsorship yang masuk.</p>
                    </div>
                  )}

                  {sponsorshipPagination.rows.map(spon => {
                    const status = String(spon.status || 'PENDING').toUpperCase();
                    const href = proposalHref(spon.proposal_url);
                    return (
                      <div key={spon.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {spon.sponsor_name || spon.company_name || 'PT Mitra Desa'}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              {spon.contact || 'Kontak belum diisi'} • Petani: {spon.plot_owner || '-'}
                            </p>
                            <p className="text-sm font-extrabold text-primary mt-1">
                              Rp {Number(spon.funding_amount || spon.amount || 0).toLocaleString('id-ID')}
                            </p>
                            {spon.coffee_type && (
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {spon.coffee_type} • {spon.elevation ? `${spon.elevation} MDPL` : 'elevasi -'}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              status === 'DISBURSED' ? 'bg-blue-500/10 text-blue-500' :
                              status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                              status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' :
                              status === 'CURATED' ? 'bg-sky-500/10 text-sky-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {SPONSORSHIP_STATUS_LABELS[status] || status}
                            </span>

                            {href && (
                              <a href={href} target="_blank" rel="noreferrer" className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                                Lihat Proposal PDF
                              </a>
                            )}

                            {status === 'PENDING' && role === 'admin' && (
                              <div className="flex gap-2">
                                <button onClick={() => runSponsorshipAction(curateSponsorship, spon.id)} className="px-3.5 py-1.5 bg-primary text-slate-900 rounded-xl font-extrabold text-xs shadow-sm hover:bg-primary/90">Kurasi &amp; Teruskan</button>
                                <button onClick={() => runSponsorshipAction(rejectSponsorship, spon.id, 'pending')} className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-extrabold text-xs">Tolak</button>
                              </div>
                            )}

                            {status === 'CURATED' && role === 'village' && (
                              <div className="flex gap-2">
                                <button onClick={() => runSponsorshipAction(approveSponsorship, spon.id)} className="px-3.5 py-1.5 bg-primary text-slate-900 rounded-xl font-extrabold text-xs shadow-sm hover:bg-primary/90">Setujui &amp; TTD</button>
                                <button onClick={() => runSponsorshipAction(rejectSponsorship, spon.id, 'curated')} className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-extrabold text-xs">Tolak</button>
                              </div>
                            )}

                            {status === 'APPROVED' && role === 'village' && (
                              <button onClick={() => runSponsorshipAction(disburseSponsorship, spon.id)} className="px-3.5 py-1.5 bg-blue-500 text-white rounded-xl font-extrabold text-xs shadow-sm hover:bg-blue-600">Cairkan Dana</button>
                            )}

                            {(status === 'PENDING' || status === 'CURATED') && role !== 'admin' && role !== 'village' && (
                              <span className="text-[10px] text-slate-400 font-semibold">Menunggu perangkat desa</span>
                            )}
                          </div>
                        </div>

                        {/* Audit trail */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold space-y-0.5">
                          <div>Diajukan: {spon.created_at ? new Date(spon.created_at).toLocaleString('id-ID') : '-'}</div>
                          {spon.curated_at && <div>Kurasi: {spon.curated_by_name || 'Admin'} • {new Date(spon.curated_at).toLocaleString('id-ID')}</div>}
                          {spon.approved_at && <div>Disetujui: {spon.approved_by_name || 'Kepala Desa'} • {new Date(spon.approved_at).toLocaleString('id-ID')}</div>}
                          {spon.disbursed_at && <div>Dicairkan: {spon.disbursed_by_name || 'Kepala Desa'} • {new Date(spon.disbursed_at).toLocaleString('id-ID')}</div>}
                          {spon.rejected_at && <div className="text-rose-400">Ditolak: {spon.rejected_by_name || 'Perangkat Desa'} — {spon.rejection_reason || 'tanpa alasan'}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  page={sponsorshipPagination.safePage}
                  pageCount={sponsorshipPagination.pageCount}
                  total={sponsorshipList.length}
                  pageSize={SPONSORSHIP_PAGE_SIZE}
                  onPageChange={setSponsorshipPage}
                  itemLabel="proposal"
                  plain
                  className="pt-3 border-t border-slate-100 dark:border-slate-800"
                />
              </div>

              {/* Right Column: Approval Summary */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">PERSETUJUAN</span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Ringkasan</h3>

                  <div className="mt-6 space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/10 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Kurasi / Persetujuan</div>
                      <div className="text-2xl font-extrabold text-amber-500">{pendingSponsorsCount}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/10 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Disetujui</div>
                      <div className="text-2xl font-extrabold text-emerald-500">{approvedSponsorsCount}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/10 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Dicairkan</div>
                      <div className="text-2xl font-extrabold text-blue-500">{disbursedSponsorsCount}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/10 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Ditolak</div>
                      <div className="text-2xl font-extrabold text-rose-500">{rejectedSponsorsCount}</div>
                    </div>
                  </div>

                  <p className="mt-4 text-[10px] font-semibold text-slate-400 leading-relaxed">
                    Alur: proposal masuk → dikurasi Karang Taruna → disetujui Kepala Desa → dana dicairkan.
                    Setiap tahap menyimpan catatan petugas dan waktu.
                  </p>
                </div>

                <button
                  onClick={() => setActiveView('sponsor')}
                  className="w-full bg-primary hover:bg-primary/90 text-slate-900 p-3.5 rounded-xl font-extrabold text-xs shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Buka Portal Sponsor Publik</span>
                </button>
              </div>
            </div>
          )}

          {/* 7. PENGATURAN DESA TAB */}
          {activeTab === 'settings' && (
            <div className="p-6 sm:p-8 max-w-4xl space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">RINGKASAN DATA</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Status Data Desa</h3>
                <p className="text-[11px] text-slate-500">
                  Angka di bawah dihitung dari data desa yang tersimpan. Tidak ada data contoh atau nilai bawaan.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Plot Lahan', value: dashboardKpi.plots },
                    { label: `Batch Panen (${CHART_RANGES.find(r => r.id === chartRange)?.label || '7 Hari'})`, value: dashboardKpi.batches },
                    { label: 'Sponsor Aktif', value: dashboardKpi.active_sponsors },
                    { label: 'Lahan Waspada', value: dashboardKpi.alert_plots },
                    { label: 'Pemandu Menunggu', value: dashboardKpi.pending_guides },
                    { label: 'SOS Aktif', value: dashboardKpi.active_sos },
                    { label: 'Destinasi', value: destinations.length },
                    { label: 'Akun Admin', value: adminAccounts.length }
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                      <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{formatNumber(item.value)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Sinkronisasi Data</div>
                    <div className="text-[10px] text-slate-400">
                      Terakhir dimuat: {dashboardSummary?.generated_at
                        ? new Date(dashboardSummary.generated_at).toLocaleString('id-ID')
                        : 'belum tersedia'}
                    </div>
                  </div>
                  <button onClick={refreshDashboard} className="px-3 py-1 bg-primary text-slate-900 font-extrabold text-xs rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Muat Ulang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 8. PROFIL SOFTWARE HOUSE */}
          {activeTab === 'profile' && (
            <div className="p-6 sm:p-8">
              <React.Suspense fallback={<div className="text-xs font-bold text-slate-400">Memuat profil...</div>}>
                <Profile />
              </React.Suspense>
            </div>
          )}

        </div>

      </main>

    </div>
  );
}
