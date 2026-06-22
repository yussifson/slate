import React, { useState } from 'react';
import { FileText, Download, Sparkles, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompanyId } from '@/hooks/useCompanyId';
import { powerSync } from '@/api/PowerSyncConnector';
import { invokeCloudflareAi } from '@/lib/cloudflareAI';
import { useToast } from '@/components/ui/use-toast';

export default function ReportGenerator() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    setIsGenerating(true);
    setReport(null);
    try {
      // Gather comprehensive stats
      const [patients, appointments, revenues] = await Promise.all([
        powerSync.execute('SELECT COUNT(*) as c FROM univ_patients WHERE company_id = ? AND created_at > datetime("now", "-7 days")', [companyId]),
        powerSync.execute('SELECT status, COUNT(*) as c FROM univ_appointments WHERE company_id = ? AND date > datetime("now", "-7 days") GROUP BY status', [companyId]),
        powerSync.execute('SELECT SUM(total_cost) as total FROM univ_medicalbillings WHERE company_id = ? AND status = "paid" AND created_at > datetime("now", "-7 days")', [companyId]),
      ]);

      const dataContext = {
        new_patients_last_7_days: patients.rows._array[0]?.c || 0,
        appointment_stats: appointments.rows._array,
        revenue_last_7_days: revenues.rows._array[0]?.total || 0,
      };

      const systemPrompt = `You are a professional executive assistant for a hospital. Write a comprehensive, multi-paragraph weekly executive summary report based on the provided data. Use professional tone. Format the output in markdown. Include an introduction, a breakdown of key metrics, and a short conclusion/recommendation.`;

      const response = await invokeCloudflareAi(`Data: ${JSON.stringify(dataContext)}`, systemPrompt);
      const content = typeof response === 'string' ? response : (response?.response || response?.text || JSON.stringify(response));

      setReport(content);
      toast({
        title: "Report Generated",
        description: "Your weekly executive summary is ready.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 p-6 shadow-sm min-h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Automated Report Generator</h3>
            <p className="text-xs text-slate-500">AI-compiled executive summaries</p>
          </div>
        </div>
        <Button onClick={generateReport} disabled={isGenerating} className="gap-2 bg-purple-600 hover:bg-purple-700">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isGenerating ? 'Compiling Data...' : 'Generate Weekly Report'}
        </Button>
      </div>

      <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg border p-6 overflow-y-auto prose dark:prose-invert max-w-none">
        {isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Sparkles className="w-8 h-8 animate-pulse text-purple-500" />
            <p>Analyzing cross-module data and drafting report...</p>
          </div>
        ) : report ? (
          <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FileText className="w-12 h-12 mb-2 opacity-20" />
            <p>Click generate to create your executive summary.</p>
          </div>
        )}
      </div>

      {report && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      )}
    </div>
  );
}
