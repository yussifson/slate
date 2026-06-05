import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, ShieldCheck, CheckCircle2, ChevronLeft, ArrowRight, Lock } from 'lucide-react';

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  // Mock course data
  const course = {
      title: "UI Design Fundamentals",
      instructor: "Sarah Jenkins",
      price: 149.00,
      thumbnail: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?q=80&w=600"
  };

  const handlePayment = () => {
      setProcessing(true);
      setTimeout(() => {
          setProcessing(false);
          alert("Payment successful! Redirecting to course...");
          navigate(`/o/learn/${courseId}`);
      }, 2000);
  };

  return (
    <div className="min-h-screen bg-void flex flex-col font-body text-text-primary">
      {/* Checkout Header */}
      <div className="h-16 border-b border-border bg-overlay flex items-center px-8 shrink-0 justify-between">
          <Link to={`/o/courses/${courseId}`} className="text-text-secondary hover:text-orbit-light flex items-center gap-2 text-sm font-medium transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Course
          </Link>
          <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
              <Lock className="w-4 h-4" /> Secure Checkout
          </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Payment Form (Left) */}
          <div className="lg:col-span-7 space-y-8">
              <div>
                  <h1 className="text-3xl font-display font-medium text-orbit-light mb-2">Complete your purchase</h1>
                  <p className="text-text-secondary">Get instant access to the course material.</p>
              </div>

              <div className="bg-deep border border-border rounded-2xl p-8">
                  <h2 className="text-xl font-display font-medium mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-orbit" /> Payment Method
                  </h2>
                  
                  <div className="space-y-4">
                      {/* Name on Card */}
                      <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Name on Card</label>
                          <input type="text" placeholder="John Doe" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-orbit focus:ring-1 focus:ring-orbit transition-all" />
                      </div>
                      
                      {/* Card Number */}
                      <div>
                          <label className="block text-sm font-medium text-text-secondary mb-1">Card Number</label>
                          <div className="relative">
                              <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-text-primary font-mono focus:outline-none focus:border-orbit focus:ring-1 focus:ring-orbit transition-all" />
                              <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                          </div>
                      </div>
                      
                      {/* Expiry & CVC */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-text-secondary mb-1">Expiry Date</label>
                              <input type="text" placeholder="MM/YY" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-orbit focus:ring-1 focus:ring-orbit transition-all" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-text-secondary mb-1">CVC</label>
                              <input type="text" placeholder="123" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary font-mono focus:outline-none focus:border-orbit focus:ring-1 focus:ring-orbit transition-all" />
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex items-center gap-3 text-sm text-text-muted bg-surface/50 p-4 rounded-xl border border-border/50">
                      <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
                      <p>Your payment is processed securely. We do not store your full credit card information.</p>
                  </div>
              </div>
          </div>

          {/* Order Summary (Right) */}
          <div className="lg:col-span-5 relative">
              <div className="sticky top-8 bg-overlay border border-border rounded-2xl p-8 shadow-2xl shadow-orbit/5">
                  <h2 className="text-xl font-display font-medium mb-6">Order Summary</h2>
                  
                  <div className="flex gap-4 mb-6 pb-6 border-b border-border">
                      <img src={course.thumbnail} alt="Course" className="w-24 h-24 rounded-lg object-cover border border-border" />
                      <div>
                          <h3 className="font-medium text-orbit-light leading-tight mb-1">{course.title}</h3>
                          <p className="text-xs text-text-secondary mb-2">by {course.instructor}</p>
                          <div className="text-sm text-text-muted">Lifetime Access</div>
                      </div>
                  </div>

                  <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-text-secondary">
                          <span>Original Price</span>
                          <span>${course.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                          <span>Discount</span>
                          <span>-$0.00</span>
                      </div>
                  </div>

                  <div className="flex justify-between items-end mb-8 pt-6 border-t border-border">
                      <span className="text-text-primary font-medium">Total</span>
                      <span className="text-3xl font-display font-medium text-orbit-light">${course.price.toFixed(2)}</span>
                  </div>

                  <button 
                      onClick={handlePayment} 
                      disabled={processing}
                      className="w-full orbit-btn-primary py-4 text-lg font-medium flex justify-center items-center gap-2"
                  >
                      {processing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                          <>Pay ${course.price.toFixed(2)} <ArrowRight className="w-5 h-5" /></>
                      )}
                  </button>

                  <div className="mt-6 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                          <CheckCircle2 className="w-4 h-4 text-orbit" /> 30-Day Money-Back Guarantee
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                          <CheckCircle2 className="w-4 h-4 text-orbit" /> Full lifetime access
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                          <CheckCircle2 className="w-4 h-4 text-orbit" /> Certificate of completion
                      </div>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
}
