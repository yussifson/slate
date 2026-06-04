import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, Mail, Users, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function SHSEmailComms() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({
    subject: '',
    targetGroup: 'All Parents',
    body: ''
  });
  const [isSending, setIsSending] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_email_log', user?.company_id);
      records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setEmails(records);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchEmails();
    }
  }, [user]);

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      const recipientCount = newEmail.targetGroup === 'All Parents' ? 450 : 120; // Mock counts
                           
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_email_log',
        title: newEmail.subject || `Email to ${newEmail.targetGroup}`,
        case_number: `EML-${Math.floor(Math.random() * 100000)}`,
        status: 'Sent',
        data: {
          targetGroup: newEmail.targetGroup,
          subject: newEmail.subject,
          bodyText: newEmail.body,
          recipientCount,
          sentDate: new Date().toISOString(),
          senderName: user?.full_name || 'Admin',
          openRate: Math.floor(Math.random() * 50) + 30 // Mock open rate
        }
      };
      
      // Simulate API delay
      await new Promise(r => setTimeout(r, 2000));
      await base44.createEntity(payload);
      
      setIsSendModalOpen(false);
      setNewEmail({ subject: '', targetGroup: 'All Parents', body: '' });
      fetchEmails();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredEmails = emails.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.data?.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Email Broadcasts
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Send rich HTML emails, newsletters, and attachments.
          </p>
        </div>
        
        <Button onClick={() => setIsSendModalOpen(true)} className="h-9 gap-2 rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white shadow-md shadow-purple-500/20">
          <Mail className="w-4 h-4" /> Compose Email
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#6F00FF]" /> Sent Emails
              </CardTitle>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search subjects..." 
                className="pl-9 h-9 bg-white border-slate-200 rounded-xl focus-visible:ring-[#6F00FF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading email logs...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 mx-auto flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No emails sent</h3>
              <p className="text-sm text-slate-500">Your email broadcasts will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEmails.map((email) => (
                <div key={email.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">{email.data?.subject}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                          {email.data?.targetGroup}
                        </Badge>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1 border-l pl-2 border-slate-200">
                          <Users className="w-3 h-3" /> {email.data?.recipientCount} Recipients
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium block mb-1">
                        {new Date(email.data?.sentDate).toLocaleString()}
                      </span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {email.data?.openRate}% Open Rate
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 mt-3 line-clamp-2 overflow-hidden text-ellipsis whitespace-pre-wrap">
                    {email.data?.bodyText}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-[#6F00FF] to-purple-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Compose Broadcast</DialogTitle>
              <DialogDescription className="text-purple-100">
                Send an email newsletter or alert to a target audience.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 bg-slate-50 space-y-4">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Target Audience</label>
              <select 
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#6F00FF] font-semibold text-slate-700"
                value={newEmail.targetGroup}
                onChange={e => setNewEmail({...newEmail, targetGroup: e.target.value})}
              >
                <option value="All Parents">All Parents</option>
                <option value="Form 1 Parents">Form 1 Parents Only</option>
                <option value="Form 3 Parents">Form 3 Parents Only</option>
                <option value="All Staff">All Teaching & Non-Teaching Staff</option>
                <option value="All Students">All Students (School Email)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Subject Line</label>
              <Input 
                placeholder="e.g. End of Term Newsletter"
                className="bg-white border-slate-200 rounded-xl font-bold"
                value={newEmail.subject}
                onChange={e => setNewEmail({...newEmail, subject: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Message Body</label>
              <div className="border border-slate-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#6F00FF]">
                <div className="bg-slate-100 border-b border-slate-200 p-2 flex gap-2">
                  <div className="h-6 w-6 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-500">B</div>
                  <div className="h-6 w-6 bg-slate-200 rounded flex items-center justify-center text-xs italic text-slate-500">I</div>
                  <div className="h-6 w-6 bg-slate-200 rounded flex items-center justify-center text-xs underline text-slate-500">U</div>
                </div>
                <textarea 
                  placeholder="Dear Parent/Guardian..."
                  className="w-full h-48 p-3 outline-none resize-none text-sm"
                  value={newEmail.body}
                  onChange={e => setNewEmail({...newEmail, body: e.target.value})}
                />
              </div>
            </div>
            
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)} className="rounded-xl font-semibold text-slate-600">
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={!newEmail.subject || !newEmail.body || isSending}
              className="rounded-xl bg-[#6F00FF] hover:bg-[#5200c2] text-white font-bold px-6"
            >
              {isSending ? 'Sending Broadcast...' : 'Send Broadcast'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
