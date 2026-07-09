import React from 'react';
import { CreditCard, Package } from 'lucide-react';

export default function AccountPayments() {
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
             <h3 className="text-gray-900 dark:text-white font-medium mb-1">No payment methods saved</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
               You haven't added any credit cards or payment methods yet.
             </p>
             <button className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors">
               Add payment method
             </button>
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
