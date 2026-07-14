import React, { useState, useEffect } from 'react';
import { Lock, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * LockWall — displayed when content is locked (manually or scheduled).
 * Props:
 *   type: 'manual' | 'scheduled' | 'private'
 *   unlockAt: Date | null  (for scheduled locks)
 *   title: string  (name of the content)
 *   onBack: fn  (navigate away)
 */
export default function LockWall({ type = 'manual', unlockAt = null, title = 'this content', onBack }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (type !== 'scheduled' || !unlockAt) return;
    const update = () => {
      const diff = new Date(unlockAt) - Date.now();
      if (diff <= 0) {
        setTimeLeft('Unlocking...');
        window.location.reload();
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (d > 0) parts.push(`${d}d`);
      if (h > 0) parts.push(`${h}h`);
      if (m > 0) parts.push(`${m}m`);
      parts.push(`${s}s`);
      setTimeLeft(parts.join(' '));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [type, unlockAt]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const isPrivate = type === 'private';
  const isScheduled = type === 'scheduled';

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 dark:bg-violet-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay" />

      <div className="max-w-xl w-full relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="p-8 sm:p-12 text-center flex flex-col items-center">
          
          {/* Icon */}
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-white to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
              {isScheduled ? (
                <Clock className="w-10 h-10 text-amber-500" />
              ) : (
                <Lock className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
              )}
            </div>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              {isPrivate ? 'Private Space' : isScheduled ? 'Scheduled Release' : 'Content Locked'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              {isPrivate
                ? `"${title}" is inside a private space. You need to be a member to access it.`
                : isScheduled
                ? `"${title}" will be available to everyone once the scheduled time arrives.`
                : `"${title}" has been locked by its creator and is not currently accessible.`}
            </p>
          </div>

          {/* Countdown for scheduled */}
          {isScheduled && unlockAt && timeLeft && (
            <div className="w-full bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-5 mb-8">
              <p className="text-[10px] text-amber-600 dark:text-amber-500 uppercase tracking-[0.2em] font-bold mb-2">Unlocks in</p>
              <p className="text-4xl font-mono font-black text-amber-500 dark:text-amber-400 tracking-tight">{timeLeft}</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-3 font-medium">
                {new Date(unlockAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Private space note */}
          {isPrivate && (
            <div className="w-full bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5 mb-8 text-left">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] font-bold mb-3">How to get access</p>
              <ul className="text-sm text-indigo-900/80 dark:text-indigo-200 space-y-2.5 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0" /> 
                  Ask the space owner to add you as a member
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-1.5 shrink-0" /> 
                  Once added, refresh this page
                </li>
              </ul>
            </div>
          )}

          {/* Back button */}
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
