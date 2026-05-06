"use client";

import { createTheme } from "@mui/material/styles";

// Tema mengacu DESIGN.md (Apple-inspired): premium white space, SF Pro,
// monochrome luxury. Diterjemahkan ke MUI tokens (no Tailwind).
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0071e3", contrastText: "#ffffff" }, // Apple blue
    secondary: { main: "#1d1d1f" },
    background: { default: "#ffffff", paper: "#fbfbfd" },
    text: { primary: "#1d1d1f", secondary: "#6e6e73" },
    divider: "rgba(0,0,0,0.08)",
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"SF Pro Display"',
      '"SF Pro Text"',
      '"Helvetica Neue"',
      "Inter",
      "system-ui",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 600, letterSpacing: "-0.02em" },
    h2: { fontWeight: 600, letterSpacing: "-0.015em" },
    h3: { fontWeight: 600, letterSpacing: "-0.01em" },
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 980, paddingInline: 22, paddingBlock: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { boxShadow: "0 1px 2px rgba(0,0,0,0.04)" } },
    },
  },
});
