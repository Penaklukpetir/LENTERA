-- MLR v1.4-Kucur: recalibrated on the 33 usable Kucur harvest survey plots.
-- Coefficients mirror backend/mlrService.js; keep both in sync.

UPDATE coffee_plots
SET predicted_yield = ROUND(
      GREATEST(
        0,
        637.5208
          + 0.0699748 * land_area
          - 0.1145365 * tree_count
          - 0.5723476 * elevation
      )::numeric,
      2
    )
WHERE deleted_at IS NULL;

INSERT INTO mlr_yield_predictions
  (plot_id, land_area_input, elevation_input, tree_count_input, mlr_formula_version, predicted_kg, calculated_by)
SELECT id, land_area, elevation, tree_count, 'MLR-v1.4-Kucur', predicted_yield, NULL
FROM coffee_plots
WHERE deleted_at IS NULL;
