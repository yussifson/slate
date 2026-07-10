import React, { useState, useEffect } from 'react';
import { CreditCard, Package, CheckCircle2, Clock, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

const PLAN_COLORS = {
  free:         { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-700 dark:text-gray-300',       border: 'border-gray-200 dark:border-gray-700' },
  starter:      { bg: 'bg-blue-50 dark:bg-blue-900/20',      text: 'text-blue-700 dark:text-blue-400',       border: 'border-blue-200 dark:border-blue-700' },
  professional: { bg: 'bg-purple-50 dark:bg-purple-900/20',  text: 'text-purple-700 dark:text-purple-400',   border: 'border-purple-200 dark:border-purple-700' },
  enterprise:   { bg: 'bg-amber-50 dark:bg-amber-900/20',    text: 'text-amber-700 dark:text-amber-400',     border: 'border-amber-200 dark:border-amber-700' },
};

function CheckoutForm({ onCancel, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const cardElement = elements.getElement(CardElement);
    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });
    if (stripeError) {
      setCardError(stripeError.message);
      setProcessing(false);
    } else {
      setTimeout(() => {
        setProcessing(false);
        onSuccess(`•••• •••• •••• ${paymentMethod.card.last4}`, paymentMethod.card.brand);
      }, 1000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardElement options={{
          style: {
            base: { fontSize: '15px', color: '#374151', fontFamily: 'Inter, sans-serif', '::placeholder': { color: '#9CA3AF' } },
            invalid: { color: '#EF4444' },
          },
        }} />
      </div>
      {cardError && <p className="text-sm text-red-500">{cardError}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={!stripe || processing} className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2">
          {processing && <Loader2 className="w-4 h-4 animate-spin" />}
          {processing ? 'Saving...' : 'Save Card'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AccountPayments() {
  const { user } = useAuth();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.company_id) { setIsLoading(false); return; }
      try {
        const { data } = await supabase
          .from('companies')
          .select('id, name, subscription_plan, subscription_status, max_users, trial_ends_at')
          .eq('id', user.company_id)
          .single();
        if (data) setCompany(data);
      } catch (e) {
        console.warn('Could not load company info', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.company_id]);

  const handleCardSuccess = (maskedNumber, brand) => {
    setSavedCards(prev => [...prev, { id: Date.now(), number: maskedNumber, brand }]);
    setIsAddingCard(false);
  };

  const handleRemoveCard = (id) => {
    setSavedCards(prev => prev.filter(c => c.id !== id));
  };

  const planKey = (company?.subscription_plan || 'free').toLowerCase().replace(/\s+/g, '');
  const planColors = PLAN_COLORS[planKey] || PLAN_COLORS.free;
  const planDisplayName = company?.subscription_plan
    ? company.subscription_plan.charAt(0).toUpperCase() + company.subscription_plan.slice(1)
    : 'Free';

  const statusIcon = company?.subscription_status === 'active'
    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
    : company?.subscription_status === 'trial'
    ? <Clock className="w-4 h-4 text-amber-500" />
    : <AlertCircle className="w-4 h-4 text-gray-400" />;

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-12 text-center relative pt-4">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent dark:from-amber-900/20 rounded-full blur-3xl opacity-70"></div>
        <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-900/40 dark:to-amber-900/10 text-amber-600 dark:text-amber-400 rounded-2xl mb-6 ring-1 ring-amber-200/50 dark:ring-amber-800/50 shadow-sm">
          <CreditCard className="w-6 h-6" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight mb-4 pb-1">
          Payments &amp; Subscriptions
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-[1.1rem] max-w-xl mx-auto leading-relaxed">
          Manage your payment methods and subscriptions across the Optavel ecosystem.
        </p>
      </div>

      <div className="space-y-6">
        {/* Active Subscription */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-1">Your subscriptions</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Manage your active plans across Optavel Slate, Preloom, and other apps.
            </p>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : company ? (
            <div className="p-6 md:px-8 space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-xl border ${planColors.border} ${planColors.bg}`}>
                <div className="flex items-center gap-3">
                  <Package className={`w-5 h-5 ${planColors.text}`} strokeWidth={1.5} />
                  <div>
                    <div className={`font-semibold text-sm ${planColors.text}`}>{planDisplayName} Plan</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      {statusIcon}
                      <span className="capitalize">{company.subscription_status || 'Active'}</span>
                      {company.trial_ends_at && (
                        <span className="ml-1">· Trial ends {new Date(company.trial_ends_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href="https://optavel.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Upgrade <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {company.max_users && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-primary/60 inline-block" />
                  Up to <strong className="text-gray-700 dark:text-gray-200 mx-1">{company.max_users}</strong> team members included
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                <Package className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-gray-900 dark:text-white font-medium mb-1">No active subscriptions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                You are currently on the free tier. Upgrade to unlock more features.
              </p>
              <a
                href="https://optavel.com/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
              >
                View plans
              </a>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-1">Payment methods</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Save a payment method to easily purchase apps and subscriptions.
            </p>
          </div>

          <div className="p-6 md:px-8">
            {savedCards.length > 0 && (
              <div className="space-y-3 mb-6">
                {savedCards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">{card.brand} {card.number}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Default payment method</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(card.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAddingCard ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm onCancel={() => setIsAddingCard(false)} onSuccess={handleCardSuccess} />
              </Elements>
            ) : (
              <div className={savedCards.length === 0 ? 'flex flex-col items-center justify-center text-center py-4' : ''}>
                {savedCards.length === 0 && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <CreditCard className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-medium mb-1">No payment methods saved</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                      You haven't added any credit cards or payment methods yet.
                    </p>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddingCard(true)}
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors"
                >
                  {savedCards.length > 0 ? 'Add another card' : 'Add payment method'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

