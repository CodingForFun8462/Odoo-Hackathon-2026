# GlobeTrotter — MVP

Covers the P0 slice from the PRD: auth, trip creation, multi-city itinerary
builder (cities + dated activities), budget calculation, calendar/timeline
view, and public sharing with copy-trip. Not included: admin analytics,
image uploads, drag-and-drop reordering, AI itinerary generation — these
are marked P1/P2/optional in the PRD's own priority matrix and were cut
to keep this actually finishable and testable.

## Stack

- Backend: Node.js, Express, PostgreSQL (pg), JWT auth
- Frontend: plain HTML/CSS/JS (no build step, no framework)
- Fully dockerized: postgres + backend + frontend via docker-compose

## Run it with Docker (recommended)

```
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:4000/api
- Postgres: localhost:5432 (user/pass/db: globetrotter/globetrotter/globetrotter)

The backend container seeds the database with sample cities and activities
automatically on every start (seed script checks if data already exists
and skips if so, so it's safe to restart).

To stop and wipe the database volume: `docker compose down -v`

## Run it without Docker

You'll need a local Postgres instance.

```
createdb globetrotter
cd backend
npm install
export PGHOST=localhost PGUSER=youruser PGPASSWORD=yourpass PGDATABASE=globetrotter
npm run seed
npm start
```

Frontend: open `frontend/index.html` directly, or serve it:
```
cd frontend
python3 -m http.server 5500
```
API base URL is set in `frontend/config.js` — defaults to `http://localhost:4000/api`.

## What's actually implemented

- Signup/login (JWT, bcrypt password hashing)
- Dashboard with upcoming/past trips
- Create/view/delete trip
- Add cities to a trip with dates (validated against trip date range)
- Add activities to a city stop with dates (validated against stop date range and city match)
- Budget: total cost, cost by category, cost per day, auto-summed from activities + manual expenses
- Calendar/timeline view grouped by date
- Publish a trip publicly (shareable link), public read-only view, "copy this trip"
- Profile: name/language edit

## Known gaps / what I'd flag before you demo this

- No image upload — cover photo and activity images are just URL text fields.
- No drag-and-drop reordering — sequence field exists in the DB but there's no UI for reordering yet.
- Currency is hardcoded to ₹ symbol in the UI; the number itself is currency-agnostic.
- No rate limiting or email verification — fine for a hackathon demo, not for production.
- JWT_SECRET and Postgres password are hardcoded defaults in docker-compose.yml — fine for a demo, change both before deploying anywhere real.
