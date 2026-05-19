import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0071e3",
      light: "#2997ff",
      dark: "#0051a2",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1d1d1f",
      light: "#3d3d3f",
      dark: "#000000",
      contrastText: "#ffffff",
    },
    background: {
      default: "#fbfbfd",
      paper: "#ffffff",
    },
    text: {
      primary: "#1d1d1f",
      secondary: "#6e6e73",
    },
    success: { main: "#34c759" },
    warning: { main: "#ff9f0a" },
    error:   { main: "#ff3b30" },
    divider: "rgba(0,0,0,0.08)",
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5, color: "#6e6e73" },
    button: { textTransform: "none", fontWeight: 500 },
  },

  shape: { borderRadius: 12 },

  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)",
    "0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.05)",
    "0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.04)",
    "0 25px 50px rgba(0,0,0,0.10)",
    ...Array(19).fill("none"),
  ],

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: "8px 20px",
          fontWeight: 500,
          transition: "all 0.2s ease",
          "&:hover": { transform: "translateY(-1px)" },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #0071e3 0%, #2997ff 100%)",
          boxShadow: "0 4px 15px rgba(0,113,227,0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #0051a2 0%, #0071e3 100%)",
            boxShadow: "0 6px 20px rgba(0,113,227,0.4)",
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": { borderWidth: 1.5 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.05)",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#0071e3",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "none",
          color: "#1d1d1f",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: "#1d1d1f", background: "#f5f5f7" },
      },
    },
  },
});

export default theme;
