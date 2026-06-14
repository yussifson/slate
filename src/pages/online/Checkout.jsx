import React, { useState} from 'react';
import { useParams, useNavigate} from 'react-router-dom';
import { useQuery} from "@tanstack/react-query";
import { base44} from "@/api/base44Client";
import { useCompanyId} from "@/hooks/useCompanyId";
import { CreditCard, ShieldCheck, ArrowRight, Lock} from 'lucide-react';
import { useToast} from "@/components/ui/use-toast";

export default function Checkout() {
 const { courseId} = useParams();
 const navigate = useNavigate();
 const companyId = useCompanyId();
 const { toast} = useToast();
 
 const [loading, setLoading] = useState(false);

 const { data: course} = useQuery({
 queryKey: ["case", courseId],
 queryFn: () => base44.entities.LegalCase.get(courseId),
 enabled: !!courseId && !!companyId
});

 const title = course?.title || 'Loading...';
 let extra = {};
 try { extra = JSON.parse(course?.notes || '{}');} catch(e) {}
 const price = extra.price || '99.00';

 const handleCheckout = () => {
 setLoading(true);
 setTimeout(() => {
 setLoading(false);
 toast({ title: "Payment Successful", description: "You are now enrolled in the course."});
 navigate('/o/student-dashboard');
}, 1500);
};

 return (
 <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-surface-1)] py-12 px-4 animate-in fade-in duration-500">
 <div className="max-w-4xl mx-auto">
 <div className="text-center mb-8">
 <h1 className="text-3xl font-bold font-display text-[var(--color-text-primary)]">Secure Checkout</h1>
 <p className="text-[var(--color-text-secondary)] mt-2 flex items-center justify-center gap-2">
 <Lock className="w-4 h-4" /> 256-bit SSL Encrypted Payment
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Order Summary */}
 <div className="lg:col-span-1 lg:order-2">
 <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-[var(--radius-xl)] overflow-hidden sticky top-6">
 <div className="bg-[var(--color-surface-1)] p-4 border-b border-primary/40">
 <h2 className="font-semibold text-[var(--color-text-primary)]">Order Summary</h2>
 </div>
 <div className="p-6 space-y-4 border-b border-primary/40">
 <div className="flex justify-between items-start gap-4">
 <div className="font-medium text-sm text-[var(--color-text-primary)]">{title}</div>
 <div className="font-semibold text-[var(--color-text-primary)]">${price}</div>
 </div>
 </div>
 <div className="p-6 bg-[var(--color-surface-1)] space-y-2">
 <div className="flex justify-between items-center text-sm">
 <span className="text-[var(--color-text-secondary)]">Subtotal</span>
 <span className="font-medium text-[var(--color-text-primary)]">${price}</span>
 </div>
 <div className="flex justify-between items-center text-sm pb-4 border-b border-primary/40">
 <span className="text-[var(--color-text-secondary)]">Tax</span>
 <span className="font-medium text-[var(--color-text-primary)]">$0.00</span>
 </div>
 <div className="flex justify-between items-center pt-2">
 <span className="font-bold text-[var(--color-text-primary)] text-lg">Total</span>
 <span className="font-bold text-[var(--color-text-primary)] text-lg">${price}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Payment Form */}
 <div className="lg:col-span-2 lg:order-1 space-y-6">
 <div className="bg-[var(--color-surface-0)] border border-primary/40 rounded-[var(--radius-xl)] p-6 sm:p-8">
 <h2 className="text-xl font-bold font-display text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
 <CreditCard className="w-5 h-5 text-[var(--primary)]" /> Payment Details
 </h2>
 
 <div className="space-y-5">
 <div>
 <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name on Card</label>
 <input 
 type="text" 
 placeholder="John Doe" 
 className="w-full bg-[var(--color-surface-1)] border border-primary/40 rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Card Number</label>
 <div className="relative">
 <input 
 type="text" 
 placeholder="0000 0000 0000 0000" 
 className="w-full bg-[var(--color-surface-1)] border border-primary/40 rounded-[var(--radius-md)] pl-12 pr-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-[var(--color-text-tertiary)]" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-5">
 <div>
 <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Expiry Date</label>
 <input 
 type="text" 
 placeholder="MM/YY" 
 className="w-full bg-[var(--color-surface-1)] border border-primary/40 rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">CVC</label>
 <input 
 type="text" 
 placeholder="123" 
 className="w-full bg-[var(--color-surface-1)] border border-primary/40 rounded-[var(--radius-md)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 </div>
 </div>

 <button 
 onClick={handleCheckout} 
 disabled={loading}
 className="w-full mt-8 py-4 bg-[var(--primary)] text-white text-base font-bold rounded-[var(--radius-md)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
 >
 {loading ? 'Processing...' : `Pay $${price}`} <ArrowRight className="w-5 h-5" />
 </button>

 <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--color-text-tertiary)]">
 <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" /> Payments are secure and encrypted.
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
