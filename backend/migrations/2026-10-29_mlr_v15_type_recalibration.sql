-- MLR v1.5-Kucur: elevation replaced by coffee type (Arabika dummy).
-- Fitted on the same 33 usable Kucur harvest survey plots.
-- Coefficients mirror backend/mlrService.js; keep both in sync.

UPDATE coffee_plots
SET predicted_yield = ROUND(
      GREATEST(
        0,
        133.3327
          + 0.0883178 * land_area
          - 0.1875196 * tree_count
          - CASE WHEN coffee_type = 'Arabica' THEN 101.7966 ELSE 0 END
      )::numeric,
      2
    )
WHERE deleted_at IS NULL;

INSERT INTO mlr_yield_predictions
  (plot_id, land_area_input, elevation_input, tree_count_input, mlr_formula_version, predicted_kg, calculated_by)
SELECT id, land_area, elevation, tree_count, 'MLR-v1.5-Kucur', predicted_yield, NULL
FROM coffee_plots
WHERE deleted_at IS NULL;
