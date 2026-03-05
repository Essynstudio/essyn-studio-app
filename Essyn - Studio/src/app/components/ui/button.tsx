import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[#007AFF] focus-visible:ring-[#D1D1D6] focus-visible:ring-[3px] aria-invalid:ring-[#F2DDD9] aria-invalid:border-[#FF3B30]",
  {
    variants: {
      variant: {
        default: "bg-[#1D1D1F] text-[#F5F5F7] hover:bg-[#48484A]",
        destructive:
          "bg-[#FF3B30] text-white hover:bg-[#D70015] focus-visible:ring-[#F2DDD9]",
        outline:
          "border border-[#E5E5EA] bg-white text-[#1D1D1F] hover:bg-[#F2F2F7]",
        secondary:
          "bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]",
        ghost:
          "hover:bg-[#F2F2F7] hover:text-[#1D1D1F]",
        link: "text-[#1D1D1F] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };