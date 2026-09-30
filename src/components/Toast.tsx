import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bg = 'bg-white border-slate-200 text-slate-800 shadow-sm';
          let icon = <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;

          if (toast.type === 'success') {
            bg = 'bg-[#EAF8F0] border-emerald-300 text-emerald-950 shadow-sm';
            icon = <CheckCircle2 className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm';
            icon = <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-50 border-rose-300 text-rose-950 shadow-sm';
            icon = <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border text-xs font-medium leading-snug transition-all ${bg}`}
            >
              {icon}
              <div className="flex-1">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
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
