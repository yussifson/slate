import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { BookOpen, Plus, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import { powerSync } from '@/api/PowerSyncConnector';
import PageHeader from '@/components/school/PageHeader';
import StatCard from '@/components/school/StatCard';
import ListingPage from '@/components/school/ListingPage';
import ModalForm from '@/components/school/ModalForm';
import { motion } from 'framer-motion';

export default function TeachersStaff() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Teacher',
    department: '',
    qualification: ''
  });

  const { data: teachers = [], isLoading, refetch } = useQuery({
    queryKey: ['teachers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const result = await powerSync.execute(
          'SELECT * FROM school_teachers WHERE company_id = ? ORDER BY name ASC',
          [companyId]
        );
        return result.rows._array || [];
      } catch (e) {
        console.error('Error fetching teachers:', e);
        return [];
      }
    },
    enabled: !!companyId
  });

  const handleAddNew = () => {
    setFormData({ name: '', email: '', phone: '', role: 'Teacher', department: '', qualification: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (teacher) => {
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: teacher.role || 'Teacher',
      department: teacher.department || '',
      qualification: teacher.qualification || ''
    });
    setEditingId(teacher.id);
    setShowForm(true);
  };

  const handleDelete = async (teacher) => {
    if (!confirm(`Delete ${teacher.name}?`)) return;
    try {
      await powerSync.execute('DELETE FROM school_teachers WHERE id = ?', [teacher.id]);
      toast.success('Teacher deleted');
      refetch();
    } catch (e) {
      toast.error('Failed to delete teacher');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      if (editingId) {
        await powerSync.execute(
          'UPDATE school_teachers SET name = ?, email = ?, phone = ?, role = ?, department = ?, qualification = ? WHERE id = ?',
          [formData.name, formData.email, formData.phone, formData.role, formData.department, formData.qualification, editingId]
        );
        toast.success('Teacher updated');
      } else {
        const id = `teacher_${Date.now()}`;
        await powerSync.execute(
          'INSERT INTO school_teachers (id, company_id, name, email, phone, role, department, qualification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, companyId, formData.name, formData.email, formData.phone, formData.role, formData.department, formData.qualification]
        );
        toast.success('Teacher added');
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to save teacher');
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Role', accessorKey: 'role' },
    { header: 'Department', accessorKey: 'department' },
  ];

  const formFields = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., Dr. James Wilson' },
    { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'james@school.com' },
    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890' },
    { 
      name: 'role', 
      label: 'Role', 
      type: 'select',
      options: [
        { value: 'Teacher', label: 'Teacher' },
        { value: 'Head of Department', label: 'Head of Department' },
        { value: 'Assistant', label: 'Assistant' },
        { value: 'Admin', label: 'Admin Staff' }
      ]
    },
    { name: 'department', label: 'Department', type: 'text', placeholder: 'e.g., Mathematics' },
    { name: 'qualification', label: 'Qualification', type: 'text', placeholder: 'e.g., B.Ed, M.Sc' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={BookOpen}
          title="Teachers & Staff"
          subtitle="Manage teaching and support staff"
          metric={teachers.length}
          metricLabel="Staff Members"
          actions={[
            <Button key="add" onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={BookOpen} 
            label="Total Staff" 
            value={teachers.length} 
            description="Teachers & support staff" 
            color="emerald" 
          />
          <StatCard 
            icon={Users} 
            label="Teachers" 
            value={teachers.filter(t => t.role === 'Teacher').length} 
            description="Classroom instructors" 
            color="blue" 
          />
          <StatCard 
            icon={Users} 
            label="Departments" 
            value={[...new Set(teachers.map(t => t.department).filter(Boolean))].length} 
            description="Active departments" 
            color="orange" 
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ListingPage
            data={teachers}
            columns={columns}
            loading={isLoading}
            onAdd={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search by name, email, or department..."
            filterOptions={{
              role: ['Teacher', 'Head of Department', 'Assistant', 'Admin Staff'],
              department: [...new Set(teachers.map(t => t.department).filter(Boolean))]
            }}
            emptyIcon={BookOpen}
            emptyMessage="No staff members yet. Add your first teacher or staff member."
          />
        </motion.div>
      </div>

      <ModalForm
        open={showForm}
        onOpenChange={setShowForm}
        title={editingId ? 'Edit Staff Member' : 'Add Staff Member'}
        fields={formFields}
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update' : 'Add Staff'}
      />
    </div>
  );
}
