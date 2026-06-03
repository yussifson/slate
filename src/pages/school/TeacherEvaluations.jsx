import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, TrendingUp, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TeacherEvaluations() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Teacher Evaluations</h1>
            <p className="text-sm text-muted-foreground">Assess and review educator performance</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          New Evaluation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card-premium bg-gradient-to-br from-card to-muted p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Star className="w-6 h-6" /></div>
            <div><p className="text-sm text-muted-foreground">Average Rating</p><h3 className="text-2xl font-bold">4.6 / 5.0</h3></div>
          </div>
        </div>
        <div className="stat-card-premium bg-gradient-to-br from-card to-muted p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><ClipboardCheck className="w-6 h-6" /></div>
            <div><p className="text-sm text-muted-foreground">Completed Reviews</p><h3 className="text-2xl font-bold">142</h3></div>
          </div>
        </div>
        <div className="stat-card-premium bg-gradient-to-br from-card to-muted p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600"><Users className="w-6 h-6" /></div>
            <div><p className="text-sm text-muted-foreground">Pending Reviews</p><h3 className="text-2xl font-bold">8</h3></div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-4 font-semibold">Teacher Name</th>
              <th className="px-6 py-4 font-semibold">Subject</th>
              <th className="px-6 py-4 font-semibold">Latest Score</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 font-medium">Mr. Robert Smith</td>
              <td className="px-6 py-4">Mathematics</td>
              <td className="px-6 py-4"><span className="flex items-center gap-1 text-amber-500 font-bold"><Star className="w-4 h-4 fill-current"/> 4.8</span></td>
              <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">Completed</span></td>
              <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm">View Report</Button></td>
            </tr>
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 font-medium">Ms. Emily Davis</td>
              <td className="px-6 py-4">Physics</td>
              <td className="px-6 py-4 text-muted-foreground">Pending</td>
              <td className="px-6 py-4"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs">Awaiting</span></td>
              <td className="px-6 py-4 text-right"><Button variant="outline" size="sm">Evaluate</Button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
