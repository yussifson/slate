import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Download, FileText, Printer, ShieldCheck, Building2, Star } from 'lucide-react';

export default function PaymentReceiptModal({ isOpen, onClose, transactionDetails }) {
  if (!transactionDetails) return null;

  const receiptNumber = transactionDetails.receiptNumber || `CLIP-${transactionDetails.reference?.slice(-8).toUpperCase() || Math.random().toString(36).slice(2,10).toUpperCase()}`;
  const isAdminAssigned = transactionDetails.isAdminAssigned === true;
  const amountValue = isAdminAssigned ? 0 : (transactionDetails.amount / 100);
  const formattedAmount = isAdminAssigned ? 'Admin Assigned' : `${transactionDetails.currency} ${amountValue.toFixed(2)}`;
  const dateFormatted = new Date(transactionDetails.date || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receiptNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1e293b; 
              background: #fff; 
              margin: 0; 
              padding: 40px; 
              -webkit-font-smoothing: antialiased;
            }
            .invoice-container { 
              max-width: 800px; 
              margin: 0 auto; 
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 24px;
              margin-bottom: 32px;
            }
            .brand-name {
              font-size: 28px;
              font-weight: 700;
              color: #10b981;
              margin: 0 0 4px 0;
            }
            .brand-sub {
              font-size: 13px;
              color: #64748b;
              margin: 0;
            }
            .receipt-title {
              font-size: 24px;
              font-weight: 600;
              color: #0f172a;
              text-align: right;
              margin: 0 0 8px 0;
            }
            .receipt-meta {
              font-size: 13px;
              color: #64748b;
              text-align: right;
              line-height: 1.6;
            }
            .billing-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .billing-block h3 {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #94a3b8;
              margin: 0 0 8px 0;
            }
            .billing-block p {
              margin: 0 0 4px 0;
              font-size: 14px;
              font-weight: 500;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 32px;
            }
            th {
              text-align: left;
              padding: 12px;
              background: #f8fafc;
              color: #475569;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 16px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
              color: #0f172a;
            }
            .text-right { text-align: right; }
            .summary-box {
              float: right;
              width: 300px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              font-size: 14px;
              color: #475569;
            }
            .summary-row.total {
              border-top: 2px solid #0f172a;
              font-size: 18px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 4px;
            }
            .footer {
              clear: both;
              padding-top: 64px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              margin-top: 64px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div>
                <h1 class="brand-name">CliPad</h1>
                <p class="brand-sub">by Optavel Technologies</p>
              </div>
              <div>
                <h2 class="receipt-title">RECEIPT</h2>
                <div class="receipt-meta">
                  Receipt #: <strong>${receiptNumber}</strong><br>
                  Date: ${dateFormatted}
                </div>
              </div>
            </div>

            <div class="billing-section">
              <div class="billing-block">
                <h3>Billed To</h3>
                <p>${transactionDetails.companyName || 'Valued Customer'}</p>
                <p>${transactionDetails.email}</p>
              </div>
              <div class="billing-block" style="text-align: right;">
                <h3>Payment Status</h3>
                <p style="color: #10b981; font-weight: 700;">${isAdminAssigned ? 'Complimentary' : 'Paid in Full'}</p>
                ${!isAdminAssigned && transactionDetails.reference ? `<p style="font-size: 12px; color: #64748b;">Ref: ${transactionDetails.reference}</p>` : ''}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>CliPad ${transactionDetails.plan.toUpperCase()} Plan</strong>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Workspace Subscription Upgrade</div>
                  </td>
                  <td class="text-right">${formattedAmount}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${formattedAmount}</span>
              </div>
              <div class="summary-row total">
                <span>Total Paid</span>
                <span>${formattedAmount}</span>
              </div>
            </div>

            <div class="footer">
              Thank you for choosing CliPad. If you have any questions about this receipt, please contact support.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Receipt <span className="text-slate-400 font-normal">#{receiptNumber}</span>
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Top Banner inside receipt */}
                <div className="px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100">
                  <div>
                    <h3 className="text-2xl font-black text-emerald-600 tracking-tight">CliPad</h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">by Optavel</p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {isAdminAssigned ? 'Complimentary Upgrade' : 'Payment Successful'}
                  </div>
                </div>

                {/* Billing Info */}
                <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-slate-100 bg-slate-50/50">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</div>
                    <div className="font-bold text-slate-900 text-base">{transactionDetails.companyName || 'Valued Customer'}</div>
                    <div className="text-slate-600 text-sm mt-1">{transactionDetails.email}</div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date & Reference</div>
                    <div className="font-medium text-slate-900 text-sm">{dateFormatted}</div>
                    {!isAdminAssigned && transactionDetails.reference && (
                      <div className="text-slate-500 text-xs mt-1 font-mono">{transactionDetails.reference}</div>
                    )}
                  </div>
                </div>

                {/* Line Items */}
                <div className="px-8 py-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">Description</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-6 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                              <Star className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-base">CliPad {transactionDetails.plan.toUpperCase()} Plan</div>
                              <div className="text-sm text-slate-500 mt-0.5">Workspace Subscription</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 border-b border-slate-100 text-right font-semibold text-slate-900 text-lg">
                          {formattedAmount}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="mt-6 flex justify-end">
                    <div className="w-full max-w-xs space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Subtotal</span>
                        <span className="font-semibold text-slate-900">{formattedAmount}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-lg">
                        <span className="font-bold text-slate-900">Total Paid</span>
                        <span className="font-black text-slate-900">{formattedAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-6 text-center flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                Securely generated by CliPad Billing
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={onClose}
                className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
