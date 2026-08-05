import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, GraduationCap, HeartPulse, Shield, Clock, Activity, AlertTriangle } from 'lucide-react';
import SchoolAPI from '@/api/SchoolAPI';
import SchoolPageShell from '@/components/school/SchoolPageShell';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('academics');

  const { data: studentRecords = [], isLoading: isLoadingStudents } = useIndustryRecords('school_student');
  const { data: gradeRecords = [], isLoading: isLoadingGrades } = useIndustryRecords('school_grade');
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useIndustryRecords('school_attendance');
  const { data: feeRecords = [], isLoading: isLoadingFees } = useIndustryRecords('school_fee');
  const { data: disciplineRecords = [], isLoading: isLoadingDiscipline } = useIndustryRecords('school_discipline');

  const isLoading = isLoadingStudents || isLoadingGrades || isLoadingAttendance || isLoadingFees || isLoadingDiscipline;

  const studentRecord = studentRecords.find(r => r.id === id);
  const student = studentRecord ? { id: studentRecord.id, ...studentRecord.data } : null;

  const myGrades = gradeRecords.filter(r => r.data?.student_id === id);
  const myAttendance = attendanceRecords.filter(r => 
    Array.isArray(r.data?.records) && r.data.records.some(s => s.student_id === id)
  );
  const myFees = feeRecords.filter(r => r.data?.student_id === id);
  const myDiscipline = disciplineRecords.filter(r => r.data?.student_id === id);

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-indigo-600 font-semibold animate-pulse text-lg tracking-tight">Loading Profile...</div>
    </div>
  );
  if (!student) return <div className="p-8 text-center text-rose-600 font-medium border border-rose-200 rounded-xl bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">Student not found.</div>;

  // Calculate attendance rate
  const totalAttendanceDays = myAttendance.length;
  const presentDays = myAttendance.filter(r => {
    const sRec = r.data.records.find(s => s.student_id === id);
    return sRec && sRec.status === 'Present';
  }).length;
  const attendanceRate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0;

  // Calculate average GPA/score
  let avgScore = 0;
  if (myGrades.length > 0) {
    const totalScore = myGrades.reduce((sum, g) => sum + (Number(g.data?.score) || 0), 0);
    avgScore = totalScore / myGrades.length;
  }

  // Calculate fees
  let totalFees = 0;
  let paidFees = 0;
  myFees.forEach(f => {
    totalFees += Number(f.data?.amount || 0);
    paidFees += Number(f.data?.paid || 0);
  });
  const balance = totalFees - paidFees;

  return (
    <SchoolPageShell
      title={student.name || 'Student Profile'}
      subtitle={student.id_number || student.student_id || 'Student Details'}
      breadcrumb={['School', 'Directory', 'Profile']}
      actions={
        <Button variant="outline" onClick={() => navigate('/school/students')} className="gap-2 rounded-lg border-border/50 h-10 text-xs">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-card border border-border/50 p-6 text-center rounded-xl shadow-sm">
            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4 border border-indigo-500/20">
              {student.avatar || student.name?.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1 leading-tight">{student.name}</h2>
            <p className="text-xs text-muted-foreground mb-4">{student.id_number || student.student_id}</p>
            <div className="inline-block px-3 py-1 bg-muted text-foreground text-[10px] font-bold uppercase tracking-wider rounded-full">
              {student.status || 'Active'}
            </div>
            <div className="mt-4 text-xs text-muted-foreground font-medium">
              Enrolled: {student.enrollmentDate || student.enrollment_date || 'N/A'}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/20 border-b border-border/50 text-foreground p-4 font-bold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600"/> Overview
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Class</span>
                <span className="font-semibold text-foreground text-sm">{student.class}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Gender</span>
                <span className="font-semibold text-foreground text-sm">{student.gender || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Date of Birth</span>
                <span className="font-semibold text-foreground text-sm">{student.dateOfBirth || student.dob || (student.age ? `${student.age} yrs` : 'N/A')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Address</span>
                <span className="font-semibold text-foreground text-xs leading-relaxed">{student.address || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="md:col-span-3">
          {/* Custom Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-6 bg-card border border-border/50 rounded-xl p-1.5 shadow-sm">
            {['academics', 'attendance', 'fees', 'discipline', 'contact'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{tab === 'contact' ? 'Personal Info' : tab}</button>
            ))}
          </div>

          <div className="bg-card border border-border/50 rounded-xl min-h-[400px] shadow-sm">
            {activeTab === 'academics' && (
              <div className="p-6">
                <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-3">
                  <GraduationCap className="w-4 h-4 text-indigo-600" /> Academic Performance
                </h3>
                
                <div className="mb-6 p-4 bg-muted/20 rounded-xl border border-border/30">
                  <div className="text-xs text-muted-foreground mb-1">Average Score</div>
                  <div className="text-2xl font-bold text-indigo-600">{avgScore.toFixed(1)}%</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Subject</th>
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Term</th>
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Score</th>
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {myGrades.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No grade records found.</td></tr>
                      ) : (
                        myGrades.map((g, idx) => {
                          const gradeInfo = SchoolAPI.calcGrade(g.data?.score, g.data?.max_score);
                          return (
                            <tr key={idx} className="hover:bg-muted/10 transition-colors">
                              <td className="py-4 font-semibold text-foreground">{g.data?.subject || 'Unknown'}</td>
                              <td className="py-4 text-muted-foreground">{g.data?.term || 'N/A'}</td>
                              <td className="py-4 text-foreground">{g.data?.score} / {g.data?.max_score || 100}</td>
                              <td className="py-4">
                                <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold border border-indigo-100 dark:border-indigo-500/20">{gradeInfo.letter}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="p-6">
                <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-3">
                  <Clock className="w-4 h-4 text-indigo-600" /> Attendance History
                </h3>

                <div className="mb-6 p-4 bg-muted/20 rounded-xl border border-border/30 flex gap-8">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Attendance Rate</div>
                    <div className="text-2xl font-bold text-indigo-600">{attendanceRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Days Present</div>
                    <div className="text-2xl font-bold text-indigo-600">{presentDays} / {totalAttendanceDays}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {myAttendance.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No attendance records found.</div>
                  ) : (
                    myAttendance.sort((a,b) => new Date(b.data?.date || 0) - new Date(a.data?.date || 0)).slice(0, 10).map((a, idx) => {
                      const sRec = a.data.records.find(s => s.student_id === id);
                      const isPresent = sRec?.status === 'Present';
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 border border-border/50 rounded-xl bg-muted/10">
                          <div className="font-semibold text-xs text-foreground">{a.data?.date}</div>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isPresent ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                            {sRec?.status || 'Unknown'}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="p-6">
                <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-3">
                  <Activity className="w-4 h-4 text-indigo-600" /> Fee Records
                </h3>

                <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50/30 dark:bg-blue-950/15 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Total Billed</div>
                    <div className="text-lg font-extrabold text-slate-800 dark:text-zinc-150">GHS {totalFees.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/15 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Total Paid</div>
                    <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">GHS {paidFees.toFixed(2)}</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${balance > 0 ? 'bg-rose-50/30 dark:bg-rose-950/15 border-rose-100/50 dark:border-rose-900/30' : 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-100/50 dark:border-emerald-900/30'}`}>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Outstanding</div>
                    <div className={`text-lg font-extrabold ${balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>GHS {balance.toFixed(2)}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground">
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Date</th>
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Description</th>
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Amount</th>
                        <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {myFees.length === 0 ? (
                        <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No fee records found.</td></tr>
                      ) : (
                        myFees.map((f, idx) => (
                          <tr key={idx} className="hover:bg-muted/10 transition-colors">
                            <td className="py-4 text-muted-foreground">{f.data?.date || 'N/A'}</td>
                            <td className="py-4 font-semibold text-foreground">{f.data?.description || f.data?.fee_type || 'Fee'}</td>
                            <td className="py-4 text-foreground">GHS {Number(f.data?.amount || 0).toFixed(2)}</td>
                            <td className="py-4 text-foreground">GHS {Number(f.data?.paid || 0).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'discipline' && (
              <div className="p-6">
                <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-3">
                  <AlertTriangle className="w-4 h-4 text-indigo-600" /> Discipline Incidents
                </h3>

                <div className="space-y-4">
                  {myDiscipline.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">No discipline records found.</div>
                  ) : (
                    myDiscipline.map((d, idx) => (
                      <div key={idx} className="p-4 border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl">
                        <div className="flex justify-between mb-2">
                          <div className="font-bold text-rose-600 text-sm">{d.data?.type || 'Incident'}</div>
                          <div className="text-xs text-muted-foreground">{d.data?.date}</div>
                        </div>
                        <p className="text-xs text-foreground/80 mb-2 leading-relaxed">{d.data?.description}</p>
                        <div className="text-xs text-muted-foreground">Action: <span className="font-semibold text-foreground">{d.data?.action || 'None'}</span></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="p-6">
                <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-3">
                  <Mail className="w-4 h-4 text-indigo-600" /> Personal Info & Guardians
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border/50 bg-muted/10 rounded-xl p-4">
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><User className="w-3.5 h-3.5"/> Parent/Guardian</span>
                    <p className="font-semibold text-foreground text-sm">{student.parentName || student.parent_name || student.parent || 'Not Provided'}</p>
                  </div>
                  <div className="border border-border/50 bg-muted/10 rounded-xl p-4">
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Phone className="w-3.5 h-3.5"/> Phone</span>
                    <p className="font-semibold text-foreground text-sm">{student.phone || student.parent_phone || 'Not Provided'}</p>
                  </div>
                  <div className="border border-border/50 bg-muted/10 rounded-xl p-4">
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Mail className="w-3.5 h-3.5"/> Email</span>
                    <p className="font-semibold text-foreground text-sm truncate">{student.email || student.parentEmail || 'Not Provided'}</p>
                  </div>
                  <div className="border border-rose-200 dark:border-rose-500/20 bg-rose-50/20 dark:bg-rose-500/5 rounded-xl p-4">
                    <span className="text-rose-600 dark:text-rose-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Shield className="w-3.5 h-3.5"/> Emergency Contact</span>
                    <p className="font-semibold text-rose-700 dark:text-rose-400 text-sm">{student.emergencyContactName || student.emergency_contact || 'Not Provided'}</p>
                    {student.emergencyContactPhone && <p className="font-medium text-rose-600 dark:text-rose-400/80 text-xs mt-1">{student.emergencyContactPhone}</p>}
                  </div>
                </div>

                <div className="mt-6 bg-muted/20 border-l-4 border-indigo-600 rounded-r-xl p-5">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 mb-2"><HeartPulse className="w-3.5 h-3.5 text-rose-500"/> Medical Notes</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {student.medicalNotes || student.medical_notes || "No medical conditions or allergies reported in the current system records."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SchoolPageShell>
  );
}
