export const publicPlotCode = (plot) =>
  `Anggota #${String(plot?.id ?? 0).padStart(3, '0')}`;
