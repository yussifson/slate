import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserCircle, MapPin, Phone, Mail, GraduationCap, ShieldAlert, FileText, HeartPulse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SHSStudentProfiles() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const records = await base44.getEntities('shs_student', user?.company_id);
      setStudents(records);
      if (records.length > 0 && !selectedStudent) {
        setSelectedStudent(records[0]);
      }
    } catch (error) {
      console.error('Failed to fetch student profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company_id) {
      fetchStudents();
    }
  }, [user]);

  const filteredStudents = students.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.case_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#6F00FF] to-purple-800 bg-clip-text text-transparent">
            Student Profiles
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            View detailed demographic, academic, and family information for students.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Panel: Student List */}
        <Card className="w-[350px] shrink-0 flex flex-col rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-purple-100/50">
          <div className="p-4 border-b border-purple-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <Input 
                placeholder="Search students..." 
                className="pl-9 h-10 bg-white border-purple-100 rounded-xl focus-visible:ring-[#6F00FF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-purple-300 text-sm">Loading profiles...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No students found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 ${
                      selectedStudent?.id === student.id 
                        ? 'bg-[#6F00FF] text-white shadow-md shadow-purple-500/20' 
                        : 'hover:bg-purple-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selectedStudent?.id === student.id ? 'bg-white/20' : 'bg-purple-100 text-[#6F00FF]'
                    }`}>
                      {student.title?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold truncate">{student.title}</p>
                      <p className={`text-xs truncate ${selectedStudent?.id === student.id ? 'text-purple-200' : 'text-slate-500'}`}>
                        {student.case_number} • {student.data?.grade}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Right Panel: Student Details */}
        <Card className="flex-1 flex flex-col rounded-3xl border-none shadow-sm bg-white/80 backdrop-blur-xl ring-1 ring-purple-100/50 overflow-hidden relative">
          {selectedStudent ? (
            <>
              {/* Profile Header Background */}
              <div className="h-32 bg-gradient-to-r from-[#6F00FF] to-purple-500 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>
              
              <ScrollArea className="flex-1 -mt-12">
                <div className="px-8 pb-8">
                  {/* Profile Avatar & Primary Info */}
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl shrink-0">
                      <div className="w-full h-full rounded-2xl bg-purple-50 flex items-center justify-center text-[#6F00FF]">
                        <UserCircle className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="flex-1 mt-4 sm:mt-12">
                      <h2 className="text-3xl font-black text-slate-800">{selectedStudent.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5"><Badge variant="outline" className="border-purple-200 bg-purple-50 text-[#6F00FF]">{selectedStudent.case_number}</Badge></span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-purple-400" /> {selectedStudent.data?.program}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5"><Badge className={selectedStudent.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}>{selectedStudent.status}</Badge></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="bg-purple-50/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start border border-purple-100">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#6F00FF] data-[state=active]:shadow-sm">Overview</TabsTrigger>
                        <TabsTrigger value="family" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#6F00FF] data-[state=active]:shadow-sm">Family & Contacts</TabsTrigger>
                        <TabsTrigger value="medical" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#6F00FF] data-[state=active]:shadow-sm">Medical Summary</TabsTrigger>
                        <TabsTrigger value="documents" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#6F00FF] data-[state=active]:shadow-sm">Documents</TabsTrigger>
                      </TabsList>
                      
                      <div className="mt-6">
                        <TabsContent value="overview" className="space-y-6 outline-none">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100 space-y-4">
                              <h3 className="text-sm font-bold text-[#6F00FF] uppercase tracking-wider">Demographics</h3>
                              <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                  <p className="text-xs text-slate-500">Gender</p>
                                  <p className="font-medium text-slate-800">{selectedStudent.data?.gender || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Date of Birth</p>
                                  <p className="font-medium text-slate-800">{selectedStudent.data?.dob || 'Not Provided'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-xs text-slate-500">Address</p>
                                  <p className="font-medium text-slate-800 flex items-start gap-2 mt-1">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    {selectedStudent.data?.address || 'Address not logged in system'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-5 rounded-2xl bg-blue-50/30 border border-blue-100 space-y-4">
                              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Enrollment Info</h3>
                              <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                  <p className="text-xs text-slate-500">Current Grade</p>
                                  <p className="font-medium text-slate-800">{selectedStudent.data?.grade || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Boarding Status</p>
                                  <p className="font-medium text-slate-800">{selectedStudent.data?.boardingStatus || 'Day Student'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Enrollment Date</p>
                                  <p className="font-medium text-slate-800">{new Date(selectedStudent.created_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">House</p>
                                  <p className="font-medium text-slate-800">{selectedStudent.data?.house || 'Unassigned'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="family" className="outline-none">
                          <div className="p-8 text-center border-2 border-dashed border-purple-100 rounded-2xl bg-purple-50/20">
                            <Users className="w-10 h-10 text-purple-300 mx-auto mb-3" />
                            <h4 className="text-slate-700 font-bold">No Family Contacts Added</h4>
                            <p className="text-slate-500 text-sm mt-1 mb-4">You have not added any emergency contacts or guardians for this student.</p>
                            <Button variant="outline" className="border-purple-200 text-[#6F00FF] hover:bg-purple-50 rounded-xl">Add Contact</Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="medical" className="outline-none">
                          <div className="p-8 text-center border-2 border-dashed border-rose-100 rounded-2xl bg-rose-50/20">
                            <HeartPulse className="w-10 h-10 text-rose-300 mx-auto mb-3" />
                            <h4 className="text-slate-700 font-bold">No Medical Records</h4>
                            <p className="text-slate-500 text-sm mt-1 mb-4">No allergies, conditions, or medical history logged.</p>
                            <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl">Update Medical Info</Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="documents" className="outline-none">
                          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <h4 className="text-slate-700 font-bold">No Documents Uploaded</h4>
                            <p className="text-slate-500 text-sm mt-1 mb-4">Upload birth certificates, previous report cards, etc.</p>
                            <Button variant="outline" className="rounded-xl">Upload Document</Button>
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6">
                <UserCircle className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No Student Selected</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Select a student from the list on the left to view their detailed profile, family contacts, and medical summary.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
