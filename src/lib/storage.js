import { useEffect, useState } from 'react';

const PREFIX = 'twenty-dollar:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    if (value === undefined) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the game still works, it just won't remember.
  }
}

// `prepare` adjusts a saved value when it's loaded (e.g. to fill in new settings).
export function usePersistent(key, fallback, prepare) {
  const [value, setValue] = useState(() => {
    const saved = load(key, fallback);
    return prepare ? prepare(saved) : saved;
  });
  useEffect(() => save(key, value), [key, value]);
  return [value, setValue];
}
