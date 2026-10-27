import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import Sidebar from './components/Sidebar';
import CoffeeMap from './components/CoffeeMap';
import DetailsPanel from './components/DetailsPanel';
import Education from './components/Education';
import Navigation from './components/Navigation';
import EResourceView from './components/EResourceView';
import SponsorView from './components/SponsorView';
import AdminPlotForm from './components/AdminPlotForm';
import SponsorModal from './components/SponsorModal';
import Profile from './components/Profile';
import DashboardView from './components/DashboardView';
import LoginModal from './components/LoginModal';
import AdminLoginModal from './components/AdminLoginModal';
import BottomNav from './components/BottomNav';
import SosButton from './components/SosButton';

const API_BASE_URL = 'http://localhost:5000/api';

const INITIAL_PLOTS = [
  {
    id: 1,
    farmer_name: 'Pak Mulyono (Offline)',
    lat: -7.9130,
    lng: 112.5180,
    coffee_type: 'Robusta',
    tree_count: 1500,
    elevation: 720,
    description: 'Perkebunan kopi Robusta tradisional tumpang sari dengan pohon sengon untuk naungan alami.',
  },
  {
    id: 2,
    farmer_name: 'Bu Sumiati (Offline)',
    lat: -7.9190,
    lng: 112.5230,
    coffee_type: 'Arabica',
    tree_count: 800,
    elevation: 1120,
    description: 'Lahan kopi Arabika organik pada lereng tinggi. Menghasilkan biji kopi specialty grade berkualitas tinggi.',
  }
];

