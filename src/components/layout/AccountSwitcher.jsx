import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Plus, Check, ChevronDown, UserCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getSavedAccounts } from '@/lib/multiAccountUtils';

export default function AccountSwitcher({ className = '' }) {
  const { user, profile, switchAccount, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAccounts(getSavedAccounts());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const handleAddAccount = () => {
    window.location.href = '/login';
  };

  const initials = getInitials(profile?.first_name || user?.user_metadata?.first_name, profile?.last_name || user?.user_metadata?.last_name, user?.email);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ring-offset-1 dark:ring-offset-background"
      >
        <div className="relative shrink-0 rounded-full w-8 h-8 md:w-9 md:h-9">
          {profile?.avatar_url || user?.avatar_url ? (
            <img src={profile?.avatar_url || user?.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm md:text-base">
              {initials}
            </div>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#28292C] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden">
              {profile?.avatar_url || user?.avatar_url ? (
                <img src={profile?.avatar_url || user?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-medium text-lg">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name || user?.user_metadata?.full_name || 'Optavel User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-2">
            {accounts.filter(a => a.id !== user?.id).map((acc) => (
              <button 
                key={acc.id}
                onClick={() => {
                  setIsOpen(false);
                  switchAccount(acc.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden">
                  {acc.avatar_url ? (
                    <img src={acc.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-medium text-xs">
                      {getInitials(acc.full_name?.split(' ')[0], acc.full_name?.split(' ')[1], acc.email)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{acc.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{acc.email}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 p-2 space-y-1">
            <button 
              onClick={handleAddAccount}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-500" />
              Add another account
            </button>
            <button 
              onClick={() => logout(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out of all accounts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
