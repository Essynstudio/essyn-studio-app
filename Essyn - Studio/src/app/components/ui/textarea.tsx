import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-[#E5E5EA] placeholder:text-[#8E8E93] focus-visible:border-[#007AFF] focus-visible:ring-[#D1D1D6] aria-invalid:ring-[#F2DDD9] aria-invalid:border-[#FF3B30] flex field-sizing-content min-h-16 w-full rounded-xl border bg-[#F2F2F7] px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };