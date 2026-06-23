import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  colorSchemes: {
    light: true,
  },
  palette: {
    primary: {
      main: "#2d6a4f",
    },
    secondary: {
      main: "#c0392b",
    },
    background: {
      default: "#f5f0e8",
      paper: "#ffffff",
    },
    text: {
      primary: "#17201f",
      secondary: "#5c6866",
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: "'Noto Sans KR', Arial, Helvetica, sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: 0,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: "#fffef5",
        },
      },
    },
  },
});
