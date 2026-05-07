"use client";

import { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert, Card, CardContent, Chip } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import dynamic from "next/dynamic";

export type EmpMarker = {
  id: number;
  full_name: string;
  nip: string;
  latitude: number;
  longitude: number;
  position_name: string;
  department_name: string;
  distance_km?: number;
};

type MapData = {
  data: EmpMarker[];
  nearest: EmpMarker | null;
};

const MapWithNoSSR = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
      <CircularProgress />
    </Box>
  ),
});

export default function EmployeeMap({ showNearest = false }: { showNearest?: boolean }) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/employees/map")
      .then((r) => r.ok ? r.json() : Promise.reject("Gagal"))
      .then((d) => setMapData(d))
      .catch(() => setError("Gagal memuat data peta"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const markers = mapData?.data ?? [];

  if (markers.length === 0) {
    return (
      <Alert severity="info">
        Belum ada pegawai dengan data koordinat domisili. Tambahkan koordinat pada form edit pegawai.
      </Alert>
    );
  }

  const nearest = mapData?.nearest;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        {markers.length} pegawai aktif dengan data lokasi
      </Typography>

      {showNearest && nearest && (
        <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, mb: 2, bgcolor: "primary.50" }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOnIcon color="primary" fontSize="small" />
              <Typography variant="caption" color="text.secondary">Pegawai terdekat ke kantor</Typography>
            </Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 0.5 }}>
              {nearest.full_name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              <Chip label={nearest.position_name ?? "-"} size="small" />
              <Chip label={`${nearest.distance_km} km`} size="small" color="primary" />
            </Box>
          </CardContent>
        </Card>
      )}

      <MapWithNoSSR markers={markers} />
    </Box>
  );
}
