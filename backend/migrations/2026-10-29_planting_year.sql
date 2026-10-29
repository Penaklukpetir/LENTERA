-- Tambah tahun tanam pada lahan kopi agar umur tanaman bisa dipakai
-- sebagai pembanding akurasi peramalan dan kelengkapan data lapangan.
-- Idempotent: aman dijalankan ulang.

ALTER TABLE coffee_plots
    ADD COLUMN IF NOT EXISTS planting_year SMALLINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'coffee_plots_planting_year_range'
    ) THEN
        ALTER TABLE coffee_plots
            ADD CONSTRAINT coffee_plots_planting_year_range
            CHECK (planting_year IS NULL OR (planting_year BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE)::int));
    END IF;
END $$;
