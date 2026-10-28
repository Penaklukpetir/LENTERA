-- Backfill legacy rows where MLR v1.2 stored 0 kg despite valid inputs.
-- Uses the v1.3 formula and keeps an audit row in mlr_yield_predictions.
-- Idempotent: only touches rows that still hold a 0 prediction.

WITH recalc AS (
    SELECT p.id,
           p.land_area,
           p.tree_count,
           p.elevation,
           GREATEST(
               p.tree_count * 0.4,
               -45.50 + (0.12 * p.land_area) + (1.85 * p.tree_count) - (0.08 * p.elevation),
               0
           ) AS new_yield
    FROM coffee_plots p
    WHERE p.deleted_at IS NULL
      AND p.predicted_yield = 0
      AND p.land_area > 0
      AND p.tree_count >= 1
      AND p.elevation BETWEEN 400 AND 3000
), updated AS (
    UPDATE coffee_plots p
    SET predicted_yield = recalc.new_yield,
        updated_at = CURRENT_TIMESTAMP
    FROM recalc
    WHERE p.id = recalc.id
    RETURNING p.id, p.land_area, p.tree_count, p.elevation, p.predicted_yield
)
INSERT INTO mlr_yield_predictions
    (plot_id, land_area_input, elevation_input, tree_count_input, mlr_formula_version, predicted_kg)
SELECT id, land_area, elevation, tree_count, 'MLR-v1.3-Kucur', predicted_yield
FROM updated;
