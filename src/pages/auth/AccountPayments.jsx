import React, { useState } from 'react';
import { CreditCard, Package } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

function CheckoutForm({ onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    
    // In a real implementation, you would create a SetupIntent on the backend and confirm it here.
    // For now, we mock success after validating the card element.
    const cardElement = elements.getElement(CardElement);
    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else {
      // Mock saving to DB
      setTimeout(() => {
        setProcessing(false);
        onCancel();
        alert(`Successfully linked card ending in ${paymentMethod.card.last4}`);
      }, 1000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4">
      <div className="p-4 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}/>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="flex gap-2 justify-center">
        <button type="submit" disabled={!stripe || processing} className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors">
          {processing ? 'Processing...' : 'Save Card'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AccountPayments() {
  const [isAddingCard, setIsAddingCard] = useState(false);
  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 dark:text-white mb-3">Payments & subscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Manage your payment methods and subscriptions across the Optavel ecosystem.
        </p>
      </div>

      <div className="space-y-6">
        {/* Payment Methods */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Payment methods</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">
               Save a payment method to easily purchase apps and subscriptions.
             </p>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <CreditCard className="w-8 h-8" strokeWidth={1.5} />
             </div>
             {isAddingCard ? (
               <Elements stripe={stripePromise}>
                 <CheckoutForm onCancel={() => setIsAddingCard(false)} />
               </Elements>
             ) : (
               <>
                 <h3 className="text-gray-900 dark:text-white font-medium mb-1">No payment methods saved</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                   You haven't added any credit cards or payment methods yet.
                 </p>
                 <button onClick={() => setIsAddingCard(true)} className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors">
                   Add payment method
                 </button>
               </>
             )}
          </div>
        </div>

        {/* Subscriptions */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Your subscriptions</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">
               Manage your active plans across Optavel Slate, Preloom, and other apps.
             </p>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                <Package className="w-8 h-8" strokeWidth={1.5} />
             </div>
             <h3 className="text-gray-900 dark:text-white font-medium mb-1">No active subscriptions</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
               You are currently on the free tier for all services.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
