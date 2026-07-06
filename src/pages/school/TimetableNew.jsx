import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from '@/components/ui/button';
import { powerSync } from '@/api/PowerSyncConnector';
import PageHeader from '@/components/school/PageHeader';
import StatCard from '@/components/school/StatCard';
import ModalForm from '@/components/school/ModalForm';
import { motion } from 'framer-motion';

export default function Timetable() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    period: 1,
    className: '',
    subject: '',
    teacher: '',
    startTime: '09:00',
    endTime: '10:00'
  });

  const { data: timetable = [], isLoading, refetch } = useQuery({
    queryKey: ['timetable', companyId, selectedClass],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        let query = 'SELECT * FROM school_timetable WHERE company_id = ? ORDER BY day_order ASC, period ASC';
        let params = [companyId];
        if (selectedClass) {
          query += ' AND class_name = ?';
          params.push(selectedClass);
        }
        const result = await powerSync.execute(query, params);
        return result.rows._array || [];
      } catch (e) {
        console.error('Error fetching timetable:', e);
        return [];
      }
    },
    enabled: !!companyId
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const result = await powerSync.execute('SELECT DISTINCT name FROM school_classes WHERE company_id = ?', [companyId]);
        return result.rows._array?.map(r => r.name) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!companyId
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const result = await powerSync.execute('SELECT id, name FROM school_teachers WHERE company_id = ?', [companyId]);
        return result.rows._array || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!companyId
  });

  const handleAddNew = () => {
    setFormData({
      dayOfWeek: 'Monday',
      period: 1,
      className: selectedClass || '',
      subject: '',
      teacher: '',
      startTime: '09:00',
      endTime: '10:00'
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (entry) => {
    setFormData({
      dayOfWeek: entry.day_of_week || 'Monday',
      period: entry.period || 1,
      className: entry.class_name || '',
      subject: entry.subject || '',
      teacher: entry.teacher || '',
      startTime: entry.start_time || '09:00',
      endTime: entry.end_time || '10:00'
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (entry) => {
    if (!confirm(`Delete this timetable entry?`)) return;
    try {
      await powerSync.execute('DELETE FROM school_timetable WHERE id = ?', [entry.id]);
      toast.success('Entry deleted');
      refetch();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleSubmit = async () => {
    if (!formData.className || !formData.subject) {
      toast.error('Class name and subject are required');
      return;
    }
    try {
      if (editingId) {
        await powerSync.execute(
          'UPDATE school_timetable SET day_of_week = ?, period = ?, class_name = ?, subject = ?, teacher = ?, start_time = ?, end_time = ? WHERE id = ?',
          [formData.dayOfWeek, formData.period, formData.className, formData.subject, formData.teacher, formData.startTime, formData.endTime, editingId]
        );
        toast.success('Entry updated');
      } else {
        const id = `timetable_${Date.now()}`;
        await powerSync.execute(
          'INSERT INTO school_timetable (id, company_id, day_of_week, period, class_name, subject, teacher, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, companyId, formData.dayOfWeek, formData.period, formData.className, formData.subject, formData.teacher, formData.startTime, formData.endTime]
        );
        toast.success('Entry added');
      }
      setShowForm(false);
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const groupedByDay = {};
  days.forEach(day => groupedByDay[day] = timetable.filter(t => t.day_of_week === day));

  const formFields = [
    {
      name: 'dayOfWeek',
      label: 'Day of Week',
      type: 'select',
      required: true,
      options: days.map(d => ({ value: d, label: d }))
    },
    { name: 'period', label: 'Period', type: 'number', required: true, min: 1, max: 10 },
    {
      name: 'className',
      label: 'Class Name',
      type: 'select',
      required: true,
      options: classes.map(c => ({ value: c, label: c }))
    },
    { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'e.g., Mathematics' },
    {
      name: 'teacher',
      label: 'Teacher',
      type: 'select',
      options: teachers.map(t => ({ value: t.id, label: t.name }))
    },
    { name: 'startTime', label: 'Start Time', type: 'time' },
    { name: 'endTime', label: 'End Time', type: 'time' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={Calendar}
          title="Timetable"
          subtitle="Manage class schedules and periods"
          metric={timetable.length}
          metricLabel="Total Entries"
          actions={[
            <Button key="add" onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Calendar} label="Classes" value={classes.length} description="Timetabled classes" color="emerald" />
          <StatCard icon={Clock} label="Entries" value={timetable.length} description="Total schedule slots" color="blue" />
          <StatCard icon={Calendar} label="School Days" value={5} description="Monday to Friday" color="orange" />
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!selectedClass ? 'default' : 'outline'}
              onClick={() => setSelectedClass('')}
              className="bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
            >
              All Classes
            </Button>
            {classes.map(cls => (
              <Button
                key={cls}
                variant={selectedClass === cls ? 'default' : 'outline'}
                onClick={() => setSelectedClass(cls)}
                className="bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
              >
                {cls}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {days.map(day => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4">
                <h3 className="font-bold text-lg">{day}</h3>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {groupedByDay[day]?.length ? (
                  groupedByDay[day].map(entry => (
                    <div key={entry.id} className="p-3 hover:bg-emerald-50 transition-colors">
                      <p className="font-semibold text-sm text-emerald-900">{entry.subject}</p>
                      <p className="text-xs text-emerald-600">{entry.class_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{entry.start_time} - {entry.end_time}</p>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-sm">No classes</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ModalForm
        open={showForm}
        onOpenChange={setShowForm}
        title={editingId ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
        fields={formFields}
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmit}
        submitText={editingId ? 'Update' : 'Add Entry'}
      />
    </div>
  );
}
