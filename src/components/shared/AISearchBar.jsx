import { OrbitLoader } from '@/components/ui/orbit-loader';
import { useState} from 'react';
import { Search, Sparkles, Loader2, X} from 'lucide-react';
import { generateText} from '@/lib/cloudflareAI';
import { toast} from 'react-hot-toast';

/**
 * AISearchBar
 * Natural Language search input that translates queries to filter conditions.
 * 
 * Props:
 * fields: array of {key, label, type} describing available fields
 * onApplyFilters: ({ logic, conditions}) => void
 */
export default function AISearchBar({ fields = [], onApplyFilters}) {
 const [query, setQuery] = useState('');
 const [isSearching, setIsSearching] = useState(false);

 const handleAISearch = async (e) => {
 e.preventDefault();
 if (!query.trim()) return;

 setIsSearching(true);
 
 try {
 const messages = [
 {
 role: 'system',
 content: `You are an AI search assistant. Convert the user's natural language query into a JSON filter array. 
Available fields: ${JSON.stringify(fields.map(f => ({ key: f.key, type: f.type})))}
Valid operators: equals, contains, starts_with, greater_than, less_than, not_equals.
Return ONLY a valid JSON object matching this structure:
{"logic": "AND" | "OR", "conditions": [{"field": "...", "operator": "...", "value": "..."}]}
If no specific filter can be extracted, return an empty conditions array.`
},
 {
 role: 'user',
 content: query
}
 ];

 const response = await generateText(messages);
 
 let parsed = { logic: 'AND', conditions: []};
 try {
 parsed = JSON.parse(response);
} catch (err) {
 const match = response.match(/\{[\s\S]*\}/);
 if (match) parsed = JSON.parse(match[0]);
}

 if (parsed.conditions?.length > 0) {
 toast.success(`AI applied ${parsed.conditions.length} filters`);
 onApplyFilters(parsed);
} else {
 toast.error("Couldn't understand filter criteria. Try specific terms.");
}
} catch (err) {
 console.error(err);
 toast.error("AI Search failed.");
} finally {
 setIsSearching(false);
}
};

 const handleClear = () => {
 setQuery('');
 onApplyFilters({ logic: 'AND', conditions: []});
};

 return (
 <form onSubmit={handleAISearch} className="relative w-full max-w-2xl">
 <div className="relative flex items-center w-full group">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <OrbitLoader size="sm" />
 </div>
 
 <input
 type="text"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Ask AI to filter... (e.g. 'Show me pending claims over $5000')"
 className="w-full pl-10 pr-24 py-2.5 bg-card border-2 border-primary/20 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 disabled={isSearching}
 />
 
 <div className="absolute inset-y-0 right-1 flex items-center gap-2">
 {query && (
 <button 
 type="button" 
 onClick={handleClear}
 className="p-1.5 text-[#71717a] dark:text-gray-400 hover:text-foreground rounded-full hover:bg-muted"
 >
 <X className="w-4 h-4" />
 </button>
 )}
 <button
 type="submit"
 disabled={isSearching || !query.trim()}
 className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors tracking-[0.04em]"
 >
 {isSearching ? 'Thinking...' : 'AI Search'}
 </button>
 </div>
 </div>
 </form>
 );
}

