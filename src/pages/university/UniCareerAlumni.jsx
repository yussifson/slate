import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';
import { Briefcase, Landmark, Trophy, Users, HeartHandshake, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UniCareerAlumni() {
  const { t } = useTranslation();
  const [jobs] = useState([
    { title: "Junior Software Architect", employer: "Google Cloud", location: "Silicon Valley (Hybrid)", type: "Full Time" },
    { title: "Quantitative Risk Intern", employer: "Goldman Sachs", location: "New York City", type: "Internship" }
  ]);

  return (
    <div className="space-y-6">
      <ModuleBanner 
        title={t("uni_career_alumni", "Career Services & Alumni Hub")} 
        subtitle="Manage internship pipelines, view corporate job postings, access the alumni database, and track donor contributions." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Jobs / Internships</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{jobs.length || 18}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partnered Employers</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">142</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Landmark className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alumni Directory</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">12K Profiles</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 hover:shadow-lg transition-all school-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Donations Received</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">$450K</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Active Job Board & Placements</CardTitle>
            <CardDescription>Browse active listings uploaded by vetted partners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.map((job, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">{job.title}</h4>
                  <p className="text-slate-500 mt-1">Employer: {job.employer} · {job.location}</p>
                </div>
                <Button size="sm" className="bg-primary hover:bg-primary/95 text-white gap-1 font-bold h-8">
                  Apply <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle>Alumni Relations & Events</CardTitle>
            <CardDescription>Keep in touch with graduating classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-600" /> Annual Alumni Gala 2026</p>
              <p className="text-[10px] text-amber-700">Scheduled for November 12 inside the Grand Ballroom. Registration open.</p>
            </div>
            <Button size="sm" className="w-full bg-primary hover:bg-primary/95 text-white">
              Browse Alumni Database
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
