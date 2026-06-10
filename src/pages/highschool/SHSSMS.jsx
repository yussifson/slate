import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, MessageSquare, History, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSSMS() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [newSms, setNewSms] = useState({
    targetGroup: 'All Parents',
    customNumbers: '',
    messageText: ''
  });
  const [isSending, setIsSending] = useState(false);

  // Retrieve standard balance from settings or API in production
  const smsBalance = 15420;

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_sms_log', user?.company_id);
      records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMessages(records);
    } catch (error) {
      console.error('Failed to fetch SMS logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchMessages();
    }
  }, [user]);

  const handleSendSms = async () => {
    setIsSending(true);
    try {
      let recipientCount = 0;
      if (newSms.targetGroup === 'Custom') recipientCount = newSms.customNumbers.split(',').length;
      else if (newSms.targetGroup.includes('All')) recipientCount = 450;
      else if (newSms.targetGroup.includes('Form')) recipientCount = 150;
      else recipientCount = 30; // Defaulters
                           
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_sms_log',
        title: `SMS to ${newSms.targetGroup}`,
        case_number: `SMS-${Math.floor(Math.random() * 100000)}`,
        status: 'Sent',
        data: {
          targetGroup: newSms.targetGroup,
          messageText: newSms.messageText,
          recipientCount,
          sentDate: new Date().toISOString(),
          senderName: user?.full_name || 'Admin'
        }
      };
      
      // Simulate API delay for sending
      await new Promise(r => setTimeout(r, 1500));
      await base44.createEntity(payload);
      
      setIsSendModalOpen(false);
      setNewSms({ targetGroup: 'All Parents', customNumbers: '', messageText: '' });
      fetchMessages();
    } catch (error) {
      console.error('Failed to send SMS:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.data?.messageText?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 bg-clip-text text-transparent">
            SMS Gateway
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Send bulk text messages to parents, staff, and students.
          </p>
        </div>
        
        <Button onClick={() => setIsSendModalOpen(true)} className="h-9 gap-2 rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white shadow-md shadow-emerald-500/20">
          <Send className="w-4 h-4" /> Compose Message
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-slate-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-primary/70 shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Available SMS Units</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{smsBalance.toLocaleString()}</h3>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg h-8 border-slate-200 dark:border-slate-700">Top Up</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="w-5 h-5 text-primary dark:text-primary/70" /> Message History
              </CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
              <Input 
                placeholder="Search message content..." 
                className="pl-9 h-9 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary dark:focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400">Loading SMS logs...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary dark:text-primary" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 dark:text-slate-200">No messages sent</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">Your sent SMS blasts will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="p-6 hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-primary dark:text-primary/70 border-none">
                        {msg.data?.targetGroup}
                      </Badge>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {msg.data?.recipientCount} Recipients
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400 font-medium">
                      {new Date(msg.data?.sentDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 dark:text-slate-200 whitespace-pre-wrap">
                    {msg.data?.messageText}
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400">
                    <span>Sent by: {msg.data?.senderName}</span>
                    <span className="text-primary font-bold flex items-center gap-1">
                      <Badge className="bg-primary hover:bg-primary border-none px-2 py-0 h-5">Delivered</Badge>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-primary/90 via-primary/80 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Compose SMS Blast</DialogTitle>
              <DialogDescription className="text-primary/10 dark:text-primary/70">
                Send a text message to multiple recipients instantly.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Target Group</label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary font-semibold text-slate-700 dark:text-slate-300 dark:text-slate-200"
                value={newSms.targetGroup}
                onChange={e => setNewSms({...newSms, targetGroup: e.target.value})}
              >
                <option value="All Parents">All Parents</option>
                <option value="Form 1 Parents">Form 1 Parents Only</option>
                <option value="Form 3 Parents">Form 3 Parents Only</option>
                <option value="All Staff">All Teaching & Non-Teaching Staff</option>
                <option value="Defaulters">Parents with Fee Arrears</option>
                <option value="Custom">Custom Numbers</option>
              </select>
            </div>

            {newSms.targetGroup === 'Custom' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Custom Numbers (Comma separated)</label>
                <textarea 
                  placeholder="e.g. 0241234567, 0501234567"
                  className="w-full h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary resize-none text-sm font-mono"
                  value={newSms.customNumbers}
                  onChange={e => setNewSms({...newSms, customNumbers: e.target.value})}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Message Content</label>
                <span className={`text-xs font-mono ${newSms.messageText.length > 160 ? 'text-amber-500 font-bold' : 'text-slate-400 dark:text-slate-500 dark:text-slate-400'}`}>
                  {newSms.messageText.length} / 160 chars ({Math.ceil(Math.max(1, newSms.messageText.length) / 160)} page)
                </span>
              </div>
              <textarea 
                placeholder="Type your message here..."
                className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary resize-none text-sm"
                value={newSms.messageText}
                onChange={e => setNewSms({...newSms, messageText: e.target.value})}
              />
            </div>
            
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary dark:text-primary/70 shrink-0 mt-0.5" />
              <p className="text-xs text-primary/70 dark:text-primary/10 leading-relaxed">
                Messages exceeding 160 characters will be charged as multiple SMS units per recipient. Estimated cost for this blast will be calculated before sending.
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-900/40 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleSendSms} 
              disabled={!newSms.messageText || (newSms.targetGroup === 'Custom' && !newSms.customNumbers) || isSending}
              className="rounded-xl bg-primary dark:bg-primary hover:bg-primary/90 dark:hover:bg-primary text-white font-bold px-6"
            >
              {isSending ? 'Sending Blast...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
