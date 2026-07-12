import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Download, FileText, Printer, ShieldCheck, Building2, Star } from 'lucide-react';

export default function PaymentReceiptModal({ isOpen, onClose, transactionDetails }) {
  const receiptRef = useRef();

  if (!transactionDetails) return null;

  const receiptNumber = transactionDetails.receiptNumber || `CLIP-${transactionDetails.reference?.slice(-8).toUpperCase() || Math.random().toString(36).slice(2,10).toUpperCase()}`;
  const isAdminAssigned = transactionDetails.isAdminAssigned === true;
  const amountDisplay = isAdminAssigned
    ? 'Admin Assigned'
    : `${transactionDetails.currency} ${(transactionDetails.amount / 100).toFixed(2)}`;

  const planColors = {
    pro: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    enterprise: { bg: 'bg-violet-50', text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', border: 'border-violet-200' },
    free: { bg: 'bg-slate-50', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700', border: 'border-slate-200' },
  };
  const colors = planColors[transactionDetails.plan] || planColors.free;

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receiptNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px; color: #0f172a; }
            .receipt { max-width: 520px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; text-align: center; padding: 32px; }
            .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px; }
            .receipt-num { font-size: 12px; opacity: 0.8; font-weight: 500; }
            .status { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 100px; padding: 6px 16px; font-size: 12px; font-weight: 700; margin-top: 12px; }
            .body { padding: 32px; }
            .amount { text-align: center; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 2px dashed #e2e8f0; }
            .amount-value { font-size: 40px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
            .plan-badge { display: inline-block; padding: 4px 14px; border-radius: 100px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; background: #f0fdf4; color: #16a34a; }
            .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 14px; }
            .label { color: #64748b; font-weight: 500; }
            .val { font-weight: 700; color: #0f172a; font-family: monospace; }
            .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px; }
            .company-block { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
            .company-name { font-weight: 800; font-size: 16px; color: #0f172a; }
            .company-label { font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="receipt">${printContent}</div>
          <script>window.print(); window.close();<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Plan Upgrade Receipt
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="flex-1 overflow-y-auto" ref={receiptRef}>
              {/* Green top banner */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-center px-8 py-7">
                <div className="text-xl font-black tracking-tight mb-1">CliPad</div>
                <div className="text-[11px] font-medium opacity-75 mb-3">by Optavel Technologies</div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-4 py-1.5 text-xs font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isAdminAssigned ? 'Plan Upgraded by Admin' : 'Payment Successful'}
                </div>
                <div className="text-[10px] opacity-60 mt-3 font-mono">#{receiptNumber}</div>
              </div>

              <div className="p-7 space-y-5">
                {/* Amount / Plan */}
                <div className={`text-center py-5 rounded-2xl ${colors.bg} border ${colors.border}`}>
                  <div className={`text-4xl font-black tracking-tight ${isAdminAssigned ? colors.text : 'text-slate-900'}`}>
                    {isAdminAssigned ? '—' : `${transactionDetails.currency} ${(transactionDetails.amount / 100).toFixed(2)}`}
                  </div>
                  <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.badge}`}>
                    <Star className="w-3 h-3 inline mr-1" />
                    {transactionDetails.plan} Plan
                  </div>
                  {isAdminAssigned && (
                    <div className="text-xs text-slate-500 mt-2 font-medium">Complimentary upgrade</div>
                  )}
                </div>

                {/* Company block */}
                {transactionDetails.companyName && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Company</div>
                        <div className="font-bold text-slate-900 text-sm">{transactionDetails.companyName}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Details rows */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Receipt No.</span>
                    <span className="text-slate-900 font-bold font-mono text-xs">{receiptNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Date</span>
                    <span className="text-slate-900 font-bold text-xs">{new Date(transactionDetails.date || Date.now()).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Billed To</span>
                    <span className="text-slate-900 font-bold text-xs">{transactionDetails.email}</span>
                  </div>
                  {transactionDetails.reference && !isAdminAssigned && (
                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Reference ID</span>
                      <span className="text-slate-900 font-bold font-mono text-xs">{transactionDetails.reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm py-2">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs uppercase tracking-wider">Active</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isAdminAssigned ? 'Upgraded by Optavel Admin · CliPad' : 'Securely processed by Paystack · CliPad'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 text-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
