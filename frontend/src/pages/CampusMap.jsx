import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import Layout from '../components/Layout';
import api from '../services/api';
import { isInsideTce, parseCoordinate, resolveComplaintCoordinates, TCE_BOUNDS, TCE_CENTER } from '../utils/coordinates';

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
  const [skippedCount, setSkippedCount] = useState(0);

  useEffect(() => {
    api
      .get('/complaints/map/locations')
      .then((res) => {
        const items = res.data.complaints || [];
        const mapped = [];
        let skipped = 0;

        for (const complaint of items) {
          const coords = resolveComplaintCoordinates(complaint);
          if (!coords) {
            skipped += 1;
            continue;
          }

          const lat = parseCoordinate(coords.lat);
          const lng = parseCoordinate(coords.lng);
          if (!isInsideTce(lat, lng)) {
            skipped += 1;
            continue;
          }

          mapped.push({
            ...complaint,
            coordinates: { lat, lng },
          });
        }

        setComplaints(mapped);
        setSkippedCount(skipped);
      })
      .finally(() => setLoading(false));
  }, []);

  const heatPoints = complaints.map((c) => [c.coordinates.lat, c.coordinates.lng, 0.6]);

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
              complaints.map((c) => (
                <Marker
                  key={c._id}
                  position={[c.coordinates.lat, c.coordinates.lng]}
                  icon={coloredIcon(PRIORITY_COLOR[c.priority] || '#8a94a6')}
                >
                  <Popup>
                    <strong>{c.title}</strong>
                    <br />
                    {c.locationName}
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

      {complaints.length === 0 && !loading && (
        <p className="text-slate text-sm" style={{ marginTop: 12 }}>
          No complaints with valid campus coordinates yet. Submit a complaint and place the pin on the map — its marker
          will appear at the exact latitude and longitude you chose.
        </p>
      )}

      {skippedCount > 0 && !loading && (
        <p className="text-slate text-sm" style={{ marginTop: 8 }}>
          {skippedCount} complaint{skippedCount === 1 ? '' : 's'} omitted from the map because coordinates are missing
          or outside the campus area.
        </p>
      )}
    </Layout>
  );
}
