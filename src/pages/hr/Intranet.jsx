import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Sparkles, Megaphone, Plus, CalendarDays, Building2, User, ArrowUpRight, ArrowDownRight, Users, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/lib/AuthContext';
import { usePowerSync } from '@powersync/react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

function avatarInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Intranet() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const { toast } = useToast();
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
          'SELECT a.*, s.name as author_name FROM univ_erp_announcements a LEFT JOIN univ_hr_employees s ON a.author_id = s.id WHERE a.company_id = ? ORDER BY a.created_at DESC', 
          [companyId]
        );
        const empRes = await powerSync.execute(
          'SELECT * FROM univ_hr_employees WHERE company_id = ? ORDER BY created_at DESC LIMIT 10', 
          [companyId]
        );
        if (active) {
          setAnnouncements(annRes.rows?._array || []);
          setEmployees(empRes.rows?._array || []);
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
    if(!formData.title || !formData.content) return toast({ title: "Please fill in title and content", variant: "destructive" });
    
    setIsSubmitting(true);
    try {
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      await powerSync.execute(
        "INSERT INTO univ_erp_announcements (id, created_at, company_id, author_id, title, content, priority, status) VALUES (?,?,?,?,?,?,?,?)",
        [newId, now, companyId, user?.id || 'System', formData.title, formData.content, formData.priority, 'Published']
      );
      
      toast({ title: 'Announcement posted successfully!' });
      setShowAddSheet(false);
      setFormData({ title: '', content: '', priority: 'Normal' });
      
      // Refresh list
      const annRes = await powerSync.execute('SELECT a.*, s.name as author_name FROM univ_erp_announcements a LEFT JOIN univ_hr_employees s ON a.author_id = s.id WHERE a.company_id = ? ORDER BY a.created_at DESC', [companyId]);
      setAnnouncements(annRes.rows?._array || []);
    } catch (err) {
      toast({ title: err.message || 'Failed to post announcement', variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'low': return 'bg-slate-100 text-slate-700 dark:bg-secondary dark:text-foreground border-slate-200 dark:border-border';
      default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    }
  };

  const highPriorityCount = announcements.filter(a => a.priority?.toLowerCase() === 'high').length;

  const kpis = [
    { label: 'Total Updates', value: announcements.length, sub: 'All time', icon: Megaphone, alt: false, trend: '+2', trendUp: true },
    { label: 'High Priority', value: highPriorityCount, sub: 'Urgent announcements', icon: Bell, alt: true, trend: highPriorityCount > 0 ? 'Needs reading' : 'All clear', trendUp: highPriorityCount === 0 },
    { label: 'Directory Size', value: employees.length, sub: 'Team members', icon: Users, alt: false },
    { label: 'Recent Activity', value: 'Today', sub: 'Last updated', icon: CalendarDays, alt: true },
  ];

  return (
    <div className="space-y-6 p-6 font-dmsans">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-40 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("company_intranet", "Company Intranet")}</h1>
                <p className="text-green-100 text-sm">Stay updated with company news and connect with the team.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddSheet(true)} className="bg-white text-green-700 hover:bg-green-50 rounded-xl shadow-sm gap-2 font-bold px-6">
              <Plus className="w-4 h-4" /> Post Update
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${kpi.alt ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${kpi.trendUp ? 'text-green-700 bg-green-50 dark:bg-green-900/40' : 'text-orange-700 bg-orange-50 dark:bg-orange-900/40'}`}>
                  {kpi.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground mb-1 tabular-nums">{kpi.value}</p>
            <p className="text-sm font-medium text-foreground mb-0.5">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" /> Latest Announcements
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-secondary/50 rounded-2xl animate-pulse border border-border/50"></div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 dark:border-green-800">
                <Megaphone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No announcements yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Be the first to post an update for the team.</p>
              <Button onClick={() => setShowAddSheet(true)} className="bg-green-600 text-white hover:bg-green-700 font-bold rounded-xl shadow-sm px-8">Post First Update</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann, i) => (
                <div key={ann.id || i} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden hover:border-green-500/30">
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-secondary border border-border/50 flex items-center justify-center font-bold text-foreground shadow-sm">
                        {avatarInitials(ann.author_name || 'System')}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{ann.author_name || 'System'}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(ann.created_at || new Date()), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border shadow-sm", getPriorityColor(ann.priority))}>
                      {ann.priority || 'Normal'}
                    </span>
                  </div>
                  
                  <div className="relative z-10 mt-4">
                    <h3 className="text-lg font-bold text-foreground leading-tight mb-2">{ann.title}</h3>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Team Directory */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" /> Team Directory
          </h2>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-secondary/50 rounded-full animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-100 dark:bg-secondary/50 rounded animate-pulse w-1/2"></div>
                      <div className="h-2 bg-slate-100 dark:bg-secondary/50 rounded animate-pulse w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No team members found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-secondary border border-border/50 flex items-center justify-center font-bold text-foreground shadow-sm group-hover:scale-105 transition-transform">
                      {avatarInitials(emp.name)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground group-hover:text-green-600 transition-colors">{emp.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{emp.role || 'Staff Member'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {employees.length > 0 && (
              <Button variant="outline" className="w-full mt-6 rounded-xl font-bold border-border/50 shadow-sm text-xs h-9">
                View All Directory
              </Button>
            )}
          </div>
        </div>
      </div>

      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent className="w-full sm:max-w-md p-6 font-dmsans overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-green-600" />
              Post Announcement
            </SheetTitle>
          </SheetHeader>
          
          <form onSubmit={handlePostAnnouncement} className="space-y-5">
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Subject Title *</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Q3 Townhall Meeting"
                required
                className="bg-slate-50 dark:bg-card rounded-xl border-border/50 font-medium"
              />
            </div>
            
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Priority Level</Label>
              <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                <SelectTrigger className="bg-slate-50 dark:bg-card rounded-xl border-border/50 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High (Urgent)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Message Content *</Label>
              <Textarea 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
                placeholder="Write your announcement here..."
                required
                className="min-h-[200px] bg-slate-50 dark:bg-card rounded-xl border-border/50 font-medium resize-none"
              />
            </div>
            
            <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowAddSheet(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold px-6 shadow-sm">
                {isSubmitting ? 'Posting...' : 'Publish Post'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
