const { Pool, types } = require('pg');
const fs = require('fs');
const path = require('path');

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of parsed JS Date
// objects (which serialize to full ISO timestamps and break the frontend's
// date inputs and string comparisons).
types.setTypeParser(1082, val => val);

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'globetrotter',
  password: process.env.PGPASSWORD || 'globetrotter',
  database: process.env.PGDATABASE || 'globetrotter'
});

async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
  await pool.query(sql);
}

async function waitForDb(retries = 20, delayMs = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`Waiting for Postgres... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect to Postgres after multiple retries');
}

module.exports = { pool, initSchema, waitForDb };
