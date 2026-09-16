import { useState } from "react";

// Shared by every 3D scene in the Genius Profile (Hologram, Your Universe,
// and whatever gets added later) so switching it in one place matches
// everywhere else -- a real per-viewer preference, not per-feature.
const STORAGE_KEY = "edin-3d-theme";

export function useHologramTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "white" ? "white" : "black";
    } catch {
      return "black";
    }
  });

  const setAndStore = (next) => {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / blocked storage -- the toggle still works for
      // this session, it just won't remember next visit.
    }
  };

  return [theme, setAndStore];
}

export const HOLOGRAM_PALETTES = {
  black: {
    background: "#0B0F14",
    starOpacity: 1,
    labelColor: "#EAF2ED",
    labelOutline: "#0B0F14",
    gridOpacity: 0,
  },
  white: {
    background: "#F4F6F4",
    starOpacity: 0,
    labelColor: "#1C2E24",
    labelOutline: "#F4F6F4",
    gridOpacity: 0.35,
  },
};
