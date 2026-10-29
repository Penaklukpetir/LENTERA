export const MLR_MODEL_VERSION = 'MLR-v1.5-Kucur';
export const VALID_COFFEE_TYPES = ['Robusta', 'Arabica', 'Liberica', 'Excelsa'];

// 10th-90th percentile of actual/predicted on the 33 Kucur plots. Used as the
// displayed estimate range because a single point value overstates precision.
export const PREDICTION_RANGE = { low: 0.32, high: 1.99 };

// Ordinary least squares on the 33 usable Kucur harvest survey plots.
// Coffee type replaces elevation: R2 0.50, MAE 108 kg, LOO MAE 127 kg, and the
// total prediction matches the 7.250 kg village total (0,73 t/ha). Elevation was
// dropped because in this survey it only acted as a proxy for coffee type.
// Area and tree count are collinear (r = 0.84), so the tree coefficient is
// negative: at equal area, denser planting lowers yield per tree.
export const MLR_COEFFICIENTS = {
  intercept: 133.3327,
  land_area: 0.0883178,
  tree_count: -0.1875196,
  arabica: -101.7966,
};

// Kalibrasi per lahan: prediksi musim berikutnya dikoreksi rasio panen nyata
// terhadap prediksi dasar pada musim-musim sebelumnya. Tanpa riwayat panen,
// rasio = 1 sehingga prediksi sama dengan model.
const CALIBRATION_MIN_RATIO = 0.25;
const CALIBRATION_MAX_RATIO = 4;

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const calibratePrediction = (baselineKg, seasons, beforeSeason = Infinity) => {
  const ratios = seasons
    .filter((item) => item.season < beforeSeason && baselineKg > 0)
    .map((item) => item.harvested_kg / baselineKg)
    .filter((ratio) => Number.isFinite(ratio) && ratio > 0);

  if (ratios.length === 0) {
    return { ratio: 1, seasons: 0, calibrated_kg: baselineKg };
  }

  const ratio = Math.min(CALIBRATION_MAX_RATIO, Math.max(CALIBRATION_MIN_RATIO, median(ratios)));
  return {
    ratio,
    seasons: ratios.length,
    calibrated_kg: Math.round(baselineKg * ratio * 100) / 100,
  };
};

export const calculateYield = ({ land_area, tree_count, elevation, coffee_type }) => {
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
  if (!VALID_COFFEE_TYPES.includes(coffee_type)) {
    throw new Error('Jenis kopi tidak dikenali.');
  }

  const linear =
    MLR_COEFFICIENTS.intercept +
    MLR_COEFFICIENTS.land_area * area +
    MLR_COEFFICIENTS.tree_count * trees +
    (coffee_type === 'Arabica' ? MLR_COEFFICIENTS.arabica : 0);
  const predicted = Math.max(linear, 0);

  return {
    predicted_yield: Math.round(predicted * 100) / 100,
    model_version: MLR_MODEL_VERSION,
    inputs: { land_area: area, tree_count: trees, elevation: elev, coffee_type },
  };
};
