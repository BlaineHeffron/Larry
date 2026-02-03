interface AlertProps {
  variant?: "error" | "success" | "warning";
  children: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES = {
  error: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
  success: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
};

export default function Alert({ variant = "error", children, className }: AlertProps) {
  return (
    <div className={`rounded-md border p-4 text-sm ${VARIANT_STYLES[variant]} ${className ?? ""}`}>
      {children}
    </div>
  );
}
