"use client";
import { useTheme} from "next-themes"
import { Toaster as Sonner} from "sonner"

const Toaster = ({
 ...props
}) => {
 const { theme = "system"} = useTheme()

 return (
 (<Sonner
 theme={theme}
 className="toaster group"
 toastOptions={{
 classNames: {
 toast:
 "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-primary/40 group-[.toaster]:",
 description: "group-[.toast]:text-[#71717a] dark:text-gray-400",
 actionButton:
 "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
 cancelButton:
 "group-[.toast]:bg-muted group-[.toast]:text-[#71717a] dark:text-gray-400",
},
}}
 {...props} />)
 );
}

export { Toaster}
