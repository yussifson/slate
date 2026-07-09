import React from 'react';
import { MonitorSmartphone, Monitor, Smartphone, Laptop } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AccountDevices() {
  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-normal text-gray-900 dark:text-white mb-3">Your devices</h1>
        <p className="text-gray-600 dark:text-gray-400 text-base max-w-lg mx-auto">
          You're currently signed in to your Optavel Account on these devices. If you don't recognize a device, sign out.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#28292C] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-800">
             <h2 className="text-xl font-medium text-gray-900 dark:text-white">Active Sessions</h2>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Current Device */}
            <div className="p-6 md:px-8 flex items-start gap-5">
               <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Laptop className="w-6 h-6" strokeWidth={1.5} />
               </div>
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-gray-900 dark:text-white font-medium text-lg">Windows Computer</h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                      This device
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Chrome • Active now</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">United States</p>
               </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 flex items-start gap-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <MonitorSmartphone className="w-6 h-6 text-gray-500 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Optavel stores sessions securely. If you lose a device or suspect unauthorized access, you can change your password to immediately revoke access to all devices.
          </p>
        </div>
      </div>
    </div>
  );
}
