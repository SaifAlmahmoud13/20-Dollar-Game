import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './fonts.css';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);

// Offline support: the service worker stores the whole game (code, photos, sounds) on the
// phone. Not in dev, and not in the claude.ai Artifact build, where service workers aren't allowed.
if (import.meta.env.PROD && import.meta.env.VITE_AI !== 'viewer' && 'serviceWorker' in navigator) {
  // When a new version takes over, reload once so the player sees it (a game in progress is
  // saved and comes back after the reload).
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        // An installed app can sit in the background for days: check for updates whenever it comes back.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update().catch(() => {});
        });
      })
      .catch(() => {
        // No offline support (e.g. not served over HTTPS); the game still works online.
      });
  });
}
