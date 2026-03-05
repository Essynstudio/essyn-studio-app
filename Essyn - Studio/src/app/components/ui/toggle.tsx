"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium hover:bg-[#F2F2F7] hover:text-[#636366] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[#F2F2F7] data-[state=on]:text-[#1D1D1F] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-[#007AFF] focus-visible:ring-[#D1D1D6] focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-[#F2DDD9] aria-invalid:border-[#FF3B30] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };