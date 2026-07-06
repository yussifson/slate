import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Users, GraduationCap, Plus, UserCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import SchoolAPI from '@/api/SchoolAPI';
import PageHeader from '@/components/school/PageHeader';
import StatCard from '@/components/school/StatCard';
import ListingPage from '@/components/school/ListingPage';
import ModalForm from '@/components/school/ModalForm';
import { motion } from 'framer-motion';

export default function Students() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    class: '',
    status: 'Active',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  // Fetch students
  const { data: students = [], isLoading: studentsLoading, refetch } = useQuery({
    queryKey: ['students', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await SchoolAPI.getStudents(companyId);
    },
    enabled: !!companyId
  });

  // Fetch statistics
  const { data: stats = { total: 0, active: 0 } } = useQuery({
    queryKey: ['studentStats', companyId],
    queryFn: async () => {
      if (!companyId) return { total: 0, active: 0 };
      return await SchoolAPI.getStudentStats(companyId);
    },
    enabled: !!companyId
  });

  const handleAddNew = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      class: '',
      status: 'Active',
      enrollmentDate: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      class: student.class || '',
      status: student.status || 'Active',
      enrollmentDate: student.enrollment_date || new Date().toISOString().split('T')[0]
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (student) => {
    if (!confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      await SchoolAPI.deleteStudent(companyId, student.id, user.id);
      toast.success('Student deleted');
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to delete student');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.class) {
      toast.error('Name and class are required');
      return;
    }
    try {
      if (editingId) {
        await SchoolAPI.updateStudent(companyId, editingId, formData, user.id);
        toast.success('Student updated');
      } else {
        await SchoolAPI.addStudent(companyId, formData, user.id);
        toast.success('Student added');
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to save student');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Class', accessorKey: 'class' },
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
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., John Smith' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com' },
    { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890' },
    { name: 'class', label: 'Class/Grade', type: 'text', required: true, placeholder: 'e.g., Grade 9A' },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Graduated', label: 'Graduated' },
        { value: 'Suspended', label: 'Suspended' }
      ]
    },
    { name: 'enrollmentDate', label: 'Enrollment Date', type: 'date' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
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
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          ]}
        />

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={Users}
            label="Total Students"
            value={stats.total || 0}
            description="All enrolled students"
            color="emerald"
          />
          <StatCard
            icon={UserCheck}
            label="Active Students"
            value={stats.active || 0}
            description="Currently enrolled"
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="Enrollment Rate"
            value={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`}
            description="Active vs Total"
            color="orange"
          />
        </div>

        {/* Students Listing */}
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
            searchPlaceholder="Search by name, email, or phone..."
            filterOptions={{
              class: [...new Set(students.map(s => s.class).filter(Boolean))],
              status: ['Active', 'Graduated', 'Suspended']
            }}
            emptyIcon={Users}
            emptyMessage="No students yet. Create your first student record to get started."
          />
        </motion.div>
      </div>

      {/* Add/Edit Form Modal */}
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
