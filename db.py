"""
GlobeTrotter - Relational Database Manager & Seed Data
Demonstrating complete relational schema with foreign key integrity for Odoo Hackathon.
Configured with Indian Rupee (INR ₹) as primary currency throughout.
"""

import sqlite3
import hashlib
import json
import os
import socket
from datetime import datetime, date, timedelta

DB_FILE = os.path.join(os.path.dirname(__file__), "globetrotter.db")

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

def init_db(force_recreate=False):
    if force_recreate and os.path.exists(DB_FILE):
        os.remove(DB_FILE)

    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        home_currency TEXT DEFAULT 'INR',
        language TEXT DEFAULT 'en',
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Destinations Catalog (Global Explorer Database)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS destinations_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        continent TEXT NOT NULL,
        region TEXT NOT NULL,
        description TEXT NOT NULL,
        cost_index TEXT NOT NULL, -- '$', '$$', '$$$', '$$$$'
        avg_daily_cost REAL DEFAULT 9500.0,
        popularity_rating REAL DEFAULT 4.8,
        best_season TEXT NOT NULL,
        image_url TEXT NOT NULL,
        tags TEXT NOT NULL, -- JSON array of tags
        latitude REAL NOT NULL,
        longitude REAL NOT NULL
    );
    """)

    # 3. Activities Catalog (Curated experiences per city in INR)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activities_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_name TEXT NOT NULL,
        country TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- Sightseeing, Food, Adventure, Culture, Relaxation, Nightlife
        cost REAL DEFAULT 0.0,
        currency TEXT DEFAULT 'INR',
        duration_hours REAL DEFAULT 2.0,
        rating REAL DEFAULT 4.7,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        popular INTEGER DEFAULT 1
    );
    """)

    # 4. Trips Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        cover_image TEXT,
        total_budget REAL DEFAULT 0.0,
        currency TEXT DEFAULT 'INR',
        status TEXT DEFAULT 'Upcoming', -- Upcoming, In Progress, Completed, Draft
        is_public INTEGER DEFAULT 0,
        share_slug TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. Stops Table (Cities in a Multi-City Trip)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        city_name TEXT NOT NULL,
        country TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        arrival_date DATE NOT NULL,
        departure_date DATE NOT NULL,
        accommodation_cost REAL DEFAULT 0.0,
        stay_notes TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. Activities Table (Scheduled Activities within a Stop)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stop_id INTEGER NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        category TEXT NOT NULL, -- Sightseeing, Food, Adventure, Culture, Relaxation, Transport, Stay
        activity_date DATE NOT NULL,
        start_time TEXT DEFAULT '10:00',
        duration_hours REAL DEFAULT 2.0,
        estimated_cost REAL DEFAULT 0.0,
        currency TEXT DEFAULT 'INR',
        location TEXT,
        description TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'planned', -- planned, booked, completed
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 7. Expenses Table (Real Expenses & Financial breakdown in INR)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        stop_id INTEGER REFERENCES stops(id) ON DELETE SET NULL,
        category TEXT NOT NULL, -- Transport, Accommodation, Activities, Meals, Misc
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        expense_date DATE NOT NULL,
        note TEXT,
        payment_method TEXT DEFAULT 'UPI / Card',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 8. Saved Destinations (User Wishlist)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_destinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        destination_id INTEGER NOT NULL REFERENCES destinations_catalog(id) ON DELETE CASCADE,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, destination_id)
    );
    """)

    # 9. Analytics & Audit Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def seed_database():
    conn = get_db()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()['count'] > 0:
        conn.close()
        return

    # Seed Users (All configured with INR)
    users_data = [
        ("Alex Rivers", "traveler@odoo.com", hash_password("odoo123"), "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", "Passionate globetrotter exploring cultural gems, hidden cafes, and alpine heights.", "INR", "en", "user"),
        ("Admin Master", "admin@odoo.com", hash_password("admin123"), "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", "System Administrator & Analytics Manager for GlobeTrotter.", "INR", "en", "admin"),
        ("Sophia Chen", "sophia@example.com", hash_password("travel2026"), "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", "Foodie and architectural photographer.", "INR", "en", "user"),
    ]
    cursor.executemany("""
    INSERT INTO users (name, email, password_hash, avatar, bio, home_currency, language, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, users_data)

    # Seed Destinations Catalog (15 top world destinations with INR daily costs)
    destinations = [
        ("Paris", "France", "Europe", "Western Europe", "The City of Light known for iconic art, haute cuisine, chic boulevards, and timeless romantic architecture.", "$$$", 18500.0, 4.9, "Apr - Oct", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80", json.dumps(["Romance", "Art", "Food", "Architecture"]), 48.8566, 2.3522),
        ("Tokyo", "Japan", "Asia", "East Asia", "An electrifying metropolis harmonizing futuristic neon skyscrapers with ancient tranquil temples and unmatched culinary mastery.", "$$$", 16000.0, 5.0, "Mar - May, Sep - Nov", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80", json.dumps(["Culture", "Futuristic", "Street Food", "Anime"]), 35.6762, 139.6503),
        ("Rome", "Italy", "Europe", "Southern Europe", "An open-air museum filled with millennia of ancient history, majestic plazas, artisanal gelato, and vibrant Dolce Vita.", "$$", 14000.0, 4.8, "May - Jun, Sep - Oct", "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80", json.dumps(["History", "Cuisine", "Architecture", "Ruins"]), 41.9028, 12.4964),
        ("Barcelona", "Spain", "Europe", "Southern Europe", "Cosmopolitan seaside city with whimsical Gaudi architecture, sunny Mediterranean beaches, and legendary tapas.", "$$", 12500.0, 4.8, "May - Oct", "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&auto=format&fit=crop&q=80", json.dumps(["Beach", "Gaudi Art", "Tapas", "Nightlife"]), 41.3851, 2.1734),
        ("Kyoto", "Japan", "Asia", "East Asia", "The cultural soul of Japan, featuring serene bamboo groves, thousands of golden shrines, geisha districts, and zen gardens.", "$$", 12000.0, 4.9, "Mar - Apr, Oct - Nov", "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80", json.dumps(["Zen", "Shrines", "Tea Ceremony", "Nature"]), 35.0116, 135.7681),
        ("New York", "USA", "North America", "East Coast", "The city that never sleeps, radiating energy across Broadway, Central Park, diverse foodie neighborhoods, and iconic skylines.", "$$$$", 22000.0, 4.9, "Sep - Nov, Apr - Jun", "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop&q=80", json.dumps(["Skyline", "Broadway", "Museums", "Shopping"]), 40.7128, -74.0060),
        ("Bali", "Indonesia", "Asia", "Southeast Asia", "Tropical paradise with verdant emerald rice terraces, vibrant surf breaks, sacred sea temples, and holistic wellness retreats.", "$", 5500.0, 4.8, "Apr - Oct", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80", json.dumps(["Tropical", "Surfing", "Wellness", "Temples"]), -8.4095, 115.1889),
        ("Nice", "France", "Europe", "French Riviera", "The sparkling jewel of the Côte d'Azur with azure waters, pebble shores, Belle Époque grandeur, and olive groves.", "$$$", 17000.0, 4.7, "Jun - Sep", "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80", json.dumps(["Riviera", "Seaside", "Wine", "Sunsets"]), 43.7102, 7.2620),
        ("Cairo", "Egypt", "Africa", "North Africa", "A fascinating historic gateway to the Great Pyramids of Giza, historic Nile cruises, and bustling medieval spice bazaars.", "$", 4800.0, 4.6, "Oct - Apr", "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&auto=format&fit=crop&q=80", json.dumps(["Pyramids", "History", "Nile", "Bazaars"]), 30.0444, 31.2357),
        ("Cape Town", "South Africa", "Africa", "Southern Africa", "Breathtaking coastal spectacle with dramatic Table Mountain, wild penguin beaches, and world-class wine valleys.", "$$", 7800.0, 4.9, "Nov - Mar", "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&auto=format&fit=crop&q=80", json.dumps(["Hiking", "Penguins", "Wine", "Coastline"]), -33.9249, 18.4241),
        ("Sydney", "Australia", "Oceania", "East Coast", "Vibrant coastal harbor city famed for the iconic Opera House, Bondi surf culture, and pristine coastal walks.", "$$$", 16500.0, 4.8, "Sep - Nov, Mar - May", "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80", json.dumps(["Opera House", "Harbour", "Bondi", "Sailing"]), -33.8688, 151.2093),
        ("Amsterdam", "Netherlands", "Europe", "Western Europe", "Picturesque canal-ringed city famed for cycling culture, world-class art museums, and historic gabled townhouses.", "$$$", 15000.0, 4.8, "Apr - Sep", "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&auto=format&fit=crop&q=80", json.dumps(["Canals", "Museums", "Cycling", "Architecture"]), 52.3676, 4.9041),
        ("Reykjavik", "Iceland", "Europe", "Nordic", "Gateway to the ethereal Land of Fire and Ice, geothermal blue lagoons, glowing northern lights, and cascading waterfalls.", "$$$$", 21000.0, 4.9, "Sep - Mar (Auroras), Jun - Aug", "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&auto=format&fit=crop&q=80", json.dumps(["Northern Lights", "Glaciers", "Geothermal", "Adventure"]), 64.1466, -21.9426),
        ("Dubai", "UAE", "Asia", "Middle East", "Ultra-luxurious futuristic oasis featuring the towering Burj Khalifa, desert safaris, and sprawling artificial islands.", "$$$$", 22500.0, 4.7, "Nov - Mar", "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80", json.dumps(["Luxury", "Skyscrapers", "Desert Safari", "Shopping"]), 25.2048, 55.2708),
        ("Prague", "Czech Republic", "Europe", "Central Europe", "The Fairy Tale City of a Hundred Spires, Charles Bridge, historic cobblestone squares, and famous Czech brews.", "$", 7200.0, 4.8, "May - Sep", "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&auto=format&fit=crop&q=80", json.dumps(["Castles", "Old Town", "Brews", "History"]), 50.0755, 14.4378)
    ]

    cursor.executemany("""
    INSERT INTO destinations_catalog (name, country, continent, region, description, cost_index, avg_daily_cost, popularity_rating, best_season, image_url, tags, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, destinations)

    # Seed Activities Catalog in INR (₹)
    activities_seed = [
        # Paris
        ("Paris", "France", "Eiffel Tower Summit & Sunset Experience", "Sightseeing", 3200.0, "INR", 2.5, 4.9, "Ascend to the highest accessible observation deck in Paris for breathtaking 360 panoramic views.", "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&auto=format&fit=crop&q=80", 1),
        ("Paris", "France", "Louvre Museum Masterpieces Guided Tour", "Culture", 5800.0, "INR", 3.0, 4.8, "Skip-the-line guided access to the Mona Lisa, Venus de Milo, and French Crown Jewels.", "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80", 1),
        ("Paris", "France", "Seine River Dinner & Jazz Cruise", "Food", 8500.0, "INR", 2.5, 4.9, "Gourmet 3-course French dining gliding past illuminated Parisian monuments at dusk.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80", 1),
        ("Paris", "France", "Montmartre Bohemian Walking Tour & Pastry Tasting", "Food", 4000.0, "INR", 2.5, 4.7, "Stroll the cobblestone alleys of artists, Sacré-Cœur, and sample artisan macarons.", "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=600&auto=format&fit=crop&q=80", 1),

        # Tokyo
        ("Tokyo", "Japan", "Shibuya Crossing & Harajuku Hidden Alleyways", "Sightseeing", 2200.0, "INR", 2.5, 4.9, "Experience the pulse of Shibuya crossing and discover quirky vintage fashion boutiques.", "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80", 1),
        ("Tokyo", "Japan", "Tsukiji Outer Market Gourmet Food Odyssey", "Food", 4800.0, "INR", 3.0, 5.0, "Sample fresh otoro sashimi, tamagoyaki, wagyu skewers, and matcha sweets.", "https://images.unsplash.com/photo-1554502078-ef0fc409efce?w=600&auto=format&fit=crop&q=80", 1),
        ("Tokyo", "Japan", "teamLab Planets Immersive Digital Art", "Culture", 3400.0, "INR", 2.0, 4.9, "Walk through water and become one with mesmerizing infinite crystal light installations.", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80", 1),
        ("Tokyo", "Japan", "Akihabara Gaming & Retro VR Experience", "Adventure", 3500.0, "INR", 2.0, 4.7, "Dive into the epic heart of Japanese gaming culture, arcades, and electronics.", "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80", 0),

        # Rome
        ("Rome", "Italy", "Colosseum & Ancient Roman Forum Gladiator Tour", "Culture", 4900.0, "INR", 3.0, 4.9, "Walk the arena floor where gladiators fought and explore the ruins of the Roman Senate.", "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", 1),
        ("Rome", "Italy", "Vatican Museums, Sistine Chapel & St. Peter's", "Sightseeing", 5800.0, "INR", 3.5, 4.9, "Marvel at Michelangelo's celestial frescoes in the Sistine Chapel with expert historian guidance.", "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&auto=format&fit=crop&q=80", 1),
        ("Rome", "Italy", "Trastevere Evening Food & Wine Tasting", "Food", 6200.0, "INR", 3.0, 4.9, "Handmade cacio e pepe, supplì, crispy Roman pizza, and local Chianti wines.", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", 1),

        # Barcelona
        ("Barcelona", "Spain", "Sagrada Família Fast-Track Tower Access", "Culture", 3400.0, "INR", 2.0, 4.9, "Explore Antoni Gaudí's breathtaking stained-glass masterpiece and towering spires.", "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80", 1),
        ("Barcelona", "Spain", "Park Güell Whimsical Garden Stroll", "Sightseeing", 1400.0, "INR", 2.0, 4.8, "Colorful mosaic salamanders and panoramic coastal views overlooking Barcelona.", "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&auto=format&fit=crop&q=80", 1),
        ("Barcelona", "Spain", "Barceloneta Sunset Catamaran Sailing & Tapas", "Adventure", 4300.0, "INR", 2.0, 4.8, "Sail the Mediterranean coast with chilled cava, Iberian ham, and panoramic cityscapes.", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", 1),

        # Kyoto
        ("Kyoto", "Japan", "Fushimi Inari Shrine 10,000 Torii Gates Hike", "Sightseeing", 0.0, "INR", 2.5, 5.0, "Hike through the majestic mountain paths lined with vibrant vermilion Torii gates.", "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80", 1),
        ("Kyoto", "Japan", "Arashiyama Bamboo Forest & Monkey Park", "Adventure", 1100.0, "INR", 3.0, 4.8, "Walk through towering emerald bamboo groves and visit playful macaque monkeys on the summit.", "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80", 1),
        ("Kyoto", "Japan", "Authentic Zen Tea Ceremony & Kimono Experience", "Culture", 3900.0, "INR", 2.0, 4.9, "Learn the sacred art of Matcha tea preparation in a traditional 200-year-old Machiya.", "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80", 1),

        # New York
        ("New York", "USA", "Central Park Bike Tour & Picnic", "Relaxation", 2600.0, "INR", 2.5, 4.8, "Cycle past Bethesda Terrace, Strawberry Fields, and the reservoir with skyline backdrops.", "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80", 1),
        ("New York", "USA", "Summit One Vanderbilt Glass Skydeck", "Sightseeing", 3800.0, "INR", 2.0, 4.9, "Multisensory art observation deck with mirrored infinity rooms towering over Manhattan.", "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&auto=format&fit=crop&q=80", 1),
        ("New York", "USA", "Broadway Hit Musical VIP Ticket", "Culture", 11000.0, "INR", 3.0, 4.9, "Electrifying world-class theater in the glittering heart of Times Square.", "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80", 1),

        # Bali
        ("Bali", "Indonesia", "Ubud Sacred Monkey Forest & Campuhan Ridge Walk", "Adventure", 1300.0, "INR", 3.0, 4.8, "Trek scenic green ridges, tropical jungles, and ancient moss-covered shrines.", "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80", 1),
        ("Bali", "Indonesia", "Nusa Penida Island Speedboat & Kelingking Beach", "Adventure", 5200.0, "INR", 8.0, 4.9, "Day tour to the world-famous T-Rex shaped cliff and crystalline turquoise waters.", "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&auto=format&fit=crop&q=80", 1),
        ("Bali", "Indonesia", "Traditional Balinese Healing Massage & Flower Bath", "Relaxation", 3000.0, "INR", 2.0, 5.0, "Holistic rejuvenation with herbal oils, hot stones, and aromatic botanical baths.", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80", 1),

        # Nice
        ("Nice", "France", "Promenade des Anglais & Castle Hill Panorama", "Sightseeing", 0.0, "INR", 2.0, 4.8, "Climb Castle Hill for sweeping views of the Baie des Anges and terracotta rooftops.", "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80", 1),
        ("Nice", "France", "Monaco & Monte Carlo Glamour Evening Tour", "Adventure", 5800.0, "INR", 4.0, 4.8, "Drive the coastal Corniche to the Prince's Palace and legendary Grand Casino.", "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&auto=format&fit=crop&q=80", 1)
    ]

    cursor.executemany("""
    INSERT INTO activities_catalog (city_name, country, title, category, cost, currency, duration_hours, rating, description, image_url, popular)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, activities_seed)

    # Seed Sample Multi-City Trips in INR for Demo Traveler (Alex Rivers - user_id=1)
    today = date.today()

    # Trip 1: "Grand European Odyssey" (Paris -> Nice -> Barcelona -> Rome)
    t1_start = today + timedelta(days=20)
    t1_end = t1_start + timedelta(days=12)
    cursor.execute("""
    INSERT INTO trips (user_id, title, description, start_date, end_date, cover_image, total_budget, currency, status, is_public, share_slug)
    VALUES (1, 'Grand European Odyssey', 'A breathtaking 13-day summer journey spanning Parisian art galleries, sun-kissed Côte d Azur beaches, Catalan architecture, and ancient Roman history.', ?, ?, ?, 280000.0, 'INR', 'Upcoming', 1, 'grand-european-odyssey-2026')
    """, (t1_start.isoformat(), t1_end.isoformat(), "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80"))
    trip1_id = cursor.lastrowid

    # Trip 1 Stops
    stops_t1 = [
        (trip1_id, "Paris", "France", 1, t1_start.isoformat(), (t1_start + timedelta(days=3)).isoformat(), 34000.0, "Boutique Hotel in Le Marais near Saint-Paul metro.", 48.8566, 2.3522),
        (trip1_id, "Nice", "France", 2, (t1_start + timedelta(days=3)).isoformat(), (t1_start + timedelta(days=6)).isoformat(), 28000.0, "Seaside apartment on Promenade des Anglais.", 43.7102, 7.2620),
        (trip1_id, "Barcelona", "Spain", 3, (t1_start + timedelta(days=6)).isoformat(), (t1_start + timedelta(days=9)).isoformat(), 25000.0, "Modern hotel in Eixample close to Casa Batlló.", 41.3851, 2.1734),
        (trip1_id, "Rome", "Italy", 4, (t1_start + timedelta(days=9)).isoformat(), t1_end.isoformat(), 31000.0, "Historic guesthouse in lively Trastevere.", 41.9028, 12.4964)
    ]
    cursor.executemany("""
    INSERT INTO stops (trip_id, city_name, country, order_index, arrival_date, departure_date, accommodation_cost, stay_notes, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, stops_t1)

    # Get stop IDs
    cursor.execute("SELECT id, city_name FROM stops WHERE trip_id = ?", (trip1_id,))
    stop_map = {row['city_name']: row['id'] for row in cursor.fetchall()}

    # Trip 1 Activities (INR)
    activities_t1 = [
        # Paris
        (stop_map['Paris'], trip1_id, "Louvre Museum Masterpieces Guided Tour", "Culture", t1_start.isoformat(), "09:30", 3.0, 5800.0, "INR", "Louvre Museum, Paris", "Skip the line tour of Mona Lisa and Greek antiquities.", "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop&q=80", "booked", 1),
        (stop_map['Paris'], trip1_id, "Eiffel Tower Summit & Sunset Experience", "Sightseeing", (t1_start + timedelta(days=1)).isoformat(), "18:00", 2.5, 3200.0, "INR", "Champ de Mars, Paris", "Panoramic sunset views over the whole of Paris.", "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=600&auto=format&fit=crop&q=80", "planned", 2),
        (stop_map['Paris'], trip1_id, "Seine River Dinner & Jazz Cruise", "Food", (t1_start + timedelta(days=2)).isoformat(), "20:00", 2.5, 8500.0, "INR", "Pont de l'Alma, Paris", "Night-time cruise with three course French menu.", "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80", "booked", 3),

        # Nice
        (stop_map['Nice'], trip1_id, "Promenade des Anglais & Castle Hill Panorama", "Sightseeing", (t1_start + timedelta(days=4)).isoformat(), "10:00", 2.0, 0.0, "INR", "Castle Hill, Nice", "Morning jog and climb up to the waterfall cascade.", "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80", "planned", 1),
        (stop_map['Nice'], trip1_id, "Monaco & Monte Carlo Glamour Evening Tour", "Adventure", (t1_start + timedelta(days=5)).isoformat(), "17:00", 4.0, 5800.0, "INR", "Monte Carlo, Monaco", "VIP evening drive through F1 track and Casino square.", "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&auto=format&fit=crop&q=80", "planned", 2),

        # Barcelona
        (stop_map['Barcelona'], trip1_id, "Sagrada Família Fast-Track Tower Access", "Culture", (t1_start + timedelta(days=7)).isoformat(), "10:30", 2.5, 3400.0, "INR", "Sagrada Familia, Barcelona", "Tower Nativity elevation and architectural tour.", "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop&q=80", "booked", 1),
        (stop_map['Barcelona'], trip1_id, "Barceloneta Sunset Catamaran Sailing & Tapas", "Adventure", (t1_start + timedelta(days=8)).isoformat(), "18:30", 2.0, 4300.0, "INR", "Port Olimpic, Barcelona", "Sailing on the Mediterranean with tapas and cava.", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80", "planned", 2),

        # Rome
        (stop_map['Rome'], trip1_id, "Colosseum & Ancient Roman Forum Gladiator Tour", "Culture", (t1_start + timedelta(days=10)).isoformat(), "09:00", 3.5, 4900.0, "INR", "Piazza del Colosseo, Rome", "Special access arena and underground hypogeum.", "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop&q=80", "booked", 1),
        (stop_map['Rome'], trip1_id, "Trastevere Evening Food & Wine Tasting", "Food", (t1_start + timedelta(days=11)).isoformat(), "19:00", 3.0, 6200.0, "INR", "Piazza Santa Maria in Trastevere", "Authentic 5-stop culinary immersion.", "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80", "planned", 2)
    ]
    cursor.executemany("""
    INSERT INTO activities (stop_id, trip_id, title, category, activity_date, start_time, duration_hours, estimated_cost, currency, location, description, image_url, status, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, activities_t1)

    # Trip 1 Recorded Expenses in INR (₹)
    expenses_t1 = [
        (trip1_id, stop_map['Paris'], "Transport", 12500.0, "INR", (t1_start - timedelta(days=5)).isoformat(), "High-speed TGV train tickets Paris to Nice", "Credit Card"),
        (trip1_id, stop_map['Paris'], "Accommodation", 34000.0, "INR", t1_start.isoformat(), "Paris Hotel Le Marais - 3 Nights deposit", "Credit Card"),
        (trip1_id, stop_map['Paris'], "Activities", 8500.0, "INR", (t1_start + timedelta(days=2)).isoformat(), "Seine River Cruise booking confirmation", "Credit Card"),
        (trip1_id, stop_map['Nice'], "Accommodation", 28000.0, "INR", (t1_start + timedelta(days=3)).isoformat(), "Nice Seaside Flat reservation", "Debit Card"),
        (trip1_id, stop_map['Barcelona'], "Meals", 9800.0, "INR", (t1_start + timedelta(days=7)).isoformat(), "Seafood Paella & Sangria banquet in Barceloneta", "Cash / UPI"),
        (trip1_id, stop_map['Rome'], "Transport", 7500.0, "INR", (t1_start + timedelta(days=9)).isoformat(), "Flight Barcelona to Rome Fiumicino", "Credit Card")
    ]
    cursor.executemany("""
    INSERT INTO expenses (trip_id, stop_id, category, amount, currency, expense_date, note, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, expenses_t1)

    # Trip 2: "Japan Cherry Blossom & Zen Odyssey" (Tokyo -> Kyoto) in INR
    t2_start = today + timedelta(days=60)
    t2_end = t2_start + timedelta(days=9)
    cursor.execute("""
    INSERT INTO trips (user_id, title, description, start_date, end_date, cover_image, total_budget, currency, status, is_public, share_slug)
    VALUES (1, 'Japan Cherry Blossom & Zen Odyssey', 'An unforgettable immersion into high-tech Tokyo neon, Michelin ramen, and tranquil Kyoto bamboo temples during peak sakura bloom.', ?, ?, ?, 240000.0, 'INR', 'Upcoming', 1, 'japan-zen-odyssey-2026')
    """, (t2_start.isoformat(), t2_end.isoformat(), "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80"))
    trip2_id = cursor.lastrowid

    # Trip 2 Stops
    stops_t2 = [
        (trip2_id, "Tokyo", "Japan", 1, t2_start.isoformat(), (t2_start + timedelta(days=5)).isoformat(), 48000.0, "Shinjuku Tower view hotel.", 35.6762, 139.6503),
        (trip2_id, "Kyoto", "Japan", 2, (t2_start + timedelta(days=5)).isoformat(), t2_end.isoformat(), 36000.0, "Traditional Ryokan with private onsen bath.", 35.0116, 135.7681)
    ]
    cursor.executemany("""
    INSERT INTO stops (trip_id, city_name, country, order_index, arrival_date, departure_date, accommodation_cost, stay_notes, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, stops_t2)

    # Wishlist / Saved Destinations for Demo User
    cursor.execute("INSERT INTO saved_destinations (user_id, destination_id) VALUES (1, 1), (1, 2), (1, 7), (1, 13)")

    # Seed Initial Analytics events
    cursor.execute("""
    INSERT INTO analytics_events (user_id, event_type, details)
    VALUES 
    (1, 'TRIP_CREATED', 'Created trip Grand European Odyssey (INR 2,80,000)'),
    (1, 'TRIP_SHARED', 'Generated public slug grand-european-odyssey-2026'),
    (2, 'ADMIN_LOGIN', 'Admin dashboard accessed'),
    (3, 'DESTINATION_VIEWED', 'Viewed Tokyo destination catalog')
    """)

    conn.commit()
    conn.close()
    print("GlobeTrotter Relational Database seeded with INR (Rs) as base currency!")

if __name__ == "__main__":
    init_db(force_recreate=True)
    seed_database()
