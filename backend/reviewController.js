import pool from './db.js';

export const getReviews = async (req, res) => {
  const { approved_only } = req.query;
  try {
    let query = 'SELECT id, visitor_name, rating, comment, visited_location, is_approved, created_at FROM reviews';
    const params = [];
    if (approved_only === 'true') {
      query += ' WHERE is_approved = true';
    }
    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Fetch reviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

export const createReview = async (req, res) => {
  const { visitor_name, rating, comment, visited_location } = req.body;
  if (!visitor_name || !comment) {
    return res.status(400).json({ error: 'Name and comment are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO reviews (visitor_name, rating, comment, visited_location, is_approved) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [visitor_name, rating || 5, comment, visited_location || 'Kebun Kopi Kucur', true]
    );
    return res.status(201).json({ message: 'Review submitted successfully.', review: result.rows[0] });
  } catch (err) {
    console.error('Create review error:', err);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
};

export const toggleApproveReview = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE reviews SET is_approved = NOT is_approved WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    return res.status(200).json({ message: 'Review approval toggled.', review: result.rows[0] });
  } catch (err) {
    console.error('Toggle approve review error:', err);
    return res.status(500).json({ error: 'Failed to toggle review status.' });
  }
};

export const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    return res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (err) {
    console.error('Delete review error:', err);
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
};
