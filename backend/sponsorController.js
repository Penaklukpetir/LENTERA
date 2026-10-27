import pool from './db.js';

// Controller handler to retrieve all funding proposals joined with users & plots
export const getSponsorships = async (req, res) => {
  try {
    const queryResult = await pool.query(
      `SELECT s.id, s.funding_amount, s.status, s.proposal_url, s.created_at,
              u.full_name AS sponsor_name, p.farmer_name AS plot_owner, p.coffee_type, p.elevation
       FROM sponsorships s
       JOIN users u ON s.sponsor_id = u.id
       JOIN coffee_plots p ON s.plot_id = p.id
       ORDER BY s.id ASC`
    );
    return res.status(200).json(queryResult.rows);
  } catch (err) {
    console.error('Fetch sponsorships database query exception:', err);
    return res.status(500).json({ error: 'Internal server error while fetching sponsorships data.' });
  }
};

// Controller handler to submit a new proposal from B2B sponsor
export const createSponsorship = async (req, res) => {
  const { plot_id, funding_amount, proposal_url } = req.body;

  if (!plot_id || funding_amount === undefined || !proposal_url) {
    return res.status(400).json({ error: 'Missing parameters. Plot ID, investment amount, and proposal URL are required.' });
  }

  try {
    const sponsorId = req.user.id; // Retreived from JWT payload
    const queryResult = await pool.query(
      'INSERT INTO sponsorships (sponsor_id, plot_id, proposal_url, funding_amount, status) VALUES ($1, $2, $3, $4, \'PENDING\') RETURNING *',
      [sponsorId, plot_id, proposal_url, funding_amount]
    );

    return res.status(201).json({
      message: 'Sponsorship proposal submitted successfully.',
      sponsorship: queryResult.rows[0]
    });

  } catch (err) {
    console.error('Insert B2B sponsorship query database exception:', err);
    return res.status(500).json({ error: 'Internal server error while creating sponsorship proposal.' });
  }
};

// Controller handler to approve proposal (Village Mayor role required)
export const approveSponsorship = async (req, res) => {
  const { id } = req.params;

  try {
    const queryResult = await pool.query(
      'UPDATE sponsorships SET status = \'APPROVED\', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (queryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sponsorship target record not found.' });
    }

    return res.status(200).json({
      message: 'Sponsorship approved and signed successfully.',
      sponsorship: queryResult.rows[0]
    });

  } catch (err) {
    console.error('Update sponsorship approval query database exception:', err);
    return res.status(500).json({ error: 'Internal server error while approving sponsorship.' });
  }
};
