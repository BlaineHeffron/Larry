"use client";
import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/80 dark:text-green-200",
  error:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/80 dark:text-red-200",
  warning:
    "border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/80 dark:text-yellow-200",
  info: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/80 dark:text-blue-200",
};

const ICONS: Record<ToastVariant, string> = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26A0",
  info: "\u2139",
};

const DURATION = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DURATION);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="alert"
              className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm shadow-lg animate-toast-in ${VARIANT_STYLES[t.variant]}`}
            >
              <span className="text-base leading-none">{ICONS[t.variant]}</span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
