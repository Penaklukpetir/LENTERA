import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './lib/api';
import Header from './components/Header';
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import DetailsPanel from './components/DetailsPanel';
import SponsorModal from './components/SponsorModal';
import LoginModal from './components/LoginModal';
import AdminLoginModal from './components/AdminLoginModal';
import BottomNav from './components/BottomNav';
import SosButton from './components/SosButton';
import ChangePasswordModal from './components/ChangePasswordModal';

const CoffeeMap = React.lazy(() => import('./components/CoffeeMap'));
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const Education = React.lazy(() => import('./components/Education'));
const Navigation = React.lazy(() => import('./components/Navigation'));
const EResourceView = React.lazy(() => import('./components/EResourceView'));
const SponsorView = React.lazy(() => import('./components/SponsorView'));
const Profile = React.lazy(() => import('./components/Profile'));


export default function App() {
  const [theme, setTheme] = useState('light');
  const [role, setRole] = useState('visitor'); // visitor, admin, village
  const [token, setToken] = useState(null); // Auth JWT Token
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [activeView, setActiveView] = useState('home'); // home, location, education, navigation, eresource, sponsor, profile
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plots, setPlots] = useState([]);
  
  // Admin Form State for mapping new plots
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlotCoords, setNewPlotCoords] = useState(null);
  const [formFarmer, setFormFarmer] = useState('');
  const [formType, setFormType] = useState('Robusta');
  const [formCount, setFormCount] = useState(100);
  const [formElevation, setFormElevation] = useState(800);
  const [formArea, setFormArea] = useState(1000);
  const [formPlantingYear, setFormPlantingYear] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Login Modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  const handleLogout = () => {
    setRole('visitor');
    setToken(null);
    setMustChangePassword(false);
    setActiveView('home');
    setShowAddForm(false);
  };

  // Destinasi Wisata Tani & Agrowisata State (fetched from PostgreSQL)
  const [destinations, setDestinations] = useState([]);

  // B2B Sponsorship State
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorships, setSponsorships] = useState([]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [sponsorContact, setSponsorContact] = useState('');
  const [selectedSponsorPlot, setSelectedSponsorPlot] = useState(1);
  const [sponsorAmount, setSponsorAmount] = useState(5000000);
  const [proposalFile, setProposalFile] = useState(null);

  // Load plots, sponsorships, and destinations from backend API
  const loadData = async () => {
    try {
      const [plotsRes, sponRes, destRes] = await Promise.all([
        fetch(`${API_BASE_URL}/plots`),
        fetch(`${API_BASE_URL}/sponsorships`),
        fetch(`${API_BASE_URL}/destinations`)
      ]);

      if (plotsRes.ok) {
        const plotsData = await plotsRes.json();
        setPlots(plotsData);
        if (plotsData.length > 0) {
          setSelectedSponsorPlot((current) =>
            plotsData.some((p) => p.id === current) ? current : plotsData[0].id
          );
        }
      }

      if (sponRes.ok) {
        setSponsorships(await sponRes.json());
      }

      if (destRes.ok) {
        const destData = await destRes.json();
        setDestinations(destData.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat data dari backend:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleAuthenticated = ({ token: nextToken, user }) => {
    setToken(nextToken);
    setMustChangePassword(Boolean(user?.must_change_password));

    if (user?.role === 'village' || user?.role === 'admin') {
      setRole(user.role);
      setActiveView('dashboard');
    } else {
      setRole('visitor');
      setActiveView('sponsor');
    }
  };

  // Toggle App Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Handle map click to drop coordinate in admin mode
  const handleMapClick = (latlng) => {
    setNewPlotCoords(latlng);
    setShowAddForm(true);
  };

  // Submit new plot coordinate mapping to PostgreSQL
  const handleAddPlot = async (e) => {
    e.preventDefault();
    if (!formFarmer || !newPlotCoords) return;

    const payload = {
      farmer_name: formFarmer,
      lat: newPlotCoords.lat,
      lng: newPlotCoords.lng,
      coffee_type: formType,
      tree_count: Number(formCount),
      elevation: Number(formElevation),
      land_area: Number(formArea),
      planting_year: formPlantingYear === '' ? null : Number(formPlantingYear),
      description: formDesc
    };

    try {
      const res = await fetch(`${API_BASE_URL}/plots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setPlots([...plots, data.plot]);
        setSelectedPlot(data.plot);
        setShowAddForm(false);
        setNewPlotCoords(null);
        setFormFarmer('');
        setFormArea(1000);
        setFormPlantingYear('');
        setFormDesc('');
        console.log('Spatiogeometric plot registered successfully in database.');
      } else {
        const errData = await res.json();
        alert(`Gagal merekam data spasial: ${errData.error}`);
      }
    } catch (err) {
      console.error('Gagal menyimpan plot ke backend:', err);
      alert('Koneksi terputus. Plot belum tersimpan.');
    }
  };

  // Submit sponsorship proposal B2B (multipart PDF upload + company identity)
  const handleSponsorSubmit = async (e) => {
    e.preventDefault();

    if (!proposalFile) {
      alert('Dokumen proposal PDF wajib diunggah.');
      return;
    }

    const formData = new FormData();
    formData.append('sponsor_name', newSponsorName.trim());
    formData.append('contact', sponsorContact.trim());
    formData.append('plot_id', String(Number(selectedSponsorPlot)));
    formData.append('funding_amount', String(Number(sponsorAmount)));
    formData.append('proposal', proposalFile);

    try {
      const res = await fetch(`${API_BASE_URL}/sponsorships`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Gagal mengajukan proposal: ${data.error || 'Terjadi kesalahan.'}`);
        return;
      }

      setSponsorships((current) => [data.sponsorship, ...current]);
      setShowSponsorModal(false);
      setNewSponsorName('');
      setSponsorContact('');
      setProposalFile(null);
      alert('Proposal kemitraan terkirim dan menunggu kurasi Karang Taruna.');
    } catch (err) {
      console.error('Gagal mengirim proposal sponsorship:', err);
      alert('Koneksi terputus. Proposal belum terkirim.');
    }
  };

  const refreshSponsorships = async () => {
    const res = await fetch(`${API_BASE_URL}/sponsorships`);
    if (res.ok) setSponsorships(await res.json());
  };

  const sponsorshipTransition = async (id, action, body = {}) => {
    if (!token) {
      alert('Sesi otentikasi tidak tersedia. Silakan masuk kembali.');
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/sponsorships/${id}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        alert(`Gagal memproses proposal: ${data.error || 'Terjadi kesalahan.'}`);
        return false;
      }

      await refreshSponsorships();
      return true;
    } catch (err) {
      console.error('Sponsorship transition failed:', err);
      alert('Koneksi terputus. Status proposal belum berubah.');
      return false;
    }
  };

  const curateSponsorship = (id) => sponsorshipTransition(id, 'curate');
  const approveSponsorship = (id) => sponsorshipTransition(id, 'approve');
  const disburseSponsorship = (id) => sponsorshipTransition(id, 'disburse');
  const rejectSponsorship = (id, stage = 'pending') => {
    const reason = window.prompt('Alasan penolakan proposal wajib diisi:');
    if (!reason || !reason.trim()) return false;
    return sponsorshipTransition(id, stage === 'curated' ? 'reject-curated' : 'reject', {
      reason: reason.trim()
    });
  };

  const floatingUiHidden = showSponsorModal || showLoginModal || showAdminLoginModal || (mustChangePassword && token);

  // Filter logic
  const filteredPlots = plots.filter(plot => {
    const matchesSearch = plot.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (plot.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || plot.coffee_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', maxWidth: '100%' }} className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200 overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <Header 
        activeView={activeView}
        setActiveView={setActiveView}
        role={role}
        handleLogout={handleLogout}
        setShowLoginModal={setShowLoginModal}
        setShowAdminLoginModal={setShowAdminLoginModal}
        theme={theme} 
        toggleTheme={toggleTheme} 
      />

      {/* CORE CONTAINER */}
      <div className="app-container flex-grow overflow-hidden flex flex-col">
        <React.Suspense fallback={<div className="flex-1 flex items-center justify-center py-24 text-xs font-bold text-slate-400">Memuat halaman...</div>}>
        
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && <Home setActiveView={setActiveView} destinations={destinations} />}

        {/* VIEW 2: LOCATION MAP */}
        {activeView === 'location' && (
          <div className="flex-1 flex flex-row overflow-hidden relative">
            {/* Left Sidebar Panel */}
            <Sidebar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              filteredPlots={filteredPlots}
              selectedPlot={selectedPlot}
              setSelectedPlot={setSelectedPlot}
              role={role}
            />

            {/* Central Leaflet Map Container (Public Tourist View - Strictly Read-Only) */}
            <CoffeeMap 
              filteredPlots={filteredPlots}
              selectedPlot={selectedPlot}
              setSelectedPlot={setSelectedPlot}
              role="tourist"
              handleMapClick={() => {}}
              showAddForm={false}
            />

            <DetailsPanel 
              selectedPlot={selectedPlot}
              setSelectedPlot={setSelectedPlot}
              role={role}
              token={token}
              plots={plots}
              setPlots={setPlots}
            />
          </div>
        )}

        {/* VIEW: DASHBOARD PERANGKAT DESA (STANDALONE FULL LAYOUT) */}
        {activeView === 'dashboard' && (
          <DashboardView 
            setActiveView={setActiveView}
            role={role}
            handleLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
            sponsorships={sponsorships}
            setSponsorships={setSponsorships}
            approveSponsorship={approveSponsorship}
            curateSponsorship={curateSponsorship}
            rejectSponsorship={rejectSponsorship}
            disburseSponsorship={disburseSponsorship}
            setShowSponsorModal={setShowSponsorModal}

            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterType={filterType}
            setFilterType={setFilterType}
            filteredPlots={filteredPlots}
            selectedPlot={selectedPlot}
            setSelectedPlot={setSelectedPlot}
            handleMapClick={handleMapClick}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            newPlotCoords={newPlotCoords}
            setNewPlotCoords={setNewPlotCoords}
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
            token={token}
            plots={plots}
            setPlots={setPlots}
            destinations={destinations}
            setDestinations={setDestinations}
          />
        )}

        {/* VIEW 3: EDUCATION */}
        {activeView === 'education' && <Education />}

        {/* VIEW 4: NAVIGATION */}
        {activeView === 'navigation' && <Navigation destinations={destinations} />}

        {/* VIEW 5: E-RESOURCE LIBRARY */}
        {activeView === 'eresource' && <EResourceView />}

        {/* VIEW 6: SPONSOR B2B PARTNERSHIP HUB */}
        {activeView === 'sponsor' && (
          <SponsorView 
            role={role}
            sponsorships={sponsorships}
            setShowSponsorModal={setShowSponsorModal}
            approveSponsorship={approveSponsorship}
          />
        )}

        {/* VIEW 7: PROFIL PAGE */}
        {activeView === 'profile' && <Profile />}

        </React.Suspense>
      </div>

      {/* POPUP MODAL: SPONSOR PROPOSAL SUBMISSION */}
      {showSponsorModal && (
        <SponsorModal 
          plots={plots}
          newSponsorName={newSponsorName}
          setNewSponsorName={setNewSponsorName}
          sponsorContact={sponsorContact}
          setSponsorContact={setSponsorContact}
          selectedSponsorPlot={selectedSponsorPlot}
          setSelectedSponsorPlot={setSelectedSponsorPlot}
          sponsorAmount={sponsorAmount}
          setSponsorAmount={setSponsorAmount}
          proposalFile={proposalFile}
          setProposalFile={setProposalFile}
          handleSponsorSubmit={handleSponsorSubmit}
          setShowSponsorModal={setShowSponsorModal}
        />
      )}

      {/* POPUP MODAL: LOGIN WISATAWAN & PUBLIK */}
      {showLoginModal && (
        <LoginModal 
          setShowLoginModal={setShowLoginModal}
          onAuthenticated={handleAuthenticated}
          openAdminModal={() => setShowAdminLoginModal(true)}
        />
      )}

      {/* POPUP MODAL: DEDICATED PORTAL LOGIN PERANGKAT DESA & ADMIN */}
      {showAdminLoginModal && (
        <AdminLoginModal 
          setShowAdminLoginModal={setShowAdminLoginModal}
          onAuthenticated={handleAuthenticated}
        />
      )}

      {/* FORCED PASSWORD CHANGE FOR NEWLY PROVISIONED ACCOUNTS */}
      {mustChangePassword && token && (
        <ChangePasswordModal
          token={token}
          onChanged={() => setMustChangePassword(false)}
          onLogout={handleLogout}
        />
      )}

      {/* GLOBAL FLOATING SOS EMERGENCY BUTTON (PUBLIC TOURIST ONLY) */}
      {activeView !== 'dashboard' && role === 'visitor' && !floatingUiHidden && <SosButton />}

      {/* FLOATING MOBILE BOTTOM NAVIGATION DOCK BAR (ONLY FOR PUBLIC/TOURIST VIEWS) */}
      {activeView !== 'dashboard' && !floatingUiHidden && (
        <BottomNav 
          activeView={activeView}
          setActiveView={setActiveView}
          role={role}
        />
      )}

    </div>
  );
}
