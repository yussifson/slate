"use client"

import { useTranslation } from "react-i18next";
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm h-full w-full data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
})
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { t } = useTranslation();
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-[9999] grid w-full gap-4 bg-white/95 dark:bg-[#111b21]/95 backdrop-blur-3xl p-5 sm:p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-y-auto overscroll-contain",
          // Mobile (Native Bottom Sheet that slides from bottom)
          "bottom-0 left-0 right-0 rounded-t-[28px] border-t border-black/10 dark:border-white/10 max-h-[92dvh] pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))] shadow-[0_-12px_45px_rgba(0,0,0,0.35)]",
          "data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
          // Desktop (Centered Modal)
          "sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:right-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border sm:border-black/10 sm:dark:border-white/10 sm:max-h-[85vh] sm:pb-6 sm:shadow-2xl sm:shadow-black/20",
          "sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]",
          "sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        {...props}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20 mx-auto -mt-1 mb-1 shrink-0" aria-hidden="true" />
        
        {children}

        {/* Modern Close Button Pill */}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary shrink-0 z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("close", "Close")}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }) => {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left pr-8 sm:pr-0", className)}
      {...props}
    />
  );
}
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 border-t border-border/40 pt-4 mt-2 gap-2 sm:gap-0", className)}
      {...props}
    />
  );
}
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-bold leading-none tracking-[-0.02em] text-foreground", className)}
      {...props}
    />
  );
})
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-xs sm:text-sm text-muted-foreground", className)}
      {...props}
    />
  );
})
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
}
