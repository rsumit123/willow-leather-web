import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'willow-leather-coach-marks';

// Simple external store so all components react to dismissals
let listeners: (() => void)[] = [];
function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}
function getSnapshot(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}
function notify() { listeners.forEach(l => l()); }

export function useCoachMarks() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot);

  const isVisible = useCallback((id: string) => !dismissed[id], [dismissed]);

  const dismiss = useCallback((id: string) => {
    const current = getSnapshot();
    current[id] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    notify();
  }, []);

  return { isVisible, dismiss };
}
