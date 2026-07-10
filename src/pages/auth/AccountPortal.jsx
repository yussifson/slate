import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ShieldCheck, MonitorSmartphone, LayoutGrid, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccountPortal() {
  const { user, profile } = useAuth();
  
  const isSuperAdmin = profile?.role === 'super_admin' || user?.role === 'super_admin';
  const isPremium = profile?.plan === 'premium' || user?.plan === 'premium';
  
  const getInitials = (fullName, email) => {
    if (fullName) {
       const parts = fullName.split(' ');
       if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
       return fullName.substring(0, 2).toUpperCase();
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const nameDisplay = user?.full_name 
    ? user.full_name
    : user?.email;

  const initials = getInitials(user?.full_name, user?.email);

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      {/* Large Header Section */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="relative mb-6 group cursor-pointer mt-4">
          <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-medium shadow-lg relative z-10 transition-transform group-hover:scale-105 duration-300 overflow-hidden ${
             isSuperAdmin ? 'ring-4 ring-red-500 ring-offset-4 dark:ring-offset-background' :
             isPremium ? 'ring-4 ring-primary ring-offset-4 dark:ring-offset-background' : 'ring-4 ring-white dark:ring-[#202124]'
          }`}>
            {user?.avatar_url ? (
               <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               initials
            )}
          </div>
          {/* Subtle colorful ring behind avatar */}
          <div className="absolute inset-[-8px] rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300 z-0"></div>
          
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow shadow-black/10 border border-gray-100 dark:border-gray-700 z-20">
             <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
          </div>
          
          {isPremium && (
            <div className="absolute -top-3 right-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-30 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </div>
          )}
          {isSuperAdmin && (
            <div className="absolute -top-3 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-30 flex items-center gap-1">
              Admin
            </div>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 dark:text-white mb-3">
          Welcome, {nameDisplay}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-md">
          Manage your info, privacy, and security to make Optavel work better for you.
        </p>
      </div>

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Info Card */}
        <Link to="/personal-info" className="flex flex-col p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] hover:shadow-md transition-shadow group">
           <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
           </div>
           <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Personal info</h2>
           <p className="text-gray-600 dark:text-gray-400 text-sm flex-1 mb-6 leading-relaxed">
             See the data in your Optavel Account and choose what activity is saved to personalize your experience.
           </p>
           <div className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-auto group-hover:underline">
             Manage personal info
           </div>
        </Link>

        {/* Security Card */}
        <Link to="/security" className="flex flex-col p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] hover:shadow-md transition-shadow group">
           <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
              <ShieldCheck className="w-6 h-6" strokeWidth={1.5} />
           </div>
           <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Security</h2>
           <p className="text-gray-600 dark:text-gray-400 text-sm flex-1 mb-6 leading-relaxed">
             Settings and recommendations to help you keep your account secure.
           </p>
           <div className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-auto group-hover:underline">
             Protect your account
           </div>
        </Link>

        {/* Payments & Subscriptions Card */}
        <Link to="/subscriptions" className="flex flex-col p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] hover:shadow-md transition-shadow group">
           <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
           </div>
           <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Payments & subscriptions</h2>
           <p className="text-gray-600 dark:text-gray-400 text-sm flex-1 mb-6 leading-relaxed">
             Manage your payment methods and subscriptions across the Optavel ecosystem.
           </p>
           <div className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-auto group-hover:underline">
             Manage payments
           </div>
        </Link>

      </div>
    </div>
  );
}
