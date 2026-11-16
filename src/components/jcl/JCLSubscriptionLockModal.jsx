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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border border-amber-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl rounded-2xl">
        {/* Glow header banner */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-amber-500/20 via-primary/10 to-transparent border-b border-white/10">
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Lock className="w-3 h-3" /> Account Restricted
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950">
              <Database className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight text-white">
                Database & Cloud Storage Required
              </DialogTitle>
              <DialogDescription className="text-xs text-amber-200/80 font-medium mt-0.5">
                Active dedicated infrastructure subscription needed to modify records.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4 text-sm">
          <p className="text-slate-300 text-xs leading-relaxed">
            Your JCL Office workspace is currently in <strong className="text-white">Read-Only Mode</strong>. To create, edit, save changes, or upload project attachments across all departments, an active Database & Storage quota subscription must be activated.
          </p>

          {/* Infrastructure Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold text-xs">
                <Database className="w-4 h-4" />
                <span>Dedicated DB Cluster</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Encrypted PostgreSQL transaction pool with high-availability syncing for real estate operations.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>Cloud Asset Storage</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                High-capacity cloud bucket for architectural CAD drawings, BOQ spreadsheets, and tenant leases.
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="p-3.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-100 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Full read access to existing records remains active</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-100 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Create, edit, and delete operations locked until subscribed</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 pt-3 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row gap-2.5 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-xs text-slate-400 hover:text-white hover:bg-white/10"
          >
            Close & Continue Browsing
          </Button>

          <Button
            onClick={() => {
              window.open('mailto:support@optavel.com?subject=JCL%20Database%20%26%20Storage%20Subscription%20Activation', '_blank');
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Contact Administrator to Subscribe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
