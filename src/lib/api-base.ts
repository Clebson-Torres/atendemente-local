const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const API = isTauri
  ? "http://localhost:3001/api"
  : `${window.location.origin}/api`;
