"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Typography, Box } from "@mui/material";

// Fix leaflet default marker icon path issue in webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type EmpMarker = {
  id: number;
  full_name: string;
  nip: string;
  latitude: number;
  longitude: number;
  position_name: string;
  department_name: string;
};

type Props = { markers: EmpMarker[] };

export default function LeafletMap({ markers }: Props) {
  useEffect(() => {
    L.Marker.prototype.options.icon = defaultIcon;
  }, []);

  const center: [number, number] = markers.length > 0
    ? [
        markers.reduce((sum, m) => sum + Number(m.latitude), 0) / markers.length,
        markers.reduce((sum, m) => sum + Number(m.longitude), 0) / markers.length,
      ]
    : [-6.2, 106.8]; // Jakarta fallback

  return (
    <Box sx={{ height: 400, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Marker key={m.id} position={[Number(m.latitude), Number(m.longitude)]} icon={defaultIcon}>
            <Popup>
              <Typography variant="body2" fontWeight={600}>{m.full_name}</Typography>
              <Typography variant="caption" display="block">{m.nip}</Typography>
              <Typography variant="caption" display="block">{m.position_name} — {m.department_name}</Typography>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
