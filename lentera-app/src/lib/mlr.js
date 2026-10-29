// Mirrors backend/mlrService.js — keep both in sync.
export const MLR_MODEL_VERSION = 'MLR-v1.5-Kucur';

// 10th-90th percentile of actual/predicted on the 33 Kucur plots.
export const PREDICTION_RANGE = { low: 0.32, high: 1.99 };

export const getPredictionRange = (yieldKg) => {
  const value = Number(yieldKg) || 0;
  return {
    low: Math.round(value * PREDICTION_RANGE.low),
    high: Math.round(value * PREDICTION_RANGE.high),
  };
};

export const MLR_COEFFICIENTS = {
  intercept: 133.3327,
  land_area: 0.0883178,
  tree_count: -0.1875196,
  arabica: -101.7966,
};

export const calculateMLRYield = (area, trees, elev, coffeeType) => {
  const a = parseFloat(area) || 0;
  const t = parseInt(trees) || 0;
  const e = parseInt(elev) || 0;
  if (a <= 0 || t < 1 || e < 400 || e > 3000 || !coffeeType) return 0;
  const linear =
    MLR_COEFFICIENTS.intercept +
    MLR_COEFFICIENTS.land_area * a +
    MLR_COEFFICIENTS.tree_count * t +
    (coffeeType === 'Arabica' ? MLR_COEFFICIENTS.arabica : 0);
  return Math.round(Math.max(linear, 0) * 100) / 100;
};
