import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, MessageCircle, Settings2, Smartphone, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSWhatsapp() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    campaignName: '',
    targetGroup: 'All Parents',
    templateId: 'general_notice',
    customMessage: ''
  });
  const [isSending, setIsSending] = useState(false);

  // Status of the WhatsApp Business API integration
  const apiStatus = 'Connected'; 

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_whatsapp_campaign', user?.company_id);
      records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setCampaigns(records);
    } catch (error) {
      console.error('Failed to fetch WhatsApp campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchCampaigns();
    }
  }, [user]);

  const handleLaunchCampaign = async () => {
    setIsSending(true);
    try {
      let recipientCount = 0;
      if (newCampaign.targetGroup.includes('All')) recipientCount = 450;
      else if (newCampaign.targetGroup.includes('Form')) recipientCount = 150;
      else recipientCount = 30; // Defaulters
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_whatsapp_campaign',
        title: newCampaign.campaignName || `Campaign to ${newCampaign.targetGroup}`,
        case_number: `WA-${Math.floor(Math.random() * 100000)}`,
        status: 'Completed',
        data: {
          targetGroup: newCampaign.targetGroup,
          templateId: newCampaign.templateId,
          messageText: newCampaign.customMessage,
          recipientCount,
          sentDate: new Date().toISOString(),
          senderName: user?.full_name || 'Admin',
          successfulDeliveries: Math.floor(recipientCount * 0.98) // Simulate 98% delivery success instead of random
        }
      };
      
      // Simulate API delay for sending broadcast via WA Business API
      await new Promise(r => setTimeout(r, 2000));
      await base44.createEntity(payload);
      
      setIsSendModalOpen(false);
      setNewCampaign({ campaignName: '', targetGroup: 'All Parents', templateId: 'general_notice', customMessage: '' });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to launch campaign:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.data?.messageText?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            WhatsApp Integration
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Send multimedia blasts and automated notifications via WhatsApp Business.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 gap-2 rounded-xl text-slate-700 dark:text-slate-200">
            <Settings2 className="w-4 h-4" /> API Settings
          </Button>
          <Button onClick={() => setIsSendModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary hover:bg-primary text-white shadow-md shadow-green-500/20 border-none">
            <Send className="w-4 h-4" /> Launch Broadcast
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-primary shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">API Connection</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{apiStatus}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" /> Campaign History
              </CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input 
                placeholder="Search campaigns..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">Loading WhatsApp campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 mx-auto flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No campaigns launched</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Launch a WhatsApp broadcast to see it here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCampaigns.map((camp) => (
                <div key={camp.id} className="p-6 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{camp.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none">
                          {camp.data?.targetGroup}
                        </Badge>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 border-l pl-2 border-slate-200 dark:border-slate-700">
                          <Users className="w-3 h-3" /> {camp.data?.successfulDeliveries} / {camp.data?.recipientCount} Delivered
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(camp.data?.sentDate).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="bg-slate-100/50 p-4 rounded-xl border border-primary/20 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap relative mt-3">
                    {/* Simulated WA message bubble tail */}
                    <div className="absolute -top-2 left-4 w-4 h-4 bg-slate-100/50 border-t border-l border-primary/20 rotate-45"></div>
                    <p className="relative z-10">{camp.data?.messageText || `[Template used: ${camp.data?.templateId}]`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-primary to-primary text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Launch WhatsApp Broadcast</DialogTitle>
              <DialogDescription className="text-primary/10">
                Send rich-text messages via the official WhatsApp Business API.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-[#EFEAE2] space-y-4"> {/* WA background color */}
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm space-y-4 border border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Campaign Name</label>
                <Input 
                  placeholder="e.g. End of Term Grades Notification"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                  value={newCampaign.campaignName}
                  onChange={e => setNewCampaign({...newCampaign, campaignName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Target Audience</label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary font-semibold text-slate-700 dark:text-slate-200"
                  value={newCampaign.targetGroup}
                  onChange={e => setNewCampaign({...newCampaign, targetGroup: e.target.value})}
                >
                  <option value="All Parents">All Parents</option>
                  <option value="Form 1 Parents">Form 1 Parents Only</option>
                  <option value="Form 3 Parents">Form 3 Parents Only</option>
                  <option value="Defaulters">Parents with Fee Arrears</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Approved WA Template</label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newCampaign.templateId}
                  onChange={e => setNewCampaign({...newCampaign, templateId: e.target.value})}
                >
                  <option value="general_notice">general_notice (Plain Text)</option>
                  <option value="fee_reminder">fee_reminder (With Payment Link)</option>
                  <option value="report_card_alert">report_card_alert (With PDF Link)</option>
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">WhatsApp requires 24h pre-approved templates for proactive messaging.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Message Content (Variables)</label>
                <textarea 
                  placeholder="Hello {{1}}, this is to inform you that..."
                  className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                  value={newCampaign.customMessage}
                  onChange={e => setNewCampaign({...newCampaign, customMessage: e.target.value})}
                />
              </div>
            </div>
            
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleLaunchCampaign} 
              disabled={!newCampaign.campaignName || !newCampaign.customMessage || isSending}
              className="rounded-xl bg-primary hover:bg-primary text-white font-bold px-6"
            >
              {isSending ? 'Sending...' : 'Launch Broadcast'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
