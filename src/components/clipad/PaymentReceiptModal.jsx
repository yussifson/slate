import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Download, FileText, Printer, ShieldCheck } from 'lucide-react';
import { CliPadLogo } from '../ui/CliPadLogo';

export default function PaymentReceiptModal({ isOpen, onClose, transactionDetails }) {
  const receiptRef = useRef();

  if (!transactionDetails) return null;

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${transactionDetails.reference}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; }
            .receipt-container { max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 32px; border-radius: 16px; }
            .header { text-align: center; margin-bottom: 32px; border-bottom: 2px dashed #cbd5e1; padding-bottom: 24px; }
            .amount { font-size: 36px; font-weight: 900; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; }
            .label { color: #64748b; font-weight: 500; }
            .val { font-weight: 600; }
            .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            ${printContent}
          </div>
          <script>window.print(); window.close();</script>
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Payment Receipt
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8" ref={receiptRef}>
              <div className="text-center mb-8 border-b-2 border-dashed border-slate-200 pb-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-emerald-500 mb-2">Payment Successful</h3>
                <div className="text-4xl font-black text-slate-900 tracking-tight">
                  {transactionDetails.currency} {(transactionDetails.amount / 100).toFixed(2)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Reference ID</span>
                  <span className="text-slate-900 font-bold font-mono">{transactionDetails.reference}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Date Paid</span>
                  <span className="text-slate-900 font-bold">{new Date(transactionDetails.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Subscription Plan</span>
                  <span className="text-slate-900 font-bold capitalize">{transactionDetails.plan} Plan</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Billed To</span>
                  <span className="text-slate-900 font-bold">{transactionDetails.email}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded text-xs uppercase tracking-wider">Paid</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" /> Securely processed by Paystack
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={handlePrint} className="flex-1 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20">
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
