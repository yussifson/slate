import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BookOpen, Users, Search, Plus, UserCog, Calendar, Trash2, Layers, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { ViewModeToggle, ClassGridCard } from '@/components/school/SchoolViewKit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Classes() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  // Real Database Hooks
  const queryClient = useQueryClient();
  const { data: records = [], isLoading: isDbLoading } = useQuery({ 
    queryKey: ["cases", companyId], 
    queryFn: () => base44.entities.LegalCase.filter({ company_id: companyId }), 
    enabled: !!companyId 
  });
  
  const mutateClass = useMutation({
    mutationFn: (data) => data.id ? base44.entities.LegalCase.update(data.id, data) : base44.entities.LegalCase.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases", companyId] })
  });

  const deleteClass = useMutation({
    mutationFn: (id) => base44.entities.LegalCase.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases", companyId] })
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '', subject: '', teacher: 'Mr. John Doe', room: '', schedule: '', courses: '', allowSelfRegistration: false
  });

  // Map DB records to UI format
  const classesData = records.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.description || '{}'); } catch(e) {}
    return {
      id: r.id,
      name: r.title || 'Untitled Class',
      subject: r.case_type || 'General',
      teacher: r.assigned_staff_name || 'Unassigned',
      room: extra.room || 'TBD',
      schedule: extra.schedule || 'TBD',
      students: extra.students || 0,
      courses: extra.courses || '',
      allowSelfRegistration: !!extra.allowSelfRegistration,
      stage: r.stage || 'active'
    };
  });

  const handleCreateClass = () => {
    if (!companyId) return toast.error("Workspace not loaded. Refresh the page and try again.");
    if (!formData.name.trim() || !formData.subject.trim()) {
      return toast.error("Please enter a class name and subject");
    }

    const payload = {
      company_id: companyId,
      title: formData.name,
      case_type: formData.subject,
      assigned_staff_name: formData.teacher,
      status: 'active',
      stage: 'primary', // Default stage for dashboard
      description: JSON.stringify({
        room: formData.room || 'TBD',
        schedule: formData.schedule || 'TBD',
        students: 0,
        courses: formData.courses || '',
        allowSelfRegistration: formData.allowSelfRegistration
      })
    };

    const onDone = {
      onSuccess: () => {
        toast.success(editingId ? "Class updated successfully!" : "Class saved successfully!");
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', subject: '', teacher: 'Mr. John Doe', room: '', schedule: '', courses: '', allowSelfRegistration: false });
      },
      onError: (err) => toast.error(err?.message || "Failed to save class"),
    };

    if (editingId) {
      mutateClass.mutate({ id: editingId, ...payload }, onDone);
    } else {
      mutateClass.mutate(payload, onDone);
    }
  };

  const handleDeleteClass = () => {
    if (!deleteTargetId) return;
    deleteClass.mutate(deleteTargetId, {
      onSuccess: () => {
        toast.success("Class removed successfully!");
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error("Failed to remove class: " + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = classesData.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{t("classes", "Classes")}</h1>
            <p className="text-emerald-100 font-medium text-lg">{t("manage_classes_subjects_and_te", "Manage classes, subjects, and teachers")}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
            <Button onClick={() => setShowForm(true)} size="sm" className="gap-1.5 text-sm font-bold bg-white text-emerald-900 hover:bg-white/90 rounded-xl">
              <Plus className="w-4 h-4" /> {t("add_class", "Add Class")}
            </Button>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <BookOpen className="w-64 h-64" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{classesData.length}</p>
            <p className="text-xs text-muted-foreground">{t("total_classes", "Total Classes")}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
            <UserCog className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{[...new Set(classesData.map(c => c.teacher))].length}</p>
            <p className="text-xs text-muted-foreground">{t("teachers", "Teachers")}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{classesData.reduce((acc, curr) => acc + (curr.students || 0), 0)}</p>
            <p className="text-xs text-muted-foreground">{t("students_enrolled", "Students Enrolled")}</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">{[...new Set(classesData.map(c => c.subject))].length}</p>
            <p className="text-xs text-muted-foreground">{t("subjects", "Subjects")}</p>
          </div>
        </div>
      </div>
      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search classes or teachers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
      </div>
      {/* Class List */}
      {isDbLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loading_classes", "Loading classes...")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse text-blue-600" />
          <p className="font-semibold text-lg text-card-foreground">{t("no_classes_registered", "No classes registered")}</p>
          <p className="text-sm mt-1 max-w-md mx-auto">{t(
            "add_a_new_grade_class_subject_",
            "Add a new grade class, subject curricula, classroom, and teacher schedules using the button above."
          )}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(c => (
            <ClassGridCard
              key={c.id}
              classInfo={c}
              onView={() => setViewDetails(c)}
              onEdit={() => {
                setEditingId(c.id);
                setFormData({
                  name: c.name,
                  subject: c.subject,
                  teacher: c.teacher,
                  room: c.room,
                  schedule: c.schedule,
                  courses: c.courses || '',
                  allowSelfRegistration: !!c.allowSelfRegistration
                });
                setShowModal(true);
              }}
              onDelete={() => setDeleteTargetId(c.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Class Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Teacher</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Students</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Schedule</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-card-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{c.subject}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{c.teacher}</td>
                    <td className="px-6 py-4 text-center">{c.students}</td>
                    <td className="px-6 py-4 text-muted-foreground">{c.schedule} ({c.room})</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setViewDetails(c)}>{t("view_details", "View Details")}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingId(c.id);
                            setFormData({ name: c.name, subject: c.subject, teacher: c.teacher, room: c.room, schedule: c.schedule, courses: c.courses || '', allowSelfRegistration: !!c.allowSelfRegistration });
                            setShowModal(true);
                          }}>{t("edit", "Edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 font-medium" onClick={() => setDeleteTargetId(c.id)}>{t("delete", "Delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-bold text-card-foreground">{editingId ? 'Edit Class' : 'Add New Class'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("class_name", "Class Name")}</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1" placeholder="Grade 10C" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("subject", "Subject")}</label>
                <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="mt-1" placeholder="Physics" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("teacher", "Teacher")}</label>
                <select value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <option>{t("mr_john_doe", "Mr. John Doe")}</option>
                  <option>{t("mrs_jane_smith", "Mrs. Jane Smith")}</option>
                  <option>{t("mr_kwesi_asante", "Mr. Kwesi Asante")}</option>
                  <option>{t("mrs_ama_owusu", "Mrs. Ama Owusu")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("room", "Room")}</label>
                <Input value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="mt-1" placeholder="Room 205" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("schedule", "Schedule")}</label>
                <Input value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className="mt-1" placeholder="Mon-Wed 9AM-10AM" />
              </div>
              <div className="pt-2 border-t border-border">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("courses_subjects", "Assigned Courses / Subjects")}</label>
                <Input value={formData.courses} onChange={e => setFormData({...formData, courses: e.target.value})} className="mt-1" placeholder="e.g. Math, Physics, Chemistry" />
                <p className="text-[10px] text-muted-foreground mt-1">Comma-separated list of courses available for this class.</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="allowSelfReg" checked={formData.allowSelfRegistration} onChange={e => setFormData({...formData, allowSelfRegistration: e.target.checked})} className="w-4 h-4 accent-blue-600 rounded" />
                <label htmlFor="allowSelfReg" className="text-sm font-semibold text-foreground cursor-pointer">Allow Students to Self-Register Courses</label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateClass}>{editingId ? 'Save Changes' : 'Save Class'}</Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteClass}
        title="Disband Class"
        message="Are you sure you want to completely disband this class? This will dissociate all students currently assigned to it."
      />
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("class_details", "Class Details")}</SheetTitle>
            <SheetDescription>{t(
              "comprehensive_view_of_class_in",
              "Comprehensive view of class information."
            )}</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">{viewDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewDetails.subject}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("teacher", "Teacher")}</p>
                  <Link to="/team" className="text-primary hover:underline font-medium">{viewDetails.teacher}</Link>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("students", "Students")}</p>
                  <Link to="/students" className="text-primary hover:underline font-medium">{viewDetails.students} {t("enrolled", "Enrolled")}</Link>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("room", "Room")}</p>
                  <p className="font-medium text-foreground">{viewDetails.room}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("schedule", "Schedule")}</p>
                  <p className="font-medium text-foreground">{viewDetails.schedule}</p>
                </div>
              </div>
              
              {viewDetails.courses && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground">{t("assigned_courses", "Assigned Courses")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewDetails.courses.split(',').map(course => (
                      <span key={course} className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full border border-blue-200">
                        {course.trim()}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Self-Registration: <strong className={viewDetails.allowSelfRegistration ? 'text-green-600' : 'text-red-600'}>{viewDetails.allowSelfRegistration ? 'Allowed' : 'Disabled'}</strong>
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
