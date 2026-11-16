import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Database, HardDrive, ShieldAlert, Sparkles, CheckCircle2, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function JCLSubscriptionLockModal({ isOpen, onClose }) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Fullscreen Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal Window: Explicitly Centered, Zero Horizontal/Vertical Scrollbars */}
        <DialogPrimitive.Content
          data-jcl-lock-modal="true"
          className={cn(
            "fixed z-[99999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[90vw] max-w-[480px] p-0 overflow-hidden",
            "bg-[#0A2540] text-white border border-[#005A9C]/50 rounded-2xl shadow-2xl",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          {/* Header Banner */}
          <div className="relative p-5 pb-3.5 bg-gradient-to-br from-[#005A9C]/35 via-[#FF6B00]/10 to-transparent border-b border-white/10">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6B00]/20 text-[#FF8533] border border-[#FF6B00]/40">
                <Lock className="w-3 h-3" /> Workspace Restricted
              </span>

              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#E05E00] flex items-center justify-center shadow-lg shadow-[#FF6B00]/30 text-white shrink-0">
                <Database className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 pr-2">
                <DialogPrimitive.Title className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Database &amp; Cloud Storage Required
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-[11px] text-white/75 font-medium mt-0.5 truncate">
                  Dedicated infrastructure subscription needed to modify records.
                </DialogPrimitive.Description>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-3 text-xs">
            <p className="text-slate-200 text-xs leading-relaxed">
              Your JCL Office workspace is in <strong className="text-white font-bold">Read-Only Mode</strong>. To create, edit, save changes, or upload project attachments across all departments, an active Database &amp; Storage quota subscription must be activated.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-1.5 mb-1 text-[#FF8533] font-bold text-[11px]">
                  <Database className="w-3.5 h-3.5 shrink-0" />
                  <span>Dedicated DB Cluster</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-normal">
                  Encrypted PostgreSQL transaction pool with high-availability syncing.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-1.5 mb-1 text-[#FF8533] font-bold text-[11px]">
                  <HardDrive className="w-3.5 h-3.5 shrink-0" />
                  <span>Cloud Asset Storage</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-normal">
                  Cloud storage bucket for CAD drawings, BOQ spreadsheets, and leases.
                </p>
              </div>
            </div>

            {/* Checklist Box */}
            <div className="p-2.5 rounded-xl bg-[#005A9C]/20 border border-[#005A9C]/35 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-white">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF8533] shrink-0" />
                <span>Full read access to all existing records remains active</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white">
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF8533] shrink-0" />
                <span>Create, edit, and delete actions locked until subscribed</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-black/25 border-t border-white/10 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-xs h-8 px-3 text-slate-300 hover:text-white hover:bg-white/10"
            >
              Continue Browsing
            </Button>

            <Button
              onClick={() => {
                window.open('mailto:support@optavel.com?subject=JCL%20Database%20%26%20Storage%20Subscription%20Activation', '_blank');
              }}
              className="bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs h-8 px-3.5 shadow-md shadow-[#FF6B00]/25"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Subscribe Now
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
