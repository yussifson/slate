import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Heart, Plus, Users } from 'lucide-react';
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

export default function Parents() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'Parent',
    studentId: ''
  });

  const { data: parents = [], isLoading, refetch } = useQuery({
    queryKey: ['parents', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await SchoolAPI.getParents(companyId);
    },
    enabled: !!companyId
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await SchoolAPI.getStudents(companyId);
    },
    enabled: !!companyId
  });

  const handleAddNew = () => {
    setFormData({ name: '', email: '', phone: '', relationship: 'Parent', studentId: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (parent) => {
    setFormData({
      name: parent.name || '',
      email: parent.email || '',
      phone: parent.phone || '',
      relationship: parent.relationship || 'Parent',
      studentId: parent.student_id || ''
    });
    setEditingId(parent.id);
    setShowForm(true);
  };

  const handleDelete = async (parent) => {
    if (!confirm(`Delete ${parent.name}?`)) return;
    try {
      await SchoolAPI.deleteParent(companyId, parent.id, user.id);
      toast.success('Parent removed');
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }
    try {
      if (editingId) {
        await SchoolAPI.updateParent(companyId, editingId, formData, user.id);
        toast.success('Parent updated');
      } else {
        await SchoolAPI.addParent(companyId, formData, user.id);
        toast.success('Parent added');
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Relationship', accessorKey: 'relationship' },
  ];

  const formFields = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., Mary Johnson' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'mary@example.com' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+1234567890' },
    { 
      name: 'relationship', 
      label: 'Relationship', 
      type: 'select',
      options: [
        { value: 'Parent', label: 'Parent' },
        { value: 'Guardian', label: 'Guardian' },
        { value: 'Emergency Contact', label: 'Emergency Contact' }
      ]
    },
    {
      name: 'studentId',
      label: 'Associated Student',
      type: 'select',
      options: students.map(s => ({ value: s.id, label: s.name }))
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={Heart}
          title="Parents & Guardians"
          subtitle="Manage parent and guardian contacts"
          metric={parents.length}
          metricLabel="Total Contacts"
          actions={[
            <Button key="add" onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Parent
            </Button>
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard icon={Users} label="Total Parents" value={parents.length} description="All registered parents" color="emerald" />
          <StatCard icon={Heart} label="Avg per Student" value={(parents.length / Math.max(students.length, 1)).toFixed(1)} description="Parent per student" color="orange" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ListingPage
            data={parents}
            columns={columns}
            loading={isLoading}
            onAdd={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search by name, email, or phone..."
            filterOptions={{
              relationship: ['Parent', 'Guardian', 'Emergency Contact']
            }}
            emptyIcon={Heart}
            emptyMessage="No parents yet. Add your first parent contact."
          />
        </motion.div>
      </div>

      <ModalForm
        open={showForm}
        onOpenChange={setShowForm}
        title={editingId ? 'Edit Parent' : 'Add Parent'}
        fields={formFields}
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update' : 'Add Parent'}
      />
    </div>
  );
}
