import { createContext, useContext, useState, useEffect } from 'react';
import { SAMPLE_TRIPS } from '../data/mockData';

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('globetrotter_trips');
    return saved ? JSON.parse(saved) : SAMPLE_TRIPS;
  });

  useEffect(() => {
    localStorage.setItem('globetrotter_trips', JSON.stringify(trips));
  }, [trips]);

  const addTrip = (tripData) => {
    const newTrip = {
      id: `trip-${Date.now()}`,
      user_id: 'user-1',
      name: tripData.name,
      start_date: tripData.start_date,
      end_date: tripData.end_date,
      description: tripData.description || '',
      cover_photo_url:
        tripData.cover_photo_url ||
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      stops: tripData.stops || [],
      status: 'Planning',
      created_at: new Date().toISOString(),
    };

    setTrips((prev) => [newTrip, ...prev]);
    return newTrip;
  };

  const deleteTrip = (tripId) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  const updateTrip = (tripId, updatedData) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, ...updatedData } : t))
    );
  };

  const getTrip = (tripId) => {
    return trips.find((t) => t.id === tripId);
  };

  return (
    <TripContext.Provider
      value={{
        trips,
        addTrip,
        deleteTrip,
        updateTrip,
        getTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
}
