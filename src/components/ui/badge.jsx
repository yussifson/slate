import * as React from "react"
import { cva} from "class-variance-authority";

import { cn} from "@/lib/utils"

const badgeVariants = cva(
 "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
 {
 variants: {
 variant: {
 default:
 "border-transparent bg-primary text-primary-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-primary/90",
 secondary:
 "border-transparent bg-secondary text-secondary-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-secondary/90",
 destructive:
 "border-transparent bg-destructive text-destructive-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:bg-destructive/90",
 outline: "border-border/50 bg-muted/30 text-foreground hover:bg-muted/50 hover:border-primary/30",
},
},
 defaultVariants: {
 variant: "default",
},
}
)

function Badge({
 className,
 variant,
 ...props
}) {
 return (<div className={cn(badgeVariants({ variant}), className)} {...props} />);
}

export { Badge, badgeVariants}
