import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'willow-leather-coach-marks';

// Simple external store so all components react to dismissals
let listeners: (() => void)[] = [];
function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

// Cache the snapshot to maintain referential stability (required by useSyncExternalStore)
let cachedRaw = '';
let cachedSnapshot: Record<string, boolean> = {};

function getSnapshot(): Record<string, boolean> {
  const raw = localStorage.getItem(STORAGE_KEY) || '{}';
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSnapshot = JSON.parse(raw);
    } catch {
      cachedSnapshot = {};
    }
  }
  return cachedSnapshot;
}

function notify() { listeners.forEach(l => l()); }

export function useCoachMarks() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot);

  const isVisible = useCallback((id: string) => !dismissed[id], [dismissed]);

  const dismiss = useCallback((id: string) => {
    const current = { ...getSnapshot(), [id]: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    // Reset cache so next getSnapshot picks up the change
    cachedRaw = '';
    notify();
  }, []);

  return { isVisible, dismiss };
}
