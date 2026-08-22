import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrips } from '../context/TripContext';
import Navbar from './Navbar';
import './Dashboard.css';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { trips } = useTrips();
  const navigate = useNavigate();

  const formatDateRange = (start, end) => {
    if (!start || !end) return 'Dates TBD';
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
  };

  const totalStops = trips.reduce((acc, t) => acc + (t.stops ? t.stops.length : 0), 0);
  const recentTrips = trips.slice(0, 3);

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
              onClick={() => navigate('/trips/new')}
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
            <span className="stat-hint">Active & planned</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Next Destination</span>
            <span className="stat-value">
              {trips[0]?.stops?.[0]?.city || trips[0]?.name?.split(' ')[0] || 'TBD'}
            </span>
            <span className="stat-hint">Upcoming journey</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Stops Planned</span>
            <span className="stat-value">{totalStops}</span>
            <span className="stat-hint">Across all itineraries</span>
          </div>
        </section>

        {/* Recent Trips Section */}
        <section className="recent-trips-section">
          <div className="section-header">
            <div>
              <h2>Recent Trips</h2>
              <p className="section-subtitle">Jump back into your recently planned itineraries</p>
            </div>
            <Link to="/trips" className="view-all-link">
              View all trips →
            </Link>
          </div>

          <div className="trips-grid">
            {recentTrips.map((trip) => (
              <article key={trip.id} className="trip-card">
                <div
                  className="trip-card-image"
                  style={{ backgroundImage: `url(${trip.cover_photo_url})` }}
                >
                  <span className={`status-badge ${(trip.status || 'planning').toLowerCase()}`}>
                    {trip.status || 'Planning'}
                  </span>
                </div>

                <div className="trip-card-body">
                  <h3 className="trip-name">{trip.name}</h3>
                  <div className="trip-meta">
                    <span className="trip-dates">
                      📅 {formatDateRange(trip.start_date, trip.end_date)}
                    </span>
                    <span className="trip-stops-count">
                      📍 {trip.stops ? trip.stops.length : 0}{' '}
                      {trip.stops?.length === 1 ? 'Destination' : 'Destinations'}
                    </span>
                  </div>

                  {trip.description && (
                    <p className="trip-description">{trip.description}</p>
                  )}

                  {trip.stops && trip.stops.length > 0 && (
                    <div className="trip-stops-tags">
                      {trip.stops.map((stop) => (
                        <span key={stop.id} className="stop-tag">
                          {stop.city}
                        </span>
                      ))}
                    </div>
                  )}
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
    </div>
  );
}
