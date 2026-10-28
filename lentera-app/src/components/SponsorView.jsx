import React, { useState } from 'react';
import Pagination from './Pagination';

const SPONSOR_PAGE_SIZE = 10;

export default function SponsorView({ role, sponsorships = [], setShowSponsorModal, approveSponsorship, inDashboard = false }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const filtered = filterStatus === 'ALL' ? sponsorships : sponsorships.filter(s => s.status === filterStatus);

  const pageCount = Math.max(1, Math.ceil(filtered.length / SPONSOR_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedFiltered = filtered.slice((safePage - 1) * SPONSOR_PAGE_SIZE, safePage * SPONSOR_PAGE_SIZE);

  const activeFunding = sponsorships.filter(s => ['APPROVED', 'DISBURSED'].includes(s.status));
  const totalAmount = activeFunding.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);

  const pendingCount = sponsorships.filter(s => ['PENDING', 'CURATED'].includes(s.status)).length;
  const approvedCount = activeFunding.length;

  const statusColors = {
    CURATED: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    DISBURSED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <div className="flex-1 overflow-y-auto font-display pb-28 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-primary/20 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary font-extrabold text-[11px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">handshake</span>
                <span>Program Investasi Hijau</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Sponsorship Hub &amp; Kemitraan B2B
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Platform pengelolaan kemitraan bisnis antara perusahaan mitra dengan petani kopi Desa Kucur. Investasikan dana Anda untuk masa depan pertanian berkelanjutan.
              </p>
            </div>
            <button
              onClick={() => setShowSponsorModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-slate-900 font-extrabold px-5 py-3 rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_business</span>
              <span>Ajukan Proposal</span>
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Dana Terverifikasi</span>
              <span className="material-symbols-outlined text-emerald-500">payments</span>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Rp {totalAmount.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 text-xs text-emerald-500 font-semibold">Dana Mitra Aktif</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Sponsor Aktif</span>
              <span className="material-symbols-outlined text-primary">verified</span>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {approvedCount}
            </div>
            <div className="mt-1 text-xs text-primary font-semibold">Perusahaan Mitra</div>
          </div>

          <div className="bg-white dark:bg-slate-950 border border-amber-500/10 rounded-2xl p-5 shadow-sm card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Menunggu Approval</span>
              <span className="material-symbols-outlined text-amber-500">pending</span>
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {pendingCount}
            </div>
            <div className="mt-1 text-xs text-amber-500 font-semibold">Proposal Masuk</div>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">MANAJEMEN MITRA</span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Antrean Proposal Kemitraan</h3>
            </div>
            {/* Filter pills */}
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-primary/10">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setFilterStatus(s);
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${filterStatus === s ? 'bg-primary text-slate-900 shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                >
                  {s === 'ALL' ? 'Semua' : s}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
              <p className="mt-2 text-sm font-bold text-slate-400">
                {sponsorships.length === 0 ? 'Belum ada proposal kemitraan yang masuk.' : 'Tidak ada data dengan filter ini.'}
              </p>
              {sponsorships.length === 0 && (
                <button
                  onClick={() => setShowSponsorModal(true)}
                  className="mt-4 px-5 py-2.5 bg-primary text-slate-900 font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Ajukan Proposal Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm" style={{ minWidth: '540px' }}>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Nama Perusahaan</th>
                    <th className="px-5 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Petani Mitra</th>
                    <th className="px-5 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Nilai Investasi</th>
                    <th className="px-5 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Status</th>
                    {role === 'village' && inDashboard && (
                      <th className="px-5 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedFiltered.map((spon) => (
                    <tr key={spon.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white">{spon.sponsor_name}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-medium">{spon.plot_owner}</td>
                      <td className="px-5 py-4 text-primary font-extrabold">
                        Rp {(parseFloat(spon.amount) || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${statusColors[spon.status] || 'bg-slate-100 text-slate-500'}`}>
                          {spon.status?.toUpperCase()}
                        </span>
                      </td>
                      {role === 'village' && inDashboard && (
                        <td className="px-5 py-4">
                          {(spon.status === 'PENDING' || spon.status === 'pending') ? (
                            <button
                              onClick={() => approveSponsorship(spon.id)}
                              className="px-3.5 py-1.5 bg-primary text-slate-900 font-extrabold rounded-xl text-[10px] hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                            >
                              ✓ Approve &amp; TTD
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-semibold">Selesai</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            page={safePage}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={SPONSOR_PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="proposal"
            className="border-t border-slate-100 dark:border-slate-800"
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'eco', color: 'text-emerald-500', title: 'Pertanian Berkelanjutan', desc: 'Setiap investasi Anda secara langsung mendukung praktik pertanian kopi organik tanpa pestisida berbahaya.' },
            { icon: 'verified_user', color: 'text-blue-500', title: 'Tata Kelola Transparan', desc: 'Semua transaksi tercatat secara digital di blockchain-ready dan dapat diaudit melalui laporan berkala.' },
            { icon: 'workspace_premium', color: 'text-primary', title: 'ISO 29148 Compliant', desc: 'Standar dokumen dan SLA kemitraan kami telah memenuhi standar internasional requirement engineering.' }
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl p-5 shadow-sm card-hover">
              <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
              <h4 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">{card.title}</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
