import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Search, Filter, Plus, ChevronRight, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function VWorkshopAssessments() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 space-y-6 p-8 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <CheckSquare className="w-6 h-6" />
            </div>
            Workshop Assessments
          </h2>
          <p className="text-muted-foreground mt-1">Evaluate trainees based on their workshop performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-[250px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-white dark:bg-slate-900">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105">
            <Plus className="w-4 h-4" /> Add New
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">124</div>
            <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" /> +12% this month
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">18</div>
            <div className="text-xs text-amber-500 flex items-center gap-1 mt-1 font-medium">
              Needs attention
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">94%</div>
            <div className="text-xs text-primary/70 flex items-center gap-1 mt-1 font-medium">
              Above average
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Data Section */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold">Recent Records</h3>
        </div>
        <div className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    #{item}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Record Item {item}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Updated 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200 border-none">Active</Badge>
                  <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
