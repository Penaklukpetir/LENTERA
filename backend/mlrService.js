export const MLR_MODEL_VERSION = 'MLR-v1.4-Kucur';
export const VALID_COFFEE_TYPES = ['Robusta', 'Arabica', 'Liberica', 'Excelsa'];

// Recalibrated with ordinary least squares on 33 usable plots of the Kucur
// harvest survey (xlsx "data panen kucur"): R2 0.55, MAE 102 kg, LOO MAE 120 kg,
// total prediction 7.250 kg vs 7.250 kg actual (0,73 t/ha).
// The tree coefficient is negative because area and tree count are collinear
// (r = 0.84): at equal area, denser planting lowers yield per tree.
export const MLR_COEFFICIENTS = {
  intercept: 637.5208,
  land_area: 0.0699748,
  tree_count: -0.1145365,
  elevation: -0.5723476,
};

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

  const linear =
    MLR_COEFFICIENTS.intercept +
    MLR_COEFFICIENTS.land_area * area +
    MLR_COEFFICIENTS.tree_count * trees +
    MLR_COEFFICIENTS.elevation * elev;
  const predicted = Math.max(linear, 0);

  return {
    predicted_yield: Math.round(predicted * 100) / 100,
    model_version: MLR_MODEL_VERSION,
    inputs: { land_area: area, tree_count: trees, elevation: elev },
  };
};
