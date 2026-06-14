import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { generateText} from '@/lib/cloudflareAI';
import { Sparkles, ShieldAlert, AlertTriangle, Info, CheckCircle, X, Loader2} from 'lucide-react';
import { Button} from '@/components/ui/button';
import { toast} from 'react-hot-toast';

const RISK_CONFIG = {
 HIGH: {
 label: 'High Risk',
 classes: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
 badgeClasses: 'bg-red-500 text-white',
 icon: AlertTriangle,
},
 MEDIUM: {
 label: 'Medium Risk',
 classes: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
 badgeClasses: 'bg-amber-500 text-white',
 icon: Info,
},
 LOW: {
 label: 'Low Risk',
 classes: 'bg-orange-100 text-orange-700 border-primary/20 dark:bg-primary/30 dark:text-primary/70 dark:border-primary/40',
 badgeClasses: 'bg-primary text-white',
 icon: Info,
},
};

/**
 * AIRiskAnalyzer — analyses a set of records for anomalies and business risks.
 * Props: records (array), recordType (string), onClose
 */
export default function AIRiskAnalyzer({ records = [], recordType = 'record', onClose}) {
 const { t} = useTranslation();
 const [findings, setFindings] = useState(null);
 const [isAnalyzing, setIsAnalyzing] = useState(false);

 const handleAnalyze = async () => {
 setIsAnalyzing(true);
 setFindings(null);
 try {
 // Take a sample to avoid token limits
 const sample = records.slice(0, 30);
 const messages = [
 {
 role: 'system',
 content: `You are a business risk analyst. Analyze the provided ${recordType} records for anomalies, fraud indicators, unusual patterns, or business risks. Return ONLY a valid JSON array of findings with this shape: [{"level":"HIGH"|"MEDIUM"|"LOW","title":string,"description":string,"record_ref":string}]. If no risks found, return [].`
},
 {
 role: 'user',
 content: `Analyze these ${recordType} records for risks:\n\n${JSON.stringify(sample, null, 2)}`
}
 ];

 const raw = await generateText(messages);

 // Extract JSON from response
 let parsed = [];
 try {
 parsed = JSON.parse(raw);
} catch {
 const match = raw.match(/\[[\s\S]*\]/);
 if (match) parsed = JSON.parse(match[0]);
}

 setFindings(Array.isArray(parsed) ? parsed : []);
} catch (err) {
 toast.error('Risk analysis failed: ' + err.message);
 setFindings([]);
} finally {
 setIsAnalyzing(false);
}
};

 return (
 <div className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-2xl border border-primary/40 flex flex-col max-h-[85vh]">

 {/* Header */}
 <div className="flex items-center justify-between p-5 border-b border-primary/40 bg-gradient-to-r from-amber-500/10 to-red-500/10 rounded-t-2xl">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
 <ShieldAlert className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-card-foreground">{t("ai_risk_analyzer", "AI Risk Analyzer")}</h2>
 <p className="text-xs text-muted-foreground">{t("scanning", "Scanning")} {records.length} {recordType} {t("records_for_anomalies", "records for anomalies")}</p>
 </div>
 </div>
 <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1.5 rounded-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto p-5 space-y-4">
 {findings === null && !isAnalyzing && (
 <div className="text-center py-10">
 <ShieldAlert className="w-14 h-14 mx-auto text-amber-400 mb-4 opacity-60" />
 <h3 className="text-base font-bold text-card-foreground mb-2">{t("ready_to_analyze", "Ready to Analyze")}</h3>
 <p className="text-sm text-muted-foreground max-w-sm mx-auto">
 {t("our_ai_will_scan_your", "Our AI will scan your")} {recordType} {t(
 "records_for_fraud_patterns_unu",
 "records for fraud patterns, unusual activity, and business risks."
 )}
 </p>
 <Button
 onClick={handleAnalyze}
 className="mt-6 gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8"
 >
 <Sparkles className="w-4 h-4" /> {t("start_analysis", "Start Analysis")}
 </Button>
 </div>
 )}

 {isAnalyzing && (
 <div className="text-center py-10">
 <div className="relative w-16 h-16 mx-auto mb-4">
 <div className="absolute inset-0 rounded-full border-4 border-amber-200 dark:border-amber-900/50" />
 <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
 <ShieldAlert className="absolute inset-0 m-auto w-6 h-6 text-amber-500" />
 </div>
 <p className="text-sm font-medium text-card-foreground">{t("analyzing_records_with_ai", "Analyzing records with AI...")}</p>
 <p className="text-xs text-muted-foreground mt-1">{t("this_may_take_a_few_seconds", "This may take a few seconds")}</p>
 </div>
 )}

 {findings !== null && !isAnalyzing && (
 <>
 {findings.length === 0 ? (
 <div className="text-center py-10">
 <CheckCircle className="w-14 h-14 mx-auto text-primary mb-4" />
 <h3 className="text-base font-bold text-card-foreground">{t("no_anomalies_detected", "No Anomalies Detected")}</h3>
 <p className="text-sm text-muted-foreground mt-1">{t("all", "All")} {records.length} {t("records_look_healthy", "records look healthy.")}</p>
 <Button onClick={handleAnalyze} variant="outline" className="mt-4 gap-2" size="sm">
 <Sparkles className="w-3.5 h-3.5" /> {t("re_analyze", "Re-analyze")}
 </Button>
 </div>
 ) : (
 <>
 <div className="flex items-center justify-between">
 <p className="text-sm font-bold text-card-foreground">
 {findings.length} {t("finding", "Finding")}{findings.length > 1 ? 's' : ''} {t("detected", "Detected")}
 </p>
 <Button onClick={handleAnalyze} variant="outline" size="sm" className="gap-1.5 text-xs h-7">
 <Sparkles className="w-3 h-3" /> {t("re_run", "Re-run")}
 </Button>
 </div>
 <div className="space-y-3">
 {findings.map((finding, idx) => {
 const config = RISK_CONFIG[finding.level] || RISK_CONFIG.MEDIUM;
 const Icon = config.icon;
 return (
 <div key={idx} className={`p-4 rounded-xl border ${config.classes} transition-all `}>
 <div className="flex items-start gap-3">
 <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config.badgeClasses}`}>
 {config.label}
 </span>
 {finding.record_ref && (
 <span className="text-[10px] font-mono text-current opacity-70">
 {t("ref", "Ref:")} {finding.record_ref}
 </span>
 )}
 </div>
 <p className="text-sm font-bold mt-1.5">{finding.title}</p>
 <p className="text-xs mt-1 opacity-80 leading-relaxed">{finding.description}</p>
 </div>
 </div>
 </div>
 );
})}
 </div>
 </>
 )}
 </>
 )}
 </div>

 {/* Footer */}
 <div className="p-4 border-t border-primary/40 bg-muted/20 rounded-b-2xl flex justify-end">
 <Button variant="outline" onClick={onClose}>{t("close", "Close")}</Button>
 </div>
 </div>
 </div>
 );
}
