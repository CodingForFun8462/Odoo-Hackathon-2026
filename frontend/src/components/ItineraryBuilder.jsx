import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import { SAMPLE_CITIES } from '../data/mockData';
import Navbar from './Navbar';
import './ItineraryBuilder.css';

export default function ItineraryBuilder() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { getTrip, updateTrip } = useTrips();

  const trip = getTrip(tripId);

  const [stops, setStops] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState(SAMPLE_CITIES[0].id);
  const [stopStartDate, setStopStartDate] = useState('');
  const [stopEndDate, setStopEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sync stops with trip
  useEffect(() => {
    if (trip) {
      setStops(trip.stops || []);
      if (trip.start_date && !stopStartDate) {
        setStopStartDate(trip.start_date);
      }
      if (trip.end_date && !stopEndDate) {
        setStopEndDate(trip.end_date);
      }
    }
  }, [trip]);

  if (!trip) {
    return (
      <div className="builder-page">
        <Navbar />
        <main className="builder-container not-found">
          <h2>Trip Not Found</h2>
          <p>The trip you are trying to edit does not exist or was removed.</p>
          <Link to="/trips" className="back-btn">
            ← Back to My Trips
          </Link>
        </main>
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return 'TBD';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleAddStop = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedCityId) {
      setErrorMessage('Please select a city.');
      return;
    }
    if (!stopStartDate || !stopEndDate) {
      setErrorMessage('Please select both start and end dates for this stop.');
      return;
    }
    if (new Date(stopEndDate) < new Date(stopStartDate)) {
      setErrorMessage('End date cannot be earlier than start date.');
      return;
    }

    const cityObj = SAMPLE_CITIES.find((c) => c.id === selectedCityId);
    const newStop = {
      id: `stop-${Date.now()}`,
      city_id: cityObj.id,
      city: cityObj.name,
      country: cityObj.country,
      start_date: stopStartDate,
      end_date: stopEndDate,
      days: calculateDays(stopStartDate, stopEndDate),
      photo: cityObj.photo,
    };

    const updatedStops = [...stops, newStop];
    setStops(updatedStops);
    updateTrip(trip.id, { stops: updatedStops });

    setSuccessMessage(`Added ${cityObj.name}, ${cityObj.country} to your itinerary!`);
    setTimeout(() => setSuccessMessage(''), 3000);

    // Auto set next stop's start date to this stop's end date
    setStopStartDate(stopEndDate);
  };

  const handleRemoveStop = (stopId) => {
    const updatedStops = stops.filter((s) => s.id !== stopId);
    setStops(updatedStops);
    updateTrip(trip.id, { stops: updatedStops });
  };

  const handleMoveStop = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;

    const newStops = [...stops];
    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    setStops(newStops);
    updateTrip(trip.id, { stops: newStops });
  };

  return (
    <div className="builder-page">
      <Navbar />

      <main className="builder-container">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-nav">
          <Link to="/" className="breadcrumb-link">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/trips" className="breadcrumb-link">My Trips</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Itinerary Builder</span>
        </div>

        {/* Trip Banner Overview */}
        <div
          className="trip-banner-card"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.65)), url(${trip.cover_photo_url})`,
          }}
        >
          <div className="trip-banner-content">
            <div className="trip-banner-header-row">
              <span className="trip-banner-badge">Itinerary Builder</span>
              <Link to="/trips" className="done-trips-link">
                Done & Back to My Trips →
              </Link>
            </div>
            <h1>{trip.name}</h1>
            <div className="trip-banner-meta">
              <span>📅 {formatDate(trip.start_date)} – {formatDate(trip.end_date)}</span>
              <span>📍 {stops.length} {stops.length === 1 ? 'Stop' : 'Stops'} Added</span>
              <span className="status-tag">{trip.status || 'Planning'}</span>
            </div>
            {trip.description && <p className="trip-banner-desc">{trip.description}</p>}
          </div>
        </div>

        {/* Top Section: Add Stop Form */}
        <section className="add-stop-section">
          <div className="panel-card form-card">
            <div className="panel-header">
              <h2>➕ Add a Stop to Itinerary</h2>
              <p>Pick a destination city from the list and specify the stay dates</p>
            </div>

            {errorMessage && <div className="builder-alert error">{errorMessage}</div>}
            {successMessage && <div className="builder-alert success">{successMessage}</div>}

            <form onSubmit={handleAddStop} className="add-stop-form">
              <div className="form-fields-grid">
                {/* City Picker */}
                <div className="form-group city-group">
                  <label htmlFor="city-select">Select Destination City</label>
                  <select
                    id="city-select"
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="city-select"
                  >
                    {SAMPLE_CITIES.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.country} ({city.region}) — {'$'.repeat(city.cost_index)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div className="form-group">
                  <label htmlFor="stop-start">Start / Arrival Date</label>
                  <input
                    type="date"
                    id="stop-start"
                    value={stopStartDate}
                    onChange={(e) => setStopStartDate(e.target.value)}
                    required
                  />
                </div>

                {/* End Date */}
                <div className="form-group">
                  <label htmlFor="stop-end">End / Departure Date</label>
                  <input
                    type="date"
                    id="stop-end"
                    value={stopEndDate}
                    onChange={(e) => setStopEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-bottom-row">
                <div className="calculated-days-hint">
                  🗓️ Stay Duration: <strong>{calculateDays(stopStartDate, stopEndDate)} days</strong>
                </div>

                <button type="submit" className="add-stop-submit-btn">
                  ➕ Add Stop
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Bottom Section: Added Stops List */}
        <section className="stops-list-section">
          <div className="section-title-bar">
            <h2>🗺️ Added Stops ({stops.length})</h2>
            <p>Chronological sequence of destinations for this trip</p>
          </div>

          {stops.length > 0 ? (
            <div className="stops-cards-grid">
              {stops.map((stop, index) => (
                <article key={stop.id || index} className="stop-item-card">
                  <div className="stop-card-badge-column">
                    <span className="stop-number-pill">Stop #{index + 1}</span>
                  </div>

                  <div className="stop-card-details">
                    <h3 className="stop-city-name">
                      {stop.city}, <span className="stop-country-name">{stop.country}</span>
                    </h3>

                    <div className="stop-dates-info">
                      <span className="dates-text">
                        📅 {formatDate(stop.start_date)} – {formatDate(stop.end_date)}
                      </span>
                      <span className="duration-pill">
                        ⏳ {stop.days || calculateDays(stop.start_date, stop.end_date)} Days
                      </span>
                    </div>
                  </div>

                  <div className="stop-card-actions">
                    <div className="reorder-btn-group">
                      <button
                        type="button"
                        className="reorder-btn"
                        disabled={index === 0}
                        onClick={() => handleMoveStop(index, -1)}
                        title="Move Earlier in Route"
                      >
                        ▲ Up
                      </button>
                      <button
                        type="button"
                        className="reorder-btn"
                        disabled={index === stops.length - 1}
                        onClick={() => handleMoveStop(index, 1)}
                        title="Move Later in Route"
                      >
                        ▼ Down
                      </button>
                    </div>
                    <button
                      type="button"
                      className="delete-stop-btn"
                      onClick={() => handleRemoveStop(stop.id)}
                      title="Remove this stop"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-stops-placeholder">
              <span className="placeholder-icon">📍</span>
              <h3>No stops added yet</h3>
              <p>Pick a city in the form above and click <strong>"Add Stop"</strong> to start building your route.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
