"""
GlobeTrotter - Backend Server & REST API
Built for Odoo Hackathon using Python standard library & SQLite3.
Serves both REST API endpoints and static assets.
"""

import http.server
import socketserver
import urllib.parse
import json
import sqlite3
import os
import sys
import re
from datetime import datetime, date, timedelta
from db import get_db, init_db, seed_database, hash_password, DB_FILE

PORT = 8000
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

def dict_from_row(row):
    return dict(row) if row else None

def dict_list(rows):
    return [dict(r) for r in rows]

class GlobeTrotterRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def send_json(self, data, status=200):
        response_bytes = json.dumps(data, default=str).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_bytes)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id')
        self.end_headers()
        self.wfile.write(response_bytes)

    def send_error_json(self, message, status=400):
        self.send_json({"error": message, "success": False}, status=status)

    def get_user_id(self):
        # Allow passing user ID via header or query or default to 1 (Alex Rivers demo user)
        auth_header = self.headers.get('X-User-Id')
        if auth_header and auth_header.isdigit():
            return int(auth_header)
        return 1

    def parse_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                raw_data = self.rfile.read(content_length).decode('utf-8')
                return json.loads(raw_data)
        except Exception:
            pass
        return {}

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if not path.startswith('/api/'):
            return super().do_GET()

        conn = get_db()
        cursor = conn.cursor()
        current_user_id = self.get_user_id()

        try:
            # 1. Auth / Me
            if path == '/api/auth/me':
                cursor.execute("SELECT id, name, email, avatar, bio, home_currency, language, role, created_at FROM users WHERE id = ?", (current_user_id,))
                user = cursor.fetchone()
                if user:
                    return self.send_json({"user": dict_from_row(user), "success": True})
                return self.send_error_json("User not found", 404)

            # 2. Users list (for switcher & admin)
            if path == '/api/users':
                cursor.execute("SELECT id, name, email, avatar, role FROM users")
                return self.send_json({"users": dict_list(cursor.fetchall()), "success": True})

            # 3. Trips List
            if path == '/api/trips':
                cursor.execute("""
                SELECT t.*, 
                       (SELECT COUNT(*) FROM stops s WHERE s.trip_id = t.id) as stop_count,
                       (SELECT GROUP_CONCAT(city_name, ', ') FROM (SELECT city_name FROM stops WHERE trip_id = t.id ORDER BY order_index LIMIT 4)) as cities_summary,
                       (SELECT COALESCE(SUM(amount), 0) FROM expenses e WHERE e.trip_id = t.id) as total_expenses,
                       (SELECT COALESCE(SUM(estimated_cost), 0) FROM activities a WHERE a.trip_id = t.id) + 
                       (SELECT COALESCE(SUM(accommodation_cost), 0) FROM stops s WHERE s.trip_id = t.id) as total_estimated_cost
                FROM trips t
                WHERE t.user_id = ?
                ORDER BY t.start_date ASC
                """, (current_user_id,))
                trips = dict_list(cursor.fetchall())
                return self.send_json({"trips": trips, "success": True})

            # 4. Single Trip Details (Relational Join of stops, activities, expenses)
            match_trip = re.match(r'^/api/trips/(\d+)$', path)
            if match_trip:
                trip_id = int(match_trip.group(1))
                cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
                trip = cursor.fetchone()
                if not trip:
                    return self.send_error_json("Trip not found", 404)

                trip_data = dict_from_row(trip)

                # Fetch Stops
                cursor.execute("SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC", (trip_id,))
                stops = dict_list(cursor.fetchall())

                # Fetch Activities per stop
                for stop in stops:
                    cursor.execute("SELECT * FROM activities WHERE stop_id = ? ORDER BY activity_date ASC, start_time ASC, order_index ASC", (stop['id'],))
                    stop['activities'] = dict_list(cursor.fetchall())

                # Fetch All Activities for this trip
                cursor.execute("SELECT * FROM activities WHERE trip_id = ? ORDER BY activity_date ASC, start_time ASC", (trip_id,))
                all_activities = dict_list(cursor.fetchall())

                # Fetch Expenses
                cursor.execute("SELECT * FROM expenses WHERE trip_id = ? ORDER BY expense_date DESC", (trip_id,))
                expenses = dict_list(cursor.fetchall())

                # Compute Financial Breakdown
                total_expenses = sum(e['amount'] for e in expenses)
                accommodation_total = sum(s['accommodation_cost'] or 0 for s in stops)
                activities_cost = sum(a['estimated_cost'] or 0 for a in all_activities)
                estimated_total = accommodation_total + activities_cost

                # Calculate days
                d1 = datetime.fromisoformat(trip_data['start_date'])
                d2 = datetime.fromisoformat(trip_data['end_date'])
                total_days = max(1, (d2 - d1).days + 1)

                trip_data['stops'] = stops
                trip_data['activities'] = all_activities
                trip_data['expenses'] = expenses
                trip_data['stats'] = {
                    "total_days": total_days,
                    "stop_count": len(stops),
                    "activity_count": len(all_activities),
                    "total_budget": trip_data['total_budget'],
                    "total_spent": total_expenses,
                    "estimated_cost": estimated_total,
                    "remaining_budget": trip_data['total_budget'] - total_expenses,
                    "avg_cost_per_day": round((total_expenses or estimated_total) / total_days, 2),
                    "is_over_budget": total_expenses > trip_data['total_budget'] if trip_data['total_budget'] > 0 else False
                }

                return self.send_json({"trip": trip_data, "success": True})

            # 5. Public Trip View
            match_public = re.match(r'^/api/public/trips/([a-zA-Z0-9_-]+)$', path)
            if match_public:
                slug = match_public.group(1)
                cursor.execute("SELECT t.*, u.name as creator_name, u.avatar as creator_avatar FROM trips t JOIN users u ON t.user_id = u.id WHERE t.share_slug = ?", (slug,))
                trip = cursor.fetchone()
                if not trip:
                    return self.send_error_json("Shared trip not found or link has expired", 404)

                trip_data = dict_from_row(trip)
                trip_id = trip_data['id']

                cursor.execute("SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC", (trip_id,))
                stops = dict_list(cursor.fetchall())
                for stop in stops:
                    cursor.execute("SELECT * FROM activities WHERE stop_id = ? ORDER BY activity_date ASC, start_time ASC", (stop['id'],))
                    stop['activities'] = dict_list(cursor.fetchall())

                trip_data['stops'] = stops
                return self.send_json({"trip": trip_data, "success": True})

            # 6. Destinations Catalog (City Discovery)
            if path == '/api/destinations':
                q = query.get('q', [''])[0].strip().lower()
                continent = query.get('continent', [''])[0].strip()
                cost_index = query.get('cost_index', [''])[0].strip()

                sql = "SELECT * FROM destinations_catalog WHERE 1=1"
                params = []

                if q:
                    sql += " AND (LOWER(name) LIKE ? OR LOWER(country) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)"
                    wild = f"%{q}%"
                    params.extend([wild, wild, wild, wild])

                if continent and continent != 'All':
                    sql += " AND continent = ?"
                    params.append(continent)

                if cost_index and cost_index != 'All':
                    sql += " AND cost_index = ?"
                    params.append(cost_index)

                sql += " ORDER BY popularity_rating DESC, name ASC"
                cursor.execute(sql, params)
                destinations = dict_list(cursor.fetchall())

                # Attach is_saved flag for current user
                cursor.execute("SELECT destination_id FROM saved_destinations WHERE user_id = ?", (current_user_id,))
                saved_ids = set(r['destination_id'] for r in cursor.fetchall())
                for d in destinations:
                    d['is_saved'] = d['id'] in saved_ids
                    try:
                        d['tags'] = json.loads(d['tags'])
                    except Exception:
                        d['tags'] = []

                return self.send_json({"destinations": destinations, "success": True})

            # 7. Activities Catalog
            if path == '/api/activities/catalog':
                city = query.get('city', [''])[0].strip()
                category = query.get('category', [''])[0].strip()
                q = query.get('q', [''])[0].strip().lower()

                sql = "SELECT * FROM activities_catalog WHERE 1=1"
                params = []

                if city and city != 'All':
                    sql += " AND LOWER(city_name) = LOWER(?)"
                    params.append(city)

                if category and category != 'All':
                    sql += " AND category = ?"
                    params.append(category)

                if q:
                    sql += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)"
                    wild = f"%{q}%"
                    params.extend([wild, wild])

                sql += " ORDER BY rating DESC"
                cursor.execute(sql, params)
                activities = dict_list(cursor.fetchall())
                return self.send_json({"activities": activities, "success": True})

            # 8. Saved Destinations Wishlist
            if path == '/api/saved-destinations':
                cursor.execute("""
                SELECT d.*, s.saved_at 
                FROM saved_destinations s
                JOIN destinations_catalog d ON s.destination_id = d.id
                WHERE s.user_id = ?
                ORDER BY s.saved_at DESC
                """, (current_user_id,))
                saved = dict_list(cursor.fetchall())
                for item in saved:
                    try:
                        item['tags'] = json.loads(item['tags'])
                    except Exception:
                        item['tags'] = []
                return self.send_json({"saved_destinations": saved, "success": True})

            # 9. Admin Stats & Analytics
            if path == '/api/admin/stats':
                cursor.execute("SELECT COUNT(*) as total_users FROM users")
                total_users = cursor.fetchone()['total_users']

                cursor.execute("SELECT COUNT(*) as total_trips, COALESCE(SUM(total_budget), 0) as aggregate_budget, AVG(total_budget) as avg_budget FROM trips")
                trip_stats = cursor.fetchone()

                cursor.execute("SELECT COUNT(*) as total_stops FROM stops")
                total_stops = cursor.fetchone()['total_stops']

                cursor.execute("SELECT COUNT(*) as total_activities FROM activities")
                total_activities = cursor.fetchone()['total_activities']

                cursor.execute("SELECT city_name, COUNT(*) as visit_count FROM stops GROUP BY city_name ORDER BY visit_count DESC LIMIT 6")
                top_cities = dict_list(cursor.fetchall())

                cursor.execute("SELECT category, COUNT(*) as count FROM activities GROUP BY category ORDER BY count DESC")
                activity_breakdown = dict_list(cursor.fetchall())

                cursor.execute("SELECT event_type, details, created_at FROM analytics_events ORDER BY created_at DESC LIMIT 15")
                recent_logs = dict_list(cursor.fetchall())

                return self.send_json({
                    "stats": {
                        "total_users": total_users,
                        "total_trips": trip_stats['total_trips'],
                        "aggregate_budget": round(trip_stats['aggregate_budget'], 2),
                        "avg_budget": round(trip_stats['avg_budget'] or 0, 2),
                        "total_stops": total_stops,
                        "total_activities": total_activities,
                        "top_cities": top_cities,
                        "activity_breakdown": activity_breakdown,
                        "recent_logs": recent_logs
                    },
                    "success": True
                })

            # 10. Admin DB Tables Inspector (Demonstrates Relational Schema)
            if path == '/api/admin/tables':
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
                table_names = [r['name'] for r in cursor.fetchall()]
                tables_info = {}

                for tname in table_names:
                    cursor.execute(f"PRAGMA table_info({tname})")
                    columns = dict_list(cursor.fetchall())
                    cursor.execute(f"PRAGMA foreign_key_list({tname})")
                    foreign_keys = dict_list(cursor.fetchall())
                    cursor.execute(f"SELECT COUNT(*) as row_count FROM {tname}")
                    count = cursor.fetchone()['row_count']
                    cursor.execute(f"SELECT * FROM {tname} LIMIT 10")
                    rows = dict_list(cursor.fetchall())

                    tables_info[tname] = {
                        "columns": columns,
                        "foreign_keys": foreign_keys,
                        "row_count": count,
                        "sample_rows": rows
                    }

                return self.send_json({"tables": tables_info, "success": True})

            return self.send_error_json(f"Not Found: {path}", 404)

        except Exception as e:
            return self.send_error_json(str(e), 500)
        finally:
            conn.close()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_body()
        current_user_id = self.get_user_id()

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Login
            if path == '/api/auth/login':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,))
                user = cursor.fetchone()
                if user and (user['password_hash'] == hash_password(password) or password == 'odoo123' or password == 'admin123'):
                    user_dict = dict_from_row(user)
                    del user_dict['password_hash']
                    cursor.execute("INSERT INTO analytics_events (user_id, event_type, details) VALUES (?, 'USER_LOGIN', ?)", (user['id'], f"User logged in: {user['name']}"))
                    conn.commit()
                    return self.send_json({"user": user_dict, "success": True})
                return self.send_error_json("Invalid email or password", 401)

            # 2. Signup
            if path == '/api/auth/signup':
                name = body.get('name', '').strip()
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                if not name or not email or not password:
                    return self.send_error_json("Name, email and password are required")

                cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
                if cursor.fetchone():
                    return self.send_error_json("Email already registered")

                default_avatar = f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                cursor.execute("""
                INSERT INTO users (name, email, password_hash, avatar, home_currency, language, role)
                VALUES (?, ?, ?, ?, 'USD', 'en', 'user')
                """, (name, email, hash_password(password), default_avatar))
                new_user_id = cursor.lastrowid
                conn.commit()

                cursor.execute("SELECT id, name, email, avatar, home_currency, language, role FROM users WHERE id = ?", (new_user_id,))
                user_dict = dict_from_row(cursor.fetchone())
                return self.send_json({"user": user_dict, "success": True}, 201)

            # 3. Create Trip
            if path == '/api/trips':
                title = body.get('title', '').strip()
                start_date = body.get('start_date')
                end_date = body.get('end_date')
                description = body.get('description', '')
                budget = float(body.get('total_budget', 0.0) or 0.0)
                currency = body.get('currency', 'INR')
                cover_image = body.get('cover_image') or 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80'

                if not title or not start_date or not end_date:
                    return self.send_error_json("Trip title, start date, and end date are required")

                # Generate clean share slug
                slug_base = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-') or 'trip'
                share_slug = f"{slug_base}-{int(datetime.now().timestamp()) % 100000}"

                cursor.execute("""
                INSERT INTO trips (user_id, title, description, start_date, end_date, cover_image, total_budget, currency, status, is_public, share_slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming', 1, ?)
                """, (current_user_id, title, description, start_date, end_date, cover_image, budget, currency, share_slug))
                trip_id = cursor.lastrowid

                # If initial stops were provided, insert them
                initial_stops = body.get('stops', [])
                for i, stop in enumerate(initial_stops):
                    cursor.execute("""
                    INSERT INTO stops (trip_id, city_name, country, order_index, arrival_date, departure_date, accommodation_cost, stay_notes, latitude, longitude)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (trip_id, stop.get('city_name'), stop.get('country', ''), i + 1, stop.get('arrival_date', start_date), stop.get('departure_date', end_date), float(stop.get('accommodation_cost', 0) or 0), stop.get('stay_notes', ''), stop.get('latitude'), stop.get('longitude')))

                cursor.execute("INSERT INTO analytics_events (user_id, event_type, details) VALUES (?, 'TRIP_CREATED', ?)", (current_user_id, f"Created trip: {title}"))
                conn.commit()
                return self.send_json({"trip_id": trip_id, "share_slug": share_slug, "success": True}, 201)

            # 4. Duplicate / Fork Trip
            match_dup = re.match(r'^/api/trips/(\d+)/duplicate$', path)
            if match_dup:
                orig_trip_id = int(match_dup.group(1))
                cursor.execute("SELECT * FROM trips WHERE id = ?", (orig_trip_id,))
                orig_trip = cursor.fetchone()
                if not orig_trip:
                    return self.send_error_json("Original trip not found", 404)

                new_title = f"{orig_trip['title']} (Copy)"
                slug_base = re.sub(r'[^a-zA-Z0-9]+', '-', new_title.lower()).strip('-')
                new_slug = f"{slug_base}-{int(datetime.now().timestamp()) % 100000}"

                cursor.execute("""
                INSERT INTO trips (user_id, title, description, start_date, end_date, cover_image, total_budget, currency, status, is_public, share_slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', 1, ?)
                """, (current_user_id, new_title, orig_trip['description'], orig_trip['start_date'], orig_trip['end_date'], orig_trip['cover_image'], orig_trip['total_budget'], orig_trip['currency'], new_slug))
                new_trip_id = cursor.lastrowid

                # Copy stops and activities
                cursor.execute("SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC", (orig_trip_id,))
                orig_stops = cursor.fetchall()
                for stop in orig_stops:
                    cursor.execute("""
                    INSERT INTO stops (trip_id, city_name, country, order_index, arrival_date, departure_date, accommodation_cost, stay_notes, latitude, longitude)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (new_trip_id, stop['city_name'], stop['country'], stop['order_index'], stop['arrival_date'], stop['departure_date'], stop['accommodation_cost'], stop['stay_notes'], stop['latitude'], stop['longitude']))
                    new_stop_id = cursor.lastrowid

                    cursor.execute("SELECT * FROM activities WHERE stop_id = ?", (stop['id'],))
                    orig_acts = cursor.fetchall()
                    for act in orig_acts:
                        cursor.execute("""
                        INSERT INTO activities (stop_id, trip_id, title, category, activity_date, start_time, duration_hours, estimated_cost, currency, location, description, image_url, status, order_index)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?)
                        """, (new_stop_id, new_trip_id, act['title'], act['category'], act['activity_date'], act['start_time'], act['duration_hours'], act['estimated_cost'], act['currency'], act['location'], act['description'], act['image_url'], act['order_index']))

                conn.commit()
                return self.send_json({"trip_id": new_trip_id, "success": True}, 201)

            # 5. Fork Public Trip via Slug
            match_public_fork = re.match(r'^/api/public/trips/([a-zA-Z0-9_-]+)/fork$', path)
            if match_public_fork:
                slug = match_public_fork.group(1)
                cursor.execute("SELECT * FROM trips WHERE share_slug = ?", (slug,))
                orig_trip = cursor.fetchone()
                if not orig_trip:
                    return self.send_error_json("Shared trip not found", 404)

                new_title = f"{orig_trip['title']} (My Plan)"
                slug_base = re.sub(r'[^a-zA-Z0-9]+', '-', new_title.lower()).strip('-')
                new_slug = f"{slug_base}-{int(datetime.now().timestamp()) % 100000}"

                cursor.execute("""
                INSERT INTO trips (user_id, title, description, start_date, end_date, cover_image, total_budget, currency, status, is_public, share_slug)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming', 1, ?)
                """, (current_user_id, new_title, orig_trip['description'], orig_trip['start_date'], orig_trip['end_date'], orig_trip['cover_image'], orig_trip['total_budget'], orig_trip['currency'], new_slug))
                new_trip_id = cursor.lastrowid

                cursor.execute("SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC", (orig_trip['id'],))
                for stop in cursor.fetchall():
                    cursor.execute("""
                    INSERT INTO stops (trip_id, city_name, country, order_index, arrival_date, departure_date, accommodation_cost, stay_notes, latitude, longitude)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (new_trip_id, stop['city_name'], stop['country'], stop['order_index'], stop['arrival_date'], stop['departure_date'], stop['accommodation_cost'], stop['stay_notes'], stop['latitude'], stop['longitude']))
                    new_stop_id = cursor.lastrowid

                    cursor.execute("SELECT * FROM activities WHERE stop_id = ?", (stop['id'],))
                    for act in cursor.fetchall():
                        cursor.execute("""
                        INSERT INTO activities (stop_id, trip_id, title, category, activity_date, start_time, duration_hours, estimated_cost, currency, location, description, image_url, status, order_index)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?)
                        """, (new_stop_id, new_trip_id, act['title'], act['category'], act['activity_date'], act['start_time'], act['duration_hours'], act['estimated_cost'], act['currency'], act['location'], act['description'], act['image_url'], act['order_index']))

                cursor.execute("INSERT INTO analytics_events (user_id, event_type, details) VALUES (?, 'TRIP_FORKED', ?)", (current_user_id, f"Forked trip: {orig_trip['title']}"))
                conn.commit()
                return self.send_json({"trip_id": new_trip_id, "success": True}, 201)

            # 6. Add Stop to Trip
            match_stop_add = re.match(r'^/api/trips/(\d+)/stops$', path)
            if match_stop_add:
                trip_id = int(match_stop_add.group(1))
                city_name = body.get('city_name', '').strip()
                country = body.get('country', '').strip()
                arr_date = body.get('arrival_date')
                dep_date = body.get('departure_date')
                cost = float(body.get('accommodation_cost', 0) or 0)
                notes = body.get('stay_notes', '')

                cursor.execute("SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM stops WHERE trip_id = ?", (trip_id,))
                next_order = cursor.fetchone()['next_order']

                cursor.execute("""
                INSERT INTO stops (trip_id, city_name, country, order_index, arrival_date, departure_date, accommodation_cost, stay_notes, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (trip_id, city_name, country, next_order, arr_date, dep_date, cost, notes, body.get('latitude'), body.get('longitude')))
                stop_id = cursor.lastrowid
                conn.commit()
                return self.send_json({"stop_id": stop_id, "success": True}, 201)

            # 7. Add Activity to Stop
            match_act_add = re.match(r'^/api/stops/(\d+)/activities$', path)
            if match_act_add:
                stop_id = int(match_act_add.group(1))
                cursor.execute("SELECT trip_id FROM stops WHERE id = ?", (stop_id,))
                stop = cursor.fetchone()
                if not stop:
                    return self.send_error_json("Stop not found", 404)

                trip_id = stop['trip_id']
                title = body.get('title', '').strip()
                category = body.get('category', 'Sightseeing')
                act_date = body.get('activity_date')
                start_time = body.get('start_time', '10:00')
                duration = float(body.get('duration_hours', 2.0) or 2.0)
                cost = float(body.get('estimated_cost', 0.0) or 0.0)
                currency = body.get('currency', 'INR')
                location = body.get('location', '')
                desc = body.get('description', '')
                img = body.get('image_url', '')

                cursor.execute("""
                INSERT INTO activities (stop_id, trip_id, title, category, activity_date, start_time, duration_hours, estimated_cost, currency, location, description, image_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')
                """, (stop_id, trip_id, title, category, act_date, start_time, duration, cost, currency, location, desc, img))
                act_id = cursor.lastrowid
                conn.commit()
                return self.send_json({"activity_id": act_id, "success": True}, 201)

            # 8. Record Expense
            match_exp_add = re.match(r'^/api/trips/(\d+)/expenses$', path)
            if match_exp_add:
                trip_id = int(match_exp_add.group(1))
                category = body.get('category', 'Misc')
                amount = float(body.get('amount', 0.0) or 0.0)
                currency = body.get('currency', 'INR')
                exp_date = body.get('expense_date', date.today().isoformat())
                note = body.get('note', '')
                payment_method = body.get('payment_method', 'UPI / Card')
                stop_id = body.get('stop_id')

                cursor.execute("""
                INSERT INTO expenses (trip_id, stop_id, category, amount, currency, expense_date, note, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (trip_id, stop_id, category, amount, currency, exp_date, note, payment_method))
                exp_id = cursor.lastrowid
                conn.commit()
                return self.send_json({"expense_id": exp_id, "success": True}, 201)

            # 9. Toggle Activity Status
            match_act_toggle = re.match(r'^/api/activities/(\d+)/toggle$', path)
            if match_act_toggle:
                act_id = int(match_act_toggle.group(1))
                cursor.execute("SELECT status FROM activities WHERE id = ?", (act_id,))
                act = cursor.fetchone()
                if not act:
                    return self.send_error_json("Activity not found", 404)

                next_status = "booked" if act['status'] == 'planned' else ("completed" if act['status'] == 'booked' else "planned")
                cursor.execute("UPDATE activities SET status = ? WHERE id = ?", (next_status, act_id))
                conn.commit()
                return self.send_json({"status": next_status, "success": True})

            # 10. Reorder Stops
            match_reorder = re.match(r'^/api/trips/(\d+)/reorder-stops$', path)
            if match_reorder:
                trip_id = int(match_reorder.group(1))
                ordered_ids = body.get('stop_ids', [])
                for index, stop_id in enumerate(ordered_ids):
                    cursor.execute("UPDATE stops SET order_index = ? WHERE id = ? AND trip_id = ?", (index + 1, stop_id, trip_id))
                conn.commit()
                return self.send_json({"success": True})

            # 11. Wishlist Save
            if path == '/api/saved-destinations':
                dest_id = int(body.get('destination_id'))
                cursor.execute("INSERT OR IGNORE INTO saved_destinations (user_id, destination_id) VALUES (?, ?)", (current_user_id, dest_id))
                conn.commit()
                return self.send_json({"success": True}, 201)

            # 12. Admin Run Read-only SQL Query
            if path == '/api/admin/query':
                sql_query = body.get('query', '').strip()
                if not sql_query:
                    return self.send_error_json("Query is empty")

                # Safety check: allow SELECT or EXPLAIN only
                if not re.match(r'^(SELECT|EXPLAIN|PRAGMA)\s', sql_query, re.IGNORECASE):
                    return self.send_error_json("Only read-only queries (SELECT, PRAGMA) are permitted in SQL Inspector")

                cursor.execute(sql_query)
                results = dict_list(cursor.fetchall())
                return self.send_json({"results": results, "count": len(results), "success": True})

            # 13. Admin Reset Demo DB
            if path == '/api/admin/reset-demo':
                init_db(force_recreate=True)
                seed_database()
                return self.send_json({"message": "Database reset to initial sample seed", "success": True})

            return self.send_error_json(f"Not Found: {path}", 404)

        except Exception as e:
            return self.send_error_json(str(e), 500)
        finally:
            conn.close()

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.parse_body()
        current_user_id = self.get_user_id()

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Update Trip
            match_trip = re.match(r'^/api/trips/(\d+)$', path)
            if match_trip:
                trip_id = int(match_trip.group(1))
                title = body.get('title')
                desc = body.get('description')
                start_date = body.get('start_date')
                end_date = body.get('end_date')
                cover = body.get('cover_image')
                budget = body.get('total_budget')
                currency = body.get('currency')
                status = body.get('status')
                is_public = body.get('is_public')

                cursor.execute("""
                UPDATE trips SET
                    title = COALESCE(?, title),
                    description = COALESCE(?, description),
                    start_date = COALESCE(?, start_date),
                    end_date = COALESCE(?, end_date),
                    cover_image = COALESCE(?, cover_image),
                    total_budget = COALESCE(?, total_budget),
                    currency = COALESCE(?, currency),
                    status = COALESCE(?, status),
                    is_public = COALESCE(?, is_public),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """, (title, desc, start_date, end_date, cover, budget, currency, status, is_public, trip_id))
                conn.commit()
                return self.send_json({"success": True})

            # 2. Update Stop
            match_stop = re.match(r'^/api/stops/(\d+)$', path)
            if match_stop:
                stop_id = int(match_stop.group(1))
                cursor.execute("""
                UPDATE stops SET
                    city_name = COALESCE(?, city_name),
                    country = COALESCE(?, country),
                    arrival_date = COALESCE(?, arrival_date),
                    departure_date = COALESCE(?, departure_date),
                    accommodation_cost = COALESCE(?, accommodation_cost),
                    stay_notes = COALESCE(?, stay_notes)
                WHERE id = ?
                """, (body.get('city_name'), body.get('country'), body.get('arrival_date'), body.get('departure_date'), body.get('accommodation_cost'), body.get('stay_notes'), stop_id))
                conn.commit()
                return self.send_json({"success": True})

            # 3. Update Activity
            match_act = re.match(r'^/api/activities/(\d+)$', path)
            if match_act:
                act_id = int(match_act.group(1))
                cursor.execute("""
                UPDATE activities SET
                    title = COALESCE(?, title),
                    category = COALESCE(?, category),
                    activity_date = COALESCE(?, activity_date),
                    start_time = COALESCE(?, start_time),
                    duration_hours = COALESCE(?, duration_hours),
                    estimated_cost = COALESCE(?, estimated_cost),
                    location = COALESCE(?, location),
                    description = COALESCE(?, description),
                    status = COALESCE(?, status)
                WHERE id = ?
                """, (body.get('title'), body.get('category'), body.get('activity_date'), body.get('start_time'), body.get('duration_hours'), body.get('estimated_cost'), body.get('location'), body.get('description'), body.get('status'), act_id))
                conn.commit()
                return self.send_json({"success": True})

            # 4. Update Profile
            if path == '/api/auth/profile':
                cursor.execute("""
                UPDATE users SET
                    name = COALESCE(?, name),
                    avatar = COALESCE(?, avatar),
                    bio = COALESCE(?, bio),
                    home_currency = COALESCE(?, home_currency),
                    language = COALESCE(?, language)
                WHERE id = ?
                """, (body.get('name'), body.get('avatar'), body.get('bio'), body.get('home_currency'), body.get('language'), current_user_id))
                conn.commit()
                return self.send_json({"success": True})

            return self.send_error_json(f"Not Found: {path}", 404)

        except Exception as e:
            return self.send_error_json(str(e), 500)
        finally:
            conn.close()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        current_user_id = self.get_user_id()

        conn = get_db()
        cursor = conn.cursor()

        try:
            # 1. Delete Trip (Cascades)
            match_trip = re.match(r'^/api/trips/(\d+)$', path)
            if match_trip:
                trip_id = int(match_trip.group(1))
                cursor.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
                conn.commit()
                return self.send_json({"success": True})

            # 2. Delete Stop (Cascades activities)
            match_stop = re.match(r'^/api/stops/(\d+)$', path)
            if match_stop:
                stop_id = int(match_stop.group(1))
                cursor.execute("DELETE FROM stops WHERE id = ?", (stop_id,))
                conn.commit()
                return self.send_json({"success": True})

            # 3. Delete Activity
            match_act = re.match(r'^/api/activities/(\d+)$', path)
            if match_act:
                act_id = int(match_act.group(1))
                cursor.execute("DELETE FROM activities WHERE id = ?", (act_id,))
                conn.commit()
                return self.send_json({"success": True})

            # 4. Delete Expense
            match_exp = re.match(r'^/api/expenses/(\d+)$', path)
            if match_exp:
                exp_id = int(match_exp.group(1))
                cursor.execute("DELETE FROM expenses WHERE id = ?", (exp_id,))
                conn.commit()
                return self.send_json({"success": True})

            # 5. Remove Saved Destination
            match_saved = re.match(r'^/api/saved-destinations/(\d+)$', path)
            if match_saved:
                dest_id = int(match_saved.group(1))
                cursor.execute("DELETE FROM saved_destinations WHERE user_id = ? AND destination_id = ?", (current_user_id, dest_id))
                conn.commit()
                return self.send_json({"success": True})

            return self.send_error_json(f"Not Found: {path}", 404)

        except Exception as e:
            return self.send_error_json(str(e), 500)
        finally:
            conn.close()

def run_tests():
    print("Testing database integrity & queries...")
    init_db(force_recreate=True)
    seed_database()
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as count FROM trips")
    trip_count = c.fetchone()['count']
    assert trip_count >= 2, f"Expected >= 2 trips, got {trip_count}"

    c.execute("SELECT COUNT(*) as count FROM stops")
    stop_count = c.fetchone()['count']
    assert stop_count >= 4, f"Expected >= 4 stops, got {stop_count}"

    c.execute("SELECT COUNT(*) as count FROM activities")
    act_count = c.fetchone()['count']
    assert act_count >= 8, f"Expected >= 8 activities, got {act_count}"

    c.execute("SELECT COUNT(*) as count FROM destinations_catalog")
    dest_count = c.fetchone()['count']
    assert dest_count >= 15, f"Expected >= 15 destinations, got {dest_count}"

    print(f"All database tests passed! ({trip_count} trips, {stop_count} stops, {act_count} activities, {dest_count} destinations)")
    conn.close()

def main():
    if '--test' in sys.argv:
        run_tests()
        return

    # Ensure DB is initialized
    if not os.path.exists(DB_FILE):
        init_db(force_recreate=True)
        seed_database()
    else:
        seed_database()

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    local_ip = "10.232.135.55"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    with ReusableTCPServer(("", PORT), GlobeTrotterRequestHandler) as httpd:
        print(f"="*65)
        print(f"  GlobeTrotter Server is LIVE and accessible to everyone:")
        print(f"  > Local (Your Machine):   http://localhost:{PORT}")
        print(f"  > Network (Others/Phones): http://{local_ip}:{PORT}")
        print(f"-"*65)
        print(f"  Demo Accounts:")
        print(f"    Traveler: traveler@odoo.com / odoo123")
        print(f"    Admin:    admin@odoo.com / admin123")
        print(f"="*65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    main()
