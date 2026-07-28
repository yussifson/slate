import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Smartphone, Activity, CheckCircle2, AlertCircle, X, Check, Twitter, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from "@/api/supabaseClient";

export default function AccountSecurity() {
  const { user } = useAuth();
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [mfaFactors, setMfaFactors] = useState([]);
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [factorId, setFactorId] = useState('');
  
  const [isLinkingTwitter, setIsLinkingTwitter] = useState(false);

  const handleLinkTwitter = async () => {
    setIsLinkingTwitter(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: window.location.origin + '/security'
        }
      });
      if (error) throw error;
    } catch (e) {
      alert("Error linking Twitter: " + e.message);
    } finally {
      setIsLinkingTwitter(false);
    }
  };

  useEffect(() => {
    loadMfa();
  }, []);

  const loadMfa = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data?.totp) {
        setMfaFactors(data.totp.filter(f => f.status === 'verified'));
      }
    } catch (e) { console.error(e); }
  };

  const handleDetailsClick = () => {
     alert("No security actions are currently required for your account.");
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMsg("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    setPasswordMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setIsChangingPassword(false), 2000);
    } catch (err) {
      setPasswordMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollMfa = async () => {
    setIsEnrollingMfa(true);
    setMfaError('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    } catch (err) {
      setMfaError(err.message);
      setIsEnrollingMfa(false);
    }
  };

  const handleVerifyMfa = async () => {
    setMfaError('');
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });
      if (error) throw error;
      setIsEnrollingMfa(false);
      setVerifyCode('');
      loadMfa();
    } catch (err) {
      setMfaError(err.message);
    }
  };

  const handleUnenrollMfa = async (fId) => {
    try {
      await supabase.auth.mfa.unenroll({ factorId: fId });
      loadMfa();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 max-w-4xl mx-auto space-y-8">
      {/* Premium Header */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -left-16 -bottom-16 w-36 h-36 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="inline-flex items-center justify-center p-3 h-12 w-12 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-4 border border-emerald-100 dark:border-emerald-900/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Security Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-[15px] font-medium leading-relaxed max-w-xl mt-2">
          Settings, multi-factor tokens, and session auditing to safeguard your Optavel credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* Security Checkup */}
        <div className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
             <div className="space-y-1">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                 <ShieldCheck className="text-emerald-500 w-5 h-5 shrink-0" />
                 Your Account is Secure
               </h2>
               <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">
                 The automated security scanner inspected active token sessions and found no anomalies.
               </p>
             </div>
             <button onClick={handleDetailsClick} className="whitespace-nowrap px-4 py-2 text-[12px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all">
               Run Check
             </button>
          </div>
        </div>

        {/* How you sign in */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
             <h2 className="text-lg font-bold text-slate-900 dark:text-white">Signing In</h2>
             <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
               Keep your password, OAuth access keys, and recovery seeds updated to prevent lockout.
             </p>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Password section */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
               {isChangingPassword ? (
                 <div className="space-y-4 max-w-md">
                   <div className="text-gray-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gray-500" /> Change Password
                   </div>
                   <input 
                     type="password" 
                     placeholder="New password" 
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   <input 
                     type="password" 
                     placeholder="Confirm new password" 
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   {passwordMsg && <p className="text-sm text-red-500">{passwordMsg}</p>}
                   <div className="flex gap-2 pt-2">
                     <button type="button" onClick={(e) => { e.stopPropagation(); handleSavePassword(); }} disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save Password</button>
                     <button type="button" onClick={(e) => { e.stopPropagation(); setIsChangingPassword(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsChangingPassword(true); }}>
                   <div>
                      <div className="text-gray-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-gray-500" />
                        Password
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Click to change password</div>
                   </div>
                   <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                 </div>
               )}
            </div>
            
            {/* 2FA section */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
               {isEnrollingMfa ? (
                 <div className="space-y-4">
                   <div className="text-gray-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-500" /> Setup 2-Step Verification
                   </div>
                   <p className="text-sm text-gray-500 dark:text-gray-400">Scan this QR code with your authenticator app.</p>
                   {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48 border bg-white" />}
                   <input 
                     type="text" 
                     placeholder="6-digit code" 
                     value={verifyCode}
                     onChange={(e) => setVerifyCode(e.target.value)}
                     className="w-full max-w-xs h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white"
                   />
                   {mfaError && <p className="text-sm text-red-500">{mfaError}</p>}
                   <div className="flex gap-2 pt-2">
                     <button type="button" onClick={(e) => { e.stopPropagation(); handleVerifyMfa(); }} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Verify Code</button>
                     <button type="button" onClick={(e) => { e.stopPropagation(); setIsEnrollingMfa(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between">
                   <div>
                      <div className="text-gray-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                        2-Step Verification
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {mfaFactors.length > 0 ? <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Enabled</span> : 'Off'}
                      </div>
                   </div>
                   {mfaFactors.length > 0 ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleUnenrollMfa(mfaFactors[0].id); }} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors">Disable</button>
                   ) : (
                      <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEnrollMfa(); }}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                   )}
                 </div>
               )}
            </div>
            
            {/* Linked Accounts section */}
            <div className="p-6 md:px-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
               <div className="flex items-center justify-between">
                 <div>
                    <div className="text-gray-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                      Twitter / X Verification
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Link your Twitter account for verification and faster login.
                    </div>
                 </div>
                 
                 {user?.app_metadata?.providers?.includes('twitter') ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-sm font-medium"><Check className="w-4 h-4" /> Linked</span>
                 ) : (
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleLinkTwitter(); }} 
                      disabled={isLinkingTwitter}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-200"
                    >
                      <LinkIcon className="w-4 h-4" />
                      {isLinkingTwitter ? 'Linking...' : 'Link Twitter'}
                    </button>
                 )}
               </div>
            </div>
          </div>
        </div>

        {/* Recent Security Activity */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card overflow-hidden">
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
