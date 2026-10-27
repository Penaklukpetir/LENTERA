import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

// Controller handler to register a new user in db
export const registerUser = async (req, res) => {
  const { username, password, email, role, full_name } = req.body;

  if (!username || !password || !email || !role || !full_name) {
    return res.status(400).json({ error: 'Missing parameters. All registration fields are required.' });
  }

  if (!['admin', 'sponsor', 'village'].includes(role)) {
    return res.status(400).json({ error: 'Invalid privilege role assignment.' });
  }

  try {
    // Check if duplicate user exists
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(409).json({ error: 'Conflict: username or email is already registered.' });
    }

    // Encrypt security password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save transaction
    const insertResult = await pool.query(
      'INSERT INTO users (username, password_hash, email, role, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, full_name',
      [username, passwordHash, email, role, full_name]
    );

    return res.status(201).json({
      message: 'Registration successful.',
      user: insertResult.rows[0]
    });

  } catch (err) {
    console.error('Database insertion registration exception:', err);
    return res.status(500).json({ error: 'Internal database error during user creation.' });
  }
};

// Controller handler to authenticate credentials and issue JWT
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    // Check user existence
    const queryResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (queryResult.rows.length === 0) {
      return res.status(401).json({ error: 'Access denied: invalid credentials.' });
    }

    const user = queryResult.rows[0];

    // Validate password comparisons
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Access denied: invalid credentials.' });
    }

    // Create session token with 24 hours duration
    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });

  } catch (err) {
    console.error('Authentication query database exception:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};
