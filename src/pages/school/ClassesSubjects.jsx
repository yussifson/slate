import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Layers, Plus, Users } from 'lucide-react';
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

export default function ClassesSubjects() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    teacher: '',
    capacity: 50
  });

  const { data: classes = [], isLoading, refetch } = useQuery({
    queryKey: ['classes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      return await SchoolAPI.getClasses(companyId);
    },
    enabled: !!companyId
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const { powerSync } = await import('@/api/PowerSyncConnector');
        const result = await powerSync.execute('SELECT id, name FROM school_teachers WHERE company_id = ?', [companyId]);
        return result.rows._array || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!companyId
  });

  const handleAddNew = () => {
    setFormData({ name: '', level: '', teacher: '', capacity: 50 });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (classItem) => {
    setFormData({
      name: classItem.name || '',
      level: classItem.level || '',
      teacher: classItem.teacher || '',
      capacity: classItem.capacity || 50
    });
    setEditingId(classItem.id);
    setShowForm(true);
  };

  const handleDelete = async (classItem) => {
    if (!confirm(`Delete ${classItem.name}?`)) return;
    try {
      await SchoolAPI.deleteClass(companyId, classItem.id, user.id);
      toast.success('Class deleted');
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to delete class');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Class name is required');
      return;
    }
    try {
      if (editingId) {
        await SchoolAPI.updateClass(companyId, editingId, formData, user.id);
        toast.success('Class updated');
      } else {
        await SchoolAPI.addClass(companyId, formData, user.id);
        toast.success('Class added');
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to save class');
    }
  };

  const columns = [
    { header: 'Class Name', accessorKey: 'name' },
    { header: 'Level', accessorKey: 'level' },
    { header: 'Teacher', accessorKey: 'teacher' },
    { header: 'Capacity', accessorKey: 'capacity', cell: (v) => `${v} students` }
  ];

  const formFields = [
    { name: 'name', label: 'Class Name', type: 'text', required: true, placeholder: 'e.g., Grade 9A' },
    { name: 'level', label: 'Grade Level', type: 'text', placeholder: 'e.g., Primary 5' },
    {
      name: 'teacher',
      label: 'Class Teacher',
      type: 'select',
      options: teachers.map(t => ({ value: t.id, label: t.name }))
    },
    { name: 'capacity', label: 'Class Capacity', type: 'number', min: 1, max: 100, value: 50 }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={Layers}
          title="Classes & Subjects"
          subtitle="Manage academic classes and divisions"
          metric={classes.length}
          metricLabel="Total Classes"
          actions={[
            <Button key="add" onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={Layers} 
            label="Total Classes" 
            value={classes.length} 
            description="Active class divisions" 
            color="emerald" 
          />
          <StatCard 
            icon={Users} 
            label="Avg Capacity" 
            value={classes.length > 0 ? Math.round(classes.reduce((sum, c) => sum + (c.capacity || 0), 0) / classes.length) : 0} 
            description="Students per class" 
            color="blue" 
          />
          <StatCard 
            icon={Users} 
            label="Total Capacity" 
            value={classes.reduce((sum, c) => sum + (c.capacity || 0), 0)} 
            description="Maximum students" 
            color="orange" 
          />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ListingPage
            data={classes}
            columns={columns}
            loading={isLoading}
            onAdd={handleAddNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search by class name or level..."
            filterOptions={{
              level: [...new Set(classes.map(c => c.level).filter(Boolean))]
            }}
            emptyIcon={Layers}
            emptyMessage="No classes yet. Create your first class to get started."
          />
        </motion.div>
      </div>

      <ModalForm
        open={showForm}
        onOpenChange={setShowForm}
        title={editingId ? 'Edit Class' : 'Add New Class'}
        fields={formFields}
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update Class' : 'Add Class'}
      />
    </div>
  );
}
