import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CoffeeMap from './CoffeeMap';
import DetailsPanel from './DetailsPanel';
import AdminPlotForm from './AdminPlotForm';
import Profile from './Profile';
import SCMHubView from './SCMHubView';

export default function DashboardView({ 
  setActiveView, 
  role, 
  handleLogout, 
  theme, 
  toggleTheme, 
  sponsorships, 
  setSponsorships,
  approveSponsorship,

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
  const [kpiSda, setKpiSda] = useState(12);
  const [kpiUmkm, setKpiUmkm] = useState(38);
  const [kpiTx, setKpiTx] = useState(2);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

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

  // Sponsorship State
  const [localSponsors, setLocalSponsors] = useState([]);

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

  const handleAddOrUpdateDestination = (e) => {
    e.preventDefault();
    if (!destName) return;

    const hlArray = destHighlights.split(',').map(s => s.trim()).filter(Boolean);

    if (editingDestId) {
      // Update existing destination
      const updated = destinations.map(d => d.id === editingDestId ? {
        ...d,
        name: destName,
        tag: destTag,
        elevation: destElevation,
        price: destPrice,
        hours: destHours,
        img: destImg,
        desc: destDesc,
        highlights: hlArray.length > 0 ? hlArray : ['Wisata Desa Kucur']
      } : d);
      if (setDestinations) setDestinations(updated);
      showToast('✓ Destinasi Wisata berhasil diperbarui!');
      setEditingDestId(null);
    } else {
      // Create new destination
      const newDest = {
        id: Date.now(),
        name: destName,
        tag: destTag,
        elevation: destElevation,
        price: destPrice,
        hours: destHours,
        img: destImg,
        desc: destDesc,
        highlights: hlArray.length > 0 ? hlArray : ['Wisata Desa Kucur']
      };
      if (setDestinations) setDestinations([...destinations, newDest]);
      showToast('✓ Destinasi Wisata baru berhasil ditambahkan!');
    }

    setDestName('');
    setDestDesc('');
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

  const handleDeleteDestination = (id) => {
    if (window.confirm('Hapus destinasi wisata ini dari portal publik?')) {
      const updated = destinations.filter(d => d.id !== id);
      if (setDestinations) setDestinations(updated);
      showToast('✓ Destinasi wisata berhasil dihapus!');
    }
  };

  // Fetch initial data from PostgreSQL Backend
  useEffect(() => {
    fetchEResources();
    fetchEducationModules();
    fetchAdminUsers();
    fetchSponsorships();
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reviews');
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
      const res = await fetch(`http://localhost:5000/api/reviews/${id}/approve`, { method: 'PUT' });
      if (res.ok) {
        showToast('✓ Status publikasi ulasan diperbarui!');
        fetchReviews();
      }
    } catch (err) {
      showToast('⚠️ Gagal memperbarui status ulasan.');
    }
  };

  const handleDeleteReviewDB = async (id) => {
    if (!window.confirm('Hapus ulasan pengunjung ini dari database?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${id}`, { method: 'DELETE' });
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
      const res = await fetch('http://localhost:5000/api/eresources');
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
      const res = await fetch('http://localhost:5000/api/education');
      if (res.ok) {
        const data = await res.json();
        setEduModules(data);
      }
    } catch (err) {
      console.error('Fetch Education failed:', err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/admins');
      if (res.ok) {
        const data = await res.json();
        setAdminAccounts(data);
      }
    } catch (err) {
      console.error('Fetch Admins failed:', err);
    }
  };

  const fetchSponsorships = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/sponsorships');
      if (res.ok) {
        const data = await res.json();
        setLocalSponsors(data);
      }
    } catch (err) {
      console.error('Fetch Sponsorships failed:', err);
    }
  };

  const pendingSponsorsCount = localSponsors.filter(s => s.status === 'PENDING' || s.status === 'pending').length;
  const approvedSponsorsCount = localSponsors.filter(s => s.status === 'APPROVED' || s.status === 'approved').length;
  const rejectedSponsorsCount = localSponsors.filter(s => s.status === 'REJECTED' || s.status === 'rejected').length;

  // Add E-Resource (DB POST)
  const handleAddEResource = async (e) => {
    e.preventDefault();
    if (!eTitle) return;
    try {
      const res = await fetch('http://localhost:5000/api/eresources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eTitle,
          type: eType.toUpperCase(),
          status: eStatus.toUpperCase(),
          content: eContent
        })
      });
      if (res.ok) {
        showToast('✓ E-Resource berhasil disimpan ke Database!');
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
      const res = await fetch(`http://localhost:5000/api/eresources/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Status E-Resource diperbarui menjadi ${newStatus}`);
        fetchEResources();
      }
    } catch (err) {
      showToast('⚠️ Gagal memperbarui status.');
    }
  };

  // Delete E-Resource (DB DELETE)
  const handleDeleteEResource = async (id) => {
    if (!window.confirm('Hapus item E-Resource ini dari database?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/eresources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('✓ Item E-Resource berhasil dihapus dari Database');
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
      const res = await fetch('http://localhost:5000/api/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`http://localhost:5000/api/education/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('✓ Modul berhasil dihapus dari Database');
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
    try {
      const res = await fetch('http://localhost:5000/api/users/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          role: adminRole === 'Admin Desa' ? 'DESA' : 'KARANGTARUNA'
        })
      });
      if (res.ok) {
        showToast('✓ Akun Admin baru berhasil dibuat!');
        setAdminName(''); setAdminEmail('');
        fetchAdminUsers();
      }
    } catch (err) {
      showToast('⚠️ Gagal membuat akun admin.');
    }
  };

  // Delete Admin Account (DB DELETE)
  const handleDeleteAdminAccount = async (id) => {
    if (!window.confirm('Hapus akun admin ini dari database?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/admins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('✓ Akun Admin berhasil dihapus');
        fetchAdminUsers();
      }
    } catch (err) {
      showToast('⚠️ Gagal menghapus akun.');
    }
  };

  // Approve Sponsorship (DB PUT)
  const handleApproveSponsorDB = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sponsorships/${id}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showToast('✓ Sponsorship disetujui & TTD sah!');
        fetchSponsorships();
      } else {
        // Fallback local update
        setLocalSponsors(localSponsors.map(s => s.id === id ? { ...s, status: 'APPROVED' } : s));
        showToast('✓ Sponsorship disetujui!');
      }
    } catch (err) {
      setLocalSponsors(localSponsors.map(s => s.id === id ? { ...s, status: 'APPROVED' } : s));
      showToast('✓ Sponsorship disetujui!');
    }
  };

  const handleSeedDemo = () => {
    setKpiSda(18);
    setKpiUmkm(45);
    setKpiTx(8);
    setDemoLoaded(true);
    showToast('✓ Data demo terbaru berhasil dimuat!');
    setTimeout(() => setDemoLoaded(false), 3000);
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

      {/* DESKTOP LEFT SIDEBAR: DASHBOARD PERANGKAT DESA */}
      <aside className="hidden lg:flex w-72 lg:w-80 bg-white dark:bg-slate-950 border-r border-primary/10 flex-col shrink-0 h-full">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <span className="material-symbols-outlined text-slate-900 font-bold">shield_person</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                PERANGKAT DESA
              </div>
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                Dashboard LENTERA
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Buttons */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          {[
            { id: 'dashboard',  label: 'Dashboard',             icon: 'dashboard' },
            { id: 'gis',        label: 'Peta Lahan & GIS',       icon: 'map' },
            { id: 'scm',        label: 'Penyimpanan Panen',      icon: 'inventory_2' },
            { id: 'navigation', label: 'Kelola Wisata & Guide', icon: 'explore' },
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary text-slate-900 text-[10px] font-extrabold rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Account & Mode */}
        <div className="mt-auto p-4 border-t border-primary/10 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
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
              className="flex-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
              <span>Mode</span>
            </button>

            <button
              onClick={() => setActiveView('home')}
              className="flex-1 px-3 py-2 rounded-xl bg-primary text-slate-900 font-extrabold text-xs text-center hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">public</span>
              <span>Ke Publik</span>
            </button>
          </div>
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
                { id: 'scm',        label: 'SCM Supply Chain',      icon: 'inventory_2' },
                { id: 'navigation', label: 'Kelola Wisata & Guide', icon: 'explore' },
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
                MONITORING & APPROVAL
              </div>
              <h1 className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white capitalize truncate">
                {activeTab === 'dashboard' ? 'Dashboard' : 
                 activeTab === 'gis' ? 'Peta Lahan & GIS' :
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
              onClick={handleSeedDemo}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-slate-900 font-extrabold text-xs shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 transform hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-sm">database</span>
              <span>{demoLoaded ? 'Data Terisi!' : 'Isi Data Demo'}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 overflow-y-auto relative flex flex-col">

          {/* 1. DASHBOARD OVERVIEW TAB */}
          {activeTab === 'dashboard' && (
            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">SDA</span>
                    <span className="material-symbols-outlined text-emerald-500">forest</span>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{kpiSda}</div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">Kategori terdata</div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">UMKM</span>
                    <span className="material-symbols-outlined text-amber-500">storefront</span>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{kpiUmkm}</div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">Pelaku aktif</div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">TRANSAKSI</span>
                    <span className="material-symbols-outlined text-blue-500">payments</span>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{kpiTx}</div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">Masuk (hari ini)</div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">SPONSOR</span>
                    <span className="material-symbols-outlined text-primary">notifications</span>
                  </div>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">{pendingSponsorsCount}</div>
                  <div className="mt-1 text-xs text-slate-500 font-medium">Pending approval</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">GRAFIK</span>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                        Ringkasan Sumberdaya & Transaksi
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">7 Hari</span>
                  </div>

                  <div className="mt-6 h-52 flex items-end gap-3 sm:gap-4 px-2">
                    {[
                      { day: 'Sen', height: 'h-36' },
                      { day: 'Sel', height: 'h-20' },
                      { day: 'Rab', height: 'h-44' },
                      { day: 'Kam', height: 'h-28' },
                      { day: 'Jum', height: 'h-36' },
                      { day: 'Sab', height: 'h-24' },
                      { day: 'Min', height: 'h-48' },
                    ].map((bar, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-primary/10 rounded-xl overflow-hidden p-0.5 flex flex-col justify-end min-h-[140px]">
                          <div className={`w-full ${bar.height} bg-primary rounded-xl shadow-sm`} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{bar.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">STATUS</span>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Approval</h3>
                      </div>
                      <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SPONSOR</span>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{pendingSponsorsCount}</div>
                        <div className="mt-1 text-xs text-amber-500 font-semibold">Menunggu</div>
                      </div>

                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-900/60 border border-primary/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-RESOURCE</span>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{eresources.length}</div>
                        <div className="mt-1 text-xs text-emerald-500 font-semibold">Aktif (DB)</div>
                      </div>
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
                onOpenAddPlot={() => {
                  setNewPlotCoords(newPlotCoords || { lat: -7.9152, lng: 112.5201 });
                  setShowAddForm(true);
                }}
              />

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

              <AdminPlotForm 
                newPlotCoords={newPlotCoords}
                setNewPlotCoords={setNewPlotCoords}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
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
                formDesc={formDesc}
                setFormDesc={setFormDesc}
                handleAddPlot={handleAddPlot}
              />

              <DetailsPanel 
                selectedPlot={selectedPlot}
                setSelectedPlot={setSelectedPlot}
                role={role}
                token={token}
                plots={plots}
                setPlots={setPlots}
                inDashboard={true}
              />
            </div>
          )}

          {/* 1.5. SCM SUPPLY CHAIN MANAGEMENT HUB TAB */}
          {activeTab === 'scm' && (
            <SCMHubView 
              onSelectPlotOnMap={(id) => {
                const targetPlot = plots.find(p => p.id === id);
                if (targetPlot) setSelectedPlot(targetPlot);
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
                            const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: formData });
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
                  {destinations.map(dest => (
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
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">UNGGAH (POSTGRESQL)</span>
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
                      Simpan ke DB
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
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">POSTGRESQL DATA</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Daftar E-Resource</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{eresources.length} Items</span>
                </div>

                <div className="space-y-3">
                  {eresources.map((item) => (
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
              </div>

              {/* Review Moderation Card (Filter & Approvals for Public Portal) */}
              <div className="lg:col-span-12 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">MODERASI ULASAN</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Filter & Approval Ulasan Pengunjung Publik</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Pilih ulasan pengunjung mana yang diizinkan untuk tampil di portal depan publik.</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {allReviews.map((rev) => (
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
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">FORM MODUL (DB)</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Tambah/Ubah Modul</h3>
                  </div>
                  <span className="material-symbols-outlined text-primary">edit_note</span>
                </div>

                <form onSubmit={handleAddEducationModule} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SLUG / ID UNIK</label>
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
                    Simpan Modul ke DB
                  </button>
                </form>
              </div>

              {/* Module Cards List */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">POSTGRESQL DATA</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Katalog Modul Aktif</h3>
                  </div>
                  <span className="text-xs font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{eduModules.length} Modul</span>
                </div>

                <div className="space-y-3">
                  {eduModules.map(mod => (
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
              </div>
            </div>
          )}

          {/* 5. SETTING AKUN TAB */}
          {activeTab === 'accounts' && (
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">ADMIN (DB)</span>
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
                  <button type="submit" className="w-full bg-primary text-slate-900 font-extrabold py-3 rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                    Simpan Akun ke DB
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">POSTGRESQL USERS</span>
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
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/10 text-blue-500">{acc.role || 'DESA'}</span>
                        <button onClick={() => handleDeleteAdminAccount(acc.id)} className="px-3 py-1 bg-slate-900 text-white rounded-lg font-extrabold text-[11px]">Hapus</button>
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
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">NOTIFIKASI (POSTGRESQL)</span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Sponsor Masuk</h3>
                  </div>
                  <span className="material-symbols-outlined text-primary">notifications</span>
                </div>

                <div className="space-y-3">
                  {localSponsors.map(spon => (
                    <div key={spon.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{spon.name || spon.sponsor_name || 'PT Mitra Desa'}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{spon.contact || 'Nadya • 081111111111'}</p>
                        <p className="text-sm font-extrabold text-primary mt-1">Rp {parseInt(spon.funding_amount || spon.amount || 15000000).toLocaleString('id-ID')}</p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          spon.status === 'APPROVED' || spon.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                          spon.status === 'REJECTED' || spon.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {spon.status}
                        </span>

                        {(spon.status === 'PENDING' || spon.status === 'pending') ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveSponsorDB(spon.id)} className="px-3.5 py-1.5 bg-primary text-slate-900 rounded-xl font-extrabold text-xs shadow-sm hover:bg-primary/90">Approve & TTD</button>
                            <button onClick={() => setLocalSponsors(localSponsors.map(s => s.id === spon.id ? { ...s, status: 'REJECTED' } : s))} className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-extrabold text-xs">Tolak</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">Sah & Terverifikasi</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Approval Summary */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">APPROVAL</span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Ringkasan</h3>

                  <div className="mt-6 space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/10">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">PENDING</div>
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{pendingSponsorsCount}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/10">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">APPROVED</div>
                      <div className="text-2xl font-extrabold text-emerald-500 mt-1">{approvedSponsorsCount}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-primary/10">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">REJECTED</div>
                      <div className="text-2xl font-extrabold text-rose-500 mt-1">{rejectedSponsorsCount}</div>
                    </div>
                  </div>
                </div>

                <button onClick={() => {
                  setLocalSponsors([{ id: Date.now(), name: `CV Agro Kopi Kucur #${localSponsors.length + 1}`, contact: 'Pak Slamet • 0812998877', amount: 20000000, status: 'PENDING' }, ...localSponsors]);
                  showToast('✓ Sponsor demo ditambahkan!');
                }} className="w-full bg-primary hover:bg-primary/90 text-slate-900 p-3.5 rounded-xl font-extrabold text-xs shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Tambah Sponsor Demo</span>
                </button>
              </div>
            </div>
          )}

          {/* 7. PENGATURAN DESA TAB */}
          {activeTab === 'settings' && (
            <div className="p-6 sm:p-8 max-w-4xl space-y-6">
              <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-6 shadow-sm space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">SETTING</span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Admin Karang Taruna</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Penetapan Admin Aktif</h4>
                    <p className="text-[11px] text-slate-500">Pilih admin karang taruna yang bertugas mengelola kegiatan dan pembaruan konten.</p>
                    <select className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold">
                      <option>Admin Desa Kucur (kades@kucur.id)</option>
                      <option>Karang Taruna Kucur (karangtaruna@kucur.id)</option>
                    </select>
                    <button onClick={() => showToast('✓ Pengaturan Admin Karang Taruna tersimpan!')} className="w-full bg-primary text-slate-900 font-extrabold py-2.5 rounded-xl text-xs shadow-sm">
                      Simpan Pengaturan
                    </button>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Ringkasan Sistem</h4>
                    <p className="text-[11px] text-slate-500">Kontrol cepat untuk pemantauan eksekutif.</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="text-xs font-bold">Sinkron Data</div>
                          <div className="text-[10px] text-slate-400">Refresh data PostgreSQL</div>
                        </div>
                        <button onClick={() => { fetchEResources(); fetchEducationModules(); fetchAdminUsers(); fetchSponsorships(); showToast('✓ Data PostgreSQL disinkronkan!'); }} className="px-3 py-1 bg-primary text-slate-900 font-extrabold text-xs rounded-lg">Refresh</button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="text-xs font-bold">Reset State</div>
                          <div className="text-[10px] text-slate-400">Reset indikator lokal</div>
                        </div>
                        <button onClick={() => { setKpiSda(12); setKpiUmkm(38); setKpiTx(2); showToast('✓ State direset!'); }} className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded-lg">Reset</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. PROFIL SOFTWARE HOUSE */}
          {activeTab === 'profile' && (
            <div className="p-6 sm:p-8"><Profile /></div>
          )}

        </div>

      </main>

    </div>
  );
}
