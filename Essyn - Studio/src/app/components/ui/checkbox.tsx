"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border bg-[#F2F2F7] data-[state=checked]:bg-[#007AFF] data-[state=checked]:text-white data-[state=checked]:border-[#007AFF] focus-visible:border-[#007AFF] focus-visible:ring-[#D1D1D6] aria-invalid:ring-[#F2DDD9] aria-invalid:border-[#FF3B30] size-4 shrink-0 rounded-[4px] border-[#E5E5EA] shadow-[0_1px_2px_#E5E5EA] transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };