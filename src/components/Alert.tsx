interface AlertProps {
  variant?: "error" | "success" | "warning";
  children: React.ReactNode;
  className?: string;
  onRetry?: () => void;
}

const VARIANT_STYLES = {
  error: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
  success: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
};

const RETRY_STYLES = {
  error: "text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-900/40",
  success: "text-green-800 hover:bg-green-100 dark:text-green-200 dark:hover:bg-green-900/40",
  warning: "text-yellow-800 hover:bg-yellow-100 dark:text-yellow-200 dark:hover:bg-yellow-900/40",
};

export default function Alert({ variant = "error", children, className, onRetry }: AlertProps) {
  return (
    <div className={`rounded-md border p-4 text-sm ${VARIANT_STYLES[variant]} ${className ?? ""}`}>
      <div className={onRetry ? "flex items-center justify-between gap-3" : ""}>
        <span>{children}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors ${RETRY_STYLES[variant]}`}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
