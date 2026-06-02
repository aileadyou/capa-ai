import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "motion-hover inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-[background-color,border-color,color,filter,transform] focus:outline-none focus:ring-0 focus:ring-offset-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.99]",
        secondary:
          "border-[var(--line-2)] bg-secondary text-secondary-foreground hover:border-[var(--line-3)] hover:brightness-110 active:scale-[0.99]",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:brightness-110 active:scale-[0.99]",
        outline: "border-[var(--line-2)] text-foreground hover:border-[var(--line-3)] hover:bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
