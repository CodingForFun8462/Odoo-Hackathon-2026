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
      { id: 'stop-1', city: 'Paris', country: 'France', days: 5 },
      { id: 'stop-2', city: 'Rome', country: 'Italy', days: 5 },
      { id: 'stop-3', city: 'Barcelona', country: 'Spain', days: 4 }
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
      { id: 'stop-4', city: 'Tokyo', country: 'Japan', days: 6 },
      { id: 'stop-5', city: 'Kyoto', country: 'Japan', days: 4 },
      { id: 'stop-6', city: 'Osaka', country: 'Japan', days: 3 }
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
      { id: 'stop-7', city: 'San Francisco', country: 'USA', days: 3 },
      { id: 'stop-8', city: 'Monterey & Big Sur', country: 'USA', days: 3 },
      { id: 'stop-9', city: 'Los Angeles', country: 'USA', days: 3 }
    ],
    status: 'Draft'
  }
];
