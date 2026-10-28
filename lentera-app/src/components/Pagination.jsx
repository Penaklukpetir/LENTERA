import React from 'react';

export const DEFAULT_PAGE_SIZE = 10;

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  itemLabel = 'data',
  variant = 'light',
  plain = false,
  className = '',
}) {
  if (!total) return null;

  const safePageCount = Math.max(pageCount, 1);
  const safePage = Math.min(Math.max(page, 1), safePageCount);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  const isDark = variant === 'dark';

  const textClass = isDark
    ? 'text-slate-400'
    : 'text-slate-500 dark:text-slate-400';
  const infoClass = isDark
    ? 'text-slate-200'
    : 'text-slate-700 dark:text-slate-200';
  const buttonClass = isDark
    ? 'bg-white/5 hover:bg-white/10 text-slate-300'
    : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300';

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold ${textClass} ${
        plain ? '' : 'px-5 py-4'
      } ${className}`}
    >
      <span>
        Menampilkan {from}–{to} dari {total.toLocaleString('id-ID')} {itemLabel}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          aria-label="Halaman sebelumnya"
          title="Halaman sebelumnya"
          className={`p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${buttonClass}`}
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>
        <span className={`px-2 font-extrabold ${infoClass}`}>
          Halaman {safePage} / {safePageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === safePageCount}
          aria-label="Halaman berikutnya"
          title="Halaman berikutnya"
          className={`p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${buttonClass}`}
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
