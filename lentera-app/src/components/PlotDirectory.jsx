import React, { useEffect, useMemo, useState } from 'react';
import Pagination from './Pagination';

const PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();

const formatKg = (value) =>
  `${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;

const formatPct = (value) =>
  `${Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;

export default function PlotDirectory({ plots = [], accuracy = null, onOpenPlot }) {
  const [search, setSearch] = useState('');
  const [variety, setVariety] = useState('All');
  const [onlyHarvested, setOnlyHarvested] = useState(false);
  const [page, setPage] = useState(1);

  const harvestByPlot = useMemo(() => {
    const map = new Map();
    (accuracy?.plots || []).forEach((row) => map.set(row.plot_id, row));
    return map;
  }, [accuracy]);

  const varieties = useMemo(() => {
    const set = new Set(plots.map((plot) => plot.coffee_type).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [plots]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return plots
      .filter((plot) => (variety === 'All' ? true : plot.coffee_type === variety))
      .filter((plot) => {
        if (!term) return true;
        return [plot.farmer_name, plot.description, plot.coffee_type]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .map((plot) => {
        const harvest = harvestByPlot.get(plot.id);
        const harvestedKg = harvest ? Number(harvest.harvested_kg) : 0;
        const predictedKg = Number(plot.predicted_yield || 0);
        return {
          ...plot,
          harvestedKg,
          predictedKg,
          errorPct: harvest ? Number(harvest.error_pct) : null,
          age: plot.planting_year ? CURRENT_YEAR - Number(plot.planting_year) : null,
        };
      })
      .filter((plot) => (onlyHarvested ? plot.harvestedKg > 0 : true));
  }, [plots, variety, search, onlyHarvested, harvestByPlot]);

  useEffect(() => {
    setPage(1);
  }, [search, variety, onlyHarvested]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totals = useMemo(() => {
    const area = rows.reduce((sum, plot) => sum + Number(plot.land_area || 0), 0);
    const predicted = rows.reduce((sum, plot) => sum + plot.predictedKg, 0);
    const harvested = rows.reduce((sum, plot) => sum + plot.harvestedKg, 0);
    const withHarvest = rows.filter((plot) => plot.harvestedKg > 0).length;
    return { area, predicted, harvested, withHarvest };
  }, [rows]);

  const withinTolerance = accuracy?.tolerance_pct ?? 25;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">DATA LAHAN KOPI</span>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Daftar Lahan &amp; Panen Riil</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Prediksi MLR dibandingkan dengan total panen yang dicatat per lahan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenPlot?.(null)}
          className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-slate-900 text-xs font-extrabold shadow-sm hover:bg-primary/90 transition-all cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-base">map</span>
          Buka Peta Lahan
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 bg-white dark:bg-slate-950 border border-primary/10 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL LAHAN</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{rows.length.toLocaleString('id-ID')}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-semibold">{(totals.area / 10000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} ha total luas</div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-slate-950 border border-primary/10 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PREDIKSI MLR</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-500">{formatKg(totals.predicted)}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-semibold">Total prediksi seluruh lahan</div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-slate-950 border border-primary/10 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PANEN RIIL</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-500">{formatKg(totals.harvested)}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-semibold">{totals.withHarvest} lahan sudah dicatat</div>
        </div>

        <div className="rounded-2xl p-4 bg-white dark:bg-slate-950 border border-primary/10 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AKURASI PREDIKSI</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {accuracy?.median_ape_pct === null || accuracy?.median_ape_pct === undefined
              ? '—'
              : formatPct(Math.max(0, 100 - accuracy.median_ape_pct))}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-semibold">
            {accuracy?.measured_plots ? `Dari ${accuracy.measured_plots} lahan terukur` : 'Belum ada lahan terukur'}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 border border-primary/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama petani atau keterangan lahan..."
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary text-slate-900 dark:text-white box-border"
            />
          </div>
          <select
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary text-slate-900 dark:text-white"
          >
            {varieties.map((item) => (
              <option key={item} value={item}>{item === 'All' ? 'Semua varietas' : item}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyHarvested}
              onChange={(e) => setOnlyHarvested(e.target.checked)}
              className="accent-emerald-500"
            />
            Hanya yang sudah panen
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-xs font-bold text-slate-400">
            Tidak ada lahan yang cocok dengan filter ini.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Petani</th>
                    <th className="px-4 py-3">Luas</th>
                    <th className="px-4 py-3">Pohon</th>
                    <th className="px-4 py-3">Elevasi</th>
                    <th className="px-4 py-3">Umur</th>
                    <th className="px-4 py-3 text-right">Prediksi</th>
                    <th className="px-4 py-3 text-right">Panen Riil</th>
                    <th className="px-4 py-3 text-right">Selisih</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pageRows.map((plot) => (
                    <tr key={plot.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 dark:text-white">{plot.farmer_name}</div>
                        <div className="text-[10px] font-bold text-slate-400">{plot.coffee_type} · {plot.status}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{Number(plot.land_area || 0).toLocaleString('id-ID')} m²</td>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{Number(plot.tree_count || 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{plot.elevation} mdpl</td>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                        {plot.planting_year ? `${plot.age} th` : '—'}
                        {plot.planting_year && <div className="text-[10px] text-slate-400">tanam {plot.planting_year}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-500">{formatKg(plot.predictedKg)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-500">
                        {plot.harvestedKg > 0 ? formatKg(plot.harvestedKg) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {plot.errorPct === null ? (
                          <span className="text-slate-400 font-semibold">Belum ada panen</span>
                        ) : (
                          <span className={`font-extrabold ${plot.errorPct <= withinTolerance ? 'text-emerald-500' : 'text-rose-500'}`}>
                            ±{formatPct(plot.errorPct)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenPlot?.(plot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-primary transition-all cursor-pointer border-none"
                        >
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {pageRows.map((plot) => (
                <div key={plot.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">{plot.farmer_name}</div>
                      <div className="text-[10px] font-bold text-slate-400">{plot.coffee_type} · {plot.status}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPlot?.(plot)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-[10px] font-extrabold text-primary border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      Peta
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>{Number(plot.land_area || 0).toLocaleString('id-ID')} m²</span>
                    <span>{Number(plot.tree_count || 0).toLocaleString('id-ID')} pohon</span>
                    <span>{plot.elevation} mdpl</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="text-amber-500">Prediksi {formatKg(plot.predictedKg)}</span>
                    <span className="text-emerald-500">
                      {plot.harvestedKg > 0 ? `Panen ${formatKg(plot.harvestedKg)}` : 'Panen belum dicatat'}
                    </span>
                  </div>
                  {plot.errorPct !== null && (
                    <div className={`text-[10px] font-extrabold ${plot.errorPct <= withinTolerance ? 'text-emerald-500' : 'text-rose-500'}`}>
                      Selisih ±{formatPct(plot.errorPct)} {plot.errorPct <= withinTolerance ? '(dalam toleransi)' : `(di luar toleransi ±${withinTolerance}%)`}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              page={safePage}
              pageCount={pageCount}
              total={rows.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="lahan"
              plain
              className="border-t border-slate-100 dark:border-slate-800"
            />
          </>
        )}
      </div>
    </div>
  );
}
