import * as React from "react"

import { cn} from "@/lib/utils"

const Card = React.forwardRef(({ className, ...props}, ref) => (
 <div
 ref={ref}
 className={cn("rounded-lg border border-border/50 bg-card text-card-foreground shadow-elevation-1 hover:shadow-elevation-3 transition-all duration-300 hover:border-primary/20", className)}
 {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props}, ref) => (
 <div
 ref={ref}
 className={cn("flex flex-col space-y-2 p-6", className)}
 {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props}, ref) => (
 <div
 ref={ref}
 className={cn("font-bold text-lg leading-none tracking-tight text-foreground", className)}
 {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props}, ref) => (
 <div
 ref={ref}
 className={cn("text-sm font-medium text-muted-foreground", className)}
 {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props}, ref) => (
 <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props}, ref) => (
 <div
 ref={ref}
 className={cn("flex items-center justify-between p-6 pt-0 border-t border-border/30", className)}
 {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent}
