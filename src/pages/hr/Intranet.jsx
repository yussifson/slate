import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Sparkles, Megaphone, Plus, CalendarDays, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/lib/AuthContext';
import { usePowerSync } from '@powersync/react';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';

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
      
      setAnnouncements(prev => [payload, ...prev]);
    } catch (err) {
      toast.error(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      case 'low': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      default: return 'bg-primary/10 text-primary dark:bg-primary/20';
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 h-[calc(100vh-4rem)] p-4 lg:p-8 font-dmsans flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full space-y-6">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-primary" /> Company Intranet
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Stay updated with company news and announcements.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm gap-2 font-bold" onClick={() => setShowAddSheet(true)}>
            <Plus className="w-4 h-4" /> Post Update
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4 overflow-y-auto custom-scrollbar pb-6 pr-2">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-white/40 dark:bg-slate-900/40 rounded-2xl animate-pulse border-[0.5px] border-black/9 dark:border-white/8"></div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No announcements yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Be the first to post an update for the team.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann, i) => (
                  <div key={ann.id || i} className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
                    
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          <span className="font-bold text-primary text-sm">
                            {(ann.author_id && ann.author_id !== 'System') ? ann.author_id.substring(0,2).toUpperCase() : 'SYS'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                            {ann.author_id !== 'System' ? 'Colleague' : 'System Post'}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {ann.created_at ? format(new Date(ann.created_at), 'MMM d, h:mm a') : 'Just now'}
                            </span>
                          </h4>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getPriorityColor(ann.priority)}`}>
                        {ann.priority || 'Normal'}
                      </span>
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{ann.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar / Directory Widget */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4 relative z-10">
                <Building2 className="w-5 h-5 text-primary" /> Directory
              </h3>
              
              <div className="space-y-3 relative z-10">
                {employees.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <User className="w-8 h-8 text-muted-foreground/30" />
                    Directory is empty.
                  </div>
                ) : (
                  employees.slice(0, 5).map(emp => (
                    <div key={emp.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {emp.name ? emp.name.substring(0, 2).toUpperCase() : '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground truncate">{emp.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-semibold truncate tracking-wider">{emp.role?.replace(/_/g, " ") || 'Staff'}</p>
                      </div>
                    </div>
                  ))
                )}
                {employees.length > 5 && (
                  <Button variant="ghost" className="w-full text-xs font-bold text-primary mt-2">View All Staff</Button>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-tr-full pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <Sparkles className="w-6 h-6 text-white/80" />
                <h3 className="font-bold text-lg">Did you know?</h3>
                <p className="text-sm text-white/80 leading-relaxed">You can customize your notification preferences in settings to stay up to date with high-priority announcements.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Add Announcement Sheet */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col font-dmsans">
          <div className="p-6 border-b border-border/50 bg-slate-50 dark:bg-slate-900/50">
            <SheetTitle className="text-xl font-bold">New Post</SheetTitle>
          </div>
          <form onSubmit={handlePostAnnouncement} className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Title</Label>
                <Input 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Q3 Townhall Update" 
                  className="rounded-xl border-border bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Priority</Label>
                <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                  <SelectTrigger className="rounded-xl border-border bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Content</Label>
                <Textarea 
                  required 
                  rows={8}
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  placeholder="Write your announcement here..." 
                  className="rounded-xl border-border bg-white dark:bg-slate-900 resize-none"
                />
              </div>
            </div>
          </form>
          <div className="p-6 border-t border-border/50 bg-slate-50 dark:bg-slate-900/50">
            <Button type="submit" onClick={handlePostAnnouncement} disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl font-bold py-6">
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
