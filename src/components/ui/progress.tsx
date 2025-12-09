import { forwardRef } from "react";

interface ProgressProps {
  value?: number;
  className?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";
