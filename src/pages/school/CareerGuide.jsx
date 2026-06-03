import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Target, TrendingUp, Award, Briefcase, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CareerGuide() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Compass className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Career Guide</h1>
            <p className="text-sm text-muted-foreground">Map out your future and track aptitude goals</p>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Target className="w-4 h-4" /> Take Aptitude Test
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card-premium bg-gradient-to-br from-card to-muted p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Briefcase className="w-6 h-6" /></div>
            <div><p className="text-sm text-muted-foreground">Recommended Path</p><h3 className="text-xl font-bold">Software Engineering</h3></div>
          </div>
          <div className="w-full bg-border rounded-full h-2 mb-2"><div className="bg-blue-600 h-2 rounded-full" style={{width: '78%'}}></div></div>
          <p className="text-xs text-muted-foreground text-right">78% Match with your skills</p>
        </div>

        <div className="stat-card-premium bg-gradient-to-br from-card to-muted p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><BookOpen className="w-6 h-6" /></div>
            <div><p className="text-sm text-muted-foreground">Required Subjects</p><h3 className="text-xl font-bold">Math, Physics, CS</h3></div>
          </div>
          <div className="w-full bg-border rounded-full h-2 mb-2"><div className="bg-green-600 h-2 rounded-full" style={{width: '92%'}}></div></div>
          <p className="text-xs text-muted-foreground text-right">92% Average Grade</p>
        </div>

        <div className="stat-card-premium bg-gradient-to-br from-card to-muted p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600"><Award className="w-6 h-6" /></div>
            <div><p className="text-sm text-muted-foreground">Certifications</p><h3 className="text-xl font-bold">2 Completed</h3></div>
          </div>
          <Button variant="outline" className="w-full text-xs mt-2">View Certificates</Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Career Milestones</h3>
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-purple-100 text-purple-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-muted/50 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-foreground">Complete Intro to Python</div>
                  <time className="font-mono text-xs font-medium text-purple-500">Milestone {i}</time>
                </div>
                <div className="text-sm text-muted-foreground">Foundation programming course required for engineering path.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
