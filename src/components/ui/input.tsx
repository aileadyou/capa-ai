import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "motion-hover flex h-10 w-full rounded-md border border-[var(--line-2)] bg-[var(--field-bg)] px-3 py-2 text-base text-[var(--fg-1)] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--fg-1)] placeholder:text-[var(--fg-3)] hover:bg-[var(--field-bg-hover)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
