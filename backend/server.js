const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { pool, initSchema, waitForDb } = require('./db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'globetrotter-dev-secret';
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function tripOwned(req, res, next) {
  const id = req.params.tripId || req.params.id;
  const { rows } = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
  const trip = rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.user_id !== req.user.id) return res.status(403).json({ error: 'Not your trip' });
  req.trip = trip;
  next();
}

function wrap(fn) {
  return (req, res) => fn(req, res).catch(err => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  });
}

// ---------- AUTH ----------

app.post('/api/auth/signup', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
    [name, email.toLowerCase(), hash]
  );
  const user = rows[0];
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [(email || '').toLowerCase()]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}));

app.get('/api/auth/me', auth, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, language FROM users WHERE id = $1', [req.user.id]);
  res.json({ user: rows[0] });
}));

app.put('/api/auth/profile', auth, wrap(async (req, res) => {
  const { name, language } = req.body;
  await pool.query(
    'UPDATE users SET name = COALESCE($1, name), language = COALESCE($2, language) WHERE id = $3',
    [name, language, req.user.id]
  );
  const { rows } = await pool.query('SELECT id, name, email, language FROM users WHERE id = $1', [req.user.id]);
  res.json({ user: rows[0] });
}));

// ---------- CITIES & ACTIVITIES (discovery) ----------

app.get('/api/cities', wrap(async (req, res) => {
  const { search } = req.query;
  let rows;
  if (search) {
    const q = `%${search.toLowerCase()}%`;
    rows = (await pool.query(
      `SELECT * FROM cities WHERE lower(name) LIKE $1 OR lower(country) LIKE $1 OR lower(region) LIKE $1 ORDER BY popularity DESC`,
      [q]
    )).rows;
  } else {
    rows = (await pool.query('SELECT * FROM cities ORDER BY popularity DESC')).rows;
  }
  res.json({ cities: rows });
}));

app.get('/api/activities', wrap(async (req, res) => {
  const { city_id, category } = req.query;
  let rows;
  if (city_id && category) {
    rows = (await pool.query('SELECT * FROM activities WHERE city_id = $1 AND category = $2', [city_id, category])).rows;
  } else if (city_id) {
    rows = (await pool.query('SELECT * FROM activities WHERE city_id = $1', [city_id])).rows;
  } else {
    rows = (await pool.query('SELECT * FROM activities')).rows;
  }
  res.json({ activities: rows });
}));

// ---------- TRIPS ----------

app.get('/api/trips', auth, wrap(async (req, res) => {
  const { rows: trips } = await pool.query('SELECT * FROM trips WHERE user_id = $1 ORDER BY start_date', [req.user.id]);
  const withCounts = [];
  for (const t of trips) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM trip_stops WHERE trip_id = $1', [t.id]);
    withCounts.push({ ...t, stop_count: rows[0].c });
  }
  res.json({ trips: withCounts });
}));

app.post('/api/trips', auth, wrap(async (req, res) => {
  const { name, description, start_date, end_date, cover_photo } = req.body;
  if (!name || !start_date || !end_date) return res.status(400).json({ error: 'name, start_date, end_date are required' });
  if (new Date(end_date) < new Date(start_date)) return res.status(400).json({ error: 'end_date must be on or after start_date' });

  const { rows } = await pool.query(
    `INSERT INTO trips (user_id, name, description, start_date, end_date, cover_photo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, name, description || '', start_date, end_date, cover_photo || '']
  );
  res.json({ trip: rows[0] });
}));

app.get('/api/trips/:id', auth, tripOwned, wrap(async (req, res) => {
  res.json({ trip: await buildFullTrip(req.trip.id) });
}));

app.put('/api/trips/:id', auth, tripOwned, wrap(async (req, res) => {
  const { name, description, start_date, end_date, cover_photo } = req.body;
  await pool.query(
    `UPDATE trips SET name = COALESCE($1,name), description = COALESCE($2,description),
     start_date = COALESCE($3,start_date), end_date = COALESCE($4,end_date), cover_photo = COALESCE($5,cover_photo) WHERE id = $6`,
    [name, description, start_date, end_date, cover_photo, req.trip.id]
  );
  res.json({ trip: await buildFullTrip(req.trip.id) });
}));

app.delete('/api/trips/:id', auth, tripOwned, wrap(async (req, res) => {
  await pool.query('DELETE FROM trips WHERE id = $1', [req.trip.id]);
  res.json({ ok: true });
}));

app.put('/api/trips/:id/publish', auth, tripOwned, wrap(async (req, res) => {
  const { visibility } = req.body; // 'public' or 'private'
  let slug = req.trip.share_slug;
  if (visibility === 'public' && !slug) slug = nanoid(10);
  await pool.query(
    'UPDATE trips SET visibility = $1, share_slug = $2 WHERE id = $3',
    [visibility, visibility === 'public' ? slug : null, req.trip.id]
  );
  res.json({ trip: await buildFullTrip(req.trip.id) });
}));

// ---------- STOPS (cities in a trip) ----------

app.post('/api/trips/:tripId/stops', auth, tripOwned, wrap(async (req, res) => {
  const { city_id, start_date, end_date, sequence } = req.body;
  if (!city_id || !start_date || !end_date) return res.status(400).json({ error: 'city_id, start_date, end_date are required' });
  if (start_date < req.trip.start_date || end_date > req.trip.end_date) {
    return res.status(400).json({ error: 'Stop dates must fall within the trip dates' });
  }
  const countRes = await pool.query('SELECT COUNT(*)::int AS c FROM trip_stops WHERE trip_id = $1', [req.trip.id]);
  const seq = sequence ?? countRes.rows[0].c;
  const { rows } = await pool.query(
    'INSERT INTO trip_stops (trip_id, city_id, start_date, end_date, sequence) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.trip.id, city_id, start_date, end_date, seq]
  );
  res.json({ stop: rows[0] });
}));

app.put('/api/stops/:stopId', auth, wrap(async (req, res) => {
  const stop = await getStopIfOwned(req, res);
  if (!stop) return;
  const { start_date, end_date, sequence } = req.body;
  await pool.query(
    'UPDATE trip_stops SET start_date = COALESCE($1,start_date), end_date = COALESCE($2,end_date), sequence = COALESCE($3,sequence) WHERE id = $4',
    [start_date, end_date, sequence, stop.id]
  );
  const { rows } = await pool.query('SELECT * FROM trip_stops WHERE id = $1', [stop.id]);
  res.json({ stop: rows[0] });
}));

app.delete('/api/stops/:stopId', auth, wrap(async (req, res) => {
  const stop = await getStopIfOwned(req, res);
  if (!stop) return;
  await pool.query('DELETE FROM trip_stops WHERE id = $1', [stop.id]);
  res.json({ ok: true });
}));

// ---------- TRIP ACTIVITIES ----------

app.post('/api/stops/:stopId/activities', auth, wrap(async (req, res) => {
  const stop = await getStopIfOwned(req, res);
  if (!stop) return;
  const { activity_id, date, start_time, estimated_cost } = req.body;
  const { rows: actRows } = await pool.query('SELECT * FROM activities WHERE id = $1', [activity_id]);
  const activity = actRows[0];
  if (!activity) return res.status(400).json({ error: 'Activity not found' });
  if (activity.city_id !== stop.city_id) return res.status(400).json({ error: 'Activity does not belong to this stop city' });

  if (date < stop.start_date || date > stop.end_date) return res.status(400).json({ error: 'Activity date must fall within the stop dates' });

  const countRes = await pool.query('SELECT COUNT(*)::int AS c FROM trip_activities WHERE stop_id = $1', [stop.id]);
  const { rows } = await pool.query(
    `INSERT INTO trip_activities (stop_id, activity_id, date, start_time, sequence, estimated_cost)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [stop.id, activity_id, date, start_time || '', countRes.rows[0].c, estimated_cost ?? activity.estimated_cost]
  );
  res.json({ trip_activity: rows[0] });
}));

app.put('/api/trip-activities/:id', auth, wrap(async (req, res) => {
  const ta = await getTripActivityIfOwned(req, res);
  if (!ta) return;
  const { date, start_time, sequence, estimated_cost } = req.body;
  await pool.query(
    `UPDATE trip_activities SET date = COALESCE($1,date), start_time = COALESCE($2,start_time),
     sequence = COALESCE($3,sequence), estimated_cost = COALESCE($4,estimated_cost) WHERE id = $5`,
    [date, start_time, sequence, estimated_cost, ta.id]
  );
  const { rows } = await pool.query('SELECT * FROM trip_activities WHERE id = $1', [ta.id]);
  res.json({ trip_activity: rows[0] });
}));

app.delete('/api/trip-activities/:id', auth, wrap(async (req, res) => {
  const ta = await getTripActivityIfOwned(req, res);
  if (!ta) return;
  await pool.query('DELETE FROM trip_activities WHERE id = $1', [ta.id]);
  res.json({ ok: true });
}));

// ---------- EXPENSES / BUDGET ----------

app.post('/api/trips/:tripId/expenses', auth, tripOwned, wrap(async (req, res) => {
  const { category, description, amount, date } = req.body;
  if (!category || amount == null) return res.status(400).json({ error: 'category and amount are required' });
  const { rows } = await pool.query(
    'INSERT INTO expenses (trip_id, category, description, amount, date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.trip.id, category, description || '', amount, date || null]
  );
  res.json({ expense: rows[0] });
}));

app.delete('/api/expenses/:id', auth, wrap(async (req, res) => {
  const { rows: expRows } = await pool.query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
  const expense = expRows[0];
  if (!expense) return res.status(404).json({ error: 'Not found' });
  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [expense.trip_id]);
  if (tripRows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not your trip' });
  await pool.query('DELETE FROM expenses WHERE id = $1', [expense.id]);
  res.json({ ok: true });
}));

app.get('/api/trips/:id/budget', auth, tripOwned, wrap(async (req, res) => {
  res.json({ budget: await computeBudget(req.trip.id) });
}));

// ---------- PUBLIC SHARED VIEW ----------

app.get('/api/public/:slug', wrap(async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM trips WHERE share_slug = $1 AND visibility = 'public'`, [req.params.slug]);
  const trip = rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found or not public' });
  const { rows: ownerRows } = await pool.query('SELECT name FROM users WHERE id = $1', [trip.user_id]);
  res.json({ trip: await buildFullTrip(trip.id), owner: ownerRows[0].name });
}));

app.post('/api/public/:slug/copy', auth, wrap(async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM trips WHERE share_slug = $1 AND visibility = 'public'`, [req.params.slug]);
  const trip = rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found or not public' });

  const { rows: newTripRows } = await pool.query(
    `INSERT INTO trips (user_id, name, description, start_date, end_date, cover_photo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [req.user.id, trip.name + ' (Copy)', trip.description, trip.start_date, trip.end_date, trip.cover_photo]
  );
  const newTripId = newTripRows[0].id;

  const { rows: stops } = await pool.query('SELECT * FROM trip_stops WHERE trip_id = $1', [trip.id]);
  for (const stop of stops) {
    const { rows: newStopRows } = await pool.query(
      'INSERT INTO trip_stops (trip_id, city_id, start_date, end_date, sequence) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [newTripId, stop.city_id, stop.start_date, stop.end_date, stop.sequence]
    );
    const newStopId = newStopRows[0].id;
    const { rows: acts } = await pool.query('SELECT * FROM trip_activities WHERE stop_id = $1', [stop.id]);
    for (const a of acts) {
      await pool.query(
        'INSERT INTO trip_activities (stop_id, activity_id, date, start_time, sequence, estimated_cost) VALUES ($1,$2,$3,$4,$5,$6)',
        [newStopId, a.activity_id, a.date, a.start_time, a.sequence, a.estimated_cost]
      );
    }
  }
  res.json({ trip: await buildFullTrip(newTripId) });
}));

// ---------- helpers ----------

async function getStopIfOwned(req, res) {
  const { rows: stopRows } = await pool.query('SELECT * FROM trip_stops WHERE id = $1', [req.params.stopId]);
  const stop = stopRows[0];
  if (!stop) { res.status(404).json({ error: 'Stop not found' }); return null; }
  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [stop.trip_id]);
  if (tripRows[0].user_id !== req.user.id) { res.status(403).json({ error: 'Not your trip' }); return null; }
  return stop;
}

async function getTripActivityIfOwned(req, res) {
  const { rows: taRows } = await pool.query('SELECT * FROM trip_activities WHERE id = $1', [req.params.id]);
  const ta = taRows[0];
  if (!ta) { res.status(404).json({ error: 'Not found' }); return null; }
  const { rows: stopRows } = await pool.query('SELECT * FROM trip_stops WHERE id = $1', [ta.stop_id]);
  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [stopRows[0].trip_id]);
  if (tripRows[0].user_id !== req.user.id) { res.status(403).json({ error: 'Not your trip' }); return null; }
  return ta;
}

async function buildFullTrip(tripId) {
  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
  const trip = tripRows[0];
  const { rows: stopRows } = await pool.query('SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY sequence', [tripId]);

  const stops = [];
  for (const stop of stopRows) {
    const { rows: cityRows } = await pool.query('SELECT * FROM cities WHERE id = $1', [stop.city_id]);
    const { rows: activities } = await pool.query(
      `SELECT ta.*, a.name, a.category, a.description, a.duration_hours, a.image
       FROM trip_activities ta JOIN activities a ON a.id = ta.activity_id WHERE ta.stop_id = $1 ORDER BY ta.date, ta.sequence`,
      [stop.id]
    );
    stops.push({ ...stop, city: cityRows[0], activities });
  }

  const budget = await computeBudget(tripId);
  return { ...trip, stops, budget };
}

async function computeBudget(tripId) {
  const { rows: tripRows } = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
  const trip = tripRows[0];
  const { rows: expenses } = await pool.query('SELECT * FROM expenses WHERE trip_id = $1', [tripId]);
  const { rows: activityCosts } = await pool.query(
    `SELECT ta.estimated_cost FROM trip_activities ta JOIN trip_stops s ON s.id = ta.stop_id WHERE s.trip_id = $1`,
    [tripId]
  );

  const byCategory = {};
  let total = 0;
  for (const e of expenses) {
    const amt = Number(e.amount);
    byCategory[e.category] = (byCategory[e.category] || 0) + amt;
    total += amt;
  }
  const activitiesTotal = activityCosts.reduce((sum, a) => sum + Number(a.estimated_cost || 0), 0);
  byCategory['Activities'] = (byCategory['Activities'] || 0) + activitiesTotal;
  total += activitiesTotal;

  const days = Math.max(1, Math.round((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000) + 1);
  const perDay = total / days;

  return { total_cost: round2(total), by_category: mapRound(byCategory), days, average_daily_cost: round2(perDay) };
}

function round2(n) { return Math.round(n * 100) / 100; }
function mapRound(obj) {
  const out = {};
  for (const k in obj) out[k] = round2(obj[k]);
  return out;
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

async function start() {
  await waitForDb();
  await initSchema();
  app.listen(PORT, () => console.log(`GlobeTrotter API running on http://localhost:${PORT}`));
}

start();
