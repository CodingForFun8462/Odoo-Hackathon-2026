"""
End-to-End API and Integration Verification Script for GlobeTrotter
"""

import urllib.request
import json
import time

BASE_URL = "http://localhost:8000"

def make_req(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json", "X-User-Id": "1"}
    if headers:
        req_headers.update(headers)

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    
    with urllib.request.urlopen(req) as resp:
        content_type = resp.headers.get("Content-Type", "")
        content = resp.read()
        if "application/json" in content_type:
            return resp.status, json.loads(content.decode("utf-8"))
        return resp.status, content.decode("utf-8", errors="ignore")

def run_e2e_verification():
    print("\n--- 1. Verifying Static Assets ---")
    status, html = make_req("/")
    assert status == 200 and "<!DOCTYPE html>" in html, "index.html served incorrectly"
    print(" [PASS] index.html served (200 OK)")

    status, css = make_req("/style.css")
    assert status == 200 and "--primary:" in css, "style.css served incorrectly"
    print(" [PASS] style.css served (200 OK)")

    status, js = make_req("/app.js")
    assert status == 200 and "initRouter" in js, "app.js served incorrectly"
    print(" [PASS] app.js served (200 OK)")

    print("\n--- 2. Verifying Auth & User Endpoints ---")
    status, res = make_req("/api/auth/me")
    assert status == 200 and res["user"]["name"] == "Alex Rivers", "Auth me failed"
    print(f" [PASS] Auth Me: {res['user']['name']} ({res['user']['email']})")

    status, res = make_req("/api/auth/login", method="POST", data={"email": "admin@odoo.com", "password": "admin123"})
    assert status == 200 and res["user"]["role"] == "admin", "Admin login failed"
    print(f" [PASS] Admin Login: {res['user']['name']} (role={res['user']['role']})")

    print("\n--- 3. Verifying Multi-City Trips & Relational Joins ---")
    status, res = make_req("/api/trips")
    assert status == 200 and len(res["trips"]) >= 2, "Trips list failed"
    print(f" [PASS] GET /api/trips returned {len(res['trips'])} trips")

    # Find Grand European Odyssey
    geo_trip = next((t for t in res["trips"] if "Grand European" in t["title"]), res["trips"][0])
    trip_id = geo_trip["id"]
    status, res = make_req(f"/api/trips/{trip_id}")
    assert status == 200, "Trip details failed"
    trip = res["trip"]
    print(f" [PASS] GET /api/trips/{trip_id}: '{trip['title']}' with {len(trip['stops'])} stops, {len(trip['activities'])} activities, {len(trip['expenses'])} expenses")
    assert len(trip["stops"]) >= 4, "Expected >= 4 stops in Grand European Odyssey"
    assert len(trip["activities"]) >= 8, "Expected >= 8 activities"

    print("\n--- 4. Verifying Create Trip, Add Stop & Activity Workflow ---")
    status, res = make_req("/api/trips", method="POST", data={
        "title": "Swiss Alps & Northern Lakes Expedition",
        "description": "Scenic alpine trains and tranquil mountain lakes.",
        "start_date": "2026-09-10",
        "end_date": "2026-09-20",
        "total_budget": 280000.0,
        "currency": "INR"
    })
    assert status == 201, "Create trip failed"
    new_trip_id = res["trip_id"]
    new_slug = res["share_slug"]
    print(f" [PASS] POST /api/trips created new trip ID: {new_trip_id} (slug: {new_slug})")

    # Add stop
    status, res = make_req(f"/api/trips/{new_trip_id}/stops", method="POST", data={
        "city_name": "Lucerne",
        "country": "Switzerland",
        "arrival_date": "2026-09-10",
        "departure_date": "2026-09-14",
        "accommodation_cost": 38000.0,
        "stay_notes": "Lakefront hotel near Chapel Bridge",
        "latitude": 47.0502,
        "longitude": 8.3093
    })
    assert status == 201, "Add stop failed"
    stop_id = res["stop_id"]
    print(f" [PASS] POST /api/trips/{new_trip_id}/stops added stop Lucerne (ID: {stop_id})")

    # Add activity
    status, res = make_req(f"/api/stops/{stop_id}/activities", method="POST", data={
        "title": "Mount Pilatus Dragon Ride Cableway",
        "category": "Adventure",
        "activity_date": "2026-09-11",
        "start_time": "09:30",
        "duration_hours": 4.0,
        "estimated_cost": 6500.0,
        "currency": "INR",
        "location": "Pilatus Kulm",
        "description": "World steepest cogwheel railway and aerial panoramic ride."
    })
    assert status == 201, "Add activity failed"
    print(" [PASS] POST /api/stops/.../activities scheduled Mount Pilatus adventure")

    # Record expense
    status, res = make_req(f"/api/trips/{new_trip_id}/expenses", method="POST", data={
        "category": "Transport",
        "amount": 14000.0,
        "currency": "INR",
        "expense_date": "2026-09-10",
        "note": "Swiss Travel Pass 4-day flex",
        "payment_method": "UPI / Card"
    })
    assert status == 201, "Add expense failed"
    print(" [PASS] POST /api/trips/.../expenses recorded expense")

    print("\n--- 5. Verifying Public Share & Forking ---")
    status, res = make_req(f"/api/public/trips/{new_slug}")
    assert status == 200 and res["trip"]["title"] == "Swiss Alps & Northern Lakes Expedition", "Public trip view failed"
    print(f" [PASS] GET /api/public/trips/{new_slug} accessible publicly")

    # Fork public trip
    status, res = make_req(f"/api/public/trips/{new_slug}/fork", method="POST", headers={"X-User-Id": "3"})
    assert status == 201, "Fork trip failed"
    print(f" [PASS] POST /api/public/trips/.../fork successfully cloned trip into user 3 (Sophia) account!")

    print("\n--- 6. Verifying Discovery Catalogs & Wishlists ---")
    status, res = make_req("/api/destinations?continent=Europe")
    assert status == 200 and len(res["destinations"]) > 0, "Destinations catalog failed"
    print(f" [PASS] Destinations Catalog: found {len(res['destinations'])} European destinations")

    status, res = make_req("/api/activities/catalog?city=Paris")
    assert status == 200 and len(res["activities"]) > 0, "Activities catalog failed"
    print(f" [PASS] Activities Catalog: found {len(res['activities'])} activities for Paris")

    print("\n--- 7. Verifying Admin Analytics & Relational SQL Inspector ---")
    status, res = make_req("/api/admin/stats")
    assert status == 200 and "total_trips" in res["stats"], "Admin stats failed"
    print(f" [PASS] Admin Stats: {res['stats']['total_users']} users, {res['stats']['total_trips']} trips, {res['stats']['total_stops']} stops, aggregate budget {res['stats']['aggregate_budget']}")

    status, res = make_req("/api/admin/tables")
    assert status == 200 and "trips" in res["tables"] and "stops" in res["tables"], "DB tables failed"
    print(f" [PASS] Admin Schema Inspector: inspected tables: {list(res['tables'].keys())}")

    # Run direct SQL query via Inspector
    status, res = make_req("/api/admin/query", method="POST", data={
        "query": "SELECT t.title, COUNT(s.id) as stops_count FROM trips t LEFT JOIN stops s ON t.id = s.trip_id GROUP BY t.id;"
    })
    assert status == 200 and res["count"] > 0, "Admin query execution failed"
    print(f" [PASS] Live Relational SQL Inspector executed query with {res['count']} rows returned")

    print("\n" + "="*60)
    print(" ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY! (100% GREEN)")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_e2e_verification()
