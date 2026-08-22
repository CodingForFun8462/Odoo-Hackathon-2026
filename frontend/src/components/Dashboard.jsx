import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_TRIPS } from '../data/mockData';
import Navbar from './Navbar';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [trips] = useState(SAMPLE_TRIPS);
  const [showNewTripModal, setShowNewTripModal] = useState(false);

  const formatDateRange = (start, end) => {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
  };

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-content">
        {/* Welcome & Primary CTA Banner */}
        <section className="welcome-banner">
          <div className="welcome-text">
            <h1>Welcome back, {currentUser?.name || 'Traveler'}! ✈️</h1>
            <p>
              Plan your next multi-city journey, customize activities, estimate budgets, and share itineraries with friends.
            </p>
          </div>
          <div className="welcome-actions">
            <button
              className="primary-cta-button"
              onClick={() => setShowNewTripModal(true)}
            >
              <span className="plus-icon">+</span> Plan New Trip
            </button>
          </div>
        </section>

        {/* Quick Highlights / Stats */}
        <section className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total Trips</span>
            <span className="stat-value">{trips.length}</span>
            <span className="stat-hint">Active plans</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Next Destination</span>
            <span className="stat-value">Paris, FR</span>
            <span className="stat-hint">In Sep 2026</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Stops Planned</span>
            <span className="stat-value">
              {trips.reduce((acc, t) => acc + t.stops.length, 0)}
            </span>
            <span className="stat-hint">Across 3 countries</span>
          </div>
        </section>

        {/* Recent Trips Section */}
        <section className="recent-trips-section">
          <div className="section-header">
            <div>
              <h2>Recent Trips</h2>
              <p className="section-subtitle">Jump back into your recently edited itineraries</p>
            </div>
            <Link to="/trips" className="view-all-link">
              View all trips →
            </Link>
          </div>

          <div className="trips-grid">
            {trips.map((trip) => (
              <article key={trip.id} className="trip-card">
                <div
                  className="trip-card-image"
                  style={{ backgroundImage: `url(${trip.cover_photo_url})` }}
                >
                  <span className={`status-badge ${trip.status.toLowerCase()}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="trip-card-body">
                  <h3 className="trip-name">{trip.name}</h3>
                  <div className="trip-meta">
                    <span className="trip-dates">
                      📅 {formatDateRange(trip.start_date, trip.end_date)}
                    </span>
                    <span className="trip-stops-count">
                      📍 {trip.stops.length} {trip.stops.length === 1 ? 'Destination' : 'Destinations'}
                    </span>
                  </div>

                  <p className="trip-description">{trip.description}</p>

                  <div className="trip-stops-tags">
                    {trip.stops.map((stop) => (
                      <span key={stop.id} className="stop-tag">
                        {stop.city}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="trip-card-footer">
                  <button
                    className="card-action-btn primary"
                    onClick={() => alert(`Opening Itinerary for: ${trip.name} (Screen 6)`)}
                  >
                    View Itinerary
                  </button>
                  <button
                    className="card-action-btn secondary"
                    onClick={() => alert(`Edit trip details for: ${trip.name}`)}
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Plan New Trip Modal Placeholder */}
      {showNewTripModal && (
        <div className="modal-backdrop" onClick={() => setShowNewTripModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Plan a New Trip</h3>
              <button
                className="close-btn"
                onClick={() => setShowNewTripModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Create Trip Screen (Screen 3)</strong> will be integrated here next!
              </p>
              <p>
                You'll be able to specify trip name, start & end dates, description, and upload a cover photo.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => setShowNewTripModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
