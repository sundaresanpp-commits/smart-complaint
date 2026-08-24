import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LocationPicker from '../components/LocationPicker';
import api from '../services/api';

const CATEGORIES = [
  'Infrastructure',
  'Hostel',
  'Transport',
  'Wi-Fi/IT',
  'Sanitation',
  'Ragging/Safety',
  'Academic',
  'Canteen',
  'Other',
];

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    isAnonymous: false,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    name: '',
    lat: 9.8819,
    lng: 78.0827,
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!Number.isFinite(selectedLocation.lat) || !Number.isFinite(selectedLocation.lng)) {
      setError('Place the pin on the map before submitting the complaint.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => data.append(key, val));
      data.append('locationName', selectedLocation.name || 'Custom pinpoint');
      data.append('lat', String(selectedLocation.lat));
      data.append('lng', String(selectedLocation.lng));
      if (image) data.append('image', image);

      const res = await api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.isDuplicate) {
        navigate('/history');
      } else {
        navigate(`/complaints/${res.data.complaint._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 style={{ marginBottom: 4 }}>Submit a Complaint</h1>
      <p className="text-slate" style={{ marginBottom: 24 }}>
        AI will automatically categorize, prioritize, and flag urgency — you just describe the issue.
      </p>

      <div className="card" style={{ maxWidth: 640, padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Water leakage near hostel block C"
              required
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the issue in detail — what, where, and since when."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-16">
            <div className="field">
              <label>Category (optional — AI will suggest one if left blank)</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="">Let AI decide</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Location</label>
              <LocationPicker value={selectedLocation} onChange={handleLocationChange} error={error} />
            </div>
          </div>

          <div className="field">
            <label>Attach a photo (optional)</label>
            <input type="file" accept="image/*" onChange={handleImage} />
            {preview && (
              <img
                src={preview}
                alt="preview"
                style={{ marginTop: 8, maxHeight: 160, borderRadius: 6, border: '1px solid var(--line)' }}
              />
            )}
          </div>

          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleChange}
              style={{ width: 'auto' }}
            />
            <label htmlFor="isAnonymous" style={{ margin: 0 }}>
              Submit anonymously
            </label>
          </div>

          {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Analyzing & submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </Layout>
  );
}

