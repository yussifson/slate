import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { generateText} from '@/lib/cloudflareAI';
import { Button} from '@/components/ui/button';
import { Sparkles, Copy, CheckCircle, Mail, X} from 'lucide-react';
import { toast} from 'react-hot-toast';

export default function AIEmailDrafter({ recordData, defaultContext = "Write a polite and professional email based on this record.", onClose}) {
 const { t} = useTranslation();
 const [draft, setDraft] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [customPrompt, setCustomPrompt] = useState(defaultContext);
 const [copied, setCopied] = useState(false);

 const handleGenerate = async () => {
 setIsGenerating(true);
 setCopied(false);
 try {
 const messages = [
 { 
 role: 'system', 
 content: 'You are an expert professional assistant. You draft emails based on the provided record data and context instructions. Output ONLY the email body and subject line. Do not include introductory text.'
},
 {
 role: 'user',
 content: `Instructions: ${customPrompt}\n\nRecord Data: ${JSON.stringify(recordData, null, 2)}`
}
 ];

 const result = await generateText(messages);
 setDraft(result);
} catch (err) {
 toast.error("Failed to generate draft: " + err.message);
} finally {
 setIsGenerating(false);
}
};

 const handleCopy = () => {
 if (!draft) return;
 navigator.clipboard.writeText(draft);
 setCopied(true);
 toast.success("Copied to clipboard!");
 setTimeout(() => setCopied(false), 2000);
};

 return (
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4">
 <div className="bg-card rounded-md-2xl w-full max-w-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 flex flex-col max-h-[90vh] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-primary/40">
 <div className="flex items-center gap-2 text-primary">
 <Sparkles className="w-5 h-5" />
 <h2 className="text-lg font-semibold">{t("ai_communication_drafter", "AI Communication Drafter")}</h2>
 </div>
 <button onClick={onClose} className="text-[#71717a] dark:text-gray-400 hover:bg-muted p-1 rounded-md-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="p-4 flex-1 overflow-y-auto space-y-4">
 <div className="space-y-1">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("ai_instructions", "AI Instructions")}</label>
 <textarea
 value={customPrompt}
 onChange={e => setCustomPrompt(e.target.value)}
 className="w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-background px-3 py-2 text-sm resize-none h-16 focus:ring-2 focus:ring-primary/20"
 placeholder="E.g., Write a rejection email..."
 />
 </div>

 <Button 
 onClick={handleGenerate} 
 disabled={isGenerating}
 className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
 >
 {isGenerating ? (
 <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> {t("generating_magic", "Generating Magic...")}</span>
 ) : (
 <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t("generate_draft", "Generate Draft")}</span>
 )}
 </Button>

 {draft && (
 <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-bottom-2">
 <div className="flex items-center justify-between">
 <label className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-[0.04em]">{t("generated_draft", "Generated Draft")}</label>
 <button 
 onClick={handleCopy}
 className="flex items-center gap-2 text-xs font-medium text-primary hover:underline tracking-[0.04em]"
 >
 {copied ? <CheckCircle className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
 {copied ? 'Copied!' : 'Copy'}
 </button>
 </div>
 <textarea
 value={draft}
 onChange={e => setDraft(e.target.value)}
 className="w-full rounded-lg border-[0.5px] border-black/9 dark:border-white/8 border-input bg-muted/50 px-3 py-3 text-sm h-64 focus:bg-background transition-colors focus:ring-2 focus:ring-primary/20"
 />
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="p-4 border-t border-primary/40 bg-muted/30 flex justify-end gap-3">
 <Button variant="outline" onClick={onClose}>{t("close", "Close")}</Button>
 <Button 
 disabled={!draft} 
 onClick={() => window.location.href = `mailto:?subject=Regarding your record&body=${encodeURIComponent(draft)}`}
 className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 <Mail className="w-4 h-4" /> {t("open_in_mail_app", "Open in Mail App")}
 </Button>
 </div>

 </div>
 </div>
 );
}
