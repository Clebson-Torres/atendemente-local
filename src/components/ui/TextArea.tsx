import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, className, ...props }, ref) => {
    return (
      <div>
        {label && <label className="block text-sm font-medium text-slate-800 mb-1">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "flex min-h-[120px] w-full rounded-3xl border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
export default TextArea;
