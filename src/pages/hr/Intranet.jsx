import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Search, Plus, Sparkles, Megaphone, AlertCircle, Clock, User, Building2, ChevronRight } from 'lucide-react';
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
      case 'high': return 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/30';
      case 'low': return 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 dark:from-slate-700 dark:to-slate-800 dark:text-slate-300 shadow-slate-500/20';
      default: return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/30';
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-10 font-dmsans max-w-7xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-400" />
              Company Intranet
            </h1>
            <p className="text-indigo-200/80 text-lg max-w-xl leading-relaxed">
              Discover the latest company news, connect with colleagues, and stay updated with the pulse of the organization.
            </p>
          </div>
          <Button 
            onClick={() => setShowAddSheet(true)} 
            className="group relative overflow-hidden bg-white hover:bg-slate-50 text-indigo-950 font-semibold shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 rounded-full px-8 py-6 hover:scale-105"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span className="relative flex items-center">
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" /> 
              Post Update
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <Megaphone className="w-6 h-6 text-indigo-500" /> Latest Announcements
            </h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-slate-100/50 dark:bg-slate-800/30 rounded-3xl animate-pulse backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50"></div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-slate-800/60 p-16 text-center transform transition-all duration-500 hover:scale-[1.01]">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">It's quiet here</h3>
              <p className="text-slate-500 max-w-md mx-auto">Be the first to share an update, milestone, or exciting news with the team.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((ann, idx) => (
                <div 
                  key={ann.id} 
                  className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/80 dark:border-slate-800 p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex justify-between items-start mb-6 gap-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {ann.title}
                    </h3>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-md ${getPriorityColor(ann.priority)}`}>
                      {ann.priority}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-base leading-relaxed mb-8">
                    {ann.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">System Admin</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span className="font-medium">{new Date(ann.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Directory Sidebar */}
        <div className="space-y-8">
          <div className="sticky top-8">
            <div className="flex items-center justify-between px-2 mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-slate-100">
                <Building2 className="w-6 h-6 text-indigo-500" /> Directory
              </h2>
            </div>
            
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 dark:border-slate-800 overflow-hidden">
              <div className="p-3">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl animate-pulse"></div>)}
                  </div>
                ) : employees.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Directory is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {employees.map((emp, idx) => (
                      <div 
                        key={emp.id} 
                        className="group flex items-center gap-4 p-4 hover:bg-white dark:hover:bg-slate-800/80 rounded-2xl transition-all duration-300 cursor-pointer hover:shadow-sm"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/10 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-white dark:border-slate-700">
                            {emp.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {emp.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate font-medium">
                            {emp.role || 'Team Member'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm">
                <Button variant="ghost" className="w-full font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl py-6 transition-colors">
                  View Full Directory
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent className="sm:max-w-lg w-full p-0 flex flex-col h-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-l border-slate-200/50 dark:border-slate-800/50 font-dmsans shadow-2xl">
          <div className="flex-1 overflow-y-auto p-8">
            <SheetHeader className="mb-10 text-left">
              <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">Post Announcement</SheetTitle>
              <SheetDescription className="text-base text-slate-500">
                Share important news, updates, or alerts with the entire organization.
              </SheetDescription>
            </SheetHeader>
            
            <form id="announcement-form" onSubmit={handlePostAnnouncement} className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Title</label>
                <Input 
                  placeholder="e.g. Q3 Town Hall Meeting" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl px-4 py-6 text-base transition-all"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Priority Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Low', 'Normal', 'High'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({...formData, priority: p})}
                      className={`py-3 text-sm font-semibold rounded-xl border-2 transition-all duration-200 ${
                        formData.priority === p 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                          : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Message Content</label>
                <textarea 
                  className="flex w-full rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-4 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[250px] resize-y transition-all"
                  placeholder="Type your message here... You can use formatting."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                />
              </div>
            </form>
          </div>
          
          <div className="p-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 mt-auto flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddSheet(false)} type="button" className="rounded-xl px-6 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="announcement-form" 
              disabled={isSubmitting} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Posting...' : 'Post Announcement'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