export default function App() {
  const [theme, setTheme] = useState('light');
  const [role, setRole] = useState('visitor'); // visitor, admin, village
  const [token, setToken] = useState(null); // Auth JWT Token
  const [activeView, setActiveView] = useState('home'); // home, location, education, navigation, eresource, sponsor, profile
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plots, setPlots] = useState(INITIAL_PLOTS);
  
  // Admin Form State for mapping new plots
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlotCoords, setNewPlotCoords] = useState(null);
  const [formFarmer, setFormFarmer] = useState('');
  const [formType, setFormType] = useState('Robusta');
  const [formCount, setFormCount] = useState(100);
  const [formElevation, setFormElevation] = useState(800);
  const [formArea, setFormArea] = useState(1000);
  const [formDesc, setFormDesc] = useState('');

  // Login Modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  const handleLogout = () => {
    setRole('visitor');
    setToken(null);
    setActiveView('home');
    setShowAddForm(false);
  };

  // Destinasi Wisata Tani & Agrowisata State
  const [destinations, setDestinations] = useState([
    {
      id: 1,
      name: 'Terasering Zamrud Kucur',
      tag: 'Alam & Fotografi',
      elevation: '950 MDPL',
      price: 'Rp 15.000 / orang',
      hours: '08:00 - 18:00 WIB',
      img: 'https://images.unsplash.com/photo-1578507065211-17b2d564c20f?auto=format&fit=crop&q=80&w=600',
      desc: 'Pemandangan panorama menakjubkan dari lereng Gunung Kawi dengan sistem irigasi subak pegunungan alami.',
      highlights: ['Spot Foto Panoramic', 'Udara Segar Pegunungan', 'Dekat Parkir Utama']
    },
    {
      id: 2,
      name: 'Kebun Kopi High Altitude (1.250 MDPL)',
      tag: 'Edukasi Tani',
      elevation: '1250 MDPL',
      price: 'Rp 25.000 / orang (Termasuk Seduh Kopi)',
      hours: '08:00 - 16:30 WIB',
      img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=600',
      desc: 'Jelajah hamparan kebun kopi Arabika organik lereng tinggi, belajar perwatan bibit & pemetikan ceri pilihan.',
      highlights: ['Petik Ceri Kopi', 'Edukasi Agronomi', 'Free Coffee Tasting']
    },
    {
      id: 3,
      name: 'Greenhouse Penjemuran Ceri Natural',
      tag: 'Pasca-Panen',
      elevation: '1100 MDPL',
      price: 'Gratis (Kunjungan Edukasi)',
      hours: '09:00 - 16:00 WIB',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600',
      desc: 'Melihat langsung proses pengeringan ceri kopi Natural, Washed, & Honey Process di atas meja gantung higienis.',
      highlights: ['Proses Olah Kopi', 'Aroma Kopi Alami', 'Panduan Petani']
    },
    {
      id: 4,
      name: 'Sentra UMKM Kriya & Kopi Kucur',
      tag: 'Budaya & Belanja',
      elevation: '850 MDPL',
      price: 'Gratis Masuk',
      hours: '08:00 - 20:00 WIB',
      img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      desc: 'Pusat oleh-oleh bubuk kopi kemasan asli Desa Kucur, kerajinan anyaman kriya bambu, dan kuliner tradisional.',
      highlights: ['Oleh-oleh Asli Desa', 'Kerajinan Bambu', 'Kedai Kopi Pokdarwis']
    },
    {
      id: 5,
      name: 'Wisata Edukasi Petik Ceri Merah',
      tag: 'Edukasi Tani',
      elevation: '1200 MDPL',
      price: 'Rp 35.000 / orang',
      hours: 'Panen Raya (08:00 - 14:00)',
      img: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&q=80&w=600',
      desc: 'Pengalaman interaktif memetik buah ceri merah matang langsung di pohon bersama bimbingan petani lokal Kucur.',
      highlights: ['Pengalaman Petik Langsung', 'Keranjang Tradisional', 'Sertifikat Edukasi']
    },
    {
      id: 6,
      name: 'Spot Sunset Lereng Gunung Kawi',
      tag: 'Alam & Fotografi',
      elevation: '1350 MDPL',
      price: 'Rp 10.000 / kendaraan',
      hours: '15:30 - 18:30 WIB',
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
      desc: 'Titik pandang tertinggi Desa Kucur untuk menikmati matahari terbenam dengan latar belakang samudera awan.',
      highlights: ['Sunrise/Sunset Point', 'Area Camping Light', 'Warung Kopi Hangat']
    }
  ]);

  // B2B Sponsorship State
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorships, setSponsorships] = useState([
    { id: 1, sponsor_name: 'PT Kopi Nusa (Offline)', plot_owner: 'Bu Sumiati', amount: 15000000, status: 'APPROVED' }
  ]);
  const [newSponsorName, setNewSponsorName] = useState('');
  const [selectedSponsorPlot, setSelectedSponsorPlot] = useState(1);
  const [sponsorAmount, setSponsorAmount] = useState(5000000);
  const [proposalFile, setProposalFile] = useState('proposal_kemitraan.pdf');

  // Load plots and sponsorships from backend API
  const loadData = async () => {
    try {
      const plotsRes = await fetch(`${API_BASE_URL}/plots`);
      if (plotsRes.ok) {
        const plotsData = await plotsRes.json();
        if (plotsData.length > 0) {
          setPlots(plotsData);
          setSelectedSponsorPlot(plotsData[0].id);
        }
      }
      
      const sponRes = await fetch(`${API_BASE_URL}/sponsorships`);
      if (sponRes.ok) {
        const sponData = await sponRes.json();
        setSponsorships(sponData);
      }
    } catch (err) {
      console.warn('Backend server offline. Running in sandbox offline mode with pre-seeded data.', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle Dynamic Role Changes and simulate authentication
  const handleRoleChange = async (newRole) => {
    setRole(newRole);
    if (newRole === 'village' || newRole === 'admin') {
      setActiveView('dashboard');
    }
    if (newRole === 'visitor') {
      setToken(null);
      return;
    }

    let credentials = { username: 'admin', password: 'adminpassword' };
    let regDetails = {
      username: 'admin',
      password: 'adminpassword',
      email: 'admin@lentera.com',
      role: 'admin',
      full_name: 'Admin Karang Taruna'
    };

    if (newRole === 'village') {
      credentials = { username: 'kades', password: 'kadespassword' };
      regDetails = {
        username: 'kades',
        password: 'kadespassword',
        email: 'kades@lentera.com',
        role: 'village',
        full_name: 'Kepala Desa Kucur'
      };
    }

    const login = async () => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        console.log(`Auto-authenticated as ${newRole} in backend.`);
        if (newRole === 'village' || newRole === 'admin') {
          setActiveView('dashboard');
        }
        return true;
      }
      return false;
    };

    try {
      const isLoginOk = await login();
      if (!isLoginOk) {
        console.log(`Registering seed account for role ${newRole}...`);
        const regRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regDetails)
        });
        if (regRes.ok) {
          await login();
        }
      }
    } catch (err) {
      console.warn('Backend server offline. Simulating mock authorization JWT.', err);
      setToken('mock-offline-token');
      if (newRole === 'village' || newRole === 'admin') {
        setActiveView('dashboard');
      }
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
        setFormDesc('');
        console.log('Spatiogeometric plot registered successfully in database.');
      } else {
        const errData = await res.json();
        alert(`Gagal merekam data spasial: ${errData.error}`);
      }
    } catch (err) {
      console.warn('Backend offline. Adding plot locally to state.', err);
      const localYield = Math.max(0, -245.50 + (0.12 * Number(formArea)) + (1.85 * Number(formCount)) - (0.08 * Number(formElevation)));
      const newPlot = {
        id: plots.length + 1,
        farmer_name: formFarmer + ' (Offline)',
        lat: newPlotCoords.lat,
        lng: newPlotCoords.lng,
        coffee_type: formType,
        tree_count: Number(formCount),
        elevation: Number(formElevation),
        land_area: Number(formArea),
        predicted_yield: localYield,
        status: 'Sehat',
        description: formDesc
      };
      setPlots([...plots, newPlot]);
      setSelectedPlot(newPlot);
      setShowAddForm(false);
      setNewPlotCoords(null);
      setFormFarmer('');
      setFormArea(1000);
      setFormDesc('');
    }
  };

  // Submit sponsorship proposal B2B
  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    
    let activeSponsorToken = token;
    if (!activeSponsorToken) {
      try {
        const regDetails = {
          username: 'sponsor',
          password: 'sponsorpassword',
          email: 'sponsor@lentera.com',
          role: 'sponsor',
          full_name: 'PT Kopi Nusantara'
        };
        const credentials = { username: 'sponsor', password: 'sponsorpassword' };
        
        const login = async () => {
          const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            return loginData.token;
          }
          return null;
        };

        activeSponsorToken = await login();
        if (!activeSponsorToken) {
          await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regDetails)
          });
          activeSponsorToken = await login();
        }
      } catch (err) {
        console.warn('Failed connection for sponsor login auth', err);
      }
    }

    const payload = {
      plot_id: Number(selectedSponsorPlot),
      funding_amount: Number(sponsorAmount),
      proposal_url: proposalFile
    };

    try {
      const res = await fetch(`${API_BASE_URL}/sponsorships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeSponsorToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const reloadRes = await fetch(`${API_BASE_URL}/sponsorships`);
        if (reloadRes.ok) {
          const reloadData = await reloadRes.json();
          setSponsorships(reloadData);
        }
        setShowSponsorModal(false);
        setNewSponsorName('');
        console.log('B2B sponsorship registered in database.');
      } else {
        const errData = await res.json();
        alert(`Gagal mengajukan proposal: ${errData.error}`);
      }
    } catch (err) {
      console.warn('Backend offline. Adding proposal locally.', err);
      const targetPlot = plots.find(p => p.id === Number(selectedSponsorPlot));
      const newSpon = {
        id: sponsorships.length + 1,
        sponsor_name: newSponsorName || 'PT Kopi Nusantara',
        plot_owner: targetPlot ? targetPlot.farmer_name : 'Unknown',
        amount: Number(sponsorAmount),
        status: 'PENDING'
      };
      setSponsorships([...sponsorships, newSpon]);
      setShowSponsorModal(false);
      setNewSponsorName('');
    }
  };

  // Approve sponsorship (Village Mayor role only)
  const approveSponsorship = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/sponsorships/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const reloadRes = await fetch(`${API_BASE_URL}/sponsorships`);
        if (reloadRes.ok) {
          const reloadData = await reloadRes.json();
          setSponsorships(reloadData);
        }
        console.log('Proposal approved successfully.');
      } else {
        const errData = await res.json();
        alert(`Gagal menyetujui proposal: ${errData.error}`);
      }
    } catch (err) {
      console.warn('Backend offline. Approving locally.', err);
      setSponsorships(sponsorships.map(s => s.id === id ? { ...s, status: 'APPROVED' } : s));
    }
  };

  // Filter logic
  const filteredPlots = plots.filter(plot => {
    const matchesSearch = plot.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plot.description.toLowerCase().includes(searchQuery.toLowerCase());
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
        
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && <Home setActiveView={setActiveView} />}

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

      </div>

      {/* POPUP MODAL: SPONSOR PROPOSAL SUBMISSION */}
      {showSponsorModal && (
        <SponsorModal 
          plots={plots}
          newSponsorName={newSponsorName}
          setNewSponsorName={setNewSponsorName}
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
          handleRoleChange={handleRoleChange}
          role={role}
          openAdminModal={() => setShowAdminLoginModal(true)}
        />
      )}

      {/* POPUP MODAL: DEDICATED PORTAL LOGIN PERANGKAT DESA & ADMIN */}
      {showAdminLoginModal && (
        <AdminLoginModal 
          setShowAdminLoginModal={setShowAdminLoginModal}
          handleRoleChange={handleRoleChange}
        />
      )}

      {/* GLOBAL FLOATING SOS EMERGENCY BUTTON */}
      {activeView !== 'dashboard' && <SosButton />}

      {/* FLOATING MOBILE BOTTOM NAVIGATION DOCK BAR */}
      <BottomNav 
        activeView={activeView}
        setActiveView={setActiveView}
        role={role}
      />

    </div>
  );
}
