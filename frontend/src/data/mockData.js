export const SAMPLE_CITIES = [
  { id: 'city-1', name: 'Paris', country: 'France', cost_index: 4, popularity: 98, region: 'Europe', photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-2', name: 'Rome', country: 'Italy', cost_index: 3, popularity: 95, region: 'Europe', photo: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-3', name: 'Barcelona', country: 'Spain', cost_index: 3, popularity: 94, region: 'Europe', photo: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-4', name: 'Tokyo', country: 'Japan', cost_index: 4, popularity: 99, region: 'Asia', photo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-5', name: 'Kyoto', country: 'Japan', cost_index: 3, popularity: 92, region: 'Asia', photo: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-6', name: 'Osaka', country: 'Japan', cost_index: 3, popularity: 90, region: 'Asia', photo: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-7', name: 'London', country: 'United Kingdom', cost_index: 5, popularity: 97, region: 'Europe', photo: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-8', name: 'Amsterdam', country: 'Netherlands', cost_index: 4, popularity: 93, region: 'Europe', photo: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-9', name: 'San Francisco', country: 'United States', cost_index: 5, popularity: 93, region: 'North America', photo: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-10', name: 'New York', country: 'United States', cost_index: 5, popularity: 98, region: 'North America', photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-11', name: 'Sydney', country: 'Australia', cost_index: 4, popularity: 91, region: 'Oceania', photo: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80' },
  { id: 'city-12', name: 'Zurich', country: 'Switzerland', cost_index: 5, popularity: 89, region: 'Europe', photo: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80' },
];

export const SAMPLE_TRIPS = [
  {
    id: 'trip-1',
    user_id: 'user-1',
    name: 'European Grand Highlights',
    start_date: '2026-09-10',
    end_date: '2026-09-24',
    description: 'A 14-day adventure exploring art, culture, and cuisine across Paris, Rome, and Barcelona.',
    cover_photo_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    stops: [
      { id: 'stop-1', city_id: 'city-1', city: 'Paris', country: 'France', start_date: '2026-09-10', end_date: '2026-09-15', days: 5 },
      { id: 'stop-2', city_id: 'city-2', city: 'Rome', country: 'Italy', start_date: '2026-09-15', end_date: '2026-09-20', days: 5 },
      { id: 'stop-3', city_id: 'city-3', city: 'Barcelona', country: 'Spain', start_date: '2026-09-20', end_date: '2026-09-24', days: 4 }
    ],
    status: 'Upcoming'
  },
  {
    id: 'trip-2',
    user_id: 'user-1',
    name: 'Japan Autumn Discovery',
    start_date: '2026-10-15',
    end_date: '2026-10-28',
    description: 'Immerse in vibrant Tokyo neon, serene Kyoto shrines, and Osaka street food markets.',
    cover_photo_url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    stops: [
      { id: 'stop-4', city_id: 'city-4', city: 'Tokyo', country: 'Japan', start_date: '2026-10-15', end_date: '2026-10-21', days: 6 },
      { id: 'stop-5', city_id: 'city-5', city: 'Kyoto', country: 'Japan', start_date: '2026-10-21', end_date: '2026-10-25', days: 4 },
      { id: 'stop-6', city_id: 'city-6', city: 'Osaka', country: 'Japan', start_date: '2026-10-25', end_date: '2026-10-28', days: 3 }
    ],
    status: 'Planning'
  },
  {
    id: 'trip-3',
    user_id: 'user-1',
    name: 'California Coastline Roadtrip',
    start_date: '2026-11-05',
    end_date: '2026-11-14',
    description: 'Scenic Highway 1 coastal drive from San Francisco down to Santa Barbara and Los Angeles.',
    cover_photo_url: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&q=80',
    stops: [
      { id: 'stop-7', city_id: 'city-9', city: 'San Francisco', country: 'United States', start_date: '2026-11-05', end_date: '2026-11-08', days: 3 },
      { id: 'stop-8', city_id: 'city-9', city: 'Monterey & Big Sur', country: 'United States', start_date: '2026-11-08', end_date: '2026-11-11', days: 3 },
      { id: 'stop-9', city_id: 'city-10', city: 'Los Angeles', country: 'United States', start_date: '2026-11-11', end_date: '2026-11-14', days: 3 }
    ],
    status: 'Draft'
  }
];
