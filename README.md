# ✈️ GlobeTrotter — Next-Gen Multi-City Travel Planning Platform

<div align="center">

![GlobeTrotter Banner](https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80)

[![Odoo Hackathon](https://img.shields.io/badge/Odoo%20Hackathon-2026-714B67?style=for-the-badge&logo=odoo&logoColor=white)](https://www.odoo.com)
[![Python](https://img.shields.io/badge/Backend-Python%203-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20Relational-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS%20%7C%20Modern%20CSS-EA580C?style=for-the-badge&logo=javascript&logoColor=white)](https://developer.mozilla.org)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet.js%20Routing-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Chart.js](https://img.shields.io/badge/Analytics-Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://chartjs.org)
[![Tests](https://img.shields.io/badge/Automated%20Tests-100%25%20PASS-10B981?style=for-the-badge&logo=checkmarx&logoColor=white)](file:///c:/Users/Manoj/Desktop/Demo/test_app.py)

<p align="center">
  <b>A personalized, intelligent, and collaborative multi-city travel planning platform built for the Odoo Hackathon.</b><br>
  Featuring relational database foreign key integrity, interactive map routing, dynamic Indian Rupee (INR ₹) budget analytics, 1-click templates, and universal public sharing.
</p>

[🌐 Live Cloudflare Demo](https://undefined-fancy-moderate-alternative.trycloudflare.com) • [📍 Shared Trip View](https://undefined-fancy-moderate-alternative.trycloudflare.com/#share/grand-european-odyssey-2026) • [📖 Documentation](#-relational-database-architecture) • [🚀 Quickstart](#-quickstart-guide)

</div>

---

## 🌟 Executive Summary & Value Proposition

Travelers often struggle with fragmented spreadsheets, disconnected flight bookings, and inaccurate multi-currency budgeting when planning multi-city adventures. 

**GlobeTrotter** solves this by delivering an end-to-end, integrated travel command center that unites:
- 🗺️ **Stop-by-Stop Multi-City Itinerary Construction** with automatic timeline calculations.
- 💰 **Automated Indian Rupee (INR ₹) Budget Tracking** with visual category and daily expense charts.
- 📍 **Interactive Geographic Route Visualization** powered by Leaflet.js with curvature waypoint lines.
- 🚀 **1-Click Curated Itinerary Templates** and standard **iCal (`.ics`) Export** for Apple & Google Calendars.
- 🌐 **Public Itinerary Sharing & 1-Click Forking** allowing anyone in the world to clone a trip into their own account.
- 🗄️ **Relational Database Integrity & Live SQL Inspector** for administrators and hackathon evaluators.

---

## 🚀 Live Access Links

| Environment | Access URL | Description |
| :--- | :--- | :--- |
| **🌐 Cloudflare Global HTTPS** | **[Live Web App](https://undefined-fancy-moderate-alternative.trycloudflare.com)** | High-speed global edge link accessible across any browser or phone |
| **📍 Public Itinerary Share** | **[Grand European Odyssey](https://undefined-fancy-moderate-alternative.trycloudflare.com/#share/grand-european-odyssey-2026)** | Public read-only view with interactive map & 1-click copy |
| **🔐 Dedicated Auth View** | **[Sign In / Register](https://undefined-fancy-moderate-alternative.trycloudflare.com/#login)** | Dedicated authentication page with 1-click demo logins |
| **🏠 Localhost (Development)** | **[http://localhost:8000](http://localhost:8000)** | Local machine development URL |
| **📶 Wi-Fi / Local Network** | **[http://10.232.135.55:8000](http://10.232.135.55:8000)** | Accessible by any device on the local network |

---

## 🔑 Demo Personas for Judges & Evaluators

The application includes a **Top Quick-Switcher Banner** and **1-Click Login Pills** to instantly test different roles:

| Persona | Credentials | Key Data & Features to Inspect |
| :--- | :--- | :--- |
| 🧑‍💼 **Alex Rivers** *(Traveler)* | `traveler@odoo.com`<br>`odoo123` | • **Active Trips**: *Grand European Odyssey* (₹2,80,000) & *Japan Zen Trail* (₹2,40,000)<br>• 4 multi-city stops, 9 scheduled activities, and 6 tracked expenses. |
| 👑 **Admin Master** *(Administrator)* | `admin@odoo.com`<br>`admin123` | • **Platform Analytics**: Total users, aggregate budgets, top visited cities.<br>• **Relational DB Inspector**: Live schema tables and **Interactive SQL Query Console**. |
| 🎒 **Sophia Chen** *(Creator)* | `sophia@example.com`<br>`travel2026` | • Fresh creator profile with saved wishlist destinations and trip cloning. |

---

## 📋 Comprehensive 13-Screen Hackathon Coverage

GlobeTrotter implements **100% of all 13 required screens and modules** specified in the Odoo Hackathon brief:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 GLOBETROTTER PLATFORM                                  │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 1. 🔐 Auth & Login       │ 6. 👁️ Itinerary View        │ 10. 📅 Calendar & Agenda      │
│ 2. 📊 Dashboard Overview │ 7. 🏙️ City Discovery        │ 11. 🌐 Public Share & Fork    │
│ 3. ➕ Create Trip Wizard │ 8. 🎟️ Activities Catalog    │ 12. 👤 Profile & Wishlists    │
│ 4. 🧳 My Trips Grid      │ 9. 💰 Budget & Cost Charts  │ 13. 🗄️ Admin & SQL Inspector  │
│ 5. 🛠️ Itinerary Builder  │                             │                               │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

| # | Screen / Module | Status | Technical Implementation Details |
|---|---|:---:|---|
| **1** | **Login & Signup** | ✅ 100% | Full-page auth screen (`#login`) & modal dialog; password visibility toggle (`👁️`); SHA-256 password hashing; 1-click evaluator login pills. |
| **2** | **Dashboard / Home** | ✅ 100% | Real-time metrics (Total Trips, Destinations Planned, Curated Activities, Total INR Budget); upcoming trip cards with progress rings; handpicked inspiration cities. |
| **3** | **Create Trip Wizard** | ✅ 100% | Multi-city initialization with date pickers; target budget in INR; currency selector; curated cover gallery; 1-Click templates dropdown. |
| **4** | **My Trips Collection** | ✅ 100% | Multi-facet filtering by status (*Upcoming*, *In Progress*, *Completed*, *Draft*); real-time search; budget health indicators; duplicate trip; delete with cascade confirmation. |
| **5** | **Itinerary Builder** | ✅ 100% | Reorderable city stops; automatic waypoint calculation; modal activity scheduler with start time and duration; accommodation cost logging. |
| **6** | **Itinerary View** | ✅ 100% | Dual viewing modes: **Chronological Timeline View** and **Interactive Leaflet.js Route Map**; status toggles (*Planned* ➔ *Booked* ➔ *Completed*); iCal export. |
| **7** | **City Search & Discovery** | ✅ 100% | Global catalog of 15+ curated world destinations; filtering by Continent, Region, Cost Index (`$` to `$$$$`); 1-click wishlist toggle; average daily INR costs. |
| **8** | **Activity Discovery Catalog** | ✅ 100% | Catalog of 50+ curated experiences categorized by *Sightseeing*, *Culture*, *Food & Dining*, *Adventure*, *Relaxation*; 1-click add to itinerary. |
| **9** | **Budget & Cost Analytics** | ✅ 100% | Chart.js interactive **Category Doughnut Chart** and **Daily Spending Bar Chart**; real-time expense logger; remaining balance calculator; overbudget warning. |
| **10** | **Calendar & Timeline** | ✅ 100% | Day-by-day agenda matrix; hourly slots; category badges; activity detail cards with instant status toggling. |
| **11** | **Public Share & 1-Click Fork** | ✅ 100% | Unique SEO-friendly slugs (`#share/grand-european-odyssey-2026`); dynamic QR Code generator; 1-Click **"Copy Trip to My Account"** cloning; WhatsApp/Twitter share. |
| **12** | **User Profile & Settings** | ✅ 100% | Profile editing (bio, avatar, home currency); interactive saved wishlist destinations; reset database to demo state. |
| **13** | **Admin & SQL Inspector** | ✅ 100% | System-wide statistics; relational table schema viewer with foreign key listings; **Live Read-only SQL Query Console** to execute custom `SELECT` & `PRAGMA` queries. |

---

## 🏗️ Relational Database Architecture

The backend implements SQLite with strict foreign key constraints (`PRAGMA foreign_keys = ON;`) ensuring referential integrity and cascading deletions across related records.

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ TRIPS : "creates (1:N)"
    USERS ||--o{ SAVED_DESTINATIONS : "saves (1:N)"
    USERS ||--o{ ANALYTICS_EVENTS : "triggers (1:N)"
    
    TRIPS ||--o{ STOPS : "contains (1:N, CASCADE)"
    TRIPS ||--o{ ACTIVITIES : "schedules (1:N, CASCADE)"
    TRIPS ||--o{ EXPENSES : "incurs (1:N, CASCADE)"
    
    STOPS ||--o{ ACTIVITIES : "hosts (1:N, CASCADE)"
    STOPS ||--o{ EXPENSES : "associates (1:N, SET NULL)"
    
    DESTINATIONS_CATALOG ||--o{ SAVED_DESTINATIONS : "bookmarked in (1:N)"

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string avatar
        string bio
        string home_currency "Default: INR"
        string role "user | admin"
        datetime created_at
    }

    TRIPS {
        int id PK
        int user_id FK
        string title
        string description
        date start_date
        date end_date
        string cover_image
        float total_budget "in INR"
        string currency "INR"
        string status "Upcoming | In Progress | Completed"
        int is_public
        string share_slug UK
        datetime created_at
    }

    STOPS {
        int id PK
        int trip_id FK "ON DELETE CASCADE"
        string city_name
        string country
        int order_index
        date arrival_date
        date departure_date
        float accommodation_cost "in INR"
        string stay_notes
        float latitude
        float longitude
    }

    ACTIVITIES {
        int id PK
        int stop_id FK "ON DELETE CASCADE"
        int trip_id FK "ON DELETE CASCADE"
        string title
        string category "Sightseeing | Food | Adventure | Culture | Relaxation"
        date activity_date
        string start_time
        float duration_hours
        float estimated_cost "in INR"
        string status "planned | booked | completed"
        int order_index
    }

    EXPENSES {
        int id PK
        int trip_id FK "ON DELETE CASCADE"
        int stop_id FK "ON DELETE SET NULL"
        string category "Transport | Accommodation | Activities | Meals | Misc"
        float amount "in INR"
        string currency "INR"
        date expense_date
        string note
        string payment_method
    }

    DESTINATIONS_CATALOG {
        int id PK
        string name
        string country
        string continent
        string cost_index "$ | $$ | $$$ | $$$$"
        float avg_daily_cost "in INR"
        float popularity_rating
        string best_season
        string image_url
        string tags "JSON Array"
        float latitude
        float longitude
    }

    SAVED_DESTINATIONS {
        int id PK
        int user_id FK "ON DELETE CASCADE"
        int destination_id FK "ON DELETE CASCADE"
        datetime saved_at
    }
```

---

## ⚡ Key Highlights & Innovations

### 1. 🇮🇳 Native Indian Rupee (INR ₹) Financial Engine
All monetary values, destination benchmarks, activity tickets, and accommodations are calibrated in Indian Rupees:
- Standard Indian numbering format (`₹2,80,000.00`).
- Real-time expense tracker with remaining balance and overbudget alerts.
- Visual breakdown powered by Chart.js (Doughnut by category & Bar by timeline day).

### 2. 🗺️ Interactive Geographic Route Mapping
- Integrates Leaflet.js with custom glowing city markers, sequential stop badges, and animated route lines.
- Click any city stop to center the map, view lodging notes, and inspect scheduled excursions.

### 3. 🚀 1-Click Itinerary Templates & iCal Calendar Export
- **Curated Templates**: Pre-configured itineraries for *Mediterranean Coastal Odyssey*, *Japan Sakura & Zen Trail*, *Swiss Alps Expedition*, and *Bali Explorer*.
- **iCal Export (`.ics`)**: Generates standard calendar files containing exact hotel check-in/out times and scheduled activity slots ready for 1-click import into Google Calendar or Apple Calendar.

### 4. 🌐 Public Itinerary Sharing & 1-Click Forking
- Every trip generates a unique, human-readable share slug (e.g. `grand-european-odyssey-2026`).
- Evaluators and friends can open the shared link on mobile, scan the auto-generated QR code, and click **"Copy Trip to My Account"** to clone the complete multi-city itinerary.

### 5. 🗄️ Administrator SQL Query & Schema Console
- Built-in SQL query console allowing judges to run live read-only SQL queries (`SELECT`, `PRAGMA`) directly against `globetrotter.db`.
- Pre-set query buttons for verifying joins across trips, stops, activities, and foreign keys.

---

## 📡 REST API Reference

The backend exposes a clean REST API built on Python's native `http.server`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/auth/me` | Fetch active user profile and preferences | Yes (`X-User-Id` / Bearer) |
| `POST` | `/api/auth/login` | Authenticate user credentials & return token | No |
| `POST` | `/api/auth/signup` | Register new user account with INR default | No |
| `GET` | `/api/trips` | List all trips for current authenticated user | Yes |
| `POST` | `/api/trips` | Create new multi-city trip & generate slug | Yes |
| `GET` | `/api/trips/:id` | Fetch complete trip with stops, activities, expenses & stats | Yes |
| `PUT` | `/api/trips/:id` | Update trip title, dates, cover photo, or budget | Yes |
| `DELETE` | `/api/trips/:id` | Delete trip (cascades to all stops & activities) | Yes |
| `POST` | `/api/trips/:id/stops` | Add destination city stop to trip | Yes |
| `POST` | `/api/stops/:id/activities` | Schedule activity within a city stop | Yes |
| `POST` | `/api/activities/:id/toggle` | Toggle activity status (`planned` ➔ `booked` ➔ `completed`) | Yes |
| `POST` | `/api/trips/:id/expenses` | Record financial transaction under category | Yes |
| `GET` | `/api/public/trips/:slug` | Public read-only view of shared trip | No |
| `POST` | `/api/public/trips/:slug/fork` | Clone shared trip into authenticated user's account | Yes |
| `GET` | `/api/destinations` | Search city catalog with continent & cost filters | No |
| `GET` | `/api/activities/catalog` | Filter curated experiences by city & category | No |
| `GET` | `/api/admin/stats` | Platform usage analytics for admin dashboard | Admin |
| `GET` | `/api/admin/tables` | Schema inspector with columns & foreign keys | Admin |
| `POST` | `/api/admin/query` | Execute read-only SQL inspection query | Admin |

---

## 💻 Tech Stack & Zero-Dependency Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TECH STACK                                │
├───────────────────┬────────────────────────────────────────────────────┤
│ Backend           │ Python 3.13 Standard Library (Zero PyPI overhead)  │
│ Database          │ SQLite 3 with Foreign Key Cascades & Indices       │
│ Frontend Core     │ Vanilla HTML5, Modern ES6+ JavaScript, CSS3        │
│ Design System     │ Custom Glassmorphism, CSS Tokens, Dark/Light Mode  │
│ Mapping           │ Leaflet.js 1.9.4 (OpenStreetMap tile layer)        │
│ Charts            │ Chart.js 4.4.1 (Doughnut & Bar visualizations)     │
│ Cloud Tunnel      │ Cloudflare Global Edge Tunnel (trycloudflare.com)  │
│ Testing           │ Automated E2E Python Test Suite (test_app.py)      │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.8+** installed on your system.

### 1. Start the Server
```bash
python server.py
```
> The server will automatically create `globetrotter.db`, enforce relational foreign keys, seed rich sample data in INR (`₹`), and start listening on:  
> 👉 **`http://localhost:8000`**

### 2. Run Automated Verification Tests
```bash
python test_app.py
```
> Runs 7 end-to-end test suites testing static assets, authentication, relational joins, budget calculations, public forking, and the Admin SQL Inspector:
> ```
> ============================================================
>  ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY! (100% GREEN)
> ============================================================
> ```

---

## 📂 Project Structure

```
GlobeTrotter/
├── index.html        # Main Single Page Application (13 screens & modals)
├── style.css         # Modern design system (tokens, themes, glassmorphism)
├── app.js            # Client router, state manager, Chart.js & Leaflet logic
├── server.py         # REST API server & static file dispatcher
├── db.py             # Relational SQLite database schema & INR seed generator
├── test_app.py       # Automated end-to-end verification test suite
├── globetrotter.db   # SQLite relational database file
├── README.md         # Comprehensive project documentation
└── .gitignore        # Clean version control exclusions
```

---

## 👥 Contributors
Developed with passion for the **Odoo Hackathon 2026**.

⭐ *If you find this project impressive, feel free to star the repository!*
