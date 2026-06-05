import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Building2, School, Landmark, GraduationCap, ChevronRight, Award, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const defaultStructure = [
  {
    faculty: "Faculty of Engineering & Applied Sciences",
    icon: Building2,
    schools: [
      {
        name: "School of Computing",
        departments: [
          {
            name: "Department of Software Engineering",
            programs: [
              { name: "B.Sc. Software Engineering", majors: ["Mobile Development", "Cloud Architectures"], minors: ["Cybersecurity"] },
              { name: "M.Sc. Advanced Computing", majors: ["Artificial Intelligence"], minors: [] }
            ]
          }
        ]
      }
    ]
  },
  {
    faculty: "Faculty of Business & Humanities",
    icon: Landmark,
    schools: [
      {
        name: "Harvard School of Business",
        departments: [
          {
            name: "Department of Applied Economics",
            programs: [
              { name: "B.A. Economics & Finance", majors: ["Quantitative Analysis"], minors: ["Corporate Law"] }
            ]
          }
        ]
      }
    ]
  }
];

export default function UniAcademicStructure() {
  const { t } = useTranslation();
  const [structure] = useState(defaultStructure);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_academic_structure", "University Academic Structure")} 
        subtitle="Manage faculties, departments, schools, course programs, majors, and minors." 
      />

      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex gap-2">
          <Button size="sm" className="bg-primary hover:bg-primary/95 text-white gap-1.5"><Plus className="w-4 h-4" /> Add Faculty</Button>
          <Button size="sm" variant="outline" className="gap-1.5"><Plus className="w-4 h-4" /> Add Department</Button>
        </div>
        <p className="text-xs text-muted-foreground font-semibold">Total Faculties: {structure.length}</p>
      </div>

      <div className="space-y-6">
        {structure.map((fac, idx) => (
          <Card key={idx} className="border-slate-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center gap-3 bg-slate-50/50 dark:bg-slate-800/20 py-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <fac.icon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-800">{fac.faculty}</CardTitle>
                <CardDescription>Academic Board Jurisdiction</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {fac.schools.map((school, sIdx) => (
                <div key={sIdx} className="pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                    <School className="w-4 h-4 text-primary" /> {school.name}
                  </div>
                  {school.departments.map((dept, dIdx) => (
                    <div key={dIdx} className="pl-6 border-l-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="text-slate-600 font-bold text-xs flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-indigo-500" /> {dept.name}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                        {dept.programs.map((prog, pIdx) => (
                          <div key={pIdx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <div>
                              <p className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4 text-primary" /> {prog.name}
                              </p>
                              <div className="mt-2 space-y-1">
                                {prog.majors.length > 0 && (
                                  <p className="text-[10px] text-slate-500">
                                    <strong>Majors:</strong> {prog.majors.join(", ")}
                                  </p>
                                )}
                                {prog.minors.length > 0 && (
                                  <p className="text-[10px] text-slate-500">
                                    <strong>Minors:</strong> {prog.minors.join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="self-end text-[10px] h-6 mt-4 gap-0.5 text-primary hover:text-primary/80">
                              View Curriculum <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
