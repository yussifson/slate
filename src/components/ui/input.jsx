import * as React from "react"

import { cn} from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props}, ref) => {
 return (
 (<input
 type={type}
 className={cn(
 "flex h-11 w-full rounded-lg border border-border/50 bg-card px-4 py-2.5 text-sm font-medium transition-all duration-250 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 hover:border-primary/30 hover:shadow-elevation-1 focus-visible:outline-none focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary focus-visible:shadow-elevation-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
 className
 )}
 ref={ref}
 {...props} />)
 );
})
Input.displayName = "Input"

export { Input}
