import React, { useState, useEffect, useCallback } from 'react';
import Pagination from './Pagination';

const API_BASE_URL = 'http://localhost:5000/api';

const BATCH_PAGE_SIZE = 8;
const TRACE_PAGE_SIZE = 6;
const CONTRACT_PAGE_SIZE = 8;

const cardStyle = {
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '18px'
};

const inputStyle = {
  width: '100%',
  background: '#0F172A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#F8FAFC',
  outline: 'none',
  boxSizing: 'border-box'
};

const subTabStyle = (active, color) => ({
  background: active ? `rgba(${color}, 0.15)` : 'transparent',
  color: active ? `rgb(${color})` : '#94A3B8',
  border: active ? `1px solid rgba(${color}, 0.4)` : '1px solid transparent',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

export default function SCMHubView({ onSelectPlotOnMap, token, plots = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('tracking');
  const [batches, setBatches] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);
  const [batchPagination, setBatchPagination] = useState({ page: 1, pageCount: 1, total: 0 });
  const [traceBatches, setTraceBatches] = useState([]);
  const [tracePagination, setTracePagination] = useState({ page: 1, pageCount: 1, total: 0 });
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [traceLoading, setTraceLoading] = useState(true);
  const [contracts, setContracts] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [selectedQRBatch, setSelectedQRBatch] = useState(null);
  const [traceData, setTraceData] = useState(null);

  const [newBatch, setNewBatch] = useState({
    plot_id: '',
    process_method: 'Natural Process',
    weight_kg: '',
    drying_days: 14,
    grade: 'Specialty Grade',
    cupping_score: 85.0,
    status: 'Pengeringan',
    harvest_date: new Date().toISOString().slice(0, 10)
  });

  const [newContract, setNewContract] = useState({
    buyer_name: '',
    coffee_type: 'Arabica',
    volume_kg: '',
    price_per_kg: '',
    delivery_date: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const [tracePage, setTracePage] = useState(1);
  const [contractPage, setContractPage] = useState(1);

  useEffect(() => {
    if (!selectedQRBatch) {
      setTraceData(null);
      return;
    }

    fetch(`${API_BASE_URL}/scm/traceability/${encodeURIComponent(selectedQRBatch.batch_code)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTraceData(data?.data || null))
      .catch(() => setTraceData(null));
  }, [selectedQRBatch]);

  const fetchSCMData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [contractsRes, forecastRes] = await Promise.all([
        fetch(`${API_BASE_URL}/scm/offtakers`),
        fetch(`${API_BASE_URL}/scm/forecast`)
      ]);

      if (contractsRes.ok) setContracts((await contractsRes.json()).data || []);
      if (forecastRes.ok) setForecast((await forecastRes.json()).data || null);
    } catch {
      setErrorMsg('Gagal memuat data SCM dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatches = useCallback(async (page, term) => {
    setBatchesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(BATCH_PAGE_SIZE) });
      if (term.trim()) params.set('search', term.trim());

      const res = await fetch(`${API_BASE_URL}/scm/batches?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) {
        setErrorMsg(payload.error || 'Gagal memuat batch panen.');
        return;
      }

      setBatches(payload.data || []);
      if (payload.summary) setBatchSummary(payload.summary);
      if (payload.pagination) {
        setBatchPagination(payload.pagination);
        if (payload.pagination.page !== page) setBatchPage(payload.pagination.page);
      }
    } catch {
      setErrorMsg('Gagal menghubungi server.');
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  const fetchTraceBatches = useCallback(async (page) => {
    setTraceLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(TRACE_PAGE_SIZE) });
      const res = await fetch(`${API_BASE_URL}/scm/batches?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) return;

      setTraceBatches(payload.data || []);
      if (payload.pagination) {
        setTracePagination(payload.pagination);
        if (payload.pagination.page !== page) setTracePage(payload.pagination.page);
      }
    } catch {
      // Trace gallery keeps its last successful page on transient failures.
    } finally {
      setTraceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSCMData();
  }, [fetchSCMData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBatches(batchPage, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [batchPage, searchTerm, fetchBatches]);

  useEffect(() => {
    fetchTraceBatches(tracePage);
  }, [tracePage, fetchTraceBatches]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/scm/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plot_id: Number(newBatch.plot_id),
          weight_kg: Number(newBatch.weight_kg),
          drying_days: Number(newBatch.drying_days),
          grade: newBatch.grade,
          process_method: newBatch.process_method,
          cupping_score: newBatch.cupping_score === '' ? null : Number(newBatch.cupping_score),
          status: newBatch.status,
          harvest_date: newBatch.harvest_date
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan batch panen.');
        return;
      }

      if (batchPage === 1) {
        fetchBatches(1, searchTerm);
      } else {
        setBatchPage(1);
      }
      fetchTraceBatches(tracePage);
      setShowAddBatchModal(false);
      setNewBatch({
        plot_id: '',
        process_method: 'Natural Process',
        weight_kg: '',
        drying_days: 14,
        grade: 'Specialty Grade',
        cupping_score: 85.0,
        status: 'Pengeringan',
        harvest_date: new Date().toISOString().slice(0, 10)
      });
    } catch {
      setErrorMsg('Gagal menghubungi server. Batch panen tidak tersimpan.');
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/scm/offtakers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          buyer_name: newContract.buyer_name,
          coffee_type: newContract.coffee_type,
          volume_kg: Number(newContract.volume_kg),
          price_per_kg: Number(newContract.price_per_kg),
          delivery_date: newContract.delivery_date
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan kontrak offtaker.');
        return;
      }

      setContracts((current) => [data.data, ...current]);
      setContractPage(1);
      setShowAddContractModal(false);
      setNewContract({ buyer_name: '', coffee_type: 'Arabica', volume_kg: '', price_per_kg: '', delivery_date: '' });
      fetchSCMData();
    } catch {
      setErrorMsg('Gagal menghubungi server. Kontrak tidak tersimpan.');
    }
  };

  const totalBatchCount = Number(batchSummary?.total_batches || 0);
  const totalWeightKg = Number(batchSummary?.total_weight_kg || 0);
  const greenBeanStockKg = Number(batchSummary?.green_bean_stock_kg || 0);
  const specialtyCount = Number(batchSummary?.specialty_count || 0);
  const specialtyRatio = totalBatchCount ? Math.round((specialtyCount / totalBatchCount) * 100) : 0;

  const activeTraceBatch = traceData || selectedQRBatch;

  const contractPageCount = Math.max(1, Math.ceil(contracts.length / CONTRACT_PAGE_SIZE));
  const safeContractPage = Math.min(contractPage, contractPageCount);
  const pagedContracts = contracts.slice(
    (safeContractPage - 1) * CONTRACT_PAGE_SIZE,
    safeContractPage * CONTRACT_PAGE_SIZE
  );

  return (
    <div style={{ padding: '24px', color: '#E2E8F0', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #052e23 0%, #0f172a 55%, #0b3b2e 100%)',
        border: '1px solid rgba(52, 211, 153, 0.25)',
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(52, 211, 153, 0.2)',
              color: '#34D399',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span className="material-symbols-outlined text-sm">account_tree</span>
              HUB SCM &amp; HASIL PANEN
            </span>
            <span style={{ color: '#94A3B8', fontSize: '12px' }}>• Rantai Pasok Kopi Desa Kucur</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
            Hub SCM &amp; Hasil Panen
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: '4px 0 0 0' }}>
            Pencatatan hasil panen realisasi per lahan, inventaris gudang, grading mutu, kontrak offtaker, dan Traceability QR Code.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddContractModal(true)}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span className="material-symbols-outlined text-base">handshake</span> Kontrak Offtaker
          </button>
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
            <span className="material-symbols-outlined text-base">add</span> Catat Batch Panen
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#F87171',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-symbols-outlined text-base">error</span>
          {errorMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>TOTAL HASIL PANEN TERCATAT</span>
            <div style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', padding: '6px', borderRadius: '8px' }}>
              <span className="material-symbols-outlined text-lg">inventory_2</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
            {totalWeightKg.toLocaleString('id-ID')} <span style={{ fontSize: '14px', color: '#94A3B8' }}>Kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#34D399', marginTop: '4px' }}>
            ✓ Dari {totalBatchCount} batch panen tersimpan di database
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>STOK GUDANG GREEN BEAN</span>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', padding: '6px', borderRadius: '8px' }}>
              <span className="material-symbols-outlined text-lg">warehouse</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
            {greenBeanStockKg.toLocaleString('id-ID')} <span style={{ fontSize: '14px', color: '#94A3B8' }}>Kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#38BDF8', marginTop: '4px' }}>
            ✓ Status Gudang Green Bean / Siap Kirim
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>RASIO SPECIALTY GRADE</span>
            <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', padding: '6px', borderRadius: '8px' }}>
              <span className="material-symbols-outlined text-lg">military_tech</span>
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
            {specialtyRatio}% <span style={{ fontSize: '14px', color: '#94A3B8' }}>Grade 80+</span>
          </div>
          <div style={{ fontSize: '11px', color: '#FBBF24', marginTop: '4px' }}>
            {totalBatchCount === 0 ? 'Belum ada batch panen' : `${specialtyCount} dari ${totalBatchCount} batch specialty`}
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '24px',
        paddingBottom: '8px',
        flexWrap: 'wrap'
      }}>
        <button onClick={() => setActiveSubTab('tracking')} style={subTabStyle(activeSubTab === 'tracking', '52, 211, 153')}>
          <span className="material-symbols-outlined text-base">fact_check</span> Panen &amp; Grading
        </button>
        <button onClick={() => setActiveSubTab('qrcode')} style={subTabStyle(activeSubTab === 'qrcode', '56, 189, 248')}>
          <span className="material-symbols-outlined text-base">qr_code_2</span> Traceability QR
        </button>
        <button onClick={() => setActiveSubTab('contracts')} style={subTabStyle(activeSubTab === 'contracts', '251, 191, 36')}>
          <span className="material-symbols-outlined text-base">handshake</span> Kontrak Offtaker
        </button>
        <button onClick={() => setActiveSubTab('forecast')} style={subTabStyle(activeSubTab === 'forecast', '167, 139, 250')}>
          <span className="material-symbols-outlined text-base">trending_up</span> Proyeksi Harga &amp; Permintaan
        </button>
      </div>

      {/* TAB 1: BATCH TRACKING */}
      {activeSubTab === 'tracking' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B', fontSize: '18px' }}>search</span>
              <input
                type="text"
                placeholder="Cari Batch Code, Petani, Metode Olah..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setBatchPage(1);
                }}
                style={{ ...inputStyle, background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px 8px 36px' }}
              />
            </div>
            <div style={{ color: '#94A3B8', fontSize: '13px' }}>
              Menampilkan {batchPagination.total} batch hasil panen
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#94A3B8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '12px 16px' }}>BATCH ID</th>
                  <th style={{ padding: '12px 16px' }}>PETANI / KOKTAN</th>
                  <th style={{ padding: '12px 16px' }}>VARIETAS &amp; OLAH</th>
                  <th style={{ padding: '12px 16px' }}>HASIL PANEN (KG)</th>
                  <th style={{ padding: '12px 16px' }}>MUTU / GRADE</th>
                  <th style={{ padding: '12px 16px' }}>STATUS PROSES</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {!batchesLoading && batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
                      {searchTerm.trim() ? 'Tidak ada batch yang cocok dengan pencarian.' : 'Belum ada batch panen tersimpan.'}
                    </td>
                  </tr>
                ) : batchesLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
                      Memuat batch panen...
                    </td>
                  </tr>
                ) : batches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', color: '#E2E8F0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#38BDF8' }}>{b.batch_code}</td>
                    <td style={{ padding: '12px 16px' }}>{b.farmer_name || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: b.coffee_type === 'Arabica' ? '#34D399' : '#FBBF24', fontWeight: 600 }}>{b.coffee_type || '-'}</span>
                      <span style={{ color: '#94A3B8', fontSize: '12px', marginLeft: '6px' }}>({b.process_method})</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{Number(b.weight_kg).toLocaleString('id-ID')} Kg</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: b.grade === 'Specialty Grade' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: b.grade === 'Specialty Grade' ? '#FBBF24' : '#94A3B8',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {b.grade} ({b.cupping_score ?? '-'} Pts)
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
                        QR Traceability
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={batchPagination.page}
            pageCount={batchPagination.pageCount}
            total={batchPagination.total}
            pageSize={BATCH_PAGE_SIZE}
            onPageChange={setBatchPage}
            itemLabel="batch"
            variant="dark"
            className="mt-3 rounded-xl"
          />
        </div>
      )}

      {/* TAB 2: QR TRACEABILITY */}
      {activeSubTab === 'qrcode' && (
        <div>
          <div style={{ marginBottom: '16px', color: '#94A3B8', fontSize: '13px' }}>
            QR Code mengarah ke halaman traceability lokal yang dirender dari database LENTERA. Pilih batch untuk melihat detail asal-usul spasial.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {!traceLoading && traceBatches.length === 0 && (
              <div style={{ color: '#64748B', fontSize: '13px', padding: '16px' }}>
                Belum ada batch panen untuk dibuatkan QR traceability.
              </div>
            )}
            {traceBatches.map((b) => {
              const traceUrl = `http://localhost:5000/trace/${encodeURIComponent(b.batch_code)}`;
              const isActive = selectedQRBatch?.id === b.id;
              return (
                <div
                  key={b.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: isActive ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
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
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{b.coffee_type || '-'}</span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px 0' }}>
                      {b.farmer_name || '-'}
                    </h3>

                    <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: 1.6, marginBottom: '16px' }}>
                      <div><strong>Metode Olah:</strong> {b.process_method}</div>
                      <div><strong>Volume Panen:</strong> {Number(b.weight_kg).toLocaleString('id-ID')} Kg ({b.grade})</div>
                      <div><strong>Asal Usul Spasial:</strong> Desa Kucur {b.elevation ? `(Elevasi ${b.elevation} MDPL)` : ''}</div>
                    </div>

                    {isActive && activeTraceBatch && (
                      <div style={{ fontSize: '11px', color: '#94A3B8', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px', marginBottom: '10px' }}>
                        <div>Koordinat: {activeTraceBatch.origin_coordinates ? `${activeTraceBatch.origin_coordinates.lat.toFixed(6)}, ${activeTraceBatch.origin_coordinates.lng.toFixed(6)}` : '-'}</div>
                        <div>Sertifikasi: {activeTraceBatch.certification || '-'}</div>
                        <div style={{ wordBreak: 'break-all', color: '#38BDF8' }}>{activeTraceBatch.trace_url}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(traceUrl)}`}
                      alt={`QR Code ${b.batch_code}`}
                      style={{ width: '80px', height: '80px', borderRadius: '6px' }}
                    />
                    <div>
                      <div style={{ color: '#0F172A', fontWeight: 700, fontSize: '13px' }}>Traceability QR Code</div>
                      <div style={{ color: '#64748B', fontSize: '11px', margin: '4px 0 8px 0' }}>
                        Pindai untuk membuka halaman traceability batch ini.
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedQRBatch(b)}
                          style={{ background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Lihat Detail
                        </button>
                        {b.plot_id && (
                          <button
                            onClick={() => onSelectPlotOnMap && onSelectPlotOnMap(b.plot_id)}
                            style={{ background: '#E2E8F0', color: '#0F172A', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Lihat Lahan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={tracePagination.page}
            pageCount={tracePagination.pageCount}
            total={tracePagination.total}
            pageSize={TRACE_PAGE_SIZE}
            onPageChange={setTracePage}
            itemLabel="batch QR"
            variant="dark"
            className="mt-4"
          />
        </div>
      )}

      {/* TAB 3: OFFTAKER CONTRACTS */}
      {activeSubTab === 'contracts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ color: '#94A3B8', fontSize: '13px' }}>
              Kontrak pembelian kopi dari offtaker tersimpan di database dan menjadi basis proyeksi SCM.
            </div>
            <button
              onClick={() => setShowAddContractModal(true)}
              style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              + Tambah Kontrak
            </button>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#94A3B8' }}>
                  <th style={{ padding: '12px 16px' }}>KODE</th>
                  <th style={{ padding: '12px 16px' }}>PEMBELI</th>
                  <th style={{ padding: '12px 16px' }}>VARIETAS</th>
                  <th style={{ padding: '12px 16px' }}>VOLUME</th>
                  <th style={{ padding: '12px 16px' }}>HARGA / KG</th>
                  <th style={{ padding: '12px 16px' }}>TOTAL NILAI</th>
                  <th style={{ padding: '12px 16px' }}>TANGGAL KIRIM</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '28px 16px', textAlign: 'center', color: '#64748B' }}>
                      {loading ? 'Memuat kontrak offtaker...' : 'Belum ada kontrak offtaker.'}
                    </td>
                  </tr>
                ) : pagedContracts.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', color: '#FBBF24', fontWeight: 600 }}>{c.contract_code}</td>
                    <td style={{ padding: '12px 16px' }}>{c.buyer_name}</td>
                    <td style={{ padding: '12px 16px' }}>{c.coffee_type || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>{Number(c.volume_kg).toLocaleString('id-ID')} Kg</td>
                    <td style={{ padding: '12px 16px' }}>Rp {Number(c.price_per_kg).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>Rp {Number(c.total_value).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '12px 16px' }}>{c.delivery_date ? new Date(c.delivery_date).toISOString().slice(0, 10) : '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34D399', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={safeContractPage}
            pageCount={contractPageCount}
            total={contracts.length}
            pageSize={CONTRACT_PAGE_SIZE}
            onPageChange={setContractPage}
            itemLabel="kontrak"
            variant="dark"
            className="mt-3 rounded-xl"
          />
        </div>
      )}

      {/* TAB 4: FORECAST */}
      {activeSubTab === 'forecast' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#A78BFA' }}>show_chart</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>Realisasi Harga Kontrak per Bulan</span>
            </div>
            {!forecast?.price_history?.length ? (
              <p style={{ fontSize: '12px', color: '#64748B' }}>Belum ada riwayat harga kontrak tersimpan.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {forecast.price_history.map((row) => (
                  <div key={row.month} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span>{row.month}</span>
                    <span>
                      Arabica: <strong style={{ color: '#34D399' }}>{row.arabica ? `Rp ${Number(row.arabica).toLocaleString('id-ID')}` : '-'}</strong>
                      {' • '}
                      Robusta: <strong style={{ color: '#FBBF24' }}>{row.robusta ? `Rp ${Number(row.robusta).toLocaleString('id-ID')}` : '-'}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#A78BFA' }}>local_shipping</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>Proyeksi Permintaan &amp; Pengiriman</span>
            </div>
            {!forecast?.demand_forecast?.length ? (
              <p style={{ fontSize: '12px', color: '#64748B' }}>Belum ada kontrak aktif dengan tanggal kirim mendatang.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {forecast.demand_forecast.map((row) => (
                  <div key={row.month} style={{ fontSize: '12px', color: '#CBD5E1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{row.month}</span>
                      <strong style={{ color: '#A78BFA' }}>{Number(row.forecast_kg).toLocaleString('id-ID')} Kg</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>
                      <span>{row.target_buyer || '-'}</span>
                      <span>Rp {Number(row.price_projected).toLocaleString('id-ID')} / Kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '10px', color: '#64748B', marginTop: '12px' }}>{forecast?.basis || ''}</p>
          </div>
        </div>
      )}

      {/* MODAL: ADD BATCH */}
      {showAddBatchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', color: '#F8FAFC', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Catat Batch Panen Baru</h2>
              <button onClick={() => setShowAddBatchModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Lahan Panen (Plot)</label>
                <select
                  required
                  value={newBatch.plot_id}
                  onChange={(e) => setNewBatch({ ...newBatch, plot_id: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Pilih lahan kopi...</option>
                  {plots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.farmer_name} • {plot.coffee_type} • {plot.elevation} MDPL
                    </option>
                  ))}
                </select>
                {plots.length === 0 && (
                  <p style={{ fontSize: '11px', color: '#FBBF24', margin: '4px 0 0 0' }}>
                    Belum ada lahan terdaftar. Tambahkan plot terlebih dahulu di menu Peta Lahan.
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Metode Pengolahan</label>
                  <select value={newBatch.process_method} onChange={(e) => setNewBatch({ ...newBatch, process_method: e.target.value })} style={inputStyle}>
                    <option value="Natural Process">Natural Process</option>
                    <option value="Full Washed">Full Washed</option>
                    <option value="Honey Process">Honey Process</option>
                    <option value="Wet Hulled">Wet Hulled (Giling Basah)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tanggal Panen</label>
                  <input type="date" required value={newBatch.harvest_date} onChange={(e) => setNewBatch({ ...newBatch, harvest_date: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Hasil Panen (Kg)</label>
                  <input type="number" required min="0.1" step="0.1" placeholder="850" value={newBatch.weight_kg} onChange={(e) => setNewBatch({ ...newBatch, weight_kg: e.target.value })} style={inputStyle} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Kelas Mutu (Grade)</label>
                  <select value={newBatch.grade} onChange={(e) => setNewBatch({ ...newBatch, grade: e.target.value })} style={inputStyle}>
                    <option value="Specialty Grade">Specialty Grade (80+ Pts)</option>
                    <option value="Commercial Grade">Commercial Grade</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Cupping Score</label>
                  <input type="number" min="0" max="100" step="0.5" value={newBatch.cupping_score} onChange={(e) => setNewBatch({ ...newBatch, cupping_score: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Drying (Hari)</label>
                  <input type="number" min="0" max="60" value={newBatch.drying_days} onChange={(e) => setNewBatch({ ...newBatch, drying_days: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Status</label>
                  <select value={newBatch.status} onChange={(e) => setNewBatch({ ...newBatch, status: e.target.value })} style={inputStyle}>
                    <option value="Pengeringan">Pengeringan</option>
                    <option value="Gudang Green Bean">Gudang Green Bean</option>
                    <option value="Siap Kirim">Siap Kirim</option>
                    <option value="Terjual">Terjual</option>
                  </select>
                </div>
              </div>

              <button type="submit" style={{ marginTop: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer' }}>
                Simpan Pencatatan Panen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CONTRACT */}
      {showAddContractModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '24px', color: '#F8FAFC' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FBBF24' }}>Kontrak Offtaker Baru</h2>
              <button onClick={() => setShowAddContractModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateContract} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Nama Pembeli / Offtaker</label>
                <input type="text" required placeholder="PT Kopi Nusantara" value={newContract.buyer_name} onChange={(e) => setNewContract({ ...newContract, buyer_name: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Varietas</label>
                  <select value={newContract.coffee_type} onChange={(e) => setNewContract({ ...newContract, coffee_type: e.target.value })} style={inputStyle}>
                    <option value="Arabica">Arabica</option>
                    <option value="Robusta">Robusta</option>
                    <option value="Liberica">Liberica</option>
                    <option value="Excelsa">Excelsa</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Tanggal Kirim</label>
                  <input type="date" required value={newContract.delivery_date} onChange={(e) => setNewContract({ ...newContract, delivery_date: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Volume (Kg)</label>
                  <input type="number" required min="1" value={newContract.volume_kg} onChange={(e) => setNewContract({ ...newContract, volume_kg: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Harga / Kg (Rp)</label>
                  <input type="number" required min="1" value={newContract.price_per_kg} onChange={(e) => setNewContract({ ...newContract, price_per_kg: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <button type="submit" style={{ marginTop: '8px', background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)', color: '#0F172A', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 800, cursor: 'pointer' }}>
                Simpan Kontrak
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
