import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Settings, User, Bell, Shield, LogOut, ArrowLeft, Video, CheckCircle, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CliPadSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Settings state (mocked for UI)
  const [settings, setSettings] = useState({
    emailNotifs: true,
    actionItemReminders: true,
    aiSummaries: true,
    cameraDefault: true,
    micDefault: true,
    blurBackground: false
  });

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    }, 600);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#050A15] text-white">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-[#050A15]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">Settings</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-400 hover:text-white transition-colors">← Dashboard</button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-1">
            {[{id: 'profile', icon: User, label: 'Profile'}, {id: 'notifs', icon: Bell, label: 'Notifications'}, {id: 'meeting', icon: Video, label: 'Meeting Defaults'}].map(tab => (
              <button key={tab.id} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white font-semibold text-sm transition-all border border-white/10">
                <tab.icon className="w-4 h-4 text-indigo-400" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-8">
            
            {/* Profile */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><User className="w-5 h-5 text-indigo-400" /> Account Profile</h2>
              <div className="flex items-center gap-6 mb-8">
                <img
                  src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_metadata?.full_name || user?.email}`}
                  className="w-20 h-20 rounded-2xl bg-white/5"
                  alt="Profile"
                />
                <div>
                  <h3 className="text-xl font-bold text-white">{user?.user_metadata?.full_name || 'User'}</h3>
                  <p className="text-gray-400">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Full Name</label>
                  <input
                    defaultValue={user?.user_metadata?.full_name || ''}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
                  <input
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-400 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-pink-400" /> Notifications</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">Meeting summaries</p>
                    <p className="text-xs text-gray-500 mt-0.5">Receive email with AI summary after meetings</p>
                  </div>
                  <div onClick={() => toggle('aiSummaries')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.aiSummaries ? 'bg-indigo-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.aiSummaries ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                <div className="h-px bg-white/5 w-full" />
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">Action item reminders</p>
                    <p className="text-xs text-gray-500 mt-0.5">Daily reminder of pending tasks</p>
                  </div>
                  <div onClick={() => toggle('actionItemReminders')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.actionItemReminders ? 'bg-indigo-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.actionItemReminders ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>

            {/* Meeting Defaults */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Camera className="w-5 h-5 text-cyan-400" /> Meeting Defaults</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">Camera on by default</p>
                  </div>
                  <div onClick={() => toggle('cameraDefault')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.cameraDefault ? 'bg-indigo-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.cameraDefault ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                <div className="h-px bg-white/5 w-full" />
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">Microphone on by default</p>
                  </div>
                  <div onClick={() => toggle('micDefault')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.micDefault ? 'bg-indigo-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.micDefault ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                <div className="h-px bg-white/5 w-full" />
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">Blur background</p>
                  </div>
                  <div onClick={() => toggle('blurBackground')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.blurBackground ? 'bg-indigo-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.blurBackground ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-sm font-semibold">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-70">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
