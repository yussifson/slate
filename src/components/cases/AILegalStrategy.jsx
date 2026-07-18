import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, BrainCircuit, Target, Clock, AlertTriangle } from "lucide-react";
import { generateText } from "@/lib/cloudflareAI";
import { toast } from "react-hot-toast";
import { base44 } from "@/api/base44Client";

export default function AILegalStrategy({ caseData, user }) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState(caseData.ai_strategy || null);

  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    const tId = toast.loading('AI analyzing case facts and generating strategy...');
    try {
      const prompt = `You are an expert Legal AI Strategist. 
Analyze the following case details and formulate a winning legal strategy.
Case Title: ${caseData.title}
Case Type: ${caseData.case_type}
Opposing Counsel/Party: ${caseData.opposing_counsel || 'Unknown'} / ${caseData.opposing_party || 'Unknown'}
Description/Facts: ${caseData.description || 'Not provided'}

Respond ONLY with a valid JSON object containing exactly these fields:
{
  "predictedTimeline": "Estimated timeline in months and key phases",
  "coreArguments": ["Argument 1", "Argument 2", "Argument 3"],
  "recommendedActions": ["Action 1", "Action 2"],
  "riskAssessment": "A 1-2 sentence assessment of the biggest risk in this case."
}`;

      const rawResponse = await generateText([{ role: 'user', content: prompt }]);
      const cleanJsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const safeJsonStr = cleanJsonStr.replace(/[\u0000-\u001F]+/g, "");
      const generatedStrategy = JSON.parse(safeJsonStr);

      await base44.entities.LegalCase.update(caseData.id, { ai_strategy: generatedStrategy });
      setStrategy(generatedStrategy);
      toast.success('Strategy generated and saved!', { id: tId });
    } catch (err) {
      toast.error('Failed to generate strategy: ' + err.message, { id: tId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 p-6 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BrainCircuit className="w-32 h-32"/></div>
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-primary"><Sparkles className="w-5 h-5"/> AI Legal Strategy Copilot</h3>
      <p className="text-sm text-[#71717a] dark:text-gray-400 mb-6">Instantly analyze case facts to predict timelines, formulate arguments, and assess risks.</p>
      
      {strategy ? (
        <div className="space-y-6 flex-1 relative z-10">
          <div>
            <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Target className="w-3 h-3"/> Core Arguments</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground bg-primary/5 p-4 rounded-lg border border-primary/10">
              {strategy.coreArguments?.map((arg, idx) => (
                <li key={idx}>{arg}</li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Predicted Timeline</p>
              <div className="text-sm text-foreground bg-slate-50 dark:bg-secondary/50 p-4 rounded-lg border border-primary/10">
                {strategy.predictedTimeline}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500"/> Risk Assessment</p>
              <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-900/30">
                {strategy.riskAssessment}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Recommended Actions</p>
            <div className="flex flex-wrap gap-2">
              {strategy.recommendedActions?.map((action, idx) => (
                <span key={idx} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20">
                  {action}
                </span>
              ))}
            </div>
          </div>
          
          <Button onClick={handleGenerateStrategy} disabled={isGenerating} variant="outline" className="w-full mt-4 gap-2 border-primary/30 text-primary hover:bg-primary/10">
            {isGenerating ? 'Recalculating Strategy...' : 'Refresh Strategy'}
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            <BrainCircuit className="w-8 h-8"/>
          </div>
          <p className="text-sm font-medium">No strategy generated yet.</p>
          <Button onClick={handleGenerateStrategy} disabled={isGenerating} className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Sparkles className="w-4 h-4"/> {isGenerating ? 'Analyzing Case Files...' : 'Generate Legal Strategy'}
          </Button>
        </div>
      )}
    </div>
  );
}
