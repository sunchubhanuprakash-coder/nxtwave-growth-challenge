import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertOctagon, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  addToast: (title: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: 'error', title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: 'info', title, message }), [toast]);
  const addToast = useCallback((title: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    toast({ type, title });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, addToast }}>
      {children}
      {/* Toast Floating Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const Icon = isSuccess
            ? CheckCircle2
            : isError
            ? AlertOctagon
            : isWarning
            ? AlertTriangle
            : Info;

          const borderClass = isSuccess
            ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200'
            : isError
            ? 'border-red-500/40 bg-red-950/90 text-red-200'
            : isWarning
            ? 'border-amber-500/40 bg-amber-950/90 text-amber-200'
            : 'border-cyan-500/40 bg-slate-900/90 text-cyan-200';

          const iconColor = isSuccess
            ? 'text-emerald-400'
            : isError
            ? 'text-red-400'
            : isWarning
            ? 'text-amber-400'
            : 'text-cyan-400';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start space-x-3 animate-fadeIn transition-all duration-200 ${borderClass}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 pr-2">
                <h4 className="text-xs font-bold text-white tracking-tight">{t.title}</h4>
                {t.message && <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition p-1"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
