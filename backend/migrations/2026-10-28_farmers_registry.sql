-- Registry petani: entitas mandiri agar data petani bisa diinput walau belum punya lahan.
CREATE TABLE IF NOT EXISTS farmers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS farmers_active_name_unique
    ON farmers (LOWER(name))
    WHERE deleted_at IS NULL;

-- Daftarkan nama petani yang sudah tercatat di lahan agar dapat diubah di dashboard.
INSERT INTO farmers (name)
SELECT DISTINCT TRIM(p.farmer_name)
FROM coffee_plots p
WHERE p.deleted_at IS NULL
  AND TRIM(p.farmer_name) <> ''
  AND NOT EXISTS (
      SELECT 1 FROM farmers f
      WHERE f.deleted_at IS NULL
        AND LOWER(f.name) = LOWER(TRIM(p.farmer_name))
  );
