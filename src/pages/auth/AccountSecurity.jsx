import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Smartphone, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from "@/api/supabaseClient";

import { useNavigate } from 'react-router-dom';

export default function AccountSecurity() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDetailsClick = () => {
     alert("No security actions are currently required for your account.");
  };

  const handle2FAClick = () => {
     alert("2-Step Verification is coming soon to Optavel!");
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 dark:text-white mb-3">Security</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base">
          Settings and recommendations to help you keep your account secure.
        </p>
      </div>

      <div className="space-y-6">
        {/* Security Checkup */}
        <div className="p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
             <div>
               <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                 <ShieldCheck className="text-green-500 w-6 h-6" />
                 Your account is protected
               </h2>
               <p className="text-gray-600 dark:text-gray-400 text-sm">
                 The Security Checkup checked your account and found no recommended actions.
               </p>
             </div>
             <button onClick={handleDetailsClick} className="whitespace-nowrap px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors">
               See details
             </button>
          </div>
        </div>

        {/* How you sign in */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">How you sign in to Optavel</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">
               Make sure that you can always access your Optavel Account by keeping this information up to date.
             </p>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className={`p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer`} onClick={() => navigate('/forgot-password')}>
               <div className="flex items-center justify-between">
                 <div>
                    <div className="text-gray-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gray-500" />
                      Password
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Last changed recently</div>
                 </div>
                 <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
               </div>
            </div>
            
            <div className="p-6 md:px-8 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={handle2FAClick}>
               <div>
                  <div className="text-gray-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    2-Step Verification
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Off</div>
               </div>
               <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
            </div>
          </div>
        </div>

        {/* Recent Security Activity */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Recent security activity</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">
               Review security events from the past 28 days.
             </p>
          </div>
          <div className="p-6 md:px-8 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
               <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
             </div>
             <div>
               <div className="text-gray-900 dark:text-white font-medium text-sm">New sign-in on Windows</div>
               <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Today • Chrome</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
