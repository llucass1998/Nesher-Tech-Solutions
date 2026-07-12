'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Correção para o ícone padrão do Leaflet não aparecer transparente
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function Map() {
  return (
    <MapContainer 
      center={[-22.9068, -43.1729]} // Coordenadas de Rio de Janeiro
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[-22.9068, -43.1729]} icon={icon}>
        <Popup>Localização da entrega.</Popup>
      </Marker>
    </MapContainer>
  );
}