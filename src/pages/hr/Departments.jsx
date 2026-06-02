import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Building2, Search, Plus, Trash2, MoreVertical, Edit, Users, DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export default function Departments() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('department');
  const { data: staffRecords = [] } = useIndustryRecords('staff');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const staffList = staffRecords.map(r => ({
    id: r.id,
    name: r.data?.full_name || r.data?.name || 'Unnamed Staff',
    departmentId: r.data?.departmentId || '',
    salary: parseFloat(r.data?.salary) || 0
  }));

  const departments = dbRecords.map(r => {
    const deptStaff = staffList.filter(s => s.departmentId === r.id);
    const head = staffList.find(s => s.id === r.data?.managerId);
    return {
      id: r.id,
      name: r.data?.name || 'Unnamed Department',
      description: r.data?.description || '',
      managerId: r.data?.managerId || '',
      managerName: head ? head.name : 'Unassigned',
      staffCount: deptStaff.length,
      budget: deptStaff.reduce((sum, s) => sum + s.salary, 0),
      ...r.data
    };
  });

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [viewTargetId, setViewTargetId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  });

  const handleCreateOrUpdate = () => {
    if (!formData.name.trim()) return toast.error("Please enter a department name");

    if (editTargetId) {
      const existing = departments.find(d => d.id === editTargetId);
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'department',
        payload: { ...formData },
        status: existing?.status || 'Active',
        searchText: `${formData.name} ${formData.description}`
      }, {
        onSuccess: () => {
          toast.success('Department updated successfully!');
          setShowModal(false);
          setEditTargetId(null);
          setFormData({ name: '', description: '', managerId: '' });
        },
        onError: (err) => toast.error('Failed to update: ' + err.message)
      });
    } else {
      mutateRecord.mutate({
        recordType: 'department',
        payload: { ...formData },
        status: 'Active',
        searchText: `${formData.name} ${formData.description}`
      }, {
        onSuccess: () => {
          toast.success('Department created successfully!');
          setShowModal(false);
          setFormData({ name: '', description: '', managerId: '' });
        },
        onError: (err) => toast.error('Failed to create: ' + err.message)
      });
    }
  };

  const openEdit = (dept) => {
    setFormData({
      name: dept.name || '',
      description: dept.description || '',
      managerId: dept.managerId || ''
    });
    setEditTargetId(dept.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({ name: '', description: '', managerId: '' });
    setEditTargetId(null);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'department' }, {
      onSuccess: () => {
        toast.success('Department removed successfully!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = departments.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.managerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("departments", "Departments")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("manage_organizational_structur", "Manage organizational structure and teams")}</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4" /> {t("new_department", "New Department")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card-premium bg-card rounded-xl border border-border p-6 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">{t("total_departments", "Total Departments")}</p>
             <h2 className="text-3xl font-bold text-card-foreground">{departments.length}</h2>
           </div>
           <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
             <Building2 className="w-6 h-6" />
           </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-6 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">{t("total_employees", "Total Employees")}</p>
             <h2 className="text-3xl font-bold text-card-foreground">{departments.reduce((sum, d) => sum + d.staffCount, 0)}</h2>
           </div>
           <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
             <Users className="w-6 h-6" />
           </div>
        </div>
        <div className="stat-card-premium bg-card rounded-xl border border-border p-6 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-sm text-muted-foreground mb-1">{t("total_budget", "Total Budget")}</p>
             <h2 className="text-3xl font-bold text-card-foreground">${departments.reduce((sum, d) => sum + d.budget, 0).toLocaleString()}</h2>
           </div>
           <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
             <DollarSign className="w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_departments", "Loading departments...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-600" />
              <p className="font-semibold text-lg text-card-foreground">{t("no_departments_found", "No departments found")}</p>
              <p className="text-xs mt-1">{t("add_your_first_department_to_g", "Add your first department to get started.")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("department", "Department")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("manager", "Manager")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("staff_count", "Staff Count")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("salary_budget", "Salary Budget")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(dept => {
                  return (
                    <tr key={dept.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-card-foreground">{dept.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{dept.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-card-foreground">{dept.managerName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold">{dept.staffCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-green-600 dark:text-green-400">${dept.budget.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t("open_menu", "Open menu")}</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewTargetId(dept.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t("view_details", "View Details")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(dept)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t("edit", "Edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTargetId(dept.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("delete", "Delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Department' : 'New Department'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("department_name", "Department Name")}</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Engineering" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("department_head_manager", "Department Head (Manager)")}</label>
                <select 
                  value={formData.managerId} 
                  onChange={e => setFormData({...formData, managerId: e.target.value})} 
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">{t("select_manager", "Select Manager...")}</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("description", "Description")}</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Responsibilities and overview..." 
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreateOrUpdate}>{t("save", "Save")}</Button>
            </div>
          </div>
        </div>
      )}

      {viewTargetId && (
        <Sheet open={!!viewTargetId} onOpenChange={() => setViewTargetId(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("department_details", "Department Details")}</SheetTitle>
              <SheetDescription>{t("overview_and_metrics_for_this_", "Overview and metrics for this department.")}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {(() => {
                const dept = departments.find(d => d.id === viewTargetId);
                if (!dept) return null;
                return (
                  <div className="space-y-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">{t("name", "Name:")}</span> <p className="font-bold text-lg">{dept.name}</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("manager", "Manager:")}</span> <p className="font-medium text-primary"><Link to="/employees" className="hover:underline">{dept.managerName}</Link></p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("staff_count", "Staff Count:")}</span> <p className="font-medium">{dept.staffCount} employees</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("salary_budget", "Salary Budget:")}</span> <p className="font-medium text-green-600 font-bold">${dept.budget.toLocaleString()} / mo</p></div>
                    <div><span className="font-semibold text-muted-foreground">{t("description", "Description:")}</span> <p className="font-medium bg-muted p-3 rounded-lg border border-border mt-1">{dept.description || 'No description provided.'}</p></div>
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
        title="Delete Department"
        message="Are you sure you want to permanently delete this department? Staff assigned to this department will remain but lose their department association."
      />
    </div>
  );
}
