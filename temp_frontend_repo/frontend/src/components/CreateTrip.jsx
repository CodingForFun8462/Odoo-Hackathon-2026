import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTrips } from '../context/TripContext';
import Navbar from './Navbar';
import './CreateTrip.css';

const PRESET_COVERS = [
  {
    name: 'Mountain Escape',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Tropical Beach',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Historic City',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Scenic Roadtrip',
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
  },
];

export default function CreateTrip() {
  const { addTrip } = useTrips();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    cover_photo_url: PRESET_COVERS[0].url,
  });

  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(PRESET_COVERS[0].url);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData((prev) => ({ ...prev, cover_photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url) => {
    setPhotoPreview(url);
    setFormData((prev) => ({ ...prev, cover_photo_url: url }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Trip name is required.';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required.';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required.';
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date = 'End date cannot be earlier than start date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    addTrip(formData);
    navigate('/trips');
  };

  return (
    <div className="create-trip-page">
      <Navbar />

      <main className="create-trip-container">
        <div className="breadcrumb-nav">
          <Link to="/" className="breadcrumb-link">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/trips" className="breadcrumb-link">My Trips</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Plan New Trip</span>
        </div>

        <div className="create-trip-card">
          <div className="form-header">
            <h1>Plan a New Adventure</h1>
            <p>Set up the initial details for your multi-city trip itinerary.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="trip-form">
            {/* Trip Name */}
            <div className="form-group">
              <label htmlFor="name">
                Trip Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g. Summer across Mediterranean, Japan Cherry Blossom Tour"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            {/* Date Range */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">
                  Start Date <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={errors.start_date ? 'input-error' : ''}
                />
                {errors.start_date && (
                  <span className="field-error">{errors.start_date}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="end_date">
                  End Date <span className="required-star">*</span>
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={errors.end_date ? 'input-error' : ''}
                />
                {errors.end_date && (
                  <span className="field-error">{errors.end_date}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">
                Description & Goals <span className="optional-tag">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                placeholder="Describe your trip goals, must-see places, travel style, or notes..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Cover Photo Upload & Presets */}
            <div className="form-group">
              <label>
                Cover Photo <span className="optional-tag">(Optional)</span>
              </label>

              <div className="cover-photo-section">
                {photoPreview && (
                  <div
                    className="cover-preview"
                    style={{ backgroundImage: `url(${photoPreview})` }}
                  >
                    <span className="preview-label">Preview</span>
                  </div>
                )}

                <div className="cover-controls">
                  <div className="upload-btn-wrapper">
                    <label htmlFor="photo-upload" className="upload-label-btn">
                      📁 Upload Custom Image
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

                  <span className="or-text">or pick a curated cover:</span>

                  <div className="presets-list">
                    {PRESET_COVERS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={`preset-btn ${formData.cover_photo_url === preset.url ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(preset.url)}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/trips')}
              >
                Cancel
              </button>
              <button type="submit" className="save-trip-btn">
                💾 Save Trip & Continue
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
