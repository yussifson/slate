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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-2xl">
            {isScheduled ? (
              <Clock className="w-10 h-10 text-amber-400" />
            ) : (
              <Lock className="w-10 h-10 text-indigo-400" />
            )}
          </div>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isPrivate ? 'Private Space' : isScheduled ? 'Scheduled Release' : 'Content Locked'}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isPrivate
              ? `"${title}" is inside a private space. You need to be a member to access it.`
              : isScheduled
              ? `"${title}" will be available to everyone once the scheduled time arrives.`
              : `"${title}" has been locked by its creator and is not currently accessible.`}
          </p>
        </div>

        {/* Countdown for scheduled */}
        {isScheduled && unlockAt && timeLeft && (
          <div className="bg-slate-800/60 border border-amber-500/30 rounded-2xl p-5">
            <p className="text-xs text-amber-400/80 uppercase tracking-widest font-semibold mb-1">Unlocks in</p>
            <p className="text-3xl font-mono font-bold text-amber-300">{timeLeft}</p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(unlockAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* Private space note */}
        {isPrivate && (
          <div className="bg-slate-800/60 border border-indigo-500/30 rounded-2xl p-5 text-left">
            <p className="text-xs text-indigo-400 uppercase tracking-widest font-semibold mb-2">How to get access</p>
            <ul className="text-sm text-slate-400 space-y-1.5">
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> Ask the space owner to add you as a member</li>
              <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">•</span> Once added, refresh this page</li>
            </ul>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-all border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}
