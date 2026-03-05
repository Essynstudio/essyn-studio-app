import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[#1D1D1F] placeholder:text-[#8E8E93] selection:bg-[#007AFF] selection:text-white border-[#E5E5EA] focus-visible:border-[#007AFF] focus-visible:ring-[#D1D1D6] aria-invalid:ring-[#F2DDD9] aria-invalid:border-[#FF3B30] flex h-9 w-full min-w-0 rounded-xl border px-3 py-1 text-base bg-[#F2F2F7] transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };