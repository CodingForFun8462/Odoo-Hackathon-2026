const { pool, initSchema, waitForDb } = require('./db');

const cities = [
  ['Paris', 'France', 'Europe', 80, 95],
  ['Amsterdam', 'Netherlands', 'Europe', 75, 85],
  ['Berlin', 'Germany', 'Europe', 60, 80],
  ['Rome', 'Italy', 'Europe', 70, 90],
  ['Barcelona', 'Spain', 'Europe', 65, 88],
  ['Tokyo', 'Japan', 'Asia', 85, 92],
  ['Bangkok', 'Thailand', 'Asia', 30, 80],
  ['Goa', 'India', 'Asia', 25, 75],
  ['New York', 'USA', 'North America', 95, 90],
  ['Bali', 'Indonesia', 'Asia', 35, 88]
];

const activities = [
  ['Paris', 'Eiffel Tower Visit', 'Sightseeing', 'Iconic tower with city views', 2, 30],
  ['Paris', 'Louvre Museum', 'Culture', 'World famous art museum', 3, 20],
  ['Paris', 'Seine River Cruise', 'Sightseeing', 'Evening cruise along the Seine', 1.5, 25],
  ['Amsterdam', 'Canal Tour', 'Sightseeing', 'Boat tour through the canals', 1.5, 20],
  ['Amsterdam', 'Rijksmuseum', 'Culture', 'Dutch art and history museum', 2.5, 22],
  ['Amsterdam', 'Local Food Tour', 'Food', 'Guided food tasting walk', 3, 45],
  ['Berlin', 'Brandenburg Gate', 'Sightseeing', 'Historic landmark', 1, 0],
  ['Berlin', 'Museum Island', 'Culture', 'Cluster of major museums', 3, 18],
  ['Rome', 'Colosseum Tour', 'Sightseeing', 'Ancient amphitheater tour', 2, 28],
  ['Rome', 'Vatican Museums', 'Culture', 'Includes Sistine Chapel', 3, 32],
  ['Barcelona', 'Sagrada Familia', 'Sightseeing', 'Gaudi basilica', 2, 26],
  ['Barcelona', 'Beach Day', 'Nature', 'Relax at Barceloneta beach', 4, 0],
  ['Tokyo', 'Shibuya Crossing', 'Sightseeing', 'Famous pedestrian crossing', 1, 0],
  ['Tokyo', 'Sushi Making Class', 'Food', 'Hands-on sushi workshop', 2, 55],
  ['Bangkok', 'Grand Palace', 'Culture', 'Former royal residence', 2.5, 15],
  ['Bangkok', 'Street Food Tour', 'Food', 'Night market food crawl', 3, 20],
  ['Goa', 'Beach Hopping', 'Nature', 'Visit multiple beaches', 5, 10],
  ['Goa', 'Water Sports', 'Adventure', 'Jet ski and parasailing', 2, 40],
  ['New York', 'Statue of Liberty', 'Sightseeing', 'Ferry and monument visit', 3, 35],
  ['New York', 'Broadway Show', 'Entertainment', 'Evening theatre show', 2.5, 120],
  ['Bali', 'Ubud Rice Terraces', 'Nature', 'Scenic terraced rice fields', 2, 10],
  ['Bali', 'Surf Lesson', 'Adventure', 'Beginner surf class', 2, 30]
];

async function seed() {
  await waitForDb();
  await initSchema();

  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM cities');
  if (rows[0].c > 0) {
    console.log('Cities already seeded, skipping.');
    await pool.end();
    return;
  }

  const cityIds = {};
  for (const [name, country, region, cost_index, popularity] of cities) {
    const res = await pool.query(
      'INSERT INTO cities (name, country, region, cost_index, popularity) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [name, country, region, cost_index, popularity]
    );
    cityIds[name] = res.rows[0].id;
  }

  for (const [cityName, name, category, description, duration, cost] of activities) {
    await pool.query(
      'INSERT INTO activities (city_id, name, category, description, duration_hours, estimated_cost) VALUES ($1,$2,$3,$4,$5,$6)',
      [cityIds[cityName], name, category, description, duration, cost]
    );
  }

  console.log('Seeded cities and activities.');
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
