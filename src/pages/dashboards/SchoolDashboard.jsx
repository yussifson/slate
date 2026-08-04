import React from "react";
import "../school/SchoolTheme.css";
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
  Presentation,
  Plus
} from "lucide-react";

import { useIndustryRecords } from '@/hooks/useIndustryData';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function StatCard({ icon: IconComp, label, value, sub, color = "indigo", onClick, trend }) {
  const colorMap = {
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400", border: "border-indigo-100/50" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400", border: "border-emerald-100/50" },
    orange: { bg: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400", border: "border-orange-100/50" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400", border: "border-rose-100/50" }
  };
  const theme = colorMap[color] || colorMap.indigo;

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] p-6 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col justify-between min-h-[160px] relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center ${theme.bg}`}>
          <IconComp className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 tracking-tight">{label}</p>
        <p className="text-3xl font-bold text-[#1F1E1C] dark:text-zinc-50 tracking-[-0.03em] mt-1">{value}</p>
        {sub && <p className="text-xs text-zinc-400 mt-1 font-medium">{sub}</p>}
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
      const total = parseFloat(att.data?.total_count) || 1;
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
    <div className="school-theme-root space-y-8 school-page-enter font-outfit max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 p-8 sm:p-10 text-white shadow-xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3.5 mb-3">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">School Management System</h1>
            </div>
            <p className="text-indigo-100 text-lg font-medium">Welcome back, {user?.email?.split('@')[0] || 'Administrator'} ✨</p>
            <div className="mt-6 flex items-center gap-4 text-sm font-semibold text-indigo-100/90">
              <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4 opacity-80" />
                {format(today, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => navigate('/school-attendance')} className="gap-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-full px-5 py-2.5 shadow-lg border-0 transition-transform hover:scale-[1.02]">
              <CheckSquare className="w-4 h-4" />
              Take Attendance
            </Button>
            <Button onClick={() => navigate('/school-students')} className="gap-2 bg-indigo-900/40 text-white hover:bg-indigo-900/60 font-bold rounded-full px-5 py-2.5 shadow-lg border border-white/25 transition-transform hover:scale-[1.02]">
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Total Enrolled" 
          value={totalStudents} 
          sub={`${activeStudents} active students`}
          color="indigo" 
          trend="+11%"
          onClick={() => navigate('/school-students')}
        />
        <StatCard 
          icon={BookOpen} 
          label="Active School (Classes)" 
          value={totalClasses} 
          sub="Configured classroom rooms"
          color="orange" 
          trend="+3%"
          onClick={() => navigate('/school-classes')}
        />
        <StatCard 
          icon={DollarSign} 
          label="Fee Revenue" 
          value={`$${feesCollected.toLocaleString()}`} 
          sub={`$${feesOutstanding.toLocaleString()} outstanding`}
          color="emerald" 
          trend="+8%"
          onClick={() => navigate('/school-fees')}
        />
        <StatCard 
          icon={Presentation} 
          label="Staff" 
          value={totalTeachers} 
          sub="Assigned teachers & staff"
          color="rose" 
          trend="+4%"
          onClick={() => navigate('/school-teachers')}
        />
      </div>

      {/* Main Dashboard Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (SaaS Charts and Notice Board) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Fee Collection Visual bar list (Mimics Revenue Chart) */}
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#1F1E1C] dark:text-zinc-50 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Fee Collection Overview (USD)
              </h3>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-full">Monthly Revenue Trend</span>
            </div>
            
            {/* Visual Micro Chart Grid */}
            <div className="flex items-end justify-between gap-3 h-48 px-2 pt-6 border-b border-[#F0EBE1] dark:border-zinc-800/80">
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-indigo-100 dark:bg-indigo-950/40 rounded-t-lg h-12 group-hover:bg-indigo-600 transition-colors duration-300" />
                <span className="text-[10px] font-bold text-zinc-400 mt-2">Sep</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-indigo-100 dark:bg-indigo-950/40 rounded-t-lg h-20 group-hover:bg-indigo-600 transition-colors duration-300" />
                <span className="text-[10px] font-bold text-zinc-400 mt-2">Oct</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-indigo-100 dark:bg-indigo-950/40 rounded-t-lg h-28 group-hover:bg-indigo-600 transition-colors duration-300" />
                <span className="text-[10px] font-bold text-zinc-400 mt-2">Nov</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-indigo-100 dark:bg-indigo-950/40 rounded-t-lg h-36 group-hover:bg-indigo-600 transition-colors duration-300" />
                <span className="text-[10px] font-bold text-zinc-400 mt-2">Dec</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-indigo-100 dark:bg-indigo-950/40 rounded-t-lg h-16 group-hover:bg-indigo-600 transition-colors duration-300" />
                <span className="text-[10px] font-bold text-zinc-400 mt-2">Jan</span>
              </div>
              <div className="flex flex-col items-center flex-1 group">
                <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-lg h-44" />
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">Feb</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[#FCFAF7] dark:bg-zinc-800/30 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-400 uppercase">Total Collected</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">${feesCollected.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-[#FCFAF7] dark:bg-zinc-800/30 rounded-2xl border border-[#F0EBE1] dark:border-zinc-800">
                <p className="text-xs font-semibold text-zinc-400 uppercase">Outstanding Balance</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">${feesOutstanding.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* School Distribution Levels */}
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] p-6">
            <h3 className="text-lg font-bold text-[#1F1E1C] dark:text-zinc-50 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              School Distribution
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#FCFAF7] dark:bg-zinc-800/30 border border-[#F0EBE1] dark:border-zinc-800/80 rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold text-[#1F1E1C] dark:text-zinc-50">{kgCount}</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-1.5">KG Students</p>
              </div>
              <div className="bg-[#FCFAF7] dark:bg-zinc-800/30 border border-[#F0EBE1] dark:border-zinc-800/80 rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold text-[#1F1E1C] dark:text-zinc-50">{primaryCount}</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-1.5">Primary Students</p>
              </div>
              <div className="bg-[#FCFAF7] dark:bg-zinc-800/30 border border-[#F0EBE1] dark:border-zinc-800/80 rounded-2xl p-5 text-center">
                <p className="text-3xl font-bold text-[#1F1E1C] dark:text-zinc-50">{jhsCount}</p>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-1.5">JHS Students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column (Notices and Exams) */}
        <div className="space-y-8">
          
          {/* Recent Notices */}
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#F0EBE1] dark:border-zinc-800 flex justify-between items-center bg-[#FAF8F5] dark:bg-zinc-800/40">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-[#1F1E1C] dark:text-zinc-50">Recent Notices</h3>
              </div>
              <Link to="/school-notices" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</Link>
            </div>
            <div className="divide-y divide-[#F0EBE1] dark:divide-zinc-800/50">
              {recentNotices.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">No recent notices posted</div>
              ) : recentNotices.map(notice => (
                <div key={notice.id} className="p-5 hover:bg-[#FCFAF7]/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <p className="text-sm font-semibold text-[#1F1E1C] dark:text-zinc-100">{notice.data?.title}</p>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{notice.data?.content}</p>
                  <span className="text-[10px] font-bold text-zinc-400 mt-2.5 block">
                    {format(new Date(notice.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#F0EBE1] dark:border-zinc-800 flex items-center gap-2 bg-[#FAF8F5] dark:bg-zinc-800/40">
              <Award className="w-5 h-5 text-violet-500" />
              <h3 className="text-base font-bold text-[#1F1E1C] dark:text-zinc-50">Upcoming Exams</h3>
            </div>
            <div className="divide-y divide-[#F0EBE1] dark:divide-zinc-800/50">
              {upcomingExams.slice(0, 4).length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">No upcoming exam sessions</div>
              ) : upcomingExams.slice(0, 4).map(exam => (
                <div key={exam.id} className="p-5 flex justify-between items-center hover:bg-[#FCFAF7]/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1E1C] dark:text-zinc-100">{exam.data?.subject || exam.data?.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{exam.data?.class_names?.join(', ') || 'All Classes'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                      {exam.data?.date ? format(new Date(exam.data?.date), "MMM d") : 'TBD'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#F0EBE1] dark:border-zinc-800 flex items-center gap-2 bg-[#FAF8F5] dark:bg-zinc-800/40">
              <Users className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-bold text-[#1F1E1C] dark:text-zinc-50">Recent Registrations</h3>
            </div>
            <div className="divide-y divide-[#F0EBE1] dark:divide-zinc-800/50">
              {recentStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-400">No new student records</div>
              ) : recentStudents.map(student => (
                <div key={student.id} className="p-5 flex justify-between items-center hover:bg-[#FCFAF7]/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[#1F1E1C] dark:text-zinc-100">{student.data?.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{student.data?.class_name || 'N/A'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" asChild>
                    <Link to="/school-students">
                      <ArrowRight className="w-4 h-4 text-zinc-400" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
