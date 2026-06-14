import React, { useState} from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import { Button} from "@/components/ui/button";
import { Input} from "@/components/ui/input";
import { Label} from "@/components/ui/label";
import { CreditCard, Smartphone, CheckCircle, Loader2, Lock} from "lucide-react";
import { formatCurrency} from "@/lib/constants";
import { useTranslation} from "react-i18next";
import { cn} from "@/lib/utils";

export default function PaymentModal({ open, onClose, invoice, onSuccess}) {
 const { t} = useTranslation();
 const [method, setMethod] = useState("card"); // 'card' or 'mobile_money'
 const [loading, setLoading] = useState(false);
 const [success, setSuccess] = useState(false);

 // Form states
 const [cardNumber, setCardNumber] = useState("");
 const [expiry, setExpiry] = useState("");
 const [cvc, setCvc] = useState("");
 const [momoNumber, setMomoNumber] = useState("");
 const [network, setNetwork] = useState("mtn");

 if (!invoice) return null;

 const handlePay = (e) => {
 e.preventDefault();
 setLoading(true);
 // Simulate payment processing delay
 setTimeout(() => {
 setLoading(false);
 setSuccess(true);
 setTimeout(() => {
 onSuccess();
 setSuccess(false);
}, 2000);
}, 2500);
};

 return (
 <Dialog open={open} onOpenChange={(val) => !loading && !success && onClose(val)}>
 <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
 {success ? (
 <div className="flex flex-col items-center justify-center p-12 text-center">
 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
 <CheckCircle className="w-10 h-10 text-primary" />
 </div>
 <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("payment_successful", "Payment Successful")}</h2>
 <p className="text-slate-500 mb-6">{t("invoice_marked_paid", "Your invoice has been marked as paid. Thank you!")}</p>
 </div>
 ) : (
 <>
 <div className="bg-slate-50 p-6 border-b border-primary/40 text-center">
 <DialogTitle className="text-xl font-bold mb-1">{t("pay_invoice", "Pay Invoice")}</DialogTitle>
 <DialogDescription className="text-slate-500 mb-4">{invoice.invoice_number}</DialogDescription>
 <div className="text-4xl font-black text-slate-900 tracking-tight">
 {formatCurrency(invoice.total_amount, invoice.currency)}
 </div>
 </div>

 <div className="p-6">
 <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
 <button
 type="button"
 onClick={() => setMethod("card")}
 className={cn(
 "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
 method === "card" ? "bg-white text-slate-900 " : "text-slate-500 hover:text-slate-700"
 )}
 >
 <CreditCard className="w-4 h-4" /> {t("card", "Credit Card")}
 </button>
 <button
 type="button"
 onClick={() => setMethod("mobile_money")}
 className={cn(
 "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
 method === "mobile_money" ? "bg-white text-slate-900 " : "text-slate-500 hover:text-slate-700"
 )}
 >
 <Smartphone className="w-4 h-4" /> {t("mobile_money", "Mobile Money")}
 </button>
 </div>

 <form onSubmit={handlePay} className="space-y-4">
 {method === "card" ? (
 <div className="space-y-4 animate-in fade-in duration-300">
 <div>
 <Label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wider font-semibold">{t("card_number", "Card Number")}</Label>
 <Input
 placeholder="0000 0000 0000 0000"
 value={cardNumber}
 onChange={(e) => setCardNumber(e.target.value)}
 className="font-mono text-base"
 required
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <Label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wider font-semibold">{t("expiry_date", "Expiry Date")}</Label>
 <Input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="font-mono text-base" required />
 </div>
 <div>
 <Label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wider font-semibold">CVC</Label>
 <Input placeholder="123" type="password" value={cvc} onChange={(e) => setCvc(e.target.value)} className="font-mono text-base" maxLength={4} required />
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-4 animate-in fade-in duration-300">
 <div>
 <Label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wider font-semibold">{t("network", "Network")}</Label>
 <select
 className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
 value={network}
 onChange={(e) => setNetwork(e.target.value)}
 >
 <option value="mtn">MTN Mobile Money</option>
 <option value="vodafone">Telecel Cash</option>
 <option value="airteltigo">AT Money</option>
 </select>
 </div>
 <div>
 <Label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wider font-semibold">{t("phone_number", "Phone Number")}</Label>
 <Input
 placeholder="024 000 0000"
 type="tel"
 value={momoNumber}
 onChange={(e) => setMomoNumber(e.target.value)}
 className="font-mono text-base"
 required
 />
 </div>
 </div>
 )}

 <div className="pt-4">
 <Button
 type="submit"
 className="w-full h-12 text-base font-bold relative overflow-hidden transition-all bg-primary hover:bg-primary/90 text-white"
 disabled={loading}
 >
 {loading ? (
 <Loader2 className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <Lock className="w-4 h-4 mr-2" />
 {t("pay", "Pay")} {formatCurrency(invoice.total_amount, invoice.currency)}
 </>
 )}
 </Button>
 <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
 <Lock className="w-3 h-3" /> Payments are secure and encrypted
 </p>
 </div>
 </form>
 </div>
 </>
 )}
 </DialogContent>
 </Dialog>
 );
}
