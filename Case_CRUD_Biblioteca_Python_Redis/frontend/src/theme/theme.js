import { createTheme } from "@mui/material/styles";

// ── Tokens de cor — exportados para uso nos componentes ──────────────────────
export const C = {
  bgDeep:     "#0E0720",
  bgMid:      "#160B30",
  bgCard:     "rgba(255,255,255,0.04)",

  purple50:   "#EEEDFE",
  purple100:  "#CECBF6",
  purple200:  "#AFA9EC",
  purple400:  "#7F77DD",
  purple600:  "#534AB7",
  purple800:  "#3C3489",
  purple900:  "#26215C",

  accent:      "#A78BFA",
  accentDeep:  "#7C3AED",
  accentBtn:   "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
  accentHover: "linear-gradient(135deg, #6D28D9 0%, #4338CA 100%)",

  border:   "rgba(167,139,250,0.2)",
  borderMd: "rgba(167,139,250,0.4)",

  textPrimary: "#FFFFFF",
  textMuted:   "rgba(255,255,255,0.55)",
  textHint:    "rgba(255,255,255,0.35)",

  // Status
  availableBg:   "rgba(29,158,117,0.15)",
  availableText: "#5DCAA5",
  borrowedBg:    "rgba(167,139,250,0.12)",
  borrowedText:  "#A78BFA",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main:         C.accent,
      dark:         C.accentDeep,
      light:        C.purple200,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main:         C.purple600,
      dark:         C.purple800,
      light:        C.purple400,
      contrastText: "#FFFFFF",
    },
    success: {
      main:         C.availableText,
      dark:         "#1D9E75",
      light:        C.availableBg,
      contrastText: C.bgDeep,
    },
    warning: {
      main:         C.accent,
      dark:         C.accentDeep,
      light:        C.borrowedBg,
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#F87171",
      dark: "#EF4444",
    },
    background: {
      default: C.bgDeep,
      paper:   C.bgMid,
    },
    text: {
      primary:   C.textPrimary,
      secondary: C.textMuted,
      disabled:  C.textHint,
    },
    divider: C.border,
  },

  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: { fontFamily: "'Playfair Display', serif", fontWeight: 900 },
    h2: { fontFamily: "'Playfair Display', serif", fontWeight: 900 },
    h3: { fontFamily: "'Playfair Display', serif", fontWeight: 700 },
    h4: { fontFamily: "'Playfair Display', serif", fontWeight: 700 },
    h5: { fontFamily: "'Playfair Display', serif", fontWeight: 700 },
    h6: { fontFamily: "'Playfair Display', serif", fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: "none" },
  },

  shape: { borderRadius: 12 },

  components: {
    // ── Global ──────────────────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": { boxSizing: "border-box" },
        body: { background: C.bgDeep, color: C.textPrimary },
      },
    },

    // ── AppBar ───────────────────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background:           "rgba(14,7,32,0.75)",
          backdropFilter:       "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom:         `1px solid ${C.border}`,
        },
      },
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, textTransform: "none" },
        containedPrimary: {
          background: C.accentBtn,
          "&:hover":  { background: C.accentHover },
        },
        outlinedPrimary: {
          borderColor: C.border,
          color:       C.accent,
          "&:hover":   { borderColor: C.borderMd, background: "rgba(167,139,250,0.06)" },
        },
      },
    },

    // ── Cards ────────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background:     C.bgCard,
          border:         `1px solid ${C.border}`,
          borderRadius:   16,
          backdropFilter: "blur(8px)",
          transition:     "border-color 0.2s, background 0.2s",
          "&:hover": {
            borderColor: C.borderMd,
            background:  "rgba(167,139,250,0.08)",
          },
        },
      },
    },

    // ── Paper ────────────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          background:      C.bgMid,
          border:          `1px solid ${C.border}`,
        },
      },
    },

    // ── Dialog ───────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          background:   C.bgMid,
          border:       `1px solid ${C.border}`,
          borderRadius: 20,
        },
      },
    },

    // ── Inputs ───────────────────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": { borderColor: C.border },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: C.borderMd },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: C.accent,
            boxShadow:   "0 0 0 4px rgba(124,58,237,0.15)",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: C.textMuted,
          "&.Mui-focused": { color: C.accent },
        },
      },
    },

    // ── Chips ────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root:             { fontWeight: 600 },
        colorSuccess:     { background: C.availableBg,  color: C.availableText, border: "none" },
        colorWarning:     { background: C.borrowedBg,   color: C.borrowedText,  border: "none" },
        outlinedSuccess:  { borderColor: C.availableText, color: C.availableText },
        outlinedWarning:  { borderColor: C.borrowedText,  color: C.borrowedText  },
      },
    },

    // ── Divider ──────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: { root: { borderColor: C.border } },
    },

    // ── Table ────────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            background:    "rgba(167,139,250,0.06)",
            color:         C.textMuted,
            fontWeight:    600,
            fontSize:      12,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: C.border } },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.MuiTableRow-hover:hover": { background: "rgba(167,139,250,0.05)" },
        },
      },
    },

    // ── Tabs ─────────────────────────────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          color: C.textMuted,
          "&.Mui-selected": { color: C.accent },
        },
      },
    },
    MuiTabs: {
      styleOverrides: { indicator: { background: C.accent } },
    },

    // ── Avatar ───────────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: { background: "rgba(167,139,250,0.2)", color: C.accent },
      },
    },

    // ── ListItemButton ───────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-selected": { background: "rgba(167,139,250,0.12)", color: C.accent },
          "&:hover":         { background: "rgba(167,139,250,0.08)" },
        },
      },
    },

    // ── Drawer ───────────────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: { background: C.bgDeep, borderRight: `1px solid ${C.border}` },
      },
    },

    // ── Menu ─────────────────────────────────────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: { background: C.bgMid, border: `1px solid ${C.border}`, borderRadius: 12 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { "&:hover": { background: "rgba(167,139,250,0.08)" } },
      },
    },

    // ── Pagination ───────────────────────────────────────────────────────────
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: C.textMuted,
          "&.Mui-selected": { background: C.accentBtn, color: "#fff" },
        },
      },
    },

    // ── Autocomplete ─────────────────────────────────────────────────────────
    MuiAutocomplete: {
      styleOverrides: {
        paper: { background: C.bgMid, border: `1px solid ${C.border}` },
        option: {
          "&:hover": { background: "rgba(167,139,250,0.08)" },
          "&[aria-selected='true']": { background: "rgba(167,139,250,0.15)" },
        },
      },
    },

    // ── Skeleton ─────────────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: { background: "rgba(167,139,250,0.08)" },
      },
    },
  },
});

export default theme;
