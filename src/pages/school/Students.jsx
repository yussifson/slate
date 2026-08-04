import { useTranslation } from "react-i18next";
import { useState, useMemo } from 'react';
import { Users, GraduationCap, Plus, UserCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/school/PageHeader';
import StatCard from '@/components/school/StatCard';
import ListingPage from '@/components/school/ListingPage';
import ModalForm from '@/components/school/ModalForm';
import { motion } from 'framer-motion';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';

export default function Students() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    dob: '',
    class_name: '',
    level: 'Primary',
    student_id: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    address: '',
    status: 'Active',
    enrollment_date: new Date().toISOString().split('T')[0]
  });

  const { data: rawStudents = [], isLoading: studentsLoading } = useIndustryRecords('school_student');
  const { data: rawClasses = [] } = useIndustryRecords('school_class');
  
  const mutate = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const students = useMemo(() => {
    return rawStudents.map(r => ({ id: r.id, status: r.status, ...r.data }));
  }, [rawStudents]);

  const classes = useMemo(() => {
    return rawClasses.map(r => r.data.name).filter(Boolean);
  }, [rawClasses]);

  const stats = useMemo(() => {
    const active = students.filter(s => s.status === 'Active').length;
    const kg = students.filter(s => s.level === 'KG').length;
    const primary = students.filter(s => s.level === 'Primary').length;
    const jhs = students.filter(s => s.level === 'JHS').length;
    return { total: students.length, active, kg, primary, jhs };
  }, [students]);

  const handleAddNew = () => {
    setFormData({
      name: '',
      gender: 'Male',
      dob: '',
      class_name: '',
      level: 'Primary',
      student_id: 'STU-' + Date.now().toString(36).toUpperCase(),
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      address: '',
      status: 'Active',
      enrollment_date: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name || '',
      gender: student.gender || 'Male',
      dob: student.dob || '',
      class_name: student.class_name || '',
      level: student.level || 'Primary',
      student_id: student.student_id || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      address: student.address || '',
      status: student.status || 'Active',
      enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0]
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (student) => {
    if (!confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      await deleteRecord.mutateAsync({ id: student.id, recordType: 'school_student' });
      toast.success('Student deleted');
    } catch (e) {
      toast.error('Failed to delete student');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.class_name) {
      toast.error('Name and class are required');
      return;
    }
    try {
      const payload = {
        recordType: 'school_student',
        payload: formData,
        status: formData.status,
        searchText: `${formData.name} ${formData.student_id} ${formData.class_name}`
      };

      if (editingId) {
        await mutate.mutateAsync({ id: editingId, ...payload });
        toast.success('Student updated');
      } else {
        await mutate.mutateAsync(payload);
        toast.success('Student added');
      }
      setShowForm(false);
    } catch (e) {
      toast.error('Failed to save student');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const columns = [
    { header: 'Student ID', accessorKey: 'student_id' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Level', accessorKey: 'level' },
    { header: 'Class', accessorKey: 'class_name' },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (value) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          value === 'Active' ? 'bg-emerald-100 text-emerald-700' :
          value === 'Graduated' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {value}
        </span>
      )
    },
    { header: 'Enrollment Date', accessorKey: 'enrollment_date' }
  ];

  const formFields = [
    { name: 'student_id', label: 'Student ID', type: 'text', required: true, readOnly: true },
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., John Smith' },
    { 
      name: 'gender', 
      label: 'Gender', 
      type: 'select',
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' }
      ]
    },
    { name: 'dob', label: 'Date of Birth', type: 'date' },
    { 
      name: 'level', 
      label: 'Level', 
      type: 'select',
      options: [
        { value: 'KG', label: 'KG' },
        { value: 'Primary', label: 'Primary' },
        { value: 'JHS', label: 'JHS' }
      ]
    },
    { 
      name: 'class_name', 
      label: 'Class/Grade', 
      type: 'select', 
      required: true,
      options: classes.map(c => ({ value: c, label: c }))
    },
    { name: 'parent_name', label: 'Parent Name', type: 'text', placeholder: 'e.g., Jane Smith' },
    { name: 'parent_phone', label: 'Parent Phone', type: 'tel', placeholder: '+1234567890' },
    { name: 'parent_email', label: 'Parent Email', type: 'email', placeholder: 'parent@example.com' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Home Address' },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Graduated', label: 'Graduated' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    },
    { name: 'enrollment_date', label: 'Enrollment Date', type: 'date' }
  ];

  return (
    <div className="school-theme-root min-h-screen bg-[#FCFAF7] dark:bg-zinc-950 font-outfit text-[#1F1E1C] dark:text-zinc-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={Users}
          title="Students Directory"
          subtitle="Manage and monitor all student records"
          metric={stats.total}
          metricLabel="Total Students"
          actions={[
            <Button
              key="add"
              onClick={handleAddNew}
              className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Students"
            value={stats.total}
            description="All enrolled"
            color="emerald"
          />
          <StatCard
            icon={UserCheck}
            label="Active Students"
            value={stats.active}
            description="Currently active"
            color="blue"
          />
          <StatCard
            icon={GraduationCap}
            label="Primary"
            value={stats.primary}
            description="Primary students"
            color="orange"
          />
          <StatCard
            icon={TrendingUp}
            label="JHS"
            value={stats.jhs}
            description="JHS students"
            color="purple"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ListingPage
            data={students}
            columns={columns}
            loading={studentsLoading}
            onAdd={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search by name or student ID..."
            filterOptions={{
              level: ['KG', 'Primary', 'JHS'],
              class_name: classes,
              status: ['Active', 'Graduated', 'Inactive']
            }}
            emptyIcon={Users}
            emptyMessage="No students yet. Create your first student record to get started."
          />
        </motion.div>
      </div>

      <ModalForm
        open={showForm}
        onOpenChange={setShowForm}
        title={editingId ? 'Edit Student' : 'Add New Student'}
        fields={formFields}
        formData={formData}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update Student' : 'Add Student'}
      />
    </div>
  );
}
