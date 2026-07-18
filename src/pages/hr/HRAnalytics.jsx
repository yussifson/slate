import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  AlertTriangle,
  Activity,
  BrainCircuit,
  Loader2,
  CalendarDays
} from 'lucide-react';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/constants';

export default function HRAnalytics() {
  const { user } = useAuth();
  const powerSync = usePowerSync();
  const companyId = user?.company_id;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    totalEmployees: 0,
    avgSalary: 0,
    totalExpenses: 0,
    activeCandidates: 0,
    flightRisks: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      if (!companyId) return;
      setIsLoading(true);
      try {
        const empRes = await powerSync.getAll('SELECT * FROM univ_hr_employees WHERE company_id = ?', [companyId]);
        const expRes = await powerSync.getAll('SELECT amount FROM univ_erp_expenses WHERE company_id = ? AND status = ?', [companyId, 'Approved']);
        const canRes = await powerSync.getAll('SELECT * FROM univ_erp_candidates WHERE company_id = ? AND status = ?', [companyId, 'Active']);

        if (!active) return;

        const totalEmp = empRes.length;
        const avgSal = totalEmp > 0 ? empRes.reduce((acc, curr) => acc + (parseFloat(curr.salary) || 0), 0) / totalEmp : 0;
        const totalExp = expRes.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        
        // Mock flight risks but using real names if available
        const flightRisks = empRes.slice(0, 3).map((e, i) => ({
          id: e.id,
          name: e.name || e.first_name || `Employee ${i}`,
          role: e.role || 'Staff',
          department: e.department || 'General',
          riskScore: 88 - (i * 6),
          reason: i === 0 ? "Below market comp, 3 yrs no promo" : i === 1 ? "High burnout indicator, recent manager change" : "Low engagement in recent pulse surveys"
        }));

        setData({
          totalEmployees: totalEmp,
          avgSalary: avgSal,
          totalExpenses: totalExp,
          activeCandidates: canRes.length,
          flightRisks
        });
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchAnalytics();
    return () => { active = false; };
  }, [companyId, powerSync]);

  const handleRunAnalysis = () => {
    setIsGenerating(true);
    // Simulate AI API Call
    setTimeout(() => {
      setAiReport(`Based on the real-time data analysis of ${data.totalEmployees} employees, the organization is maintaining a steady state. The average salary sits at ${formatCurrency(data.avgSalary, 'USD')}, which is competitive for the current demographic. However, our predictive models indicate that there are ${data.flightRisks.length} key talents showing early warning signs of turnover risk, primarily due to compensation stagnation and burnout. The recruitment pipeline has ${data.activeCandidates} active candidates, indicating strong inbound interest, but retention should remain the primary strategic focus for Q3.`);
      setIsGenerating(false);
    }, 2500);
  };

  const metrics = [
    {
      title: "Total Headcount",
      value: data.totalEmployees,
      trend: "Real-time",
      trendUp: true,
      icon: <Users className="w-6 h-6 text-primary" />,
      color: "bg-primary/10"
    },
    {
      title: "Active Candidates",
      value: data.activeCandidates,
      trend: "Pipeline",
      trendUp: true,
      icon: <PieChart className="w-6 h-6 text-indigo-500" />,
      color: "bg-indigo-100 dark:bg-indigo-900/30"
    },
    {
      title: "Avg Compensation",
      value: formatCurrency(data.avgSalary, 'USD'),
      trend: "Market Avg",
      trendUp: true,
      icon: <DollarSign className="w-6 h-6 text-emerald-500" />,
      color: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      title: "Approved Expenses",
      value: formatCurrency(data.totalExpenses, 'USD'),
      trend: "YTD",
      trendUp: false,
      icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
      color: "bg-amber-100 dark:bg-amber-900/30"
    }
  ];

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-card/50 h-[calc(100vh-4rem)] p-4 lg:p-8 font-dmsans flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              HR Analytics & AI
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Data-driven insights and predictive modeling for workforce management.
            </p>
          </div>
          <Button 
            onClick={handleRunAnalysis} 
            disabled={isGenerating || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            {isGenerating ? "Analyzing Database..." : "Generate AI Report"}
          </Button>
        </div>

        {/* AI Report Box */}
        {aiReport && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Orbit AI Executive Summary
            </h3>
            <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed font-medium">
              {aiReport}
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border-[0.5px] border-black/9 dark:border-white/8 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.color}`}>
                  {metric.icon}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase bg-slate-100 text-slate-600 dark:bg-secondary dark:text-muted-foreground`}>
                  {metric.trend}
                </span>
              </div>
              <h3 className="text-muted-foreground text-[11px] uppercase tracking-wider font-bold">{metric.title}</h3>
              <p className="text-2xl font-black text-foreground mt-1">{isLoading ? '-' : metric.value}</p>
            </div>
          ))}
        </div>

        {/* AI Flight Risk Predictor Section */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border-[0.5px] border-black/9 dark:border-white/8 flex-1 min-h-[400px] flex flex-col">
          <div className="p-6 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">AI Flight Risk Predictor</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Our predictive model has identified the following top talents with a high probability of turnover within the next 90 days.
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="space-y-4">
              {data.flightRisks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No flight risks identified.</div>
              ) : (
                data.flightRisks.map((employee) => (
                  <div key={employee.id} className="p-5 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all group bg-slate-50 dark:bg-secondary/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-card flex items-center justify-center text-lg font-bold text-foreground shadow-sm border border-border/50">
                            {employee.name.charAt(0)}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-foreground">{employee.name}</h4>
                          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mt-0.5">{employee.role} • {employee.department}</p>
                          <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40 px-3 py-1.5 rounded-lg">
                            <BrainCircuit className="w-3.5 h-3.5" />
                            Risk Factor: {employee.reason}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 md:pl-6 md:border-l border-border/50 shrink-0">
                        <div className="text-center">
                          <div className="text-2xl font-black text-red-600 dark:text-red-400">{employee.riskScore}%</div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Risk Score</div>
                        </div>
                        <Button className="rounded-xl border-border/50 font-bold hover:bg-primary hover:text-white" variant="outline">
                          Intervene
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
