import React, { useEffect, useState } from 'react';
import { MonitorSmartphone, Monitor, Smartphone, Laptop } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

export default function AccountDevices() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [ipAddress, setIpAddress] = useState('Unknown');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    
    // Fetch public IP address
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress('Unknown'));
  }, []);

  const getDeviceName = () => {
    if (typeof window === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows Computer';
    if (ua.includes('Mac')) return 'Mac Computer';
    if (ua.includes('Linux')) return 'Linux Computer';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'Apple Device';
    if (ua.includes('Android')) return 'Android Device';
    return 'Web Browser';
  };
  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-12 text-center relative pt-4">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/20 rounded-full blur-3xl opacity-70"></div>
        <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-b from-blue-50 to-blue-100/50 dark:from-blue-900/40 dark:to-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-6 ring-1 ring-blue-200/50 dark:ring-blue-800/50 shadow-sm">
          <MonitorSmartphone className="w-6 h-6" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-tight mb-4 pb-1">
          Your Devices
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-[1.1rem] max-w-xl mx-auto leading-relaxed">
          Manage the devices where you're currently signed in. If you don't recognize a device, sign out immediately to secure your account.
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
                    <h3 className="text-gray-900 dark:text-white font-medium text-lg">{getDeviceName()}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                      This device
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active now</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">IP: {ipAddress}</p>
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
