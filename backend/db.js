import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lentera_db',
});

// Helper validation on connection
pool.on('connect', () => {
  console.log('PostgreSQL Connection Pool initialized successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err);
  process.exit(-1);
});

export default pool;
