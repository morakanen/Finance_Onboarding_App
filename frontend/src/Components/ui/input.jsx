import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-zinc-800/50 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium text-white placeholder:text-zinc-400 caret-orange-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-medium",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
