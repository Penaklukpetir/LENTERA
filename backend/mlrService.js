export const MLR_MODEL_VERSION = 'MLR-v1.3-Kucur';
export const VALID_COFFEE_TYPES = ['Robusta', 'Arabica', 'Liberica', 'Excelsa'];

// Calibrated multiple linear regression for Desa Kucur smallholder plots.
// The biological floor (0.4 kg/tree) prevents valid plots from collapsing to 0 kg
// when the linear part is dominated by the elevation penalty.
export const calculateYield = ({ land_area, tree_count, elevation }) => {
  const area = Number(land_area);
  const trees = Number(tree_count);
  const elev = Number(elevation);

  if (!Number.isFinite(area) || area <= 0) {
    throw new Error('Luas lahan harus lebih besar dari nol.');
  }
  if (!Number.isInteger(trees) || trees < 1) {
    throw new Error('Jumlah pohon minimal 1 batang.');
  }
  if (!Number.isInteger(elev) || elev < 400 || elev > 3000) {
    throw new Error('Ketinggian lahan harus 400-3000 MDPL.');
  }

  const linear = -45.50 + (0.12 * area) + (1.85 * trees) - (0.08 * elev);
  const biologicalFloor = trees * 0.4;
  const predicted = Math.max(biologicalFloor, linear, 0);

  return {
    predicted_yield: Math.round(predicted * 100) / 100,
    model_version: MLR_MODEL_VERSION,
    inputs: { land_area: area, tree_count: trees, elevation: elev },
  };
};
