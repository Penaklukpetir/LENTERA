import React, { useState, useEffect } from 'react';

export default function SCMHubView({ onSelectPlotOnMap }) {
  const [activeSubTab, setActiveSubTab] = useState('tracking'); // tracking | qrcode
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [selectedQRBatch, setSelectedQRBatch] = useState(null);

  // New Batch Form State
  const [newBatch, setNewBatch] = useState({
    farmer_name: '',
    coffee_type: 'Arabica',
    process_method: 'Natural Process',
    weight_kg: '',
    drying_days: 14,
    grade: 'Specialty Grade',
    cupping_score: 85.0,
    status: 'Pengeringan'
  });

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSCMData();
  }, []);

  const fetchSCMData = async () => {
    setLoading(true);
    try {
      const resBatches = await fetch('http://localhost:5000/api/scm/batches')
        .then(res => res.json())
        .catch(() => ({ data: [] }));

      if (resBatches.data) setBatches(resBatches.data);
    } catch (err) {
      console.error('Error fetching SCM batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/scm/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch)
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setBatches([data.data, ...batches]);
        setShowAddBatchModal(false);
        setNewBatch({
          farmer_name: '',
          coffee_type: 'Arabica',
          process_method: 'Natural Process',
          weight_kg: '',
          drying_days: 14,
          grade: 'Specialty Grade',
          cupping_score: 85.0,
          status: 'Pengeringan'
        });
      }
    } catch (err) {
      console.error('Error creating SCM batch:', err);
    }
  };

  // Metrics Calculation
  const totalWeightKg = batches.reduce((acc, b) => acc + (parseFloat(b.weight_kg) || 0), 0);
  const greenBeanStockKg = batches.filter(b => b.status === 'Gudang Green Bean' || b.status === 'Siap Kirim').reduce((acc, b) => acc + (parseFloat(b.weight_kg) || 0), 0);
  const specialtyCount = batches.filter(b => b.grade === 'Specialty Grade').length;
  const specialtyRatio = batches.length ? Math.round((specialtyCount / batches.length) * 100) : 100;

  const filteredBatches = batches.filter(b => 
    b.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.process_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', color: '#E2E8F0', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(52, 211, 153, 0.2)',
              color: '#34D399',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>PENYIMPANAN & INVENTARIS PANEN</span>
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>• Sesuai Spesifikasi Mitra Desa Kucur</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
            Penyimpanan & Pencatatan Hasil Panen Realisasi
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: '4px 0 0 0' }}>
            Pencatatan hasil panen realisasi per lahan, inventaris gudang penyimpanan kopi, penjaminan mutu grading (Natural/Washed), & generator Traceability QR Code.
          </p>
        </div>

        <button
          onClick={() => setShowAddBatchModal(true)}
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          <span className="material-symbols-outlined text-base">add</span> Catat Batch Panen Baru
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Card 1 */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>TOTAL HASIL PANEN TERDRAFT</span>
            <div style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', padding: '6px', borderRadius: '8px' }}>
              <span className="material-symbols-outlined text-lg">inventory_2</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
            {totalWeightKg.toLocaleString('id-ID')} <span style={{ fontSize: '14px', color: '#94A3B8' }}>Kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#34D399', marginTop: '4px' }}>
            ✓ Dari {batches.length} Batch Pengolahan Panen
          </div>
        </div>

        {/* Card 2 */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>PENCATATAN PANEN REALISASI</span>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '6px', borderRadius: '8px' }}>
              <span className="material-symbols-outlined text-lg">fact_check</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
            {greenBeanStockKg.toLocaleString('id-ID')} <span style={{ fontSize: '14px', color: '#94A3B8' }}>Kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#38BDF8', marginTop: '4px' }}>
            ✓ Panen Realisasi Terverifikasi Mitra
          </div>
        </div>

        {/* Card 3 */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '18px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>RATIO SPECIALTY GRADE</span>
            <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', padding: '6px', borderRadius: '8px' }}>
              <span className="material-symbols-outlined text-lg">military_tech</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
            {specialtyRatio}% <span style={{ fontSize: '14px', color: '#94A3B8' }}>Grade 80+</span>
          </div>
          <div style={{ fontSize: '11px', color: '#FBBF24', marginTop: '4px' }}>
            ⭐ Mutu Kopi Lereng Tinggi
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '24px',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setActiveSubTab('tracking')}
          style={{
            background: activeSubTab === 'tracking' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
            color: activeSubTab === 'tracking' ? '#34D399' : '#94A3B8',
            border: activeSubTab === 'tracking' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid transparent',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span className="material-symbols-outlined text-base">fact_check</span> Pencatatan Panen Realisasi & Grading
        </button>

        <button
          onClick={() => setActiveSubTab('qrcode')}
          style={{
            background: activeSubTab === 'qrcode' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeSubTab === 'qrcode' ? '#38BDF8' : '#94A3B8',
            border: activeSubTab === 'qrcode' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span className="material-symbols-outlined text-base">qr_code_2</span> Traceability QR Code Generator
        </button>
      </div>

      {/* TAB 1: PENCATATAN PANEN REALISASI & GRADING */}
      {activeSubTab === 'tracking' && (
        <div>
          {/* Search bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B', fontSize: '18px' }}>search</span>
              <input
                type="text"
                placeholder="Cari Batch Code, Petani, Metode Olah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 36px',
                  color: '#F8FAFC',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ color: '#94A3B8', fontSize: '13px' }}>
              Menampilkan {filteredBatches.length} batch hasil panen terdaftar
            </div>
          </div>

          {/* Table */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#94A3B8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '12px 16px' }}>BATCH ID</th>
                  <th style={{ padding: '12px 16px' }}>PETANI / KOKTAN</th>
                  <th style={{ padding: '12px 16px' }}>VARIETAS & OLAH</th>
                  <th style={{ padding: '12px 16px' }}>HASIL PANEN (KG)</th>
                  <th style={{ padding: '12px 16px' }}>MUTU / GRADE</th>
                  <th style={{ padding: '12px 16px' }}>STATUS PROSES</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#E2E8F0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#38BDF8' }}>
                      {b.batch_code}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{b.farmer_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: b.coffee_type === 'Arabica' ? '#34D399' : '#FBBF24', fontWeight: 600 }}>{b.coffee_type}</span>
                      <span style={{ color: '#94A3B8', fontSize: '12px', marginLeft: '6px' }}>({b.process_method})</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.weight_kg} Kg</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: b.grade === 'Specialty Grade' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: b.grade === 'Specialty Grade' ? '#FBBF24' : '#94A3B8',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {b.grade} ({b.cupping_score} Pts)
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: b.status === 'Siap Kirim' ? 'rgba(52, 211, 153, 0.15)' : b.status === 'Gudang Green Bean' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                        color: b.status === 'Siap Kirim' ? '#34D399' : b.status === 'Gudang Green Bean' ? '#38BDF8' : '#FBBF24',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        ● {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedQRBatch(b);
                          setActiveSubTab('qrcode');
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38BDF8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Generate QR Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRACEABILITY QR CODE GENERATOR */}
      {activeSubTab === 'qrcode' && (
        <div>
          <div style={{ marginBottom: '16px', color: '#94A3B8', fontSize: '13px' }}>
            Pilih batch hasil panen di bawah untuk menghasilkan QR Code Traceability asal kebun. Pindaian QR ini akan langsung membuka posisi spasial lahan di Peta.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {batches.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: selectedQRBatch?.id === b.id ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>
                      {b.batch_code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{b.coffee_type}</span>
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px 0' }}>
                    {b.farmer_name}
                  </h3>

                  <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.6, marginBottom: '16px' }}>
                    <div><strong>Metode Olah:</strong> {b.process_method}</div>
                    <div><strong>Volume Panen:</strong> {b.weight_kg} Kg ({b.grade})</div>
                    <div><strong>Asal Usul Spasial:</strong> Desa Kucur (Elevasi ~{b.coffee_type === 'Arabica' ? '1250' : '850'} MDPL)</div>
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '12px'
                }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://lentera-kucur.desa.id/trace/${b.batch_code}`}
                    alt="QR Code Traceability"
                    style={{ width: '80px', height: '80px', borderRadius: '6px' }}
                  />
                  <div>
                    <div style={{ color: '#0F172A', fontWeight: 700, fontSize: '13px' }}>
                      Traceability QR Code
                    </div>
                    <div style={{ color: '#64748B', fontSize: '11px', margin: '4px 0 8px 0' }}>
                      Pindai via Smartphone untuk buka peta spasial kebun asal.
                    </div>
                    <button
                      onClick={() => onSelectPlotOnMap && onSelectPlotOnMap(b.plot_id)}
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined text-xs">location_on</span> Lihat di Peta Live
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD BATCH */}
      {showAddBatchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            color: '#F8FAFC'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Catat Batch Panen Baru</h2>
              <button onClick={() => setShowAddBatchModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Nama Petani / Kelompok Tani</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pak Sugeng (Poktan Gemah Ripah 1)"
                  value={newBatch.farmer_name}
                  onChange={(e) => setNewBatch({ ...newBatch, farmer_name: e.target.value })}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Varietas Kopi</label>
                  <select
                    value={newBatch.coffee_type}
                    onChange={(e) => setNewBatch({ ...newBatch, coffee_type: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', outline: 'none' }}
                  >
                    <option value="Arabica">Arabica</option>
                    <option value="Robusta">Robusta</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Metode Pengolahan</label>
                  <select
                    value={newBatch.process_method}
                    onChange={(e) => setNewBatch({ ...newBatch, process_method: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', outline: 'none' }}
                  >
                    <option value="Natural Process">Natural Process</option>
                    <option value="Full Washed">Full Washed</option>
                    <option value="Honey Process">Honey Process</option>
                    <option value="Wet Hulled">Wet Hulled (Giling Basah)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Hasil Panen (Kg)</label>
                  <input
                    type="number"
                    required
                    placeholder="850"
                    value={newBatch.weight_kg}
                    onChange={(e) => setNewBatch({ ...newBatch, weight_kg: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Kelas Mutu (Grade)</label>
                  <select
                    value={newBatch.grade}
                    onChange={(e) => setNewBatch({ ...newBatch, grade: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', outline: 'none' }}
                  >
                    <option value="Specialty Grade">Specialty Grade (80+ Pts)</option>
                    <option value="Commercial Grade">Commercial Grade</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '12px',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Simpan Pencatatan Panen
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
