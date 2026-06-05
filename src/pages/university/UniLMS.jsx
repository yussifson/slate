import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { BookOpen, Video, HelpCircle, MessageSquare, ClipboardList, Play, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UniLMS() {
  const { t } = useTranslation();
  const [courses] = useState([
    { code: "SE-302", title: "Human Computer Interaction", tasks: 2, videos: 4, quizzes: 1 },
    { code: "CS-401", title: "Distributed Systems & Cloud Architectures", tasks: 4, videos: 8, quizzes: 2 },
    { code: "PHY-102", title: "Classical Electrodynamics", tasks: 1, videos: 2, quizzes: 0 }
  ]);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_lms", "Learning Management System")} 
        subtitle="Access virtual course workspaces, assignment centers, live video lectures, and academic discussions." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Active Class Workspaces
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course, idx) => (
              <Card key={idx} className="border-slate-100 hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded self-start">{course.code}</span>
                  <CardTitle className="text-sm font-extrabold text-slate-800 mt-1.5">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> {course.tasks} Assignments</span>
                    <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> {course.videos} Videos</span>
                    <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> {course.quizzes} Quizzes</span>
                  </div>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/95 text-white gap-1 mt-2">
                    Enter Workspace <Play className="w-3 h-3 fill-white" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-primary" /> Recent Discussions</CardTitle>
              <CardDescription>Academic forums and peer questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-800">"Trouble with MapReduce partition algorithms?"</p>
                <p className="text-slate-500 mt-1">Asked by Student John Doe inside CS-401 workspace.</p>
                <p className="text-[10px] text-primary mt-2 font-semibold">3 replies today</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-800">"HCI heuristics project guidelines updated"</p>
                <p className="text-slate-500 mt-1">Announced by Dr. Elizabeth Blackwell.</p>
                <p className="text-[10px] text-primary mt-2 font-semibold">Read Announcement</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
