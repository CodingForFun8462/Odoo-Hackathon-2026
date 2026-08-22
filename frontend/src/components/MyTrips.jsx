import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import Navbar from './Navbar';
import './MyTrips.css';

export default function MyTrips() {
  const { trips, deleteTrip } = useTrips();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDateRange = (start, end) => {
    if (!start || !end) return 'Dates TBD';
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesFilter = filter === 'ALL' || trip.status?.toUpperCase() === filter;
    const matchesSearch =
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.description && trip.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleDelete = (tripId, tripName) => {
    if (window.confirm(`Are you sure you want to delete "${tripName}"?`)) {
      deleteTrip(tripId);
    }
  };

  return (
    <div className="my-trips-page">
      <Navbar />

      <main className="my-trips-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>My Trips</h1>
            <p>Manage all your itineraries, destinations, and planned activities.</p>
          </div>
          <button
            className="primary-plan-btn"
            onClick={() => navigate('/trips/new')}
          >
            + Plan New Trip
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="trips-toolbar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search trips by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-tabs">
            {['ALL', 'UPCOMING', 'PLANNING', 'DRAFT'].map((status) => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status === 'ALL' ? 'All Trips' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length > 0 ? (
          <div className="trips-cards-grid">
            {filteredTrips.map((trip) => (
              <article key={trip.id} className="my-trip-card">
                <div
                  className="card-cover-image"
                  style={{ backgroundImage: `url(${trip.cover_photo_url})` }}
                >
                  <span className={`status-pill ${trip.status?.toLowerCase() || 'planning'}`}>
                    {trip.status || 'Planning'}
                  </span>
                </div>

                <div className="card-content">
                  <h2 className="trip-card-title">{trip.name}</h2>

                  <div className="trip-details-row">
                    <span className="detail-item">
                      📅 {formatDateRange(trip.start_date, trip.end_date)}
                    </span>
                    <span className="detail-item destination-count">
                      📍 {trip.stops ? trip.stops.length : 0}{' '}
                      {trip.stops?.length === 1 ? 'Destination' : 'Destinations'}
                    </span>
                  </div>

                  {trip.description && (
                    <p className="card-description">{trip.description}</p>
                  )}

                  {trip.stops && trip.stops.length > 0 && (
                    <div className="stops-pills-list">
                      {trip.stops.map((stop) => (
                        <span key={stop.id} className="stop-pill">
                          {stop.city}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-actions-bar">
                  <button
                    className="action-btn view-btn"
                    onClick={() =>
                      alert(`Opening Itinerary View for: ${trip.name} (Screen 6)`)
                    }
                  >
                    👁️ View
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() =>
                      alert(`Opening Itinerary Builder for: ${trip.name} (Screen 5)`)
                    }
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(trip.id, trip.name)}
                    title="Delete Trip"
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-trips-state">
            <div className="empty-icon">🗺️</div>
            <h3>No trips found</h3>
            <p>
              {searchQuery || filter !== 'ALL'
                ? 'Try adjusting your search or filters to find what you are looking for.'
                : "You haven't planned any trips yet. Create your first itinerary to get started!"}
            </p>
            <button
              className="primary-plan-btn"
              onClick={() => navigate('/trips/new')}
            >
              + Plan New Trip
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
