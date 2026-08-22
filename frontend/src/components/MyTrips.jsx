import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import Navbar from './Navbar';
import './MyTrips.css';

export default function MyTrips() {
  const { trips, deleteTrip, updateTrip } = useTrips();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states for View and Edit
  const [viewingTrip, setViewingTrip] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
      if (viewingTrip?.id === tripId) setViewingTrip(null);
      if (editingTrip?.id === tripId) setEditingTrip(null);
    }
  };

  const handleOpenEdit = (trip) => {
    setEditingTrip(trip);
    setEditFormData({
      name: trip.name,
      start_date: trip.start_date,
      end_date: trip.end_date,
      description: trip.description || '',
      status: trip.status || 'Planning',
      cover_photo_url: trip.cover_photo_url || '',
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editFormData.name.trim() || !editFormData.start_date || !editFormData.end_date) {
      alert('Please fill out all required fields.');
      return;
    }
    updateTrip(editingTrip.id, editFormData);
    setEditingTrip(null);
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
                    onClick={() => navigate(`/trips/${trip.id}/builder`)}
                    title="Open Itinerary Builder"
                  >
                    🗺️ Builder
                  </button>
                  <button
                    className="action-btn preview-btn"
                    onClick={() => setViewingTrip(trip)}
                    title="Quick Preview Details"
                  >
                    👁️ View
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleOpenEdit(trip)}
                    title="Edit Trip Details"
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

      {/* View Trip Modal */}
      {viewingTrip && (
        <div className="modal-backdrop" onClick={() => setViewingTrip(null)}>
          <div
            className="modal-card view-modal dark-theme"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Hero with Cover Photo and Visible Close Button */}
            <div
              className="view-modal-hero"
              style={{
                backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.4)), url(${viewingTrip.cover_photo_url})`,
              }}
            >
              <span className={`status-pill ${viewingTrip.status?.toLowerCase() || 'planning'}`}>
                {viewingTrip.status || 'Planning'}
              </span>
              <button
                className="modal-close-btn"
                onClick={() => setViewingTrip(null)}
                title="Close"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="view-modal-body">
              <h2 className="modal-trip-title">{viewingTrip.name}</h2>
              <div className="modal-meta-row">
                <span>📅 {formatDateRange(viewingTrip.start_date, viewingTrip.end_date)}</span>
                <span>📍 {viewingTrip.stops?.length || 0} destinations scheduled</span>
              </div>

              {viewingTrip.description ? (
                <div className="modal-desc-box">
                  <span className="desc-box-label">Description & Notes:</span>
                  <p>{viewingTrip.description}</p>
                </div>
              ) : (
                <div className="modal-desc-box empty">
                  <p>No description provided for this trip.</p>
                </div>
              )}

              <div className="stops-timeline">
                <h4>Planned Stops & Route ({viewingTrip.stops?.length || 0})</h4>
                {viewingTrip.stops && viewingTrip.stops.length > 0 ? (
                  <div className="timeline-items">
                    {viewingTrip.stops.map((stop, index) => (
                      <div key={stop.id || index} className="timeline-item">
                        <span className="stop-number">{index + 1}</span>
                        <div className="stop-info">
                          <strong>
                            {stop.city}, <span className="country-sub">{stop.country}</span>
                          </strong>
                          <span className="stop-stay-days">
                            {stop.start_date && stop.end_date
                              ? `📅 ${stop.start_date} – ${stop.end_date}`
                              : `⏳ ${stop.days || 1} days scheduled`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-stops-notice">
                    <p>No stops added yet. Click below to add destinations in the Itinerary Builder!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setViewingTrip(null)}
              >
                Close
              </button>
              <button
                className="primary-action-btn"
                onClick={() => {
                  const tId = viewingTrip.id;
                  setViewingTrip(null);
                  navigate(`/trips/${tId}/builder`);
                }}
              >
                🗺️ Open Itinerary Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {editingTrip && (
        <div className="modal-backdrop" onClick={() => setEditingTrip(null)}>
          <div
            className="modal-card edit-modal dark-theme"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h2>Edit Trip Details</h2>
              <button
                className="modal-close-btn small"
                onClick={() => setEditingTrip(null)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label>Trip Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.start_date}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, start_date: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    required
                    value={editFormData.end_date}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, end_date: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="Planning">Planning</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Draft">Draft</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Cover Photo URL</label>
                <input
                  type="text"
                  value={editFormData.cover_photo_url}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, cover_photo_url: e.target.value }))
                  }
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingTrip(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-action-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
