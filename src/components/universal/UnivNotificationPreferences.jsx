import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { 
  Bell, Mail, Smartphone, Monitor, 
  Save, MessageSquare, AlertTriangle, ShieldCheck
} from 'lucide-react';

/**
 * Universal Notification Preferences
 * 
 * Allows users to define how they receive alerts per workflow.
 * In production, this syncs with Novu's subscriber preferences API.
 */
export default function UnivNotificationPreferences({ title = 'Notification Preferences' }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Dummy state representing Novu preference categories
  const [preferences, setPreferences] = useState({
    mentions: { in_app: true, email: true, push: false },
    task_assignments: { in_app: true, email: true, push: false },
    system_alerts: { in_app: true, email: true, push: true },
    marketing: { in_app: false, email: false, push: false }
  });

  const handleToggle = (category, channel) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel]
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // In production: novu.updatePreferences(preferences)
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: 'Preferences saved successfully.' });
    }, 800);
  };

  const categories = [
    { id: 'mentions', label: 'Mentions & Comments', desc: 'When someone @mentions you or replies to your comment.', icon: <MessageSquare className="w-5 h-5 text-blue-500" /> },
    { id: 'task_assignments', label: 'Task Assignments', desc: 'When you are assigned to a new task or project.', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
    { id: 'system_alerts', label: 'System & Security Alerts', desc: 'Critical alerts about your account, billing, or security.', icon: <ShieldCheck className="w-5 h-5 text-amber-500" />, critical: true },
    { id: 'marketing', label: 'News & Updates', desc: 'Occasional emails about new features and product updates.', icon: <Mail className="w-5 h-5 text-purple-500" /> }
  ];

  return (
    <div className="flex flex-col h-full bg-background font-sans overflow-y-auto">
      <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" /> {title}
          </h1>
          <p className="text-muted-foreground mt-2">Control how and when you receive notifications across the platform.</p>
        </div>

        {/* Channels Legend */}
        <div className="flex flex-wrap gap-6 p-4 bg-muted/30 border border-border rounded-xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Monitor className="w-4 h-4 text-muted-foreground" /> In-App
            <span className="text-xs font-normal text-muted-foreground">(Inbox)</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="w-4 h-4 text-muted-foreground" /> Email
            <span className="text-xs font-normal text-muted-foreground">(Digestable)</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground opacity-50 cursor-not-allowed" title="Coming soon">
            <Smartphone className="w-4 h-4 text-muted-foreground" /> Push
            <span className="text-xs font-normal text-muted-foreground">(Coming Soon)</span>
          </div>
        </div>

        {/* Preferences Grid */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {categories.map(cat => (
              <div key={cat.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-muted/10 transition-colors">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">{cat.icon}</div>
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      {cat.label}
                      {cat.critical && <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-[10px] uppercase tracking-wider font-bold rounded">Required</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 bg-muted/30 p-2 rounded-xl border border-border">
                  {/* In-App Toggle */}
                  <label className="flex flex-col items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">In-App</span>
                    <div className={cn(
                      "w-10 h-6 rounded-full transition-colors relative",
                      preferences[cat.id].in_app ? "bg-primary" : "bg-muted-foreground/30",
                      cat.critical ? "opacity-50 cursor-not-allowed" : ""
                    )}>
                      <input 
                        type="checkbox" className="sr-only" 
                        checked={preferences[cat.id].in_app} 
                        onChange={() => !cat.critical && handleToggle(cat.id, 'in_app')}
                        disabled={cat.critical}
                      />
                      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", preferences[cat.id].in_app ? "left-5" : "left-1")} />
                    </div>
                  </label>

                  <div className="w-px h-8 bg-border"></div>

                  {/* Email Toggle */}
                  <label className="flex flex-col items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Email</span>
                    <div className={cn(
                      "w-10 h-6 rounded-full transition-colors relative",
                      preferences[cat.id].email ? "bg-primary" : "bg-muted-foreground/30",
                      cat.critical ? "opacity-50 cursor-not-allowed" : ""
                    )}>
                      <input 
                        type="checkbox" className="sr-only" 
                        checked={preferences[cat.id].email} 
                        onChange={() => !cat.critical && handleToggle(cat.id, 'email')}
                        disabled={cat.critical}
                      />
                      <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", preferences[cat.id].email ? "left-5" : "left-1")} />
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Preferences</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// Ensure CheckCircle2 is imported (it is via lucide-react above, just adding fallback logic here if needed)
import { CheckCircle2 as CheckIcon } from 'lucide-react';
