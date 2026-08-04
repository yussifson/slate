import React, { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Users, Search, Plus, Mail, Phone, MoreVertical, Briefcase, GraduationCap, UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import ModalForm from '@/components/school/ModalForm';
import PageHeader from '@/components/school/PageHeader';
import StatCard from '@/components/school/StatCard';
import { motion } from 'framer-motion';

export default function Teachers() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const { data: rawTeachers = [], isLoading } = useIndustryRecords('school_teacher');
  const { data: rawClasses = [] } = useIndustryRecords('school_class');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const [formData, setFormData] = useState({
    full_name: '', 
    email: '', 
    phone: '', 
    gender: 'Male',
    subject: '', 
    qualification: '', 
    class_assigned: '', 
    department: 'Academics', 
    position: 'Class Teacher', 
    status: 'Active', 
    notes: ''
  });

  const teachers = useMemo(() => {
    return rawTeachers.map(r => ({ id: r.id, status: r.status, ...r.data }));
  }, [rawTeachers]);

  const classes = useMemo(() => {
    return rawClasses.map(r => r.data.name).filter(Boolean);
  }, [rawClasses]);

  const stats = useMemo(() => {
    const active = teachers.filter(t => t.status === 'Active').length;
    const depts = new Set(teachers.map(t => t.department)).size;
    return { total: teachers.length, active, depts };
  }, [teachers]);

  const departments = ['All', 'Academics', 'Administration', 'Support'];

  const filtered = teachers.filter(teacher =>
    (departmentFilter === 'All' || teacher.department === departmentFilter) &&
    (teacher.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     teacher.position?.toLowerCase().includes(search.toLowerCase()) ||
     teacher.subject?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddNew = () => {
    setFormData({ 
      full_name: '', email: '', phone: '', gender: 'Male',
      subject: '', qualification: '', class_assigned: '', 
      department: 'Academics', position: 'Class Teacher', status: 'Active', notes: '' 
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleEdit = (teacher) => {
    setFormData({
      full_name: teacher.full_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      gender: teacher.gender || 'Male',
      subject: teacher.subject || '',
      qualification: teacher.qualification || '',
      class_assigned: teacher.class_assigned || '',
      department: teacher.department || 'Academics',
      position: teacher.position || 'Class Teacher',
      status: teacher.status || 'Active',
      notes: teacher.notes || ''
    });
    setEditingId(teacher.id);
    setShowModal(true);
  };

  const handleDelete = async (teacher) => {
    if (!confirm(`Delete ${teacher.full_name}?`)) return;
    try {
      await deleteRecord.mutateAsync({ id: teacher.id, recordType: 'school_teacher' });
      toast.success('Teacher deleted');
    } catch (e) {
      toast.error('Failed to delete teacher');
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }
    
    try {
      const payload = {
        recordType: 'school_teacher',
        payload: formData,
        status: formData.status,
        searchText: `${formData.full_name} ${formData.email} ${formData.subject}`
      };

      if (editingId) {
        await mutate.mutateAsync({ id: editingId, ...payload });
        toast.success('Teacher updated');
      } else {
        await mutate.mutateAsync(payload);
        toast.success('Teacher added');
      }
      setShowModal(false);
    } catch (e) {
      toast.error('Failed to save teacher');
    }
  };

  const formFields = [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., Jane Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@school.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1234567890' },
    { 
      name: 'gender', label: 'Gender', type: 'select',
      options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]
    },
    { 
      name: 'department', label: 'Department', type: 'select',
      options: [
        { value: 'Academics', label: 'Academics' },
        { value: 'Administration', label: 'Administration' },
        { value: 'Support', label: 'Support' }
      ]
    },
    { 
      name: 'position', label: 'Position', type: 'select',
      options: [
        { value: 'Head Teacher', label: 'Head Teacher' },
        { value: 'Class Teacher', label: 'Class Teacher' },
        { value: 'Subject Teacher', label: 'Subject Teacher' },
        { value: 'Assistant Teacher', label: 'Assistant Teacher' },
        { value: 'Admin Staff', label: 'Admin Staff' }
      ]
    },
    { 
      name: 'class_assigned', label: 'Class Assigned', type: 'select',
      options: [{ value: '', label: 'None' }, ...classes.map(c => ({ value: c, label: c }))]
    },
    { name: 'subject', label: 'Subject(s) Taught', type: 'text', placeholder: 'e.g., Mathematics, Science' },
    { name: 'qualification', label: 'Qualification', type: 'text', placeholder: 'e.g., B.Ed, M.Sc' },
    { 
      name: 'status', label: 'Status', type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'On Leave', label: 'On Leave' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    },
    { name: 'notes', label: 'Additional Notes', type: 'text' }
  ];

  return (
    <div className="school-theme-root min-h-screen bg-[#FCFAF7] dark:bg-zinc-950 font-outfit text-[#1F1E1C] dark:text-zinc-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <PageHeader
          icon={Users}
          title="Staff Directory"
          subtitle="Manage teachers and school staff records"
          metric={stats.total}
          metricLabel="Total Staff"
          actions={[
            <Button
              key="add"
              onClick={handleAddNew}
              className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            label="Total Staff"
            value={stats.total}
            description="All staff members"
            color="emerald"
          />
          <StatCard
            icon={UserCheck}
            label="Active Staff"
            value={stats.active}
            description="Currently active"
            color="blue"
          />
          <StatCard
            icon={Briefcase}
            label="Departments"
            value={stats.depts}
            description="Active departments"
            color="purple"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
            <Input 
              placeholder="Search staff..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-12 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-11" 
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {departments.map(d => (
                <button
                  key={d}
                  onClick={() => setDepartmentFilter(d)}
                  className={`px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors rounded-full ${departmentFilter === d ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><div className="text-[var(--primary)] font-semibold animate-pulse text-lg">Loading Staff...</div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-dashed border-primary/30 rounded-md-[var(--radius-xl)]">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
            <p className="font-semibold text-[var(--color-text-primary)] text-lg mb-2">No Staff Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(teacher => (
              <motion.div 
                key={teacher.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 p-6 flex flex-col items-center text-center relative hover:border-[var(--primary)]/50 transition-colors"
              >
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-md-[var(--radius-lg)] bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20">
                      <DropdownMenuItem onClick={() => handleEdit(teacher)} className="cursor-pointer">Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)] cursor-pointer" onClick={() => handleDelete(teacher)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-2xl mb-4 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 tracking-[-0.02em]">
                  {teacher.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                </div>
                <h3 className="font-display font-semibold text-[var(--color-text-primary)] text-xl tracking-tight mb-1">{teacher.full_name}</h3>
                <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[var(--tracking-widest)] mb-6 tracking-[0.04em]">{teacher.position}</p>
                
                <div className="w-full space-y-2 mt-auto">
                  <div className="flex items-center gap-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-[var(--radius-lg)] p-2.5">
                    <div className="w-8 h-8 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-[var(--primary)]" /></div>
                    <span className="truncate font-medium text-[var(--color-text-secondary)] text-sm">{teacher.qualification || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-[var(--radius-lg)] p-2.5">
                    <div className="w-8 h-8 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><Briefcase className="w-4 h-4 text-[var(--primary)]" /></div>
                    <span className="truncate font-medium text-[var(--color-text-secondary)] text-sm">{teacher.subject || 'N/A'}</span>
                  </div>
                  {teacher.class_assigned && (
                    <div className="flex items-center gap-3 bg-[var(--color-surface-1)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/10 rounded-md-[var(--radius-lg)] p-2.5">
                      <div className="w-8 h-8 rounded-md-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-[var(--primary)]" /></div>
                      <span className="truncate font-medium text-[var(--color-text-secondary)] text-sm">{teacher.class_assigned}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ModalForm
        open={showModal}
        onOpenChange={setShowModal}
        title={editingId ? 'Edit Staff' : 'Add Staff'}
        fields={formFields}
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update Staff' : 'Add Staff'}
      />
    </div>
  );
}
