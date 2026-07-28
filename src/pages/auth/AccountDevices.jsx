import React, { useEffect, useState } from 'react';
import { MonitorSmartphone, Monitor, Smartphone, Laptop } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';

export default function AccountDevices() {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [ipAddress, setIpAddress] = useState('Unknown');
  const [country, setCountry] = useState('Unknown');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    
    // Fetch public IP address and country
    fetch('https://ipwho.is/')
      .then(res => res.json())
      .then(data => {
        setIpAddress(data.ip || 'Unknown');
        setCountry(data.country || 'Unknown');
      })
      .catch(() => {
        setIpAddress('Unknown');
        setCountry('Unknown');
      });
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
    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto space-y-8">
      {/* Premium Header */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="inline-flex items-center justify-center p-3 h-12 w-12 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-4 border border-blue-100 dark:border-blue-900/20">
          <MonitorSmartphone className="w-5 h-5" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Active Devices
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] font-medium leading-relaxed max-w-xl mt-2">
          Track and revoke active user login sessions to secure your profile access.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
             <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audited Sessions</h2>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
               Active web browser connections and desktop clients linked to your credentials.
             </p>
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">IP: {ipAddress} {country !== 'Unknown' && `• ${country}`}</p>
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
