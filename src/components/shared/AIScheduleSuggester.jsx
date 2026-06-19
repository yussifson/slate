import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Calendar as CalendarIcon, Sparkles, Clock} from 'lucide-react';
import { generateText} from '@/lib/cloudflareAI';
import { Button} from '@/components/ui/button';
import { toast} from 'react-hot-toast';

/**
 * AIScheduleSuggester
 * Takes an array of existing appointments/events and suggests 3 optimal timeslots for a new meeting.
 * 
 * Props:
 * existingEvents: array of { date, startTime, endTime, title}
 * durationMinutes: number
 * onSelectSlot: ({date, time}) => void
 */
export default function AIScheduleSuggester({ existingEvents = [], durationMinutes = 30, onSelectSlot}) {
 const { t} = useTranslation();
 const [suggestions, setSuggestions] = useState([]);
 const [isAnalyzing, setIsAnalyzing] = useState(false);

 const handleSuggest = async () => {
 setIsAnalyzing(true);
 setSuggestions([]);

 try {
 const messages = [
 {
 role: 'system',
 content: `You are an AI scheduling assistant. You will be given a list of existing events and a desired meeting duration. 
Find 3 available time slots (during standard business hours 9 AM - 5 PM, Mon-Fri) that do NOT overlap with existing events.
Return ONLY a JSON array of objects with the structure: [{"date": "YYYY-MM-DD", "time": "HH:MM", "reason": "Why this slot is good"}].
Use dates starting from tomorrow.`
},
 {
 role: 'user',
 content: `Duration: ${durationMinutes} minutes.\nExisting Events:\n${JSON.stringify(existingEvents)}`
}
 ];

 const response = await generateText(messages);
 
 let parsed = [];
 try {
 parsed = JSON.parse(response);
} catch (e) {
 const match = response.match(/\[[\s\S]*\]/);
 if (match) parsed = JSON.parse(match[0]);
}

 setSuggestions(parsed);
} catch (error) {
 console.error(error);
 toast.error('Failed to generate suggestions.');
} finally {
 setIsAnalyzing(false);
}
};

 return (
 <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-xl p-5  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-primary">
 <Sparkles className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-card-foreground hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">{t("smart_scheduling", "Smart Scheduling")}</h3>
 <p className="text-xs text-[#71717a] dark:text-gray-400 tracking-[0.04em]">{t("find_the_optimal_time_slot", "Find the optimal time slot")}</p>
 </div>
 </div>
 <Button 
 onClick={handleSuggest} 
 disabled={isAnalyzing}
 variant="outline" 
 size="sm"
 className="text-xs h-8 tracking-[0.04em]"
 >
 {isAnalyzing ? 'Analyzing Calendar...' : 'Suggest Times'}
 </Button>
 </div>
 {suggestions.length > 0 && (
 <div className="space-y-2 mt-4 pt-4 border-t border-primary/40">
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase mb-2 tracking-[0.04em]">{t("suggested_slots", "Suggested Slots")}</p>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {suggestions.map((slot, idx) => {
 return (
 <button
 key={idx}
 onClick={() => onSelectSlot({ date: slot.date, time: slot.time})}
 className="flex flex-col items-start p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 bg-slate-50 hover:bg-slate-100 transition-colors text-left group"
 >
 <div className="flex items-center gap-2.5 text-primary font-semibold text-sm mb-1">
 <CalendarIcon className="w-3.5 h-3.5" />
 {slot.date}
 </div>
 <div className="flex items-center gap-2.5 text-foreground font-medium text-xs mb-2 tracking-[0.04em]">
 <Clock className="w-3.5 h-3.5 text-[#71717a] dark:text-gray-400" />
 {slot.time}
 </div>
 <p className="text-[10px] text-[#71717a] dark:text-gray-400 leading-tight line-clamp-2 group-hover:text-foreground transition-colors">
 {slot.reason}
 </p>
 </button>
 );
})}
 </div>
 </div>
 )}
 </div>
 );
}
