"use client";

import { createTheme } from "@mui/material";

export const theme = createTheme({
  typography: {
    fontFamily: "var(--font-roboto)",
  },
  palette: {
    mode: "dark",
    text: {
      // make it slightly darker that white to make it more readable
      primary: "#cdcdcd",
    },
  },
});
