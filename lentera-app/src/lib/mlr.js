// Mirrors backend/mlrService.js — keep both in sync.
export const MLR_MODEL_VERSION = 'MLR-v1.4-Kucur';

export const MLR_COEFFICIENTS = {
  intercept: 637.5208,
  land_area: 0.0699748,
  tree_count: -0.1145365,
  elevation: -0.5723476,
};

export const calculateMLRYield = (area, trees, elev) => {
  const a = parseFloat(area) || 0;
  const t = parseInt(trees) || 0;
  const e = parseInt(elev) || 0;
  if (a <= 0 || t < 1 || e < 400 || e > 3000) return 0;
  const linear =
    MLR_COEFFICIENTS.intercept +
    MLR_COEFFICIENTS.land_area * a +
    MLR_COEFFICIENTS.tree_count * t +
    MLR_COEFFICIENTS.elevation * e;
  return Math.round(Math.max(linear, 0) * 100) / 100;
};
