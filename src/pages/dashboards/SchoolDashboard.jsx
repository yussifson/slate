import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  Award, 
  DollarSign, 
  Bell, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  Activity,
  Presentation
} from "lucide-react";

import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function StatCard({ icon: IconComp, label, value, sub, iconColor = "text-[#0066fe]", bgColor = "bg-[#0066fe]/05 border border-[#0066fe]/10", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2.2rem] shadow-[0_20px_48px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] p-6 hover:-translate-y-1 hover:shadow-[0_32px_64px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-center gap-5 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50/50 dark:from-zinc-800/10 to-transparent rounded-full pointer-events-none" />
      <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${bgColor}`}>
        <IconComp className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight leading-none">{value}</p>
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-2">{label}</p>
        {sub && <p className="text-[10px] text-slate-400/80 dark:text-zinc-500/80 mt-1 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

export default function SchoolDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const { data: studentRecords = [] } = useIndustryRecords('school_student');
  const { data: classRecords = [] } = useIndustryRecords('school_class');
  const { data: teacherRecords = [] } = useIndustryRecords('school_teacher');
  const { data: attendanceRecords = [] } = useIndustryRecords('school_attendance');
  const { data: feeRecords = [] } = useIndustryRecords('school_fee');
  const { data: examRecords = [] } = useIndustryRecords('school_exam');
  const { data: assignmentRecords = [] } = useIndustryRecords('school_assignment');
  const { data: noticeRecords = [] } = useIndustryRecords('school_notice');

  // KPIs
  const totalStudents = studentRecords.length;
  const activeStudents = studentRecords.filter(r => r.data?.status === 'Active').length;
  const totalClasses = classRecords.length;
  const totalTeachers = teacherRecords.length;

  // Attendance calculation
  const todayAttendance = attendanceRecords.filter(r => r.data?.date === todayStr);
  let attendanceAvg = 0;
  if (todayAttendance.length > 0) {
    let totalPct = 0;
    todayAttendance.forEach(att => {
      const present = parseFloat(att.data?.present_count) || 0;
      const total = parseFloat(att.data?.total_count) || 1; // avoid div by 0
      totalPct += (present / total);
    });
    attendanceAvg = Math.round((totalPct / todayAttendance.length) * 100);
  }

  // Fees calculation
  const feesCollected = feeRecords.reduce((sum, r) => sum + (parseFloat(r.data?.amount_paid) || 0), 0);
  const feesOutstanding = feeRecords.reduce((sum, r) => sum + (parseFloat(r.data?.balance) || 0), 0);

  // Upcoming Exams
  const upcomingExams = examRecords
    .filter(r => r.data?.status === 'Upcoming')
    .sort((a, b) => new Date(a.data?.exam_date || 0) - new Date(b.data?.exam_date || 0));

  // Recent Notices
  const recentNotices = [...noticeRecords]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Enrollment by Level
  let kgCount = 0;
  let primaryCount = 0;
  let jhsCount = 0;

  studentRecords.forEach(r => {
    const grade = r.data?.grade_level || r.data?.class_name || '';
    if (grade.includes('KG')) kgCount++;
    else if (grade.includes('Primary') || grade.includes('Class')) primaryCount++;
    else if (grade.includes('JHS') || grade.includes('Basic')) jhsCount++;
  });

  // Recent Activity
  const recentStudents = [...studentRecords]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div 
      className="school-theme-root min-h-screen text-foreground font-outfit w-full pb-12"
      style={{
        backgroundColor: 'hsl(var(--background))',
        backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.05) 1.2px, transparent 1.2px)`,
        backgroundSize: '24px 24px',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-10 school-page-enter">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[2.2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-8 sm:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#0066fe]/05 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/03 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#0066fe]/10 bg-[#0066fe]/04 text-[#0066fe] text-[10px] font-bold uppercase tracking-widest mb-4">
                <GraduationCap className="w-3.5 h-3.5" />
                Academic Portal
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50 mt-1">
                Academic Portal
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-base font-medium mt-2">
                Welcome back! Here's your school overview.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-zinc-500">
                <Calendar className="w-3.5 h-3.5 text-[#0066fe]" />
                <span>{format(today, "EEEE, MMMM d, yyyy")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3.5 bg-slate-50/80 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/50 rounded-[1.25rem] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.01)] min-w-[200px]">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              <div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Term Status</p>
                <div className="text-sm font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                  In Session
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            icon={Users} 
            label="Total Students" 
            value={totalStudents} 
            sub={`${activeStudents} Active`}
            iconColor="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-50/80 dark:bg-blue-500/10 border border-blue-100/30"
            onClick={() => navigate('/school-students')}
          />
          <StatCard 
            icon={BookOpen} 
            label="Total Classes" 
            value={totalClasses} 
            iconColor="text-violet-600 dark:text-violet-400"
            bgColor="bg-violet-50/80 dark:bg-violet-500/10 border border-violet-100/30"
            onClick={() => navigate('/school-classes')}
          />
          <StatCard 
            icon={Presentation} 
            label="Teachers" 
            value={totalTeachers} 
            iconColor="text-pink-600 dark:text-pink-400"
            bgColor="bg-pink-50/80 dark:bg-pink-500/10 border border-pink-100/30"
            onClick={() => navigate('/school-teachers')}
          />
          <StatCard 
            icon={Award} 
            label="Attendance" 
            value={todayAttendance.length > 0 ? `${attendanceAvg}%` : '-'} 
            sub="Today's Average"
            iconColor="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100/30"
          />
          <StatCard 
            icon={DollarSign} 
            label="Fees Collected" 
            value={`$${feesCollected.toLocaleString()}`} 
            iconColor="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100/30"
          />
          <StatCard 
            icon={TrendingUp} 
            label="Outstanding" 
            value={`$${feesOutstanding.toLocaleString()}`} 
            iconColor="text-amber-600 dark:text-amber-400"
            bgColor="bg-amber-50/80 dark:bg-amber-500/10 border border-amber-100/30"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[1.75rem] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.01)]">
          <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mr-2 ml-2">Quick Actions</span>
          <Button asChild variant="outline" className="bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
            <Link to="/school-attendance">
              <CheckSquare className="w-4 h-4 mr-2" />
              Take Attendance
            </Link>
          </Button>
          <Button asChild className="bg-[#0066fe] hover:bg-[#0055d4] text-white border-0 shadow-lg shadow-[#0066fe]/15 rounded-full px-6 py-2.5 font-semibold transition-all hover:scale-[1.02]">
            <Link to="/school-students">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Student
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
            <Link to="/school-fees">
              <DollarSign className="w-4 h-4 mr-2" />
              Record Payment
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white dark:bg-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 rounded-full font-semibold px-6 py-2.5 transition-all hover:scale-[1.02] shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
            <Link to="/school-notices">
              <Bell className="w-4 h-4 mr-2" />
              Post Notice
            </Link>
          </Button>
        </div>

        {/* Enrollment & Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Enrollment + Notices */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enrollment by Level */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2.5rem] shadow-[0_24px_64px_rgba(0,0,0,0.02)] p-8 hover:-translate-y-0.5 transition-all duration-300">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-900/10 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                Overview
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Enrollment by Level
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/30 dark:border-blue-800/20 rounded-[1.5rem] p-5 text-center transition-all hover:bg-blue-50/50">
                  <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">{kgCount}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-widest mt-2">KG Level</p>
                </div>
                <div className="bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100/30 dark:border-amber-800/20 rounded-[1.5rem] p-5 text-center transition-all hover:bg-amber-50/50">
                  <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">{primaryCount}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-widest mt-2">Primary</p>
                </div>
                <div className="bg-violet-50/30 dark:bg-violet-900/10 border border-violet-100/30 dark:border-violet-800/20 rounded-[1.5rem] p-5 text-center transition-all hover:bg-violet-50/50">
                  <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight">{jhsCount}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-widest mt-2">JHS Level</p>
                </div>
              </div>
            </div>

            {/* Recent Notices */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2.5rem] shadow-[0_24px_64px_rgba(0,0,0,0.02)] p-8 hover:-translate-y-0.5 transition-all duration-300 flex flex-col min-h-[350px]">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3 w-fit">
                Notices
              </div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Recent Notices
                </h3>
                <Button asChild variant="ghost" size="sm" className="rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-semibold text-[#0066fe]">
                  <Link to="/school-notices">View All</Link>
                </Button>
              </div>
              <div className="space-y-3.5 flex-1 overflow-y-auto">
                {recentNotices.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400 py-10">No recent notices</div>
                ) : recentNotices.map(notice => (
                  <div key={notice.id} className="p-4 rounded-2xl border border-slate-100/50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-all duration-200">
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{notice.data?.title || 'Notice'}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{notice.data?.content}</p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      <span>{format(new Date(notice.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Upcoming Exams + Recent Activity */}
          <div className="space-y-8">
            {/* Upcoming Exams */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2.5rem] shadow-[0_24px_64px_rgba(0,0,0,0.02)] p-8 hover:-translate-y-0.5 transition-all duration-300 flex flex-col min-h-[350px]">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-violet-100 bg-violet-50/50 dark:border-violet-900/30 dark:bg-violet-900/10 text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-3 w-fit">
                Calendar
              </div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-violet-500" />
                  Upcoming Exams
                </h3>
              </div>
              <div className="space-y-3.5 flex-1">
                {upcomingExams.slice(0, 5).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400 py-10">No upcoming exams</div>
                ) : upcomingExams.slice(0, 5).map(exam => (
                  <div key={exam.id} className="p-4 rounded-2xl border border-slate-100/50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-all duration-200 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{exam.data?.subject || exam.data?.exam_name}</p>
                      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 font-medium">
                        {exam.data?.class_name || 'All Classes'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        {exam.data?.exam_date ? format(new Date(exam.data?.exam_date), "MMM d") : 'TBD'}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50/60 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-100/50 mt-1.5 uppercase tracking-wider">
                        Upcoming
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-[2.5rem] shadow-[0_24px_64px_rgba(0,0,0,0.02)] p-8 hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-pink-100 bg-pink-50/50 dark:border-pink-900/30 dark:bg-pink-900/10 text-[9px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-3 w-fit">
                Students
              </div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-500" />
                  Recently Added
                </h3>
              </div>
              <div className="space-y-3.5">
                {recentStudents.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400 py-10">No students found</div>
                ) : recentStudents.map(student => {
                  const initials = `${student.data?.first_name?.charAt(0) || ''}${student.data?.last_name?.charAt(0) || ''}`.toUpperCase() || 'S';
                  const colors = [
                    'from-blue-400 to-indigo-500 text-blue-100 shadow-blue-500/10',
                    'from-emerald-400 to-teal-500 text-emerald-100 shadow-emerald-500/10',
                    'from-amber-400 to-orange-500 text-amber-100 shadow-amber-500/10',
                    'from-pink-400 to-rose-500 text-pink-100 shadow-pink-500/10',
                    'from-purple-400 to-violet-500 text-purple-100 shadow-purple-500/10',
                  ];
                  const colorIndex = (student.data?.first_name || 'S').charCodeAt(0) % colors.length;
                  const gradColor = colors[colorIndex];

                  return (
                    <div key={student.id} className="p-4 rounded-2xl border border-slate-100/50 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-all duration-200 flex justify-between items-center group/item">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradColor} flex items-center justify-center text-xs font-bold shadow-[0_2px_8px_rgba(0,0,0,0.05)]`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">{student.data?.first_name} {student.data?.last_name}</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">{student.data?.grade_level || 'N/A'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="rounded-full opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0 -translate-x-2 transition-all duration-200 bg-slate-50 dark:bg-zinc-850 hover:bg-[#0066fe] hover:text-white">
                        <Link to="/school-students">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
