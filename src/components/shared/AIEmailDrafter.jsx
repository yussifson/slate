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
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-2xl border border-border flex flex-col max-h-[90vh]">
 
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-border">
 <div className="flex items-center gap-2 text-primary">
 <Sparkles className="w-5 h-5" />
 <h2 className="text-lg font-bold">{t("ai_communication_drafter", "AI Communication Drafter")}</h2>
 </div>
 <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1 rounded-full transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="p-4 flex-1 overflow-y-auto space-y-4">
 <div className="space-y-1">
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("ai_instructions", "AI Instructions")}</label>
 <textarea
 value={customPrompt}
 onChange={e => setCustomPrompt(e.target.value)}
 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-16 focus:ring-2 focus:ring-primary/20"
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
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("generated_draft", "Generated Draft")}</label>
 <button 
 onClick={handleCopy}
 className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
 >
 {copied ? <CheckCircle className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
 {copied ? 'Copied!' : 'Copy'}
 </button>
 </div>
 <textarea
 value={draft}
 onChange={e => setDraft(e.target.value)}
 className="w-full rounded-md border border-input bg-muted/50 px-3 py-3 text-sm h-64 focus:bg-background transition-colors focus:ring-2 focus:ring-primary/20"
 />
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
 <Button variant="outline" onClick={onClose}>{t("close", "Close")}</Button>
 <Button 
 disabled={!draft} 
 onClick={() => window.location.href = `mailto:?subject=Regarding your record&body=${encodeURIComponent(draft)}`}
 className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
 >
 <Mail className="w-4 h-4" /> {t("open_in_mail_app", "Open in Mail App")}
 </Button>
 </div>

 </div>
 </div>
 );
}
