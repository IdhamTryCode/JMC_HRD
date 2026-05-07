import { createTheme } from "@mui/material/styles";
import { D } from "./design-tokens";

export { D } from "./design-tokens";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: D.primary, dark: D.primaryFocus, contrastText: D.onPrimary },
    secondary: { main: D.ink, contrastText: D.onDark },
    background: { default: D.canvasParchment, paper: D.canvas },
    text: { primary: D.ink, secondary: D.inkMuted48 },
    divider: D.hairline,
    success: { main: "#1a8a1a", contrastText: "#fff" },
    warning: { main: "#b45309", contrastText: "#fff" },
    error: { main: "#c0392b", contrastText: "#fff" },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"SF Pro Display"',
      '"SF Pro Text"',
      "Inter",
      "system-ui",
      "sans-serif",
    ].join(","),
    fontSize: 15,
    // display-lg
    h1: { fontSize: 40, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.01em" },
    // display-md
    h2: { fontSize: 34, fontWeight: 600, lineHeight: 1.47, letterSpacing: "-0.011em" },
    // tagline
    h3: { fontSize: 21, fontWeight: 600, lineHeight: 1.19, letterSpacing: "0.007em" },
    h4: { fontSize: 17, fontWeight: 600, lineHeight: 1.24, letterSpacing: "-0.011em" },
    h5: { fontSize: 17, fontWeight: 600, lineHeight: 1.24, letterSpacing: "-0.011em" },
    h6: { fontSize: 15, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.009em" },
    // body — 17px sesuai spec, pakai 15 untuk UI density
    body1: { fontSize: 15, fontWeight: 400, lineHeight: 1.47, letterSpacing: "-0.011em" },
    body2: { fontSize: 13, fontWeight: 400, lineHeight: 1.43, letterSpacing: "-0.007em" },
    caption: { fontSize: 12, fontWeight: 400, lineHeight: 1.33, letterSpacing: "-0.004em" },
    button: { textTransform: "none", fontWeight: 400, fontSize: 15, letterSpacing: 0 },
    overline: { textTransform: "uppercase", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" },
  },
  shape: { borderRadius: 11 }, // rounded.md default
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: D.canvasParchment, color: D.ink },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // pill
          paddingInline: 20,
          paddingBlock: 9,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
          "&:active": { transform: "scale(0.97)", boxShadow: "none" },
        },
        contained: {
          backgroundColor: D.primary,
          color: D.onPrimary,
          "&:hover": { backgroundColor: D.primaryFocus },
        },
        outlined: {
          borderColor: D.primary,
          color: D.primary,
          "&:hover": { backgroundColor: "rgba(0,102,204,0.04)", borderColor: D.primaryFocus },
        },
        sizeSmall: { paddingInline: 14, paddingBlock: 6, fontSize: 13 },
        sizeLarge: { paddingInline: 28, paddingBlock: 13, fontSize: 17, fontWeight: 300 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 9999, "&:active": { transform: "scale(0.93)" } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18, // rounded.lg
          border: `1px solid ${D.hairline}`,
          boxShadow: "none",
          backgroundColor: D.canvas,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: "none", backgroundImage: "none" },
        elevation1: { boxShadow: "none", border: `1px solid ${D.hairline}` },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 9999,
            backgroundColor: D.canvas,
            "& fieldset": { borderColor: D.hairline },
            "&:hover fieldset": { borderColor: D.inkMuted48 },
            "&.Mui-focused fieldset": { borderColor: D.primary, borderWidth: 1 },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 11,
          backgroundColor: D.canvas,
          "& fieldset": { borderColor: D.hairline },
          "&:hover fieldset": { borderColor: D.inkMuted48 },
          "&.Mui-focused fieldset": { borderColor: D.primary, borderWidth: 1 },
        },
        notchedOutline: { borderColor: D.hairline },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 11 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9999, fontWeight: 500, fontSize: 12 },
        colorSuccess: { backgroundColor: "#e6f4ea", color: "#1a6b1a" },
        colorWarning: { backgroundColor: "#fff3e0", color: "#b45309" },
        colorError: { backgroundColor: "#fde8e8", color: "#b91c1c" },
        colorPrimary: { backgroundColor: "#e8f0fc", color: D.primary },
        colorSecondary: { backgroundColor: "#f0f0f5", color: D.inkMuted80 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 11, fontSize: 13 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: D.ink, backgroundColor: D.canvasParchment, fontSize: 12 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 400,
          fontSize: 14,
          letterSpacing: "-0.007em",
          minHeight: 40,
          "&.Mui-selected": { fontWeight: 600, color: D.primary },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: D.primary, height: 2 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          "&.Mui-selected": {
            backgroundColor: "rgba(0,102,204,0.08)",
            color: D.primary,
            "&:hover": { backgroundColor: "rgba(0,102,204,0.12)" },
          },
          "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontSize: 13,
          fontWeight: 400,
          borderRadius: "9999px !important",
          border: `1px solid ${D.hairline}`,
          paddingInline: 14,
          paddingBlock: 5,
          color: D.inkMuted48,
          "&.Mui-selected": {
            backgroundColor: D.ink,
            color: D.onDark,
            borderColor: D.ink,
            "&:hover": { backgroundColor: D.inkMuted80 },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { gap: 4, "& .MuiToggleButtonGroup-grouped": { borderRadius: "9999px !important", border: `1px solid ${D.hairline} !important` } },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: D.hairline } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 7, fontSize: 12, backgroundColor: D.ink },
      },
    },
  },
});
