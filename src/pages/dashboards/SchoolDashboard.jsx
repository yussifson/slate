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

function StatCard({ icon: IconComp, label, value, sub, color = "bg-slate-50 dark:bg-secondary/50 text-primary", onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-card rounded-2xl border-0 p-5 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <IconComp className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tracking-[-0.03em]">{value}</p>
        <p className="text-sm font-medium text-muted-foreground tracking-tight mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
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
    <div className="space-y-8 school-page-enter font-dmsans max-w-7xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-8 sm:p-10 text-white shadow-2xl shadow-purple-500/20">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-violet-900 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                <GraduationCap className="w-6 h-6 text-purple-100" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Academic Portal</h1>
            </div>
            <p className="text-purple-100 text-lg font-medium tracking-wide">Welcome back! Here's your school overview.</p>
            <div className="mt-6 flex items-center gap-4 text-sm font-medium text-purple-100/80">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 opacity-70" />
                {format(today, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-inner">
            <div className="text-right">
              <p className="text-xs text-purple-200 font-bold uppercase tracking-wider mb-1">Term Status</p>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_12px_rgba(192,132,252,0.8)]" />
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
          color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" 
          onClick={() => navigate('/school-students')}
        />
        <StatCard 
          icon={BookOpen} 
          label="Total Classes" 
          value={totalClasses} 
          color="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" 
          onClick={() => navigate('/school-classes')}
        />
        <StatCard 
          icon={Presentation} 
          label="Teachers" 
          value={totalTeachers} 
          color="bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400" 
          onClick={() => navigate('/school-teachers')}
        />
        <StatCard 
          icon={Award} 
          label="Attendance" 
          value={todayAttendance.length > 0 ? `${attendanceAvg}%` : '-'} 
          sub="Today's Average"
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
        />
        <StatCard 
          icon={DollarSign} 
          label="Fees Collected" 
          value={`$${feesCollected.toLocaleString()}`} 
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Outstanding" 
          value={`$${feesOutstanding.toLocaleString()}`} 
          color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" 
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 items-center">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mr-2">Quick Actions</h3>
        <Button asChild variant="outline" className="rounded-full shadow-sm">
          <Link to="/school-attendance">
            <CheckSquare className="w-4 h-4 mr-2" />
            Take Attendance
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full shadow-sm">
          <Link to="/school-students">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Student
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full shadow-sm">
          <Link to="/school-fees">
            <DollarSign className="w-4 h-4 mr-2" />
            Record Payment
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full shadow-sm">
          <Link to="/school-notices">
            <Bell className="w-4 h-4 mr-2" />
            Post Notice
          </Link>
        </Button>
      </div>

      {/* Enrollment & Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Enrollment + Notices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollment by Level */}
          <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Enrollment by Level
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{kgCount}</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">KG</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{primaryCount}</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Primary</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold">{jhsCount}</p>
                <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">JHS</p>
              </div>
            </div>
          </div>

          {/* Recent Notices */}
          <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[300px]">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold">Recent Notices</h3>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/school-notices">View All</Link>
              </Button>
            </div>
            <div className="divide-y divide-border/50 flex-1">
              {recentNotices.length === 0 ? (
                <div className="p-5 text-center text-sm text-muted-foreground">No recent notices</div>
              ) : recentNotices.map(notice => (
                  <div key={notice.id} className="px-6 py-4">
                    <p className="text-sm font-bold">{notice.data?.title || 'Notice'}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notice.data?.content}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-2">
                      {format(new Date(notice.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Col: Upcoming Exams + Recent Activity */}
        <div className="space-y-6">
          {/* Upcoming Exams */}
          <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[300px]">
            <div className="p-6 border-b border-border/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h3 className="text-sm font-bold">Upcoming Exams</h3>
              </div>
            </div>
            <div className="divide-y divide-border/50 flex-1">
              {upcomingExams.slice(0, 5).length === 0 ? (
                <div className="p-5 text-center text-sm text-muted-foreground">No upcoming exams</div>
              ) : upcomingExams.slice(0, 5).map(exam => (
                  <div key={exam.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{exam.data?.subject || exam.data?.exam_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exam.data?.class_name || 'All Classes'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {exam.data?.exam_date ? format(new Date(exam.data?.exam_date), "MMM d") : 'TBD'}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px] bg-violet-50 text-violet-600 border-violet-200">
                        Upcoming
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-3xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
            <div className="p-6 border-b border-border/50 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <h3 className="text-sm font-bold">Recently Added Students</h3>
            </div>
            <div className="divide-y divide-border/50">
              {recentStudents.length === 0 ? (
                <div className="p-5 text-center text-sm text-muted-foreground">No students found</div>
              ) : recentStudents.map(student => (
                  <div key={student.id} className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{student.data?.first_name} {student.data?.last_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{student.data?.grade_level || 'N/A'}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/school-students">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
