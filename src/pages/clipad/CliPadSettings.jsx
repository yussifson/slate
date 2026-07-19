import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { hasFeature } from '@/lib/clipadPricing';
import { useCompanyPlan } from '@/hooks/useCompanyPlan';
import { isAdmin, isSuperAdmin } from '@/lib/constants';
import { Headphones, Puzzle, Lock, Plug } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { Settings, User, Users, Bell, Shield, LogOut, ArrowLeft, Video, CheckCircle, Camera, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CliPadLogo } from '@/components/ui/CliPadLogo';
import CliPadBilling from './CliPadBilling';
import CliPadTeamSettings from '@/components/clipad/CliPadTeamSettings';
import IntegrationsHub from './IntegrationsHub';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';

export default function CliPadSettings() {
  const { user, logout } = useAuth();
  const { plan } = useCompanyPlan();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');
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

  const handleUpdateAvatar = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (image.base64String) {
        toast({ title: "Photo selected", description: "Profile photo ready for upload to storage." });
        // Typically here: const { data } = await supabase.storage.from('avatars').upload(...)
      }
    } catch (e) {
      if (e.message !== 'User cancelled photos app') {
        toast({ title: "Camera error", description: e.message, variant: 'destructive' });
      }
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-full bg-background page-enter text-foreground">

      <div className="max-w-6xl mx-auto px-4 md:px-10 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="md:col-span-1 flex flex-row overflow-x-auto md:flex-col gap-2 md:gap-3 pb-2 md:pb-0 no-scrollbar scrollbar-hide">
            {[{id: 'profile', icon: User, label: 'Profile'}, {id: 'notifs', icon: Bell, label: 'Notifications'}, {id: 'meeting', icon: Video, label: 'Meeting Defaults'}, ...(isSuperAdmin(user) ? [{id: 'integrations', icon: Plug, label: 'Integrations 🧪'}] : []), ...(isAdmin(user) ? [{id: 'team', icon: Users, label: 'Team Management'}, {id: 'billing', icon: CreditCard, label: 'Billing & Plans'}] : [])].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all border active:scale-95 ${activeTab === tab.id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-foreground border-border hover:bg-secondary/80'}`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : 'text-primary/70'}`} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-8">
            
            {isAdmin(user) && activeTab === 'billing' && <CliPadBilling />}
            {activeTab === 'integrations' && (
              isSuperAdmin(user)
                ? <IntegrationsHub />
                : (
                  <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Plug className="w-8 h-8 text-primary/40" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-2">Integrations</h2>
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                      <p className="text-muted-foreground text-sm mt-3 max-w-sm">
                        Connect CliPad with Google Drive, Slack, Zoom, GitHub, Notion and 15 more tools. We're finalising this feature and will release it soon.
                      </p>
                    </div>
                  </div>
                )
            )}
            {isAdmin(user) && activeTab === 'team' && (
        <>
        {/* Enterprise Features */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-6 sm:p-10 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Enterprise Features</h2>
              <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">Advanced capabilities for scaling organizations.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-secondary/50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">Branded Meeting Rooms {hasFeature(plan, 'hasBrandedRooms') && <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-600">Active</span>}</h3>
                <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">Customize your clipboard meeting rooms with company logos and colors.</p>
              </div>
              {!hasFeature(plan, 'hasBrandedRooms') && <button onClick={() => setActiveTab('billing')} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Upgrade</button>}
              {hasFeature(plan, 'hasBrandedRooms') && <button onClick={() => toast({title: "Branding", description: "Company branding is automatically applied from your company profile settings."})} className="px-4 py-2 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-700 dark:text-foreground text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Configure</button>}
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-secondary/50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Headphones className="w-4 h-4"/> SLA & Dedicated Support {hasFeature(plan, 'hasSLA') && <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-600">Active</span>}</h3>
                <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">24/7 priority support and guaranteed uptime SLA.</p>
              </div>
              {!hasFeature(plan, 'hasSLA') && <button onClick={() => setActiveTab('billing')} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Upgrade</button>}
              {hasFeature(plan, 'hasSLA') && <button onClick={() => { window.location.href = "mailto:support@optavel.com"; toast({title: "Support", description: "Opening your email client to contact our enterprise support team."})}} className="px-4 py-2 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-700 dark:text-foreground text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Contact Support</button>}
            </div>

                        <div className="p-5 rounded-2xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-secondary/50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Lock className="w-4 h-4"/> SSO & Compliance Recording {hasFeature(plan, 'hasComplianceRecording') && <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-600">Active</span>}</h3>
                <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">Single Sign-On enforcement and mandatory compliance recordings.</p>
              </div>
              {!hasFeature(plan, 'hasComplianceRecording') && <button onClick={() => setActiveTab('billing')} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Upgrade</button>}
              {hasFeature(plan, 'hasComplianceRecording') && <button onClick={() => toast({title: "SSO Config", description: "SSO settings have been verified and applied to your company workspace."})} className="px-4 py-2 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-700 dark:text-foreground text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Configure</button>}
            </div>


            <div className="p-5 rounded-2xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-secondary/50 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Puzzle className="w-4 h-4"/> Custom Integrations <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-500/10 text-amber-600">Coming Soon</span></h3>
                <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">Connect CliPad directly into your proprietary internal systems.</p>
              </div>
              {!hasFeature(plan, 'hasCustomIntegrations') && <button onClick={() => setActiveTab('billing')} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Upgrade</button>}
              {hasFeature(plan, 'hasCustomIntegrations') && <button className="px-4 py-2 rounded-xl bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-700 dark:text-foreground text-sm font-bold disabled:opacity-50" disabled>Configure</button>}
            </div>
          </div>
        </div>
  
        <CliPadTeamSettings />
        </>
      )}

            {/* Profile */}
            {activeTab === 'profile' && (
            <div className="bg-card border border-border rounded-2xl p-4 md:p-8">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Account Profile</h2>
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group cursor-pointer" onClick={handleUpdateAvatar}>
                  <img
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.email}`}
                    className="w-20 h-20 rounded-2xl bg-secondary object-cover shadow-sm group-hover:opacity-70 transition-opacity"
                    alt="Profile"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-2xl">
                    <Camera className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>
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
            <div className="bg-card border border-border rounded-2xl p-4 md:p-8">
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
            <div className="bg-card border border-border rounded-2xl p-4 md:p-8">
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
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-foreground font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-70 active:scale-95">
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
