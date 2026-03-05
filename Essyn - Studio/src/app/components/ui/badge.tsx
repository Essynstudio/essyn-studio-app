import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-[#007AFF] focus-visible:ring-[#D1D1D6] focus-visible:ring-[3px] aria-invalid:ring-[#F2DDD9] aria-invalid:border-[#FF3B30] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1D1D1F] text-[#F5F5F7] [a&]:hover:bg-[#48484A]",
        secondary:
          "border-transparent bg-[#F2F2F7] text-[#1D1D1F] [a&]:hover:bg-[#E5E5EA]",
        destructive:
          "border-transparent bg-[#FF3B30] text-white [a&]:hover:bg-[#D70015] focus-visible:ring-[#F2DDD9]",
        outline:
          "text-[#1D1D1F] border-[#E5E5EA] [a&]:hover:bg-[#F2F2F7]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };