import { forwardRef, useId } from "react";
import { cn } from "../../lib/utils";
import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    return (
      <div>
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-800 mb-1">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-2xl border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
