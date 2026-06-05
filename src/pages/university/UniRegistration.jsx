import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Calendar, UserCheck, Plus, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UniRegistration() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([
    { code: "CS-101", title: "Introduction to Computer Science", credits: 4, schedule: "Mon/Wed 9:00 - 10:30 AM", enrolled: true },
    { code: "MATH-202", title: "Linear Algebra & Vector Spaces", credits: 3, schedule: "Tue/Thu 11:00 AM - 12:30 PM", enrolled: true },
    { code: "PHY-301", title: "Quantum Physics for Engineers", credits: 4, schedule: "Mon/Wed/Fri 2:00 - 3:30 PM", enrolled: false, waitlist: true },
    { code: "ENG-102", title: "Academic Writing and Rhetoric", credits: 2, schedule: "Tue 4:00 - 6:00 PM", enrolled: false }
  ]);

  const toggleCourse = (code) => {
    setCourses(courses.map(c => {
      if (c.code === code) {
        if (c.enrolled) return { ...c, enrolled: false, waitlist: false };
        return { ...c, enrolled: true, waitlist: false };
      }
      return c;
    }));
  };

  const registeredCredits = courses.filter(c => c.enrolled).reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_registration", "Course Registration Portal")} 
        subtitle="Submit module choices, add or drop courses, review waitlists, and access advisory records." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Course Enrollment Worksheet</CardTitle>
            <CardDescription>Select or drop courses for the upcoming Academic Semester.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.map((course, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded">{course.code}</span>
                    <h4 className="font-extrabold text-sm text-slate-800">{course.title}</h4>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground font-semibold">
                    <span>{course.credits} Credits</span>
                    <span>{course.schedule}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {course.enrolled ? (
                    <>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-emerald-100">
                        <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                      </span>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-8" onClick={() => toggleCourse(course.code)}>
                        Drop
                      </Button>
                    </>
                  ) : course.waitlist ? (
                    <>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-amber-100">
                        <AlertTriangle className="w-3.5 h-3.5" /> Waitlist (#3)
                      </span>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-8" onClick={() => toggleCourse(course.code)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="bg-primary text-white hover:bg-primary/95 text-xs font-bold h-8 gap-1" onClick={() => toggleCourse(course.code)}>
                      <Plus className="w-3.5 h-3.5" /> Add Course
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Registration Status</CardTitle>
            <CardDescription>Review semester milestones and advisory logs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 space-y-4">
              <div className="flex justify-between text-xs">
                <span className="font-semibold">Registered Credits:</span>
                <span className="font-bold text-primary">{registeredCredits} / 18 Max</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${(registeredCredits / 18) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-indigo-500" /> Academic Advisor Feedback</h4>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs space-y-1.5">
                <p className="font-bold text-slate-800">Dr. Elizabeth Blackwell</p>
                <p className="text-slate-500 font-medium leading-relaxed">"Your course choices align perfectly with your Software Engineering track. I recommend adding CS-101 before the deadline."</p>
                <p className="text-[10px] text-muted-foreground text-right mt-1">Approved Yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
