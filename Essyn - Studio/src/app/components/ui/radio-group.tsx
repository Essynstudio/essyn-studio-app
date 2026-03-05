"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";

import { cn } from "./utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-[#E5E5EA] text-[#007AFF] focus-visible:border-[#007AFF] focus-visible:ring-[#D1D1D6] aria-invalid:ring-[#F2DDD9] aria-invalid:border-[#FF3B30] aspect-square size-4 shrink-0 rounded-full border shadow-[0_1px_2px_#E5E5EA] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };