import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// Global function to show toasts from outside React (e.g., axios interceptors)
let globalShowToast: ((message: string, type?: 'error' | 'info', details?: string) => void) | null = null;

export function showDevToast(message: string, type: 'error' | 'info' = 'error', details?: string) {
  if (globalShowToast) {
    globalShowToast(message, type, details);
  } else if (import.meta.env.DEV) {
    // Fallback to console if provider not mounted yet
    console.error('[DevToast]', message, details);
  }
}

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'info';
  details?: string;
}

interface DevToastContextType {
  showToast: (message: string, type?: 'error' | 'info', details?: string) => void;
}

const DevToastContext = createContext<DevToastContextType | null>(null);

export function useDevToast() {
  const context = useContext(DevToastContext);
  if (!context) {
    // Return a no-op function if not in dev mode or outside provider
    return { showToast: () => {} };
  }
  return context;
}

interface DevToastProviderProps {
  children: ReactNode;
}

export function DevToastProvider({ children }: DevToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Only enable in development mode
  const isDev = import.meta.env.DEV;

  const nextIdRef = useRef(0);

  const showToast = useCallback((message: string, type: 'error' | 'info' = 'error', details?: string) => {
    if (!isDev) return;

    const id = nextIdRef.current++;
    setToasts(prev => [...prev, { id, message, type, details }]);

    // Auto-dismiss after 8 seconds (longer for errors to allow reading)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  }, [isDev]);

  // Register global function for use outside React
  useEffect(() => {
    if (isDev) {
      globalShowToast = showToast;
      return () => {
        globalShowToast = null;
      };
    }
  }, [isDev, showToast]);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (!isDev) {
    return <>{children}</>;
  }

  return (
    <DevToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container - fixed at bottom */}
      <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={clsx(
                "pointer-events-auto p-3 rounded-lg shadow-lg max-w-full",
                "border text-sm font-mono",
                toast.type === 'error'
                  ? "bg-red-900/95 border-red-500 text-red-100"
                  : "bg-blue-900/95 border-blue-500 text-blue-100"
              )}
              onClick={() => dismissToast(toast.id)}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {toast.type === 'error' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs uppercase tracking-wide mb-1 opacity-70">
                    {toast.type === 'error' ? 'API Error' : 'Dev Info'}
                  </div>
                  <div className="break-words">{toast.message}</div>
                  {toast.details && (
                    <div className="mt-2 text-xs opacity-80 break-words whitespace-pre-wrap">
                      {toast.details}
                    </div>
                  )}
                  <div className="text-xs opacity-50 mt-2">Tap to dismiss</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dev mode indicator */}
      <div className="fixed top-2 right-2 z-[100] px-2 py-1 bg-amber-500/90 text-black text-xs font-bold rounded">
        DEV
      </div>
    </DevToastContext.Provider>
  );
}
