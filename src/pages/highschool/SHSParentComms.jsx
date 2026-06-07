import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, Users, MessageSquare, Mail, Smartphone, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function SHSParentComms() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [message, setMessage] = useState({
    type: 'SMS', // SMS, Email, App Push
    subject: '',
    body: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentData, classData] = await Promise.all([
          base44.getEntities('shs_student', user?.company_id),
          base44.getEntities('shs_class', user?.company_id)
        ]);
        setStudents(studentData.filter(s => s.status === 'Active'));
        setClasses(classData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.company_id) {
      fetchData();
    }
  }, [user]);

  const handleSelectAll = (filteredList) => {
    if (selectedStudents.length === filteredList.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredList.map(s => s.id));
    }
  };

  const toggleStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSendMessage = async () => {
    setIsSending(true);
    try {
      // Simulate sending messages
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_communication_log',
        title: message.subject || `Bulk ${message.type} to ${selectedStudents.length} Parents`,
        case_number: `MSG-${Math.floor(Math.random() * 100000)}`,
        status: 'Sent',
        data: {
          ...message,
          recipientCount: selectedStudents.length,
          sentDate: new Date().toISOString()
        }
      };
      
      await base44.createEntity(payload);
      
      setIsComposeOpen(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
      setSelectedStudents([]);
      setMessage({ type: 'SMS', subject: '', body: '' });
    } catch (error) {
      console.error('Failed to send messages:', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesClass = selectedClassId === 'all' || s.data?.classRoom === classes.find(c => c.id === selectedClassId)?.title;
    const matchesSearch = s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.data?.parentName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
            Parent Communications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Send bulk SMS, Emails, and Portal Notifications to parents and guardians.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {sendSuccess && (
            <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1.5 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Message Sent Successfully
            </Badge>
          )}
          <Button 
            onClick={() => setIsComposeOpen(true)} 
            disabled={selectedStudents.length === 0}
            className="h-10 gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 px-6 font-bold"
          >
            <Send className="w-4 h-4" /> Compose Message ({selectedStudents.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Contact List */}
        <Card className="lg:col-span-4 rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4 p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1 max-w-xs">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Filter by Class
                </label>
                <select 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 font-semibold text-slate-700 dark:text-slate-200"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="all">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2 flex-1 max-w-sm">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Search Parent or Student
                </label>
                <Input 
                  placeholder="Type name..." 
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => handleSelectAll(filteredStudents)}
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:bg-slate-800"
                >
                  {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 
                    ? 'Deselect All' 
                    : 'Select All in View'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500">Loading directory...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-emerald-500 dark:text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No contacts found</h3>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-600 dark:focus:ring-emerald-500"
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onChange={() => handleSelectAll(filteredStudents)}
                        />
                      </th>
                      <th className="px-6 py-4">Parent / Guardian</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Contact Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => {
                      const isSelected = selectedStudents.includes(student.id);
                      return (
                        <tr 
                          key={student.id} 
                          className={`transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50'}`}
                          onClick={() => toggleStudent(student.id)}
                        >
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-600 dark:focus:ring-emerald-500"
                              checked={isSelected}
                              onChange={() => {}} // handled by row click
                            />
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{student.data?.parentName || 'Unknown Guardian'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{student.data?.parentRelation || 'Parent'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 text-xs shrink-0">
                                {student.title.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">{student.title}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">{student.data?.classRoom || 'No Class'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {student.data?.parentPhone ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                                  {student.data.parentPhone}
                                </div>
                              ) : (
                                <div className="text-xs text-rose-400 italic">No Phone</div>
                              )}
                              {student.data?.parentEmail && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
                                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                                  {student.data.parentEmail}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
          <div className="p-6 bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Compose Message</DialogTitle>
              <DialogDescription className="text-emerald-100 dark:text-emerald-900">
                Sending to {selectedStudents.length} selected recipients.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Message Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setMessage({...message, type: 'SMS'})}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    message.type === 'SMS' ? 'bg-emerald-50 dark:bg-slate-800 border-purple-300 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-bold">SMS Text</span>
                </button>
                <button
                  onClick={() => setMessage({...message, type: 'Email'})}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    message.type === 'Email' ? 'bg-emerald-50 dark:bg-slate-800 border-purple-300 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-xs font-bold">Email</span>
                </button>
                <button
                  onClick={() => setMessage({...message, type: 'App Push'})}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    message.type === 'App Push' ? 'bg-emerald-50 dark:bg-slate-800 border-purple-300 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs font-bold">Portal Push</span>
                </button>
              </div>
            </div>

            {message.type !== 'SMS' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Subject Line</label>
                <Input 
                  placeholder="e.g. End of Term Arrangements"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl h-11"
                  value={message.subject}
                  onChange={e => setMessage({...message, subject: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex justify-between">
                <span>Message Content</span>
                {message.type === 'SMS' && (
                  <span className={`text-[10px] ${message.body.length > 160 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                    {message.body.length} / 160 chars
                  </span>
                )}
              </label>
              <textarea 
                className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 resize-none text-sm"
                placeholder="Type your message here. Use variables like {ParentName} or {StudentName}..."
                value={message.body}
                onChange={e => setMessage({...message, body: e.target.value})}
              />
            </div>
            
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsComposeOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.body || isSending}
              className="rounded-xl bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold px-8 shadow-lg shadow-emerald-500/20"
            >
              {isSending ? 'Sending...' : (
                <><Send className="w-4 h-4 mr-2" /> Send to {selectedStudents.length}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
