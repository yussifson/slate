import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Phone, GraduationCap, HeartPulse, Shield, BookOpen, Clock, Activity, AlertTriangle } from 'lucide-react';
import SchoolAPI from '@/api/SchoolAPI';

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
      <div className="text-[var(--primary)] font-semibold animate-pulse text-lg tracking-tight">Loading Profile...</div>
    </div>
  );
  if (!student) return <div className="p-8 text-center text-[var(--color-destructive)] font-medium border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-destructive)]/30 rounded-[var(--radius-xl)] bg-[var(--color-destructive)]/5">Student not found.</div>;

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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-primary/40 pb-4">
        <Button variant="ghost" onClick={() => navigate('/school/students')} className="gap-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--primary)] rounded-full">
          <ArrowLeft className="w-5 h-5" /> Back to Directory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 text-center rounded-[var(--radius-xl)]">
            <div className="w-24 h-24 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full mx-auto flex items-center justify-center text-3xl font-semibold mb-4 border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 tracking-[-0.02em]">
              {student.avatar || student.name?.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-xl font-display font-semibold text-[var(--color-text-primary)] mb-1 leading-tight tracking-tight">{student.name}</h2>
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-4 tracking-[0.04em]">{student.id_number || student.student_id}</p>
            <div className="inline-block px-3 py-1 bg-[var(--color-surface-1)] text-[var(--primary)] text-[10px] font-semibold uppercase tracking-[var(--tracking-widest)] border-[0.5px] border-black/9 dark:border-white/8 border-[var(--primary)]/20 rounded-full tracking-[0.04em]">
              {student.status || 'Active'}
            </div>
            <div className="mt-4 text-xs text-[var(--color-text-secondary)] font-medium">
              Enrolled: {student.enrollmentDate || student.enrollment_date || 'N/A'}
            </div>
          </div>

          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-[var(--radius-xl)] overflow-hidden">
            <div className="bg-[var(--color-surface-1)] border-b border-primary/20 text-[var(--color-text-primary)] p-4 font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--primary)]"/> Overview
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col">
                <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Class</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-base">{student.class}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Gender</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-base">{student.gender || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Date of Birth</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-base">{student.dateOfBirth || student.dob || (student.age ? `${student.age} yrs` : 'N/A')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] tracking-[0.04em]">Address</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-sm">{student.address || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="md:col-span-3">
          {/* Custom Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 scrollbar-hide overflow-x-auto">
            <button onClick={() => setActiveTab('academics')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'academics' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Academics</button>
            <button onClick={() => setActiveTab('attendance')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'attendance' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Attendance</button>
            <button onClick={() => setActiveTab('fees')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'fees' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Fees</button>
            <button onClick={() => setActiveTab('discipline')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'discipline' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Discipline</button>
            <button onClick={() => setActiveTab('contact')} className={`px-5 py-2.5 font-semibold text-sm transition-colors rounded-full whitespace-nowrap ${activeTab === 'contact' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 text-[var(--color-text-secondary)] hover:border-primary/40'}`}>Personal Info</button>
          </div>

          <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-[var(--radius-xl)] min-h-[400px]">
            {activeTab === 'academics' && (
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Academic Performance
                </h3>
                
                <div className="mb-6 p-4 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] border-[0.5px] border-primary/20">
                  <div className="text-sm text-[var(--color-text-secondary)] mb-1">Average Score</div>
                  <div className="text-3xl font-semibold text-[var(--primary)]">{avgScore.toFixed(1)}%</div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-primary/20 text-[var(--color-text-secondary)]">
                        <th className="pb-3 font-semibold">Subject</th>
                        <th className="pb-3 font-semibold">Term</th>
                        <th className="pb-3 font-semibold">Score</th>
                        <th className="pb-3 font-semibold">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myGrades.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[var(--color-text-secondary)]">No grade records found.</td>
                        </tr>
                      ) : (
                        myGrades.map((g, idx) => {
                          const gradeInfo = SchoolAPI.calcGrade(g.data?.score, g.data?.max_score);
                          return (
                            <tr key={idx} className="border-b border-primary/10 last:border-0">
                              <td className="py-4 font-medium text-[var(--color-text-primary)]">{g.data?.subject || 'Unknown'}</td>
                              <td className="py-4 text-[var(--color-text-secondary)]">{g.data?.term || 'N/A'}</td>
                              <td className="py-4 text-[var(--color-text-primary)]">{g.data?.score}/{g.data?.max_score || 100}</td>
                              <td className="py-4">
                                <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded text-xs font-bold">
                                  {gradeInfo.letter}
                                </span>
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
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Attendance History
                </h3>

                <div className="mb-6 p-4 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] border-[0.5px] border-primary/20 flex gap-8">
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">Attendance Rate</div>
                    <div className="text-3xl font-semibold text-[var(--primary)]">{attendanceRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">Total Days Present</div>
                    <div className="text-3xl font-semibold text-[var(--primary)]">{presentDays} / {totalAttendanceDays}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {myAttendance.length === 0 ? (
                    <div className="text-center py-6 text-[var(--color-text-secondary)]">No attendance records found.</div>
                  ) : (
                    myAttendance.sort((a,b) => new Date(b.data?.date || 0) - new Date(a.data?.date || 0)).slice(0, 10).map((a, idx) => {
                      const sRec = a.data.records.find(s => s.student_id === id);
                      const isPresent = sRec?.status === 'Present';
                      return (
                        <div key={idx} className="flex justify-between items-center p-4 border border-primary/10 rounded-[var(--radius-md)] bg-[var(--color-surface-0)]">
                          <div className="font-medium">{a.data?.date}</div>
                          <div className={`text-sm font-semibold px-2 py-1 rounded ${isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {sRec?.status || 'Unknown'}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Fee Records
                </h3>

                <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] border-[0.5px] border-primary/20">
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">Total Billed</div>
                    <div className="text-2xl font-semibold">GHS {totalFees.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] border-[0.5px] border-primary/20">
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">Total Paid</div>
                    <div className="text-2xl font-semibold text-green-600">GHS {paidFees.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] border-[0.5px] border-primary/20">
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">Outstanding Balance</div>
                    <div className={`text-2xl font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>GHS {balance.toFixed(2)}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-primary/20 text-[var(--color-text-secondary)]">
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Description</th>
                        <th className="pb-3 font-semibold">Amount</th>
                        <th className="pb-3 font-semibold">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myFees.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[var(--color-text-secondary)]">No fee records found.</td>
                        </tr>
                      ) : (
                        myFees.map((f, idx) => (
                          <tr key={idx} className="border-b border-primary/10 last:border-0">
                            <td className="py-4 font-medium text-[var(--color-text-primary)]">{f.data?.date || 'N/A'}</td>
                            <td className="py-4 text-[var(--color-text-secondary)]">{f.data?.description || f.data?.fee_type || 'Fee'}</td>
                            <td className="py-4 text-[var(--color-text-primary)]">GHS {Number(f.data?.amount || 0).toFixed(2)}</td>
                            <td className="py-4 text-[var(--color-text-primary)]">GHS {Number(f.data?.paid || 0).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'discipline' && (
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Discipline Incidents
                </h3>

                <div className="space-y-4">
                  {myDiscipline.length === 0 ? (
                    <div className="text-center py-6 text-[var(--color-text-secondary)]">No discipline records found.</div>
                  ) : (
                    myDiscipline.map((d, idx) => (
                      <div key={idx} className="p-4 border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 rounded-[var(--radius-md)]">
                        <div className="flex justify-between mb-2">
                          <div className="font-semibold text-[var(--color-destructive)]">{d.data?.type || 'Incident'}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">{d.data?.date}</div>
                        </div>
                        <p className="text-sm text-[var(--color-text-primary)] mb-2">{d.data?.description}</p>
                        <div className="text-xs text-[var(--color-text-secondary)]">Action Taken: <span className="font-medium text-[var(--color-text-primary)]">{d.data?.action || 'None'}</span></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="p-8 animate-in fade-in">
                <h3 className="text-2xl font-display font-semibold text-[var(--color-text-primary)] mb-6 flex items-center gap-3 tracking-tight tracking-[-0.02em]">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  Personal Info & Guardians
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><User className="w-3.5 h-3.5"/> Parent/Guardian</span>
                    <p className="font-semibold text-[var(--color-text-primary)] text-xl">{student.parentName || student.parent_name || student.parent || 'Not Provided'}</p>
                  </div>
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><Phone className="w-3.5 h-3.5"/> Phone</span>
                    <p className="font-semibold text-[var(--color-text-primary)] text-xl">{student.phone || student.parent_phone || 'Not Provided'}</p>
                  </div>
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-[var(--color-surface-1)] rounded-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-text-tertiary)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><Mail className="w-3.5 h-3.5"/> Email</span>
                    <p className="font-semibold text-[var(--color-text-primary)] text-base truncate">{student.email || student.parentEmail || 'Not Provided'}</p>
                  </div>
                  <div className="border-[0.5px] border-black/9 dark:border-white/8 border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 rounded-[var(--radius-lg)] p-5">
                    <span className="text-[var(--color-destructive)] text-[11px] font-semibold uppercase tracking-[var(--tracking-widest)] flex items-center gap-2 mb-2 tracking-[0.04em]"><Shield className="w-3.5 h-3.5"/> Emergency Contact</span>
                    <p className="font-semibold text-[var(--color-destructive)] text-xl">{student.emergencyContactName || student.emergency_contact || 'Not Provided'}</p>
                    {student.emergencyContactPhone && <p className="font-medium text-[var(--color-destructive)]/80 mt-1">{student.emergencyContactPhone}</p>}
                  </div>
                </div>

                <div className="mt-8 bg-[var(--color-surface-1)] border-l-4 border-[var(--primary)] rounded-r-[var(--radius-lg)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><HeartPulse className="w-4 h-4"/> Medical Notes</h4>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] leading-relaxed">
                    {student.medicalNotes || student.medical_notes || "No medical conditions or allergies reported in the current system records."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
