import pool from './db.js';

export const getEResources = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, slug, type, status, content, attachment_url, created_at FROM e_resources WHERE deleted_at IS NULL ORDER BY id DESC'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch e_resources error:', err);
    return res.status(500).json({ error: 'Internal server error while fetching e-resources.' });
  }
};

export const createEResource = async (req, res) => {
  const { title, type, status, content } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  try {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await pool.query(
      'INSERT INTO e_resources (title, slug, type, status, content) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, slug, type || 'TEXT', status || 'AKTIF', content || '']
    );
    return res.status(201).json({ message: 'E-Resource created successfully.', resource: result.rows[0] });
  } catch (err) {
    console.error('Create e_resource error:', err);
    return res.status(500).json({ error: 'Failed to create e-resource.' });
  }
};

export const updateEResource = async (req, res) => {
  const { id } = req.params;
  const { title, type, status, content } = req.body;

  try {
    const result = await pool.query(
      'UPDATE e_resources SET title = COALESCE($1, title), type = COALESCE($2, type), status = COALESCE($3, status), content = COALESCE($4, content), updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND deleted_at IS NULL RETURNING *',
      [title, type, status, content, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'E-Resource not found.' });
    }
    return res.status(200).json({ message: 'E-Resource updated.', resource: result.rows[0] });
  } catch (err) {
    console.error('Update e_resource error:', err);
    return res.status(500).json({ error: 'Failed to update e-resource.' });
  }
};

export const deleteEResource = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE e_resources SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'E-Resource not found.' });
    }
    return res.status(200).json({ message: 'E-Resource deleted successfully (soft delete).' });
  } catch (err) {
    console.error('Delete e_resource error:', err);
    return res.status(500).json({ error: 'Failed to delete e-resource.' });
  }
};
