import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Settings, User, Users, Bell, Shield, LogOut, ArrowLeft, Video, CheckCircle, Camera, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import CliPadBilling from './CliPadBilling';
import CliPadTeamSettings from '@/components/clipad/CliPadTeamSettings';

export default function CliPadSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState(user?.full_name || user?.user_metadata?.full_name || '');

  // Settings state (persisted to Supabase)
  const [settings, setSettings] = useState(() => {
    const saved = user?.user_metadata?.clipad_settings;
    if (saved) {
      try {
        return { ...{
          emailNotifs: true,
          actionItemReminders: true,
          aiSummaries: true,
          cameraDefault: true,
          micDefault: true,
          blurBackground: false
        }, ...saved };
      } catch (e) {}
    }
    return {
      emailNotifs: true,
      actionItemReminders: true,
      aiSummaries: true,
      cameraDefault: true,
      micDefault: true,
      blurBackground: false,
      chatMentionsDelivery: 'realtime',
      taskAssignmentDelivery: 'realtime'
    };
  });

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
  
  const updateSetting = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          clipad_settings: settings,
          full_name: fullName
        }
      });
      
      if (error) throw error;
      
      // Update users table
      if (user?.id) {
        await supabase.from('users').update({ full_name: fullName }).eq('id', user.id);
      }
      
      toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to save settings', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-background page-enter text-foreground">
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 h-16 bg-background page-enter/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-primary">
            <CliPadLogo size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight">Settings</span>
        </div>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:-translate-y-0.5"><ArrowLeft className="w-4 h-4 text-slate-500" /> Dashboard</button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-3">
            {[{id: 'profile', icon: User, label: 'Profile'}, {id: 'notifs', icon: Bell, label: 'Notifications'}, {id: 'meeting', icon: Video, label: 'Meeting Defaults'}, ...(['admin', 'company_admin', 'super_admin'].includes(user?.role) ? [{id: 'team', icon: Users, label: 'Team Management'}, {id: 'billing', icon: CreditCard, label: 'Billing & Plans'}] : [])].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all border ${activeTab === tab.id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-foreground border-border hover:bg-secondary/80'}`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-primary/70'}`} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-8">
            
            {activeTab === 'billing' && <CliPadBilling />}
            {activeTab === 'team' && <CliPadTeamSettings />}

            {/* Profile */}
            {activeTab === 'profile' && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Account Profile</h2>
              <div className="flex items-center gap-6 mb-8">
                <img
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.email}`}
                  className="w-20 h-20 rounded-2xl bg-secondary object-cover shadow-sm"
                  alt="Profile"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground">{user?.full_name || 'User'}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Email Address</label>
                  <input
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] dark:bg-black/20 border border-border text-muted-foreground text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifs' && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notifications</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Meeting summaries</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive email with AI summary after meetings</p>
                  </div>
                  <div onClick={() => toggle('aiSummaries')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.aiSummaries ? 'bg-primary' : 'bg-secondary/80'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.aiSummaries ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                <div className="h-px bg-secondary w-full" />
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Action item reminders</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Daily reminder of pending tasks</p>
                  </div>
                  <div onClick={() => toggle('actionItemReminders')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.actionItemReminders ? 'bg-primary' : 'bg-secondary/80'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.actionItemReminders ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                <div className="h-px bg-secondary w-full" />
                
                {/* NEW PHASE 1 NOTIFICATIONS */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Chat Mentions</p>
                    <p className="text-xs text-muted-foreground mt-0.5">When someone @mentions you in chat</p>
                  </div>
                  <select 
                    value={settings.chatMentionsDelivery || 'realtime'} 
                    onChange={(e) => updateSetting('chatMentionsDelivery', e.target.value)}
                    className="bg-secondary border border-border text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                    <option value="off">Off</option>
                  </select>
                </div>
                <div className="h-px bg-secondary w-full" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Task Assignments</p>
                    <p className="text-xs text-muted-foreground mt-0.5">When you are assigned a new task</p>
                  </div>
                  <select 
                    value={settings.taskAssignmentDelivery || 'realtime'} 
                    onChange={(e) => updateSetting('taskAssignmentDelivery', e.target.value)}
                    className="bg-secondary border border-border text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                    <option value="off">Off</option>
                  </select>
                </div>
              </div>
            </div>
            )}

            {/* Meeting Defaults */}
            {activeTab === 'meeting' && (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> Meeting Defaults</h2>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Camera on by default</p>
                  </div>
                  <div onClick={() => toggle('cameraDefault')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.cameraDefault ? 'bg-primary' : 'bg-secondary/80'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.cameraDefault ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                <div className="h-px bg-secondary w-full" />
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Microphone on by default</p>
                  </div>
                  <div onClick={() => toggle('micDefault')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.micDefault ? 'bg-primary' : 'bg-secondary/80'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.micDefault ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                <div className="h-px bg-secondary w-full" />
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">Blur background</p>
                  </div>
                  <div onClick={() => toggle('blurBackground')} className={`w-10 h-6 rounded-full transition-colors relative ${settings.blurBackground ? 'bg-primary' : 'bg-secondary/80'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.blurBackground ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors text-sm font-semibold">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-foreground font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-70">
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
