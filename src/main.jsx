import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);

// Offline support: the service worker caches the whole game (code, photos, sounds) on first visit.
// Not in dev, and not in the claude.ai Artifact build, where service workers aren't allowed.
if (import.meta.env.PROD && import.meta.env.VITE_AI !== 'viewer' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // No offline support (e.g. not served over HTTPS); the game still works online.
    });
  });
}
