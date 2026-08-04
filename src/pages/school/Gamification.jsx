import React, { useState, useMemo } from 'react';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Trophy, Star, Medal, Award, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function Gamification() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  
  const { data: awards = [], isLoading: loadingAwards } = useIndustryRecords('school_gamification');
  const { data: students = [], isLoading: loadingStudents } = useIndustryRecords('school_student');
  const { mutateAsync: saveRecord } = useMutateIndustryRecord();
  const { mutateAsync: deleteRecord } = useDeleteIndustryRecord();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    class_name: '',
    category: 'Academic',
    badge: 'Math Star',
    points: 50,
    reason: '',
    awarded_by: user?.name || '',
    date: new Date().toISOString().split('T')[0]
  });

  const leaderboard = useMemo(() => {
    const studentPoints = {};
    awards.forEach(record => {
      const d = record.data;
      if (!d) return;
      if (!studentPoints[d.student_id]) {
        studentPoints[d.student_id] = {
          student_id: d.student_id,
          student_name: d.student_name,
          class_name: d.class_name,
          total_points: 0,
          badges: []
        };
      }
      studentPoints[d.student_id].total_points += Number(d.points) || 0;
      if (d.badge && !studentPoints[d.student_id].badges.includes(d.badge)) {
        studentPoints[d.student_id].badges.push(d.badge);
      }
    });

    return Object.values(studentPoints)
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 10);
  }, [awards]);

  const handleStudentSelect = (studentId) => {
    const student = students.find(s => s.id === studentId || s.data.student_id === studentId);
    if (student) {
      setFormData(prev => ({
        ...prev,
        student_id: studentId,
        student_name: `${student.data.first_name || ''} ${student.data.last_name || ''}`.trim(),
        class_name: student.data.current_class || ''
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.student_name || !formData.badge || !formData.points) {
      toast.error('Student, Badge, and Points are required');
      return;
    }

    try {
      await saveRecord({
        recordType: 'school_gamification',
        payload: formData,
        searchText: `${formData.student_name} ${formData.badge} ${formData.category}`,
        status: 'Active'
      });
      toast.success('Award granted successfully');
      setIsModalOpen(false);
      setFormData({
        student_id: '',
        student_name: '',
        class_name: '',
        category: 'Academic',
        badge: 'Math Star',
        points: 50,
        reason: '',
        awarded_by: user?.name || '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to grant award');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to revoke this award?')) {
      try {
        await deleteRecord({ id, recordType: 'school_gamification' });
        toast.success('Award revoked');
      } catch (error) {
        toast.error('Failed to revoke award');
      }
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Academic': return <Award className="h-5 w-5 text-indigo-500" />;
      case 'Sports': return <Trophy className="h-5 w-5 text-amber-500" />;
      case 'Conduct': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'Attendance': return <Target className="h-5 w-5 text-emerald-500" />;
      case 'Arts': return <Medal className="h-5 w-5 text-purple-500" />;
      default: return <Award className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const badgeOptions = [
    'Math Star', 'Reading Champion', 'Science Wizard', 'Perfect Attendance',
    'Helping Hand', 'Sports MVP', 'Creative Genius', 'Top Scorer', 'Rising Star'
  ];

  const isLoading = loadingAwards || loadingStudents;
  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Leaderboard & Rewards"
      subtitle="Reward student excellence and track academic milestones"
      breadcrumb={['School', 'Rewards']}
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" /> Grant Award
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top podium view */}
        <div className="lg:col-span-3 bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-bold text-foreground mb-6">Top Achievers</h2>
          <div className="flex justify-center items-end gap-6 h-60 w-full max-w-xl">
            {leaderboard[1] && (
              <div className="flex flex-col items-center flex-1">
                <div className="bg-muted px-3 py-1.5 rounded-full text-xs font-bold border border-border mb-3 flex items-center justify-center">🥈 #2</div>
                <div className="bg-gradient-to-t from-muted/50 to-muted/20 w-full h-24 rounded-t-xl flex flex-col items-center justify-center p-3 border border-border border-b-0 shadow-inner">
                  <span className="font-semibold text-foreground text-sm truncate max-w-full">{leaderboard[1].student_name}</span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">{leaderboard[1].total_points} pts</span>
                </div>
              </div>
            )}
            
            {leaderboard[0] && (
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center justify-center gap-1">🥇 MVP</div>
                <div className="bg-gradient-to-t from-amber-500/10 to-amber-500/5 w-full h-32 rounded-t-xl flex flex-col items-center justify-center p-3 border border-amber-500/20 border-b-0 shadow-inner">
                  <span className="font-bold text-foreground text-base truncate max-w-full">{leaderboard[0].student_name}</span>
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-black mt-1">{leaderboard[0].total_points} pts</span>
                </div>
              </div>
            )}

            {leaderboard[2] && (
              <div className="flex flex-col items-center flex-1">
                <div className="bg-muted px-3 py-1.5 rounded-full text-xs font-bold border border-border mb-3 flex items-center justify-center">🥉 #3</div>
                <div className="bg-gradient-to-t from-muted/50 to-muted/20 w-full h-18 rounded-t-xl flex flex-col items-center justify-center p-3 border border-border border-b-0 shadow-inner">
                  <span className="font-semibold text-foreground text-xs truncate max-w-full">{leaderboard[2].student_name}</span>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{leaderboard[2].total_points} pts</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top 10 Table */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50 bg-muted/20">
            <h3 className="font-bold text-sm text-foreground">Top 10 Students</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td className="p-8 text-center text-muted-foreground">Loading leaderboard...</td></tr>
                ) : leaderboard.length === 0 ? (
                  <tr><td className="p-8 text-center text-muted-foreground">No points awarded yet.</td></tr>
                ) : (
                  leaderboard.map((student, index) => (
                    <tr key={student.student_id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 w-14 text-center">
                        <span className={`font-black text-sm ${index < 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>#{index + 1}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{student.student_name}</div>
                        <div className="text-xs text-muted-foreground">{student.class_name}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full font-bold text-xs">
                          {student.total_points} pts
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Awards Timeline */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50 bg-muted/20">
            <h3 className="font-bold text-sm text-foreground">Recent Awards</h3>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto flex-1">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-10">Loading recent awards...</div>
            ) : awards.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-10">No recent awards.</p>
            ) : (
              awards.slice().reverse().map(record => (
                <div key={record.id} className="flex gap-3 items-start p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors relative group">
                  <div className="bg-card p-2 rounded-xl border border-border/50 shadow-sm">{getCategoryIcon(record.data.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-foreground text-sm truncate">{record.data.student_name}</p>
                      <span className="text-xs font-bold text-emerald-600 flex-shrink-0">+{record.data.points} pts</span>
                    </div>
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{record.data.badge}</p>
                    {record.data.reason && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.data.reason}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{record.data.date}</p>
                  </div>
                  <button onClick={() => handleDelete(record.id)} className="text-muted-foreground hover:text-rose-600 absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grant Award Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader><DialogTitle>Grant Award</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Student *</Label>
              <select value={formData.student_id} onChange={e => handleStudentSelect(e.target.value)} className={`w-full ${inputCls}`}>
                <option value="">Select a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{`${s.data.first_name || ''} ${s.data.last_name || ''}`.trim()} ({s.data.current_class})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`w-full ${inputCls}`}>
                  <option>Academic</option><option>Sports</option><option>Conduct</option><option>Attendance</option><option>Arts</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: Number(e.target.value) })} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Badge Type</Label>
                <select value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} className={`w-full ${inputCls}`}>
                  {badgeOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason / Note</Label>
              <Input value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for award..." className="h-10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Grant Award</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SchoolPageShell>
  );
}
