"use client";

import dynamic from "next/dynamic";
import { Box, Typography } from "@mui/material";
import AppShell from "@/components/AppShell";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function DocsPage() {
  return (
    <AppShell>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        API Documentation
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0, "& .swagger-ui": { fontSize: 13 } }}>
        <SwaggerUI url="/api/docs" />
      </Box>
    </AppShell>
  );
}
