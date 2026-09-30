import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'music';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  icon?: string;
  subtitle?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  show: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => string;
  dismiss: (id: string) => void;
  success: (message: string, subtitle?: string) => string;
  error: (message: string, subtitle?: string) => string;
  warning: (message: string, subtitle?: string) => string;
  info: (message: string, subtitle?: string) => string;
  music: (message: string, subtitle?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback((message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}): string => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const duration = options.duration ?? 4000;

    const toast: Toast = {
      id,
      message,
      type: options.type ?? 'info',
      duration,
      icon: options.icon,
      subtitle: options.subtitle,
    };

    setToasts(prev => {
      // Max 5 toasts at once, drop oldest
      const next = [...prev, toast];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });

    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    }

    return id;
  }, [dismiss]);

  const success = useCallback((message: string, subtitle?: string) =>
    show(message, { type: 'success', subtitle }), [show]);

  const error = useCallback((message: string, subtitle?: string) =>
    show(message, { type: 'error', subtitle, duration: 5000 }), [show]);

  const warning = useCallback((message: string, subtitle?: string) =>
    show(message, { type: 'warning', subtitle }), [show]);

  const info = useCallback((message: string, subtitle?: string) =>
    show(message, { type: 'info', subtitle }), [show]);

  const music = useCallback((message: string, subtitle?: string) =>
    show(message, { type: 'music', subtitle }), [show]);

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss, success, error, warning, info, music }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
