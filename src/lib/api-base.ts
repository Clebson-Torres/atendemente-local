export const API = (() => {
  const origin = window.location.origin;

  // Tauri v2 webview: tauri://localhost
  if (origin.startsWith("tauri://") || origin.startsWith("https://tauri.")) {
    return "http://localhost:3001/api";
  }

  // Vite dev server (tauri dev)
  if (window.location.port === "1420") {
    return "http://localhost:3001/api";
  }

  // Servido pelo backend (mesma origem — acesso mobile)
  return `${origin}/api`;
})();
