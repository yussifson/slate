import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Database, HardDrive, ShieldAlert, Sparkles, CheckCircle2, Lock } from 'lucide-react';

export default function JCLSubscriptionLockModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        data-jcl-lock-modal="true"
        className="w-[92vw] max-w-[560px] max-h-[90vh] overflow-y-auto p-0 border border-[#005A9C]/40 bg-[#0A2540] text-white shadow-2xl rounded-2xl"
      >
        {/* Glow header banner with JCL Navy & Orange Accent */}
        <div className="relative p-5 sm:p-6 pb-4 bg-gradient-to-br from-[#005A9C]/30 via-[#FF6B00]/10 to-transparent border-b border-white/10">
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FF6B00]/20 text-[#FF8533] border border-[#FF6B00]/40">
              <Lock className="w-3.5 h-3.5" /> Workspace Restricted
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#E05E00] flex items-center justify-center shadow-lg shadow-[#FF6B00]/30 text-white shrink-0">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
                Database &amp; Cloud Storage Required
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 font-medium mt-1">
                Active dedicated infrastructure quota needed to perform this action.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 space-y-4 text-sm">
          <p className="text-slate-200 text-xs sm:text-[13px] leading-relaxed">
            Your JCL Office workspace is in <strong className="text-white font-bold">Read-Only Mode</strong>. To create, edit, save changes, or upload project attachments across all departments, an active Database &amp; Storage quota subscription must be activated.
          </p>

          {/* Infrastructure Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 hover:border-[#FF6B00]/40 transition-all">
              <div className="flex items-center gap-2 mb-1 text-[#FF8533] font-bold text-xs">
                <Database className="w-4 h-4 shrink-0" />
                <span>Dedicated DB Cluster</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Encrypted PostgreSQL transaction pool with high-availability syncing for real estate operations.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.05] border border-white/10 hover:border-[#FF6B00]/40 transition-all">
              <div className="flex items-center gap-2 mb-1 text-[#FF8533] font-bold text-xs">
                <HardDrive className="w-4 h-4 shrink-0" />
                <span>Cloud Asset Storage</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                High-capacity cloud bucket for architectural CAD drawings, BOQ spreadsheets, and tenant leases.
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="p-3.5 rounded-xl bg-[#005A9C]/20 border border-[#005A9C]/40 space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#FF8533] shrink-0" />
              <span>Full read access to existing records remains active</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-white font-medium">
              <ShieldAlert className="w-4 h-4 text-[#FF8533] shrink-0" />
              <span>Create, edit, and delete actions locked until subscribed</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-black/20 border-t border-white/10 flex flex-col sm:flex-row gap-2.5 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-xs text-slate-300 hover:text-white hover:bg-white/10"
          >
            Close &amp; Continue Browsing
          </Button>

          <Button
            onClick={() => {
              window.open('mailto:support@optavel.com?subject=JCL%20Database%20%26%20Storage%20Subscription%20Activation', '_blank');
            }}
            className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold text-xs shadow-lg shadow-[#FF6B00]/25"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Contact Administrator to Subscribe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
