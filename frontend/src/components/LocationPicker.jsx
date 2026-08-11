import React from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function PinMap({ position, onPositionChange }) {
  const map = useMapEvents({
    click(event) {
      onPositionChange(event.latlng.lat, event.latlng.lng);
    },
  });

  React.useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 17), { duration: 0.3 });
    }
  }, [map, position?.lat, position?.lng]);

  return (
    <Marker
      position={[position.lat, position.lng]}
      eventHandlers={{
        dragend(event) {
          const { lat, lng } = event.target.getLatLng();
          onPositionChange(lat, lng);
        },
      }}
    />
  );
}

export default function LocationPicker({ value, onChange, error }) {
  React.useEffect(() => {
    if (!Number.isFinite(value?.lat) || !Number.isFinite(value?.lng)) {
      onChange({
        name: 'Custom pinpoint',
        lat: 9.8819,
        lng: 78.0827,
      });
    }
  }, []);

  const updatePinPosition = (lat, lng) => {
    onChange({
      name: value?.name || 'Custom pinpoint',
      lat: Number(lat),
      lng: Number(lng),
    });
  };

  const previewLat = Number.isFinite(value?.lat) ? value.lat : 9.8819;
  const previewLng = Number.isFinite(value?.lng) ? value.lng : 78.0827;

  return (
    <div>
      <span className="text-sm text-slate" style={{ display: 'block', marginBottom: 8 }}>
        Tap the map or drag the pin to place the complaint at the exact location.
      </span>
      <div className="card" style={{ overflow: 'hidden', height: 220 }}>
        <MapContainer
          center={[previewLat, previewLng]}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          dragging
          doubleClickZoom
          zoomControl
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <PinMap position={{ lat: previewLat, lng: previewLng }} onPositionChange={updatePinPosition} />
        </MapContainer>
      </div>
      {error ? <p className="field-error" style={{ marginTop: 8 }}>{error}</p> : null}
    </div>
  );
}



