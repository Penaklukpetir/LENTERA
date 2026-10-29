import React, { useState, useEffect } from 'react';
import { MLR_COEFFICIENTS, MLR_MODEL_VERSION, calculateMLRYield } from '../lib/mlr';

const API_BASE_URL = 'http://localhost:5000/api';

export default function DetailsPanel({ 
  selectedPlot, 
  setSelectedPlot, 
  role, 
  token, 
  plots, 
  setPlots,
  inDashboard = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    farmer_name: '',
    coffee_type: 'Robusta',
    tree_count: 100,
    elevation: 800,
    land_area: 1000,
    planting_year: '',
    description: ''
  });

  const [plotBatches, setPlotBatches] = useState([]);
  const [mlrHistory, setMlrHistory] = useState([]);
  const [showAddHarvestModal, setShowAddHarvestModal] = useState(false);
  const [newHarvest, setNewHarvest] = useState({
    weight_kg: '',
    harvest_date: ''
  });

  useEffect(() => {
    if (selectedPlot) {
      setEditForm({
        farmer_name: selectedPlot.farmer_name || '',
        coffee_type: selectedPlot.coffee_type || 'Robusta',
        tree_count: selectedPlot.tree_count || 0,
        elevation: selectedPlot.elevation || 0,
        land_area: selectedPlot.land_area || 0,
        planting_year: selectedPlot.planting_year ?? '',
        description: selectedPlot.description || ''
      });
      setIsEditing(false);

      // Fetch real harvest records for this plot
      fetch(`${API_BASE_URL}/plots/${selectedPlot.id}/harvests`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => setPlotBatches(Array.isArray(data?.data) ? data.data : []))
        .catch(() => setPlotBatches([]));

      fetch(`${API_BASE_URL}/plots/${selectedPlot.id}/mlr-history`)
        .then(res => (res.ok ? res.json() : []))
        .then(data => setMlrHistory(Array.isArray(data) ? data : []))
        .catch(() => setMlrHistory([]));
    }
  }, [selectedPlot]);

  // Handle Quick Add Harvest Batch for this plot
  const handleCreateHarvestBatch = async (e) => {
    e.preventDefault();
    if (!selectedPlot) return;
    const weight = parseFloat(newHarvest.weight_kg);
    if (!Number.isFinite(weight) || weight <= 0) {
      alert('Berat panen harus lebih dari 0 kg.');
      return;
    }
    const payload = {
      weight_kg: weight,
      harvest_date: newHarvest.harvest_date || undefined
    };

    try {
      const res = await fetch(`${API_BASE_URL}/plots/${selectedPlot.id}/harvests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Gagal menyimpan panen: ${data.error || 'Terjadi kesalahan.'}`);
        return;
      }
      setPlotBatches([data.data, ...plotBatches]);
      setShowAddHarvestModal(false);
      setNewHarvest({ weight_kg: '', harvest_date: '' });
      alert('Pencatatan hasil panen realisasi berhasil disimpan!');
    } catch (err) {
      console.error('Error creating harvest batch:', err);
      alert('Gagal menghubungi server. Panen tidak tersimpan.');
    }
  };

  // Handle Edit Plot Save with Backend API Persistence
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedPlot) return;

    const area = parseFloat(editForm.land_area) || 0;
    const trees = parseInt(editForm.tree_count) || 0;
    const elev = parseInt(editForm.elevation) || 0;

    const payload = {
      farmer_name: editForm.farmer_name,
      coffee_type: editForm.coffee_type,
      tree_count: trees,
      elevation: elev,
      land_area: area,
      planting_year: editForm.planting_year === '' ? null : Number(editForm.planting_year),
      description: editForm.description
    };

    try {
      const res = await fetch(`${API_BASE_URL}/plots/${selectedPlot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.plot) {
        alert(`Gagal memperbarui plot: ${data.error || 'Terjadi kesalahan.'}`);
        return;
      }

      const updatedPlots = plots.map(p => p.id === selectedPlot.id ? data.plot : p);
      setPlots(updatedPlots);
      setSelectedPlot(data.plot);
      setIsEditing(false);
      alert('Data plot lahan & peramalan hasil panen MLR berhasil diperbarui!');
    } catch (err) {
      console.error('Gagal update plot:', err);
      alert('Gagal menghubungi server. Perubahan tidak tersimpan.');
    }
  };

  // Handle Delete Plot with Backend API Persistence
  const handleDeletePlot = async () => {
    if (!selectedPlot) return;
    if (window.confirm(`Nonaktifkan plot lahan "${selectedPlot.farmer_name}"? Data akan diarsipkan (soft delete).`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/plots/${selectedPlot.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(`Gagal menonaktifkan plot: ${data.error || 'Terjadi kesalahan.'}`);
          return;
        }

        const updatedPlots = plots.filter(p => p.id !== selectedPlot.id);
        setPlots(updatedPlots);
        setSelectedPlot(null);
        alert('Plot lahan berhasil dinonaktifkan (soft delete).');
      } catch (err) {
        console.error('Gagal menghapus plot:', err);
        alert('Gagal menghubungi server. Plot tidak dinonaktifkan.');
      }
    }
  };

  // MLR Coefficient Component Values for Display
  const currentArea = parseFloat(selectedPlot?.land_area || 0);
  const currentTrees = parseInt(selectedPlot?.tree_count || 0);
  const currentElev = parseInt(selectedPlot?.elevation || 0);
  const mlrAreaContrib = (MLR_COEFFICIENTS.land_area * currentArea).toFixed(1);
  const mlrTreeContrib = (MLR_COEFFICIENTS.tree_count * currentTrees).toFixed(1);
  const mlrElevContrib = (MLR_COEFFICIENTS.elevation * currentElev).toFixed(1);
  const mlrTotalYield = calculateMLRYield(currentArea, currentTrees, currentElev);

  // Total Recorded Real Harvest Weight for this Plot
  const totalRecordedHarvestKg = plotBatches.reduce((acc, b) => acc + (parseFloat(b.weight_kg) || 0), 0);
  const harvestAchievementRatio = mlrTotalYield > 0 ? Math.round((totalRecordedHarvestKg / mlrTotalYield) * 100) : 0;

  return (
    <aside className={`details-panel ${selectedPlot ? 'open' : ''}`}>
      <div className="details-header">
        <h3 className="details-title">Detail Plot Lahan</h3>
        <button className="close-btn" onClick={() => setSelectedPlot(null)}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {selectedPlot && (
        <div className="details-content">
          {/* Header Title & Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{selectedPlot.farmer_name}</h2>
            <span className={`plot-tag ${selectedPlot.coffee_type.toLowerCase()}`}>
              {selectedPlot.coffee_type}
            </span>
          </div>

          {/* ADMIN & DESA CRUD ACTION CONTROLS */}
          {inDashboard && (role === 'admin' || role === 'village') && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: isEditing ? 'var(--color-primary)' : 'var(--bg-secondary)', 
                  color: isEditing ? '#132210' : 'var(--text-main)', 
                  fontWeight: '800', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                {isEditing ? 'Batal Edit' : 'Edit Plot Lahan'}
              </button>

              <button 
                onClick={handleDeletePlot}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                  color: '#EF4444', 
                  fontWeight: '800', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Hapus Plot dari Peta & Database"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                Hapus
              </button>
            </div>
          )}

          {/* INLINE EDIT FORM OR READ-ONLY VIEW */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Pemilik Lahan</label>
                <input 
                  type="text" 
                  required 
                  value={editForm.farmer_name}
                  onChange={(e) => setEditForm({ ...editForm, farmer_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Varietas</label>
                  <select 
                    value={editForm.coffee_type}
                    onChange={(e) => setEditForm({ ...editForm, coffee_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="Robusta">Robusta</option>
                    <option value="Arabica">Arabica</option>
                    <option value="Liberica">Liberica</option>
                    <option value="Excelsa">Excelsa</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Luas (m²)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={editForm.land_area}
                    onChange={(e) => setEditForm({ ...editForm, land_area: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jumlah Pohon</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={editForm.tree_count}
                    onChange={(e) => setEditForm({ ...editForm, tree_count: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Elevasi (MDPL)</label>
                  <input 
                    type="number" 
                    required 
                    min="400"
                    max="3000"
                    value={editForm.elevation}
                    onChange={(e) => setEditForm({ ...editForm, elevation: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahun Tanam (opsional)</label>
                <input 
                  type="number" 
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="misal 2012"
                  value={editForm.planting_year}
                  onChange={(e) => setEditForm({ ...editForm, planting_year: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {editForm.planting_year && Number(editForm.planting_year) >= 1900
                    ? `Umur tanaman ± ${new Date().getFullYear() - Number(editForm.planting_year)} tahun`
                    : 'Kosongkan bila belum diketahui.'}
                </span>
              </div>

              {/* Live Preview MLR Yield Formula */}
              <div style={{
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '11px',
                color: '#34D399'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>📊 Estimasi Hasil Panen (Y) — {MLR_MODEL_VERSION}:</div>
                Y = max(0, {MLR_COEFFICIENTS.intercept} + ({MLR_COEFFICIENTS.land_area} × {editForm.land_area || 0}) + ({MLR_COEFFICIENTS.tree_count} × {editForm.tree_count || 0}) + ({MLR_COEFFICIENTS.elevation} × {editForm.elevation || 0}))
                <div style={{ fontWeight: 800, fontSize: '13px', marginTop: '4px', color: '#F8FAFC' }}>
                  = {calculateMLRYield(editForm.land_area, editForm.tree_count, editForm.elevation).toLocaleString('id-ID')} Kg/tahun
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Keterangan Lahan</label>
                <textarea 
                  rows="2"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '12px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit" 
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: 'var(--color-primary)', 
                  color: '#132210', 
                  fontWeight: '800', 
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Simpan Perubahan & Hitung Ulang MLR
              </button>
            </form>
          ) : (
            <>
              <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-muted)', margin: '12px 0 0 0' }}>
                {selectedPlot.description || 'Tidak ada deskripsi tambahan untuk lahan ini.'}
              </p>

              {/* 1. KARTU ANALITIK PREDIKSI HASIL PANEN MLR */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#34D399', fontSize: '20px' }}>analytics</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Prediksi Hasil Panen MLR
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.2)', color: '#34D399', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    {MLR_MODEL_VERSION}
                  </span>
                </div>

                <div style={{ fontSize: '22px', fontWeight: '800', color: '#F8FAFC', marginBottom: '8px' }}>
                  {mlrTotalYield.toLocaleString('id-ID')} <span style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8' }}>Kg/tahun</span>
                </div>

                {/* Keterangan Variabel MLR */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: '10px',
                  padding: '10px',
                  marginBottom: '8px',
                  fontSize: '11px',
                  lineHeight: '1.7',
                  color: '#CBD5E1'
                }}>
                  <div style={{ fontWeight: 800, color: '#34D399', marginBottom: '2px' }}>
                    Keterangan Variabel Prediksi:
                  </div>
                  <div><strong style={{ color: '#F8FAFC' }}>Y</strong> = estimasi hasil panen (kg/tahun)</div>
                  <div><strong style={{ color: '#F8FAFC' }}>X₁</strong> = luas lahan (m²)</div>
                  <div><strong style={{ color: '#F8FAFC' }}>X₂</strong> = jumlah pohon (batang)</div>
                  <div><strong style={{ color: '#F8FAFC' }}>X₃</strong> = elevasi lahan (MDPL)</div>
                  <div style={{ marginTop: '4px', color: '#94A3B8' }}>
                    Koefisien pohon bernilai negatif karena pada luas yang sama, tanam yang lebih rapat menurunkan hasil per pohon.
                  </div>
                </div>

                {/* Mathematical Parameter Breakdown */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ fontWeight: 700, color: '#34D399', marginBottom: '4px' }}>Rincian Perhitungan (Y = hasil panen):</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• Konstanta (a):</span>
                    <span style={{ fontWeight: 600 }}>{MLR_COEFFICIENTS.intercept} Kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• Luas lahan X₁ ({currentArea} m² × {MLR_COEFFICIENTS.land_area}):</span>
                    <span style={{ fontWeight: 600, color: '#34D399' }}>+{mlrAreaContrib} Kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• Jumlah pohon X₂ ({currentTrees} batang × {MLR_COEFFICIENTS.tree_count}):</span>
                    <span style={{ fontWeight: 600, color: '#F87171' }}>{mlrTreeContrib} Kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>• Elevasi X₃ ({currentElev} MDPL × {MLR_COEFFICIENTS.elevation}):</span>
                    <span style={{ fontWeight: 600, color: '#F87171' }}>{mlrElevContrib} Kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: '4px', paddingTop: '4px' }}>
                    <span>• Prediksi di bawah 0 dibulatkan jadi 0 kg:</span>
                    <span style={{ fontWeight: 600, color: '#34D399' }}>≥ 0 Kg</span>
                  </div>
                </div>
              </div>

              {/* MLR MODEL GOVERNANCE: PREDICTION HISTORY */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '18px' }}>history</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Riwayat Prediksi MLR
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94A3B8' }}>{mlrHistory.length} entri</span>
                </div>

                {mlrHistory.length === 0 ? (
                  <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>
                    Belum ada riwayat prediksi tersimpan untuk lahan ini.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {mlrHistory.slice(0, 4).map((entry) => (
                      <div key={entry.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        fontSize: '10px',
                        color: '#94A3B8',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        paddingBottom: '4px'
                      }}>
                        <span>
                          {new Date(entry.calculated_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          {' • '}{entry.mlr_formula_version}
                        </span>
                        <span style={{ color: '#34D399', fontWeight: 700 }}>
                          {Number(entry.predicted_kg).toLocaleString('id-ID')} Kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. KARTU PENCATATAN HASIL PANEN REALISASI */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.1) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="material-symbols-outlined" style={{ color: '#38BDF8', fontSize: '20px' }}>fact_check</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pencatatan Hasil Panen Realisasi
                    </span>
                  </div>
                  {(role === 'admin' || role === 'village') && (
                    <button
                      onClick={() => setShowAddHarvestModal(true)}
                      style={{
                        background: '#38BDF8',
                        color: '#0F172A',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span> Catat Panen
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#F8FAFC' }}>
                    {totalRecordedHarvestKg.toLocaleString('id-ID')} <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>Kg Realisasi</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 700 }}>
                    {plotBatches.length} Batch Olah
                  </span>
                </div>

                {/* Audit Comparison Gauge */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Target Peramalan MLR:</span>
                    <span style={{ fontWeight: 700, color: '#34D399' }}>{mlrTotalYield.toLocaleString('id-ID')} Kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Total Panen Realisasi:</span>
                    <span style={{ fontWeight: 700, color: '#38BDF8' }}>{totalRecordedHarvestKg.toLocaleString('id-ID')} Kg</span>
                  </div>
                  {mlrTotalYield > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                      <span>Capaian Terhadap MLR:</span>
                      <span style={{ fontWeight: 800, color: harvestAchievementRatio >= 80 ? '#34D399' : '#FBBF24' }}>
                        {harvestAchievementRatio}% ({harvestAchievementRatio >= 80 ? 'On Target / Sangat Baik' : 'Dalam Proses Panen'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. RINCIAN LAHAN SPASIAL */}
              <div className="details-info-section" style={{ marginTop: '16px' }}>
                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">aspect_ratio</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Luas Lahan (m²)</span>
                    <span className="info-value">{currentArea.toLocaleString()} m²</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">forest</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Jumlah Tanaman Kopi</span>
                    <span className="info-value">{currentTrees.toLocaleString()} Pohon</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">filter_hdr</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Elevasi Ketinggian Lahan</span>
                    <span className="info-value">{currentElev} MDPL (Meter)</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Tahun Tanam</span>
                    <span className="info-value">
                      {selectedPlot.planting_year
                        ? `${selectedPlot.planting_year} (± ${new Date().getFullYear() - Number(selectedPlot.planting_year)} tahun)`
                        : 'Belum dicatat'}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon-container">
                    <span className="material-symbols-outlined">pin_drop</span>
                  </div>
                  <div className="info-details">
                    <span className="info-label">Koordinat Spasial (Titik)</span>
                    <span className="info-value" style={{ fontSize: '11px' }}>
                      Lat: {Number(selectedPlot.lat).toFixed(6)}<br />
                      Lng: {Number(selectedPlot.lng).toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Coordination Navigation */}
              <a 
                href={`https://wa.me/6281234567890?text=Halo%20Admin%20Karang%20Taruna%2C%20saya%20tertarik%20mengunjungi%20lahan%20kopi%20${encodeURIComponent(selectedPlot.farmer_name)}%20di%20Kucur.`}
                target="_blank"
                rel="noreferrer"
                className="nav-action-btn"
                style={{ textDecoration: 'none', marginTop: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <span className="material-symbols-outlined">chat</span>
                Hubungi Pemandu Lahan (WhatsApp)
              </a>
            </>
          )}
        </div>
      )}

      {/* QUICK MODAL: CATAT PANEN BARU */}
      {showAddHarvestModal && selectedPlot && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#1E293B',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '20px',
            color: '#F8FAFC',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined">fact_check</span> Catat Hasil Panen Realisasi
              </h3>
              <button onClick={() => setShowAddHarvestModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateHarvestBatch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Pemilik Lahan</label>
                <input type="text" disabled value={selectedPlot.farmer_name} style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#94A3B8', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Hasil Panen (Kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 850"
                    value={newHarvest.weight_kg}
                    onChange={(e) => setNewHarvest({ ...newHarvest, weight_kg: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tanggal Panen</label>
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={newHarvest.harvest_date}
                    onChange={(e) => setNewHarvest({ ...newHarvest, harvest_date: e.target.value })}
                    style={{ width: '100%', background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#F8FAFC', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0 }}>
                Kosongkan tanggal untuk memakai tanggal hari ini. Data ini langsung dipakai pada perbandingan prediksi MLR di tab Daftar Lahan.
              </p>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Simpan Pencatatan Hasil Panen Realisasi
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
