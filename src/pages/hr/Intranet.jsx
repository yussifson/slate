import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, Megaphone, AlertCircle, Clock, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAuth } from '@/lib/AuthContext';
import { usePowerSync } from '@powersync/react';
import { toast } from 'react-hot-toast';

export default function Intranet() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const companyId = user?.company_id;

  const [announcements, setAnnouncements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Normal'
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const annRes = await powerSync.execute(
          'SELECT * FROM univ_erp_announcements WHERE company_id = ? ORDER BY created_at DESC', 
          [companyId]
        );
        const empRes = await powerSync.execute(
          'SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY created_at DESC LIMIT 10', 
          [companyId]
        );
        if (active) {
          setAnnouncements(annRes.rows._array || Array.from(annRes.rows));
          setEmployees(empRes.rows._array || Array.from(empRes.rows));
        }
      } catch(e) {
        console.error("Error fetching intranet data", e);
      } finally {
        if(active) setIsLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [companyId, powerSync]);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if(!formData.title || !formData.content) return toast.error("Please fill in title and content");
    
    setIsSubmitting(true);
    try {
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const payload = {
        id: newId,
        created_at: now,
        company_id: companyId,
        author_id: user?.id || 'System',
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        status: 'Published'
      };
      
      const _k = Object.keys(payload);
      const _v = Object.values(payload);
      
      await powerSync.execute(
        `INSERT INTO univ_erp_announcements (${_k.join(', ')}) VALUES (${_k.map(()=>'?').join(', ')})`, 
        _v
      );
      
      toast.success('Announcement posted successfully!');
      setShowAddSheet(false);
      setFormData({ title: '', content: '', priority: 'Normal' });
      
      // Update local state without re-fetching
      setAnnouncements(prev => [payload, ...prev]);
    } catch (err) {
      toast.error(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30';
      case 'low': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    }
  };

  return (
    <div className="p-6 space-y-8 font-dmsans max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Company Intranet</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Company news, directories, and updates.</p>
        </div>
        <Button onClick={() => setShowAddSheet(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" /> Post Update
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Megaphone className="w-5 h-5 text-primary" /> Latest Announcements
          </h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary/40" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No Announcements Yet</h3>
              <p className="text-slate-500">Be the first to post an update to the company feed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{ann.title}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(ann.priority)}`}>
                      {ann.priority} Priority
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-sm leading-relaxed mb-6">
                    {ann.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> 
                      <span>Posted by Admin</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Directory Preview
              </h3>
            </div>
            <div className="p-2">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>)}
                </div>
              ) : employees.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No employees found.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {employees.map(emp => (
                    <div key={emp.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                        {emp.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{emp.name}</p>
                        <p className="text-xs text-slate-500 truncate">{emp.role || 'Employee'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
              <Button variant="ghost" className="text-primary text-sm w-full font-medium hover:bg-primary/5">View Full Directory</Button>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent className="sm:max-w-md w-full p-0 flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 font-dmsans">
          <div className="flex-1 overflow-y-auto p-6">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-xl">Post Announcement</SheetTitle>
              <SheetDescription>
                Share news, updates, or alerts with the entire company.
              </SheetDescription>
            </SheetHeader>
            
            <form id="announcement-form" onSubmit={handlePostAnnouncement} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <Input 
                  placeholder="e.g. Q3 Town Hall Meeting" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-900"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Normal', 'High'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={`py-2 text-sm font-medium rounded-lg border transition-all ${formData.priority === p ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message Content</label>
                <textarea 
                  className="flex w-full rounded-xl border border-input bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[200px] resize-y"
                  placeholder="Type your message here..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                />
              </div>
            </form>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 mt-auto flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddSheet(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" form="announcement-form" disabled={isSubmitting} className="bg-primary text-white">
              {isSubmitting ? 'Posting...' : 'Post Announcement'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
