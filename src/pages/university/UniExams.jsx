import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Calendar, Layers, ClipboardCheck, Sparkles, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UniExams() {
  const { t } = useTranslation();
  const [exams] = useState([
    { subject: "Distributed Systems Theory", code: "CS-401", date: "June 12, 2026", time: "9:00 - 11:30 AM", venue: "Grand Exhibition Hall", status: "Upcoming" },
    { subject: "Advanced Physics Foundations", code: "PHY-102", date: "June 15, 2026", time: "1:00 - 3:00 PM", venue: "Room 402, Science Block", status: "Upcoming" },
    { subject: "Human Computer Interaction", code: "SE-302", date: "June 18, 2026", time: "10:00 AM - 12:00 PM", venue: "Computer Lab 4B", status: "Online" }
  ]);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_exams", "Examinations & Grading Center")} 
        subtitle="Schedule examinations, compile question banks, sit online exams, and review grade transcripts." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Exams</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{exams.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Banks</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">12 Modules</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Papers Graded</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">94.8%</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Online Exam Terminals</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">Active</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Exam Schedules</CardTitle>
            <CardDescription>Official exam timetables and venue details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exams.map((exam, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{exam.code}</span>
                    <h4 className="font-extrabold text-sm text-slate-800">{exam.subject}</h4>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {exam.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.time}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {exam.venue}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {exam.status === "Online" ? (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8">
                      Launch Online Exam
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs font-bold h-8">
                      View Rules
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Grading & Results Status</CardTitle>
            <CardDescription>Academic transcripts and grade distribution reviews.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs pb-1 border-b">
                <span className="font-semibold">B.Sc. Software Engineering</span>
                <span className="text-emerald-600 font-bold">Processed</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-1 border-b">
                <span className="font-semibold">M.Sc. Advanced Computing</span>
                <span className="text-indigo-600 font-bold">Awaiting Board Approval</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">B.A. Economics & Finance</span>
                <span className="text-emerald-600 font-bold">Processed</span>
              </div>
            </div>
            <Button size="sm" className="w-full bg-primary hover:bg-primary/95 text-white gap-1 mt-2">
              Access Grading Center
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
