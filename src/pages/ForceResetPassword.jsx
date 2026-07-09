import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ForceResetPassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      // 1. Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // 2. Remove the force_password_reset flag from user metadata
      const { error: metaError } = await supabase.auth.updateUser({
        data: { force_password_reset: false }
      });

      if (metaError) throw metaError;

      setSuccess(true);
      
      // Give them a moment to read the success message, then reload to let routing take over
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to update password.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl text-center border border-slate-100">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Password Updated!</h1>
          <p className="text-slate-500 font-medium">Your password has been successfully secured. Redirecting you to your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Secure Your Account</h1>
          <p className="text-sm font-medium text-slate-500">
            Hi {user?.user_metadata?.full_name || 'there'}, your account was created with a temporary default password. For your security, please set a new permanent password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium p-4 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">New Password</label>
            <Input 
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Confirm Password</label>
            <Input 
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 focus:bg-white text-slate-900"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
            {loading ? 'Updating Password...' : 'Save & Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
