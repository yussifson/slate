import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Smartphone, Activity, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
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
                     <button onClick={handleSavePassword} disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Save Password</button>
                     <button onClick={() => setIsChangingPassword(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                   </div>
                 </div>
               ) : (
                 <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsChangingPassword(true)}>
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
                     <button onClick={handleVerifyMfa} className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90">Verify Code</button>
                     <button onClick={() => setIsEnrollingMfa(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
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
                      <button onClick={() => handleUnenrollMfa(mfaFactors[0].id)} className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors">Disable</button>
                   ) : (
                      <div className="cursor-pointer" onClick={handleEnrollMfa}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                   )}
                 </div>
               )}
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
