import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  id,
  label,
  error,
  helperText,
  className = "",
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={id}
        disabled={disabled}
        className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 disabled:bg-zinc-100 disabled:cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-100 ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-zinc-300 focus:ring-blue-500 dark:border-zinc-700"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}

