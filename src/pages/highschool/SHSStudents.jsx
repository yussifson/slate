import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Users, UserCheck, GraduationCap, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SHSStudents() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    grade: '',
    program: '',
    gender: 'Male',
    status: 'Active'
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Using LegalCase as generic entity store for SHS records
      const records = await base44.getEntities('shs_student', user?.company_id);
      setStudents(records);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchStudents();
    }
  }, [user]);

  const handleAddStudent = async () => {
    try {
      const payload = {
        company_id: user?.company_id,
        case_type: 'shs_student',
        title: `${newStudent.firstName} ${newStudent.lastName}`, // Acts as full name
        case_number: newStudent.studentId,
        status: newStudent.status,
        data: newStudent // JSON payload
      };
      
      await base44.createEntity(payload);
      setIsAddModalOpen(false);
      setNewStudent({ firstName: '', lastName: '', studentId: '', grade: '', program: '', gender: 'Male', status: 'Active' });
      fetchStudents();
    } catch (error) {
      console.error('Failed to create student:', error);
    }
  };

  const filteredStudents = students.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-blue-700 to-teal-800 bg-clip-text text-transparent">
            Student Directory
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage all enrolled students, their academic programs, and statuses.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchStudents} className="h-9 gap-2 rounded-xl border-blue-200 dark:border-slate-600 hover:bg-blue-50 dark:bg-slate-800 hover:text-blue-800 dark:text-blue-200">
            <RefreshCw className="w-4 h-4" /> Sync
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="h-9 gap-2 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Enroll Student
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-purple-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{students.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-purple-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Active</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {students.filter(s => s.status === 'Active').length}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-purple-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Graduating Class</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {students.filter(s => s.data?.grade === 'Form 3').length}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-purple-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">On Leave</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {students.filter(s => s.status === 'On Leave').length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Area */}
      <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Enrolled Roster</CardTitle>
              <CardDescription>Comprehensive list of all registered students</CardDescription>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input 
                  placeholder="Search name or ID..." 
                  className="pl-9 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <Filter className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">Loading roster...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-500 dark:text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">No students found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                {searchQuery ? "No students match your search criteria." : "There are currently no students enrolled in the system. Click 'Enroll Student' to add one."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 dark:text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Student Name</th>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">Grade / Form</th>
                    <th className="px-6 py-4">Programme</th>
                    <th className="px-6 py-4">Gender</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-800 dark:text-blue-200 flex items-center justify-center font-bold text-xs">
                            {student.title?.charAt(0) || 'S'}
                          </div>
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{student.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">{student.case_number}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.data?.grade}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.data?.program}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.data?.gender}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          student.status === 'Active' ? 'bg-blue-50 dark:bg-slate-800 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-slate-600' :
                          student.status === 'On Leave' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:text-blue-100 hover:bg-blue-50 dark:bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-blue-700 to-teal-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Enroll New Student</DialogTitle>
              <DialogDescription className="text-blue-100 dark:text-blue-900">
                Enter the details of the student to add them to the directory.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <ScrollArea className="max-h-[60vh] p-6 bg-slate-50 dark:bg-slate-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">First Name</label>
                <Input 
                  value={newStudent.firstName} 
                  onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} 
                  placeholder="e.g. John"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-purple-500 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Last Name</label>
                <Input 
                  value={newStudent.lastName} 
                  onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} 
                  placeholder="e.g. Doe"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-purple-500 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Student ID</label>
                <Input 
                  value={newStudent.studentId} 
                  onChange={e => setNewStudent({...newStudent, studentId: e.target.value})} 
                  placeholder="e.g. SHS-2026-001"
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-purple-500 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Gender</label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  value={newStudent.gender}
                  onChange={e => setNewStudent({...newStudent, gender: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Form / Grade</label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  value={newStudent.grade}
                  onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                >
                  <option value="">Select Grade...</option>
                  <option value="Form 1">Form 1</option>
                  <option value="Form 2">Form 2</option>
                  <option value="Form 3">Form 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Programme</label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  value={newStudent.program}
                  onChange={e => setNewStudent({...newStudent, program: e.target.value})}
                >
                  <option value="">Select Programme...</option>
                  <option value="General Science">General Science</option>
                  <option value="General Arts">General Arts</option>
                  <option value="Business">Business</option>
                  <option value="Visual Arts">Visual Arts</option>
                  <option value="Home Economics">Home Economics</option>
                </select>
              </div>
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800">
              Cancel
            </Button>
            <Button 
              onClick={handleAddStudent} 
              disabled={!newStudent.firstName || !newStudent.lastName || !newStudent.studentId}
              className="rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold shadow-md"
            >
              Enroll Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
