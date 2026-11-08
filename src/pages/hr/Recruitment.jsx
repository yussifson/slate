import { useTranslation} from "react-i18next";
import { useState, useEffect } from 'react';
import { Briefcase, Search, Plus, CheckCircle2, XCircle, Trash2, Edit, Eye, Users, FileSignature, CheckCircle, Clock } from 'lucide-react';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { useMeeting } from '@/hooks/integrations/useMeeting';
import { useCalendar } from '@/hooks/integrations/useCalendar';
import { usePowerSync } from '@powersync/react';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const STAGE_STYLES = {
  'Applied':   { bg: 'bg-slate-100 dark:bg-secondary text-slate-700 dark:text-foreground', dot: 'bg-slate-400' },
  'Screening': { bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  'Interview': { bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  'Offer':     { bg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  'Hired':     { bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Rejected':  { bg: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

export default function Recruitment() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { generateMeetingLink } = useMeeting();
  const { syncEvent } = useCalendar();
  const powerSync = usePowerSync();

  const [candidates, setCandidates] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchCandidates = async () => {
      setIsDbLoading(true);
      try {
        const res = await powerSync.execute('SELECT * FROM univ_hr_candidates WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
        if(active) setCandidates(res.rows._array || Array.from(res.rows));
      } catch(e){}
      setIsDbLoading(false);
    };
    if (companyId) fetchCandidates();
    return () => { active = false; };
  }, [companyId]);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [viewTargetId, setViewTargetId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    position: 'Frontend Engineer',
    department: 'Engineering',
    email: '',
    phone: '',
    notes: ''
  });

  const handleCreateOrUpdateCandidate = async () => {
    if (!formData.name.trim()) return toast.error("Please enter a name");
    
    try {
      if (editTargetId) {
        await powerSync.execute(`UPDATE univ_hr_candidates SET name=?, email=?, phone=?, notes=? WHERE id=?`, 
          [formData.name, formData.email, formData.phone, formData.notes, editTargetId]
        );
        toast.success('Candidate updated successfully!');
        setCandidates(candidates.map(c => c.id === editTargetId ? { ...c, name: formData.name, email: formData.email, phone: formData.phone, notes: formData.notes } : c));
      } else {
        const newId = crypto.randomUUID();
        await powerSync.execute(`INSERT INTO univ_hr_candidates (id, created_at, company_id, name, email, phone, stage, notes) VALUES (?, NOW(), ?, ?, ?, ?, 'Applied', ?)`, 
          [newId, companyId, formData.name, formData.email, formData.phone, formData.notes]
        );
        toast.success('Candidate added successfully!');
        setCandidates([{
          id: newId, company_id: companyId, name: formData.name, email: formData.email, 
          phone: formData.phone, stage: 'Applied', notes: formData.notes, 
          position: formData.position, department: formData.department, 
          created_at: new Date().toISOString()
        }, ...candidates]);
      }
      setShowModal(false);
      setEditTargetId(null);
      setFormData({ name: '', position: 'Frontend Engineer', department: 'Engineering', email: '', phone: '', notes: ''});
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
  };

  const openEdit = (cand) => {
    setFormData({
      name: cand.name || '',
      position: cand.position || 'Frontend Engineer',
      department: cand.department || 'Engineering',
      email: cand.email || '',
      phone: cand.phone || '',
      notes: cand.notes || ''
    });
    setEditTargetId(cand.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({ name: '', position: 'Frontend Engineer', department: 'Engineering', email: '', phone: '', notes: ''});
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleUpdateStage = async (candidate, newStage) => {
    try {
      await powerSync.execute(`UPDATE univ_hr_candidates SET stage=? WHERE id=?`, [newStage, candidate.id]);
      toast.success(`Candidate moved to ${newStage}`);
      setCandidates(candidates.map(c => c.id === candidate.id ? { ...c, stage: newStage } : c));

      if (newStage === 'Interview') {
        generateMeetingLink({
          companyId: user?.company_id,
          provider: 'zoom',
          topic: `Interview with ${candidate.name}`,
          duration: 60,
          startTime: new Date(Date.now() + 86400000).toISOString()
        }).then(meetingData => {
          syncEvent({
            companyId: user?.company_id,
            provider: 'google',
            eventDetails: {
              title: `Interview: ${candidate.name}`,
              startTime: new Date(Date.now() + 86400000).toISOString(),
              endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
              description: `Zoom Link: ${meetingData?.join_url}`,
              attendees: [candidate.email]
            }
          }).catch(console.error);
        }).catch(console.error);
      }
    } catch (err) {
      toast.error('Failed to update stage: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await powerSync.execute(`DELETE FROM univ_hr_candidates WHERE id=?`, [deleteTargetId]);
      toast.success('Candidate removed!');
      setCandidates(candidates.filter(c => c.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      toast.error('Failed to remove: ' + err.message);
    }
  };

  const filtered = candidates.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.position?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-card/50 h-full p-4 lg:p-8 font-dmsans">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("recruitment", "Recruitment")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("manage_job_postings_and_candid", "Manage job postings and candidates")}</p>
          </div>
          <Button onClick={openAdd} className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">
            <Plus className="w-4 h-4" /> {t("add_candidate", "Add Candidate")}
          </Button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Applicants', value: candidates.length, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'In Screening', value: candidates.filter(c => c.stage === 'Screening').length, icon: Clock, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Interviews', value: candidates.filter(c => c.stage === 'Interview').length, icon: Users, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Offers Sent', value: candidates.filter(c => c.stage === 'Offer').length, icon: FileSignature, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(({ label, value, icon: Icon, gradient, bg }) => (
            <div key={label} className={`${bg} rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8" />
        </div>

        {/* ── Candidates Grid ── */}
        {isDbLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading pipeline...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8">
            <Briefcase className="w-14 h-14 mx-auto mb-3 opacity-20 text-primary" />
            <p className="font-semibold text-lg text-foreground">{t("pipeline_is_empty", "Pipeline is empty")}</p>
            <p className="text-sm mt-1">{t("add_a_candidate_to_get_started", "Add a candidate to get started.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(cand => {
              const stageStyle = STAGE_STYLES[cand.stage] || STAGE_STYLES['Applied'];
              const initials = cand.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
              
              return (
                <div key={cand.id} className="group bg-white dark:bg-card rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                  
                  {/* Top Header */}
                  <div className="p-5 flex items-start gap-4 border-b border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold text-foreground text-base leading-tight truncate">{cand.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{cand.position}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Stage Pill */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Current Stage</p>
                      <select
                        value={cand.stage}
                        onChange={e => handleUpdateStage(cand, e.target.value)}
                        className={`w-full appearance-none px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer border-none outline-none focus:ring-2 focus:ring-primary/20 ${stageStyle.bg}`}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Screening">Screening</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Department & Date */}
                    <div className="bg-slate-50 dark:bg-secondary rounded-xl p-3 flex justify-between items-center text-xs">
                      <span className="font-medium text-foreground">{cand.department || 'Unassigned'}</span>
                      <span className="text-muted-foreground">{new Date(cand.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="px-5 pb-5 grid grid-cols-3 gap-2">
                    <button onClick={() => setViewTargetId(cand.id)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40 transition-colors">
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button onClick={() => openEdit(cand)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40 transition-colors">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => setDeleteTargetId(cand.id)}
                      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/40 transition-colors">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>

                  {/* Quick Action Footer */}
                  {cand.stage === 'Offer' && (
                    <div className="px-5 pb-4">
                       <Button onClick={() => handleUpdateStage(cand, 'Hired')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-9">
                         <CheckCircle2 className="w-4 h-4 mr-2"/> Mark as Hired
                       </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-card rounded-2xl w-full max-w-md shadow-2xl border-[0.5px] border-black/9 dark:border-white/8">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-bold text-foreground">{editTargetId ? 'Edit Candidate' : 'Add Candidate'}</h2>
            </div>
            <div className="space-y-4 p-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("candidate_name", "Candidate Name")}</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("position", "Position")}</label>
                  <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("department", "Department")}</label>
                  <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("email", "Email")}</label>
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("phone", "Phone")}</label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("notes", "Notes")}</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="mt-1 w-full rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border/50">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl" onClick={handleCreateOrUpdateCandidate}>{editTargetId ? 'Save Changes' : 'Add Candidate'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Sheet ── */}
      {viewTargetId && (
        <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
          <SheetContent className="overflow-y-auto w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{t("candidate_details", "Candidate Details")}</SheetTitle>
              <SheetDescription>{t("read_only_view_of_candidate_re", "Read-only view of candidate record.")}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              {(() => {
                const cand = candidates.find(c => c.id === viewTargetId);
                if (!cand) return null;
                const initials = cand.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-secondary rounded-2xl">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">{initials}</div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{cand.name}</h3>
                        <span className="text-xs text-muted-foreground">{cand.position}</span>
                      </div>
                    </div>
                    {[
                      { label: 'Department', value: cand.department },
                      { label: 'Email', value: cand.email },
                      { label: 'Phone', value: cand.phone },
                      { label: 'Applied Date', value: new Date(cand.created_at || Date.now()).toLocaleDateString() },
                      { label: 'Stage', value: cand.stage },
                      { label: 'Notes', value: cand.notes || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2 border-b border-border/30">
                        <span className="text-sm text-muted-foreground font-medium">{label}</span>
                        <span className="text-sm font-bold text-foreground text-right max-w-[60%]">{value}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </SheetContent>
        </Sheet>
      )}

      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Remove Candidate"
        message="Are you sure you want to completely remove this candidate from the pipeline?"
      />
    </div>
  );
}
