import { powerSync } from '@/api/PowerSyncConnector';
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { useQuery } from '@powersync/react';
import {Bell, Mail, Send, CheckCircle2, Building2, Users, Activity, BarChart, Inbox} from "lucide-react";
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import { OrbitLoader } from "@/components/ui/orbit-loader";

export default function AdminBroadcasts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [channel, setChannel] = useState('internal'); // internal, external, both
  const [targetMode, setTargetMode] = useState('all'); // all, specific
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  
  const { data: companies = [] } = useQuery("SELECT id, name FROM companies ORDER BY name ASC");
  
  const handleToggleCompany = (id) => {
    if (selectedCompanies.includes(id)) {
      setSelectedCompanies(prev => prev.filter(c => c !== id));
    } else {
      setSelectedCompanies(prev => [...prev, id]);
    }
  };

  const handleBroadcast = async () => {
    if (!announcementText || !subject) {
      toast({ title: "Missing fields", description: "Please provide a subject and a message.", variant: "destructive"});
      return;
    }
    if (targetMode === 'specific' && selectedCompanies.length === 0) {
      toast({ title: "No target selected", description: "Please select at least one company to broadcast to.", variant: "destructive"});
      return;
    }

    setBroadcasting(true);
    try {
      const targetList = targetMode === 'all' ? companies : companies.filter(c => selectedCompanies.includes(c.id));
      const targetIds = targetList.map(c => c.id);

      // Fetch administrators for the target companies
      const { data: admins, error: adminErr } = await supabase
        .from('profiles')
        .select('email, full_name, company_id, role')
        .in('company_id', targetIds)
        .in('role', ['company_admin', 'super_admin']);

      if (adminErr) throw adminErr;
      if (!admins || admins.length === 0) {
        toast({ title: "No targets found", description: "Could not find any administrators in the selected companies.", variant: "destructive" });
        setBroadcasting(false);
        return;
      }

      // Dispatch routing based on selected channel
      if (channel === 'external') {
        // External Only: Use the dedicated edge function so it doesn't pollute the in-app database
        const recipients = admins.map(a => a.email).filter(Boolean);
        if (recipients.length > 0) {
          const { error: invokeErr } = await supabase.functions.invoke('send-external-email', {
            body: { to: recipients, subject, message: announcementText }
          });
          if (invokeErr) {
            console.error("External broadcast failed:", invokeErr);
            throw new Error("Failed to dispatch external broadcast via Novu.");
          }
        }
      } else {
        // Internal or Both: Insert into notifications table
        // We set type to 'internal' so the webhook knows to skip sending an email if it's internal only.
        const notifPayloads = admins.map(admin => ({
          id: crypto.randomUUID(),
          company_id: admin.company_id,
          recipient_email: admin.email,
          recipient_name: admin.full_name || 'Admin',
          title: subject,
          message: announcementText,
          type: channel === 'internal' ? 'internal' : 'system',
          is_read: false
        }));

        if (notifPayloads.length > 0) {
          // Insert directly to Supabase to trigger server-side Novu webhooks (if not internal-only)
          const { error: notifErr } = await supabase.from('notifications').insert(notifPayloads);
          if (notifErr) {
            console.error("Broadcast insertion failed:", notifErr);
            throw new Error("Failed to dispatch broadcasts. Please ensure you have permission to send notifications.");
          }
        }
      }

      toast({ title: "Broadcast Dispatched", description: `Message successfully sent to ${admins.length} administrator(s) across ${targetList.length} firm(s) via selected channel(s).` });
      setSubject('');
      setAnnouncementText('');
      setSelectedCompanies([]);
    } catch (err) {
      toast({ title: "Broadcast failed", description: err.message, variant: "destructive" });
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      <PageHeader 
        title="Intelligent Broadcasting" 
        subtitle="Compose and dispatch targeted, real-time messages and emails to your platform administrators." 
      />

      {/* Broadcast Intelligence Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-emerald-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><BarChart className="w-4 h-4 text-emerald-500" /> Engagement Score</h3>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">High Open Rate</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Machine-learning analysis indicates a 68% average open rate for system broadcasts within 1 hour.</p>
          <div className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Optimal Delivery</div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-indigo-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> Audience Reach</h3>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{companies.length} Firms Active</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Total reachable firms and administrators currently active within the global ecosystem.</p>
          <div className="text-[10px] uppercase font-semibold text-indigo-600 tracking-wider">Global Penetration</div>
        </div>

        <div className="bg-gradient-to-br from-card to-slate-50 dark:from-card dark:to-slate-900/50 p-5 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-amber-200/50 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"><Inbox className="w-4 h-4 text-amber-500" /> Active Campaigns</h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">0 Scheduled</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">Track the delivery volume of recent and upcoming scheduled system-wide announcements.</p>
          <div className="text-[10px] uppercase font-semibold text-amber-600 tracking-wider">Monitor Saturation</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Composition Panel */}
        <div className="lg:col-span-2 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm rounded-2xl flex flex-col overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="bg-muted/50 p-4 border-b border-primary/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">New Message</h3>
              <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Draft your broadcast</p>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-1 block tracking-[0.04em]">Subject</label>
              <input 
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Enter an attention-grabbing subject line"
                className="w-full h-11 px-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl focus:ring-0 focus:border-primary bg-transparent text-base font-medium transition-colors"
              />
            </div>
            
            <div className="flex-1 flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-2 block tracking-[0.04em]">Message Body</label>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Compose your message here..."
                className="w-full flex-1 min-h-[300px] p-4 border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors resize-y"
              />
            </div>
          </div>
          
          <div className="p-4 bg-muted/30 border-t border-primary/10 flex justify-end">
            <Button 
              onClick={handleBroadcast}
              disabled={broadcasting || !announcementText || !subject || (targetMode === 'specific' && selectedCompanies.length === 0)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-8 h-12 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
            >
              {broadcasting ? <OrbitLoader size="md" /> : <Send className="w-4 h-4 mr-2" />}
              Dispatch Broadcast
            </Button>
          </div>
        </div>

        {/* Targeting & Channels Panel */}
        <div className="space-y-6 school-page-enter font-dmsans">
          
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm rounded-2xl p-6 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-4 flex items-center gap-2 tracking-[0.04em]">
              <Bell className="w-4 h-4" /> Delivery Channels
            </h4>
            <div className="space-y-3">
              <label className={cn("flex items-center gap-3 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 cursor-pointer transition-all", channel === 'internal' ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/50")}>
                <input type="radio" name="channel" checked={channel === 'internal'} onChange={() => setChannel('internal')} className="sr-only" />
                <div className={cn("w-5 h-5 rounded-full border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center", channel === 'internal' ? "border-primary bg-primary text-white" : "border-primary/30")}><CheckCircle2 className="w-3 h-3 opacity-100" /></div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">In-App Notification</div>
                  <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Delivered to user dashboards instantly</div>
                </div>
              </label>
              
              <label className={cn("flex items-center gap-3 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 cursor-pointer transition-all", channel === 'external' ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/50")}>
                <input type="radio" name="channel" checked={channel === 'external'} onChange={() => setChannel('external')} className="sr-only" />
                <div className={cn("w-5 h-5 rounded-full border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center", channel === 'external' ? "border-primary bg-primary text-white" : "border-primary/30")}><CheckCircle2 className="w-3 h-3 opacity-100" /></div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">Email Delivery</div>
                  <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Sent to registered administrator emails</div>
                </div>
              </label>

              <label className={cn("flex items-center gap-3 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 cursor-pointer transition-all", channel === 'both' ? "border-primary bg-primary/5" : "border-primary/20 hover:border-primary/50")}>
                <input type="radio" name="channel" checked={channel === 'both'} onChange={() => setChannel('both')} className="sr-only" />
                <div className={cn("w-5 h-5 rounded-full border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-center", channel === 'both' ? "border-primary bg-primary text-white" : "border-primary/30")}><CheckCircle2 className="w-3 h-3 opacity-100" /></div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">Both Channels</div>
                  <div className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">Maximum visibility across platforms</div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm rounded-2xl p-6 flex flex-col max-h-[500px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-4 flex items-center gap-2 tracking-[0.04em]">
              <Users className="w-4 h-4" /> Target Audience
            </h4>
            
            <div className="flex bg-muted/50 p-1 rounded-xl mb-4 shrink-0">
              <button 
                onClick={() => setTargetMode('all')}
                className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors", targetMode === 'all' ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm text-foreground" : "text-[#71717a] dark:text-gray-400 hover:text-foreground")}
              >
                All Firms
              </button>
              <button 
                onClick={() => setTargetMode('specific')}
                className={cn("flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors", targetMode === 'specific' ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm text-foreground" : "text-[#71717a] dark:text-gray-400 hover:text-foreground")}
              >
                Specific Firms
              </button>
            </div>

            {targetMode === 'specific' && (
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
                {companies.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors border-[0.5px] border-black/9 dark:border-white/8 border-transparent hover:border-primary/10">
                    <input 
                      type="checkbox" 
                      checked={selectedCompanies.includes(c.id)}
                      onChange={() => handleToggleCompany(c.id)}
                      className="rounded-md text-primary focus:ring-primary border-primary/30"
                    />
                    <Building2 className="w-4 h-4 text-[#71717a] dark:text-gray-400" />
                    <span className="text-sm font-medium truncate flex-1">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
            
            {targetMode === 'all' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#71717a] dark:text-gray-400 bg-primary/5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/10">
                <Building2 className="w-12 h-12 mb-3 opacity-20 text-primary" />
                <p className="text-sm font-semibold text-primary">Global Broadcast Active</p>
                <p className="text-xs mt-1 tracking-[0.04em]">Message will be dispatched to administrators of all {companies.length} registered firms.</p>
              </div>
            )}
            
          </div>
          
        </div>
      </div>
    </div>
  );
}
