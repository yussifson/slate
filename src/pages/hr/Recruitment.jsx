import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Briefcase, Search, Plus, CheckCircle2, XCircle, Trash2, MoreVertical, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useMeeting } from '@/hooks/integrations/useMeeting';
import { useCalendar } from '@/hooks/integrations/useCalendar';
import { useAuth } from '@/lib/AuthContext';

export default function Recruitment() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { generateMeetingLink } = useMeeting();
  const { syncEvent } = useCalendar();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('candidate');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const candidates = dbRecords.map(r => ({
    id: r.id,
    stage: r.status || 'Applied',
    ...r.data
  }));

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

  const handleCreateOrUpdateCandidate = () => {
    if (!formData.name.trim()) return toast.error("Please enter a name");
    
    if (editTargetId) {
      const cand = candidates.find(c => c.id === editTargetId);
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'candidate',
        payload: { ...formData, appliedDate: cand.appliedDate },
        status: cand.stage,
        searchText: `${formData.name} ${formData.position} ${formData.department}`
      }, {
        onSuccess: () => {
          toast.success('Candidate updated successfully!');
          setShowModal(false);
          setEditTargetId(null);
          setFormData({ name: '', position: 'Frontend Engineer', department: 'Engineering', email: '', phone: '', notes: '' });
        },
        onError: (err) => toast.error('Failed: ' + err.message)
      });
    } else {
      mutateRecord.mutate({
        recordType: 'candidate',
        payload: { ...formData, appliedDate: new Date().toISOString().split('T')[0] },
        status: 'Applied',
        searchText: `${formData.name} ${formData.position} ${formData.department}`
      }, {
        onSuccess: () => {
          toast.success('Candidate added successfully!');
          setShowModal(false);
          setFormData({ name: '', position: 'Frontend Engineer', department: 'Engineering', email: '', phone: '', notes: '' });
        },
        onError: (err) => toast.error('Failed: ' + err.message)
      });
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
    setFormData({ name: '', position: 'Frontend Engineer', department: 'Engineering', email: '', phone: '', notes: '' });
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleUpdateStage = (candidate, newStage) => {
    const payload = { ...candidate };
    delete payload.id;
    delete payload.stage;
    
    mutateRecord.mutate({
      id: candidate.id,
      recordType: 'candidate',
      payload,
      status: newStage,
      searchText: `${candidate.name} ${candidate.position}`
    }, {
      onSuccess: () => {
        toast.success(`Candidate moved to ${newStage}`);
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
                title: `Interview: ${candidate.name} - ${candidate.position}`,
                startTime: new Date(Date.now() + 86400000).toISOString(),
                endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
                description: `Zoom Link: ${meetingData?.join_url}`,
                attendees: [candidate.email]
              }
            }).catch(console.error);
          }).catch(console.error);
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'candidate' }, {
      onSuccess: () => {
        toast.success('Candidate removed!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = candidates.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.position?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("recruitment", "Recruitment")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_job_postings_and_candid", "Manage job postings and candidates")}</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
          <Briefcase className="w-4 h-4" /> {t("add_candidate", "Add Candidate")}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("total_applicants", "Total Applicants")}</p>
          <h2 className="text-2xl font-bold text-card-foreground">{candidates.length}</h2>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("in_screening", "In Screening")}</p>
          <h2 className="text-2xl font-bold text-card-foreground">{candidates.filter(c => c.stage === 'Screening').length}</h2>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("interviews", "Interviews")}</p>
          <h2 className="text-2xl font-bold text-card-foreground">{candidates.filter(c => c.stage === 'Interview').length}</h2>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">{t("offers", "Offers")}</p>
          <h2 className="text-2xl font-bold text-card-foreground">{candidates.filter(c => c.stage === 'Offer').length}</h2>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/50 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="p-4 overflow-y-auto space-y-3">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_pipeline", "Loading pipeline...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-violet-600" />
              <p className="font-semibold text-lg text-card-foreground">{t("pipeline_is_empty", "Pipeline is empty")}</p>
              <p className="text-xs mt-1">{t("add_a_candidate_to_get_started", "Add a candidate to get started.")}</p>
            </div>
          ) : filtered.map(cand => {
            return (
              <div key={cand.id} className="border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow bg-background group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold">
                    {cand.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-card-foreground">{cand.name}</p>
                    <p className="text-xs text-muted-foreground">{cand.position}• {cand.department} {t("applied", "• Applied:")} {cand.appliedDate}</p>
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{t("stage", "Stage")}</p>
                  <select
                    value={cand.stage}
                    onChange={e => handleUpdateStage(cand, e.target.value)}
                    className={`text-xs font-bold px-2 py-1 rounded-full border border-input ${
                      cand.stage === 'Offer' ? 'bg-green-100 text-green-700' :
                      cand.stage === 'Hired' ? 'bg-violet-100 text-violet-700' :
                      cand.stage === 'Interview' ? 'bg-blue-100 text-blue-700' : 
                      cand.stage === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-muted text-foreground'
                    }`}
                  >
                    <option>{t("applied", "Applied")}</option>
                    <option>{t("screening", "Screening")}</option>
                    <option>{t("interview", "Interview")}</option>
                    <option>{t("offer", "Offer")}</option>
                    <option>{t("hired", "Hired")}</option>
                    <option>{t("rejected", "Rejected")}</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdateStage(cand, 'Hired')} size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 px-2"><CheckCircle2 className="w-4 h-4"/></Button>
                  <Button onClick={() => handleUpdateStage(cand, 'Rejected')} size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 px-2"><XCircle className="w-4 h-4"/></Button>
                  <Button onClick={() => setDeleteTargetId(cand.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Candidate' : 'Add Candidate'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("candidate_name", "Candidate Name")}</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("position", "Position")}</label>
                  <Input value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("department", "Department")}</label>
                  <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("email", "Email")}</label>
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("phone", "Phone")}</label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("notes", "Notes")}</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-16 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreateOrUpdateCandidate}>{editTargetId ? 'Save Changes' : 'Add Candidate'}</Button>
            </div>
          </div>
        </div>
      )}
      {viewTargetId && (
        <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("candidate_details", "Candidate Details")}</SheetTitle>
              <SheetDescription>{t("read_only_view_of_candidate_re", "Read-only view of candidate record.")}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {(() => {
                const cand = candidates.find(c => c.id === viewTargetId);
                if (!cand) return null;
                return (
                  <div className="space-y-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">{t("name", "Name:")}</span> <p className="font-medium"><Link to="/employees" className="hover:underline text-primary">{cand.name}</Link></p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("position", "Position:")}</span> <p className="font-medium">{cand.position}</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("department", "Department:")}</span> <p className="font-medium">{cand.department}</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("email", "Email:")}</span> <p className="font-medium">{cand.email}</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("phone", "Phone:")}</span> <p className="font-medium">{cand.phone}</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("applied_date", "Applied Date:")}</span> <p className="font-medium">{cand.appliedDate}</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("stage", "Stage:")}</span> <p className="font-medium">{cand.stage}</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("notes", "Notes:")}</span> <p className="font-medium">{cand.notes}</p></div>
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
