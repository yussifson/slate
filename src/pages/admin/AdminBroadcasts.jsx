import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

export default function AdminBroadcasts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase.from('companies').select('id');
      if (data) setCompanies(data);
    };
    fetchCompanies();
  }, []);

  const handleBroadcast = async () => {
    if (!announcementText) return;
    setBroadcasting(true);
    try {
      const notificationInserts = companies.map(c => ({
        company_id: c.id,
        title: "Platform Broadcast Notice",
        message: announcementText,
        type: "system",
        status: "unread"
      }));
      
      const { error } = await supabase.from('notifications').insert(notificationInserts);
      if (error) throw error;

      toast({ title: "System Broadcast Sent", description: "Successfully pushed notification alert to all law firms." });
      setAnnouncementText('');
    } catch (err) {
      toast({ title: "Broadcast failed", description: err.message, variant: "destructive" });
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="System Broadcasts" 
        subtitle="Push release notes, maintenance alerts, or notifications to all tenants." 
      />
      <div className="bg-card border border-border rounded-2xl p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-primary flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{t("compose_broadcast", "Compose Broadcast")}</h3>
            <p className="text-sm text-slate-500">{t(
              "this_message_will_appear_in_th",
              "This message will appear in the notification bell for all active firms."
            )}</p>
          </div>
        </div>
        
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{t("message_body", "Message Body")}</label>
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Scheduled maintenance this Saturday at 2:00 AM UTC. Expect 15 minutes of downtime."
              rows={6}
              className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50/50 hover:bg-slate-50 transition-colors resize-none"
            />
          </div>
          
          <Button 
            onClick={handleBroadcast}
            disabled={broadcasting || !announcementText}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            {broadcasting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("broadcasting_to", "Broadcasting to")} {companies.length} {t("firms", "firms...")}
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                {t("push_notification_to_all_tenan", "Push Notification to All Tenants")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
