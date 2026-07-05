import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import Layout from '../components/Layout';
import api from '../services/api';

// Fix default marker icon paths (a common Leaflet + bundler quirk)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRIORITY_COLOR = {
  Low: '#8a94a6',
  Medium: '#3b6ea5',
  High: '#f2a93b',
  Critical: '#c4462b',
};

const TCE_CENTER = [9.8819, 78.0827];
const TCE_BOUNDS = [
  [9.8775, 78.0775],
  [9.887, 78.088],
];

function coloredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function HeatLayer({ points, show }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (show && points.length) {
      layerRef.current = L.heatLayer(points, { radius: 35, blur: 25, maxZoom: 17 }).addTo(map);
    }
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [points, show, map]);

  return null;
}

export default function CampusMap() {
  const [complaints, setComplaints] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/complaints/map/locations')
      .then((res) => setComplaints(res.data.complaints))
      .finally(() => setLoading(false));
  }, []);

  const isInsideTce = (lat, lng) =>
    lat >= TCE_BOUNDS[0][0] &&
    lat <= TCE_BOUNDS[1][0] &&
    lng >= TCE_BOUNDS[0][1] &&
    lng <= TCE_BOUNDS[1][1];

  const withCoords = complaints.filter((c) => {
    const lat = Number(c.coordinates?.lat);
    const lng = Number(c.coordinates?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && isInsideTce(lat, lng);
  });

  const heatPoints = withCoords.map((c) => [c.coordinates.lat, c.coordinates.lng, 0.6]);

  return (
    <Layout>
      <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
        <div>
          <h1>Campus Map</h1>
          <p className="text-slate">Thiagarajar College of Engineering complaint locations and hotspot density.</p>
        </div>
        <button className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowHeatmap(!showHeatmap)}>
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>

      {loading ? (
        <p className="text-slate">Loading map...</p>
      ) : (
        <div className="card" style={{ overflow: 'hidden', height: 520 }}>
          <MapContainer
            center={TCE_CENTER}
            zoom={17}
            minZoom={16}
            maxBounds={TCE_BOUNDS}
            maxBoundsViscosity={1}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <HeatLayer points={heatPoints} show={showHeatmap} />
            {!showHeatmap &&
              withCoords.map((c) => (
                <Marker
                  key={c._id}
                  position={[c.coordinates.lat, c.coordinates.lng]}
                  icon={coloredIcon(PRIORITY_COLOR[c.priority] || '#8a94a6')}
                >
                  <Popup>
                    <strong>{c.title}</strong>
                    <br />
                    {c.category} — {c.priority}
                    <br />
                    Status: {c.status}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      )}

      {withCoords.length === 0 && !loading && (
        <p className="text-slate text-sm" style={{ marginTop: 12 }}>
          No complaints with location data inside Thiagarajar College of Engineering yet. Locations are captured
          automatically when a user submits a complaint with browser location permission enabled.
        </p>
      )}
    </Layout>
  );
}
