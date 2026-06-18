import * as React from "react"
import { Slot} from "@radix-ui/react-slot"
import { cva} from "class-variance-authority";

import { cn} from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-250 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:bg-muted/30 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
 {
 variants: {
 variant: {
 default:
 "bg-primary text-primary-foreground shadow-elevation-2 hover:shadow-elevation-4 hover:bg-primary/90 hover:-translate-y-0.5",
 destructive:
 "bg-destructive text-destructive-foreground shadow-elevation-2 hover:shadow-elevation-4 hover:bg-destructive/90 hover:-translate-y-0.5",
 outline:
 "border border-border/50 bg-card text-foreground hover:bg-muted/50 hover:border-primary/30 hover:shadow-elevation-1 transition-all",
 secondary:
 "bg-secondary text-secondary-foreground shadow-elevation-1 hover:shadow-elevation-3 hover:bg-secondary/90 hover:-translate-y-0.5",
 ghost: "hover:bg-muted/50 text-foreground transition-all duration-200",
 link: "text-primary underline-offset-4 hover:underline font-semibold",
},
 size: {
 default: "h-10 px-5 py-2.5 text-sm",
 sm: "h-9 rounded-md px-3 text-xs",
 lg: "h-12 rounded-lg px-8 text-base",
 icon: "h-10 w-10",
},
},
 defaultVariants: {
 variant: "default",
 size: "default",
},
}
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props}, ref) => {
 const Comp = asChild ? Slot : "button"
 return (
 (<Comp
 className={cn(buttonVariants({ variant, size, className}))}
 ref={ref}
 {...props} />)
 );
})
Button.displayName = "Button"

export { Button, buttonVariants}
