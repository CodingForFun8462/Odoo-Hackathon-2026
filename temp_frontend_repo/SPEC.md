# GlobeTrotter — Travel Planning App

## Vision
A personalized, intelligent, collaborative platform for planning multi-city trips: add stops, explore activities, estimate budgets, visualize timelines, and share plans.

## Tech stack
- Frontend: React (Vite)
- Backend: Node/Express (or Flask — confirm with team)
- Database: PostgreSQL or SQLite

## Data model
- User: id, name, email, password_hash
- Trip: id, user_id (FK), name, start_date, end_date, description, cover_photo_url
- Stop: id, trip_id (FK), city_id (FK), start_date, end_date, order_index
- City: id, name, country, cost_index, popularity
- Activity: id, city_id (FK), name, type, cost, duration, description
- TripActivity: id, stop_id (FK), activity_id (FK), scheduled_time, cost

## Screens (MVP priority order)

1. Login/Signup Screen — email & password fields, login button, signup link, forgot password link, basic validation.
2. Dashboard/Home Screen — welcome message, list of recent trips, "Plan New Trip" button.
3. Create Trip Screen — trip name, start & end dates, description, optional cover photo, save button.
4. My Trips Screen — trip cards showing name, date range, destination count, edit/view/delete actions.
5. Itinerary Builder Screen — "Add Stop" button, select city and dates, assign activities to each stop, reorder cities.
6. Itinerary View Screen — day-wise layout, city headers, activity blocks with time and cost.
7. City Search — search bar, list of cities with meta info, "Add to Trip" button, filter by country/region.
8. Activity Search — filters by type/cost/duration, add/remove buttons.
9. Trip Budget & Cost Breakdown Screen — cost breakdown by transport/stay/activities/meals, chart, average cost per day.
10. Shared/Public Itinerary View Screen — public URL, read-only itinerary summary, "Copy Trip" button.

## Out of scope for MVP
Calendar drag-and-drop, admin/analytics dashboard, social sharing buttons, profile settings beyond basic edit.
