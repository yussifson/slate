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
import toast from 'react-hot-toast';

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

  // Calculate Leaderboard
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
      setFormData({
        ...formData,
        student_id: studentId,
        student_name: `${student.data.first_name} ${student.data.last_name}`,
        class_name: student.data.current_class || ''
      });
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
      case 'Academic': return <Award className="h-5 w-5 text-blue-500" />;
      case 'Sports': return <Trophy className="h-5 w-5 text-orange-500" />;
      case 'Conduct': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'Attendance': return <Target className="h-5 w-5 text-green-500" />;
      case 'Arts': return <Medal className="h-5 w-5 text-purple-500" />;
      default: return <Award className="h-5 w-5 text-gray-500" />;
    }
  };

  const badgeOptions = [
    'Math Star', 'Reading Champion', 'Science Wizard', 'Perfect Attendance',
    'Helping Hand', 'Sports MVP', 'Creative Genius', 'Top Scorer', 'Rising Star'
  ];

  if (loadingAwards || loadingStudents) {
    return <div className="p-8 text-center text-gray-500">Loading gamification data...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-300" />
            Student Leaderboard
          </h1>
          <p className="text-indigo-100 opacity-90 text-lg">Reward excellence and gamify learning.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-white text-indigo-600 hover:bg-gray-100 font-bold border-none">
          <Plus className="h-4 w-4 mr-2" />
          Grant Award
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 3 Podium */}
        <div className="lg:col-span-3">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Top Achievers</h2>
          <div className="flex justify-center items-end gap-4 h-64 mt-8">
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-full shadow-md mb-2 border-4 border-gray-300">
                  <span className="text-xl font-bold text-gray-700">#2</span>
                </div>
                <div className="bg-gradient-to-t from-gray-300 to-gray-100 w-32 h-32 rounded-t-lg flex flex-col items-center justify-center p-2 shadow-inner">
                  <span className="font-bold text-gray-800 truncate w-full text-center">{leaderboard[1].student_name}</span>
                  <span className="text-sm font-medium text-gray-600">{leaderboard[1].total_points} pts</span>
                </div>
              </div>
            )}
            
            {leaderboard[0] && (
              <div className="flex flex-col items-center z-10">
                <div className="bg-white p-4 rounded-full shadow-lg mb-2 border-4 border-yellow-400">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="bg-gradient-to-t from-yellow-300 to-yellow-100 w-36 h-44 rounded-t-lg flex flex-col items-center justify-center p-2 shadow-inner">
                  <span className="font-bold text-gray-900 truncate w-full text-center text-lg">{leaderboard[0].student_name}</span>
                  <span className="text-md font-bold text-yellow-800">{leaderboard[0].total_points} pts</span>
                </div>
              </div>
            )}

            {leaderboard[2] && (
              <div className="flex flex-col items-center">
                <div className="bg-white p-3 rounded-full shadow-md mb-2 border-4 border-amber-600">
                  <span className="text-xl font-bold text-amber-700">#3</span>
                </div>
                <div className="bg-gradient-to-t from-amber-200 to-amber-50 w-32 h-24 rounded-t-lg flex flex-col items-center justify-center p-2 shadow-inner">
                  <span className="font-bold text-gray-800 truncate w-full text-center">{leaderboard[2].student_name}</span>
                  <span className="text-sm font-medium text-amber-800">{leaderboard[2].total_points} pts</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Top 10 Students</h3>
          </div>
          <table className="w-full">
            <tbody>
              {leaderboard.length === 0 ? (
                <tr><td className="p-8 text-center text-gray-500">No points awarded yet.</td></tr>
              ) : (
                leaderboard.map((student, index) => (
                  <tr key={student.student_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 w-16 text-center">
                      <span className={`font-bold ${index < 3 ? 'text-lg' : 'text-gray-500'}`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{student.student_name}</div>
                      <div className="text-xs text-gray-500">{student.class_name}</div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold">
                        {student.total_points} pts
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Awards Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Recent Awards</h3>
          </div>
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {awards.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No recent awards.</p>
            ) : (
              awards.slice().reverse().map((record) => (
                <div key={record.id} className="flex gap-4 items-start p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="bg-gray-50 p-2 rounded-full border border-gray-200">
                    {getCategoryIcon(record.data.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-gray-800 text-sm">{record.data.student_name}</p>
                      <span className="text-xs font-bold text-green-600">+{record.data.points}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700">{record.data.badge}</p>
                    <p className="text-xs text-gray-500 mt-1">{record.data.reason}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{record.data.date}</p>
                  </div>
                  <button onClick={() => handleDelete(record.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Grant Award</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select onValueChange={handleStudentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id || s.data.student_id}>
                      {s.data.first_name} {s.data.last_name} ({s.data.current_class})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Conduct">Conduct</SelectItem>
                    <SelectItem value="Attendance">Attendance</SelectItem>
                    <SelectItem value="Arts">Arts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Badge</Label>
                <Select value={formData.badge} onValueChange={(v) => setFormData({ ...formData, badge: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {badgeOptions.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason for Award</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Top score in Mathematics exam"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">Grant Award</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
