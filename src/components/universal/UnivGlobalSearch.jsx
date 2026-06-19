import React, { useState, useEffect, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion, AnimatePresence} from 'framer-motion';
import { useQuery} from '@tanstack/react-query';
import { cn} from '@/lib/utils';
import {Search, FileText, Calendar, Users, Briefcase, Command,
 LayoutGrid, ArrowRight, Clock,, FolderOpen} from "lucide-react";
import { useDebounce} from '@/hooks/useDebounce';
import { OrbitLoader } from "@/components/ui/orbit-loader";

const SCOPES = [
 { id: 'all', label: 'All Results'},
 { id: 'records', label: 'Data Records'},
 { id: 'pages', label: 'Pages'},
 { id: 'documents', label: 'Documents'},
 { id: 'contacts', label: 'Contacts'}
];

export default function UnivGlobalSearch({
 title = 'Global Search',
 companyId,
 pageName,
 tableName
}) {
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const targetTable = tableName || 'industry_records';

 const [query, setQuery] = useState('');
 const debouncedQuery = useDebounce(query, 300);
 const [activeScope, setActiveScope] = useState('all');
 const [recentSearches, setRecentSearches] = useState([]);
 const [searchTime, setSearchTime] = useState(0);

 useEffect(() => {
 try {
 const saved = JSON.parse(localStorage.getItem('orbit_recent_searches') || '[]');
 setRecentSearches(saved);
} catch(e) {}
}, []);

 const saveRecentSearch = (q) => {
 if (!q.trim()) return;
 const next = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
 setRecentSearches(next);
 localStorage.setItem('orbit_recent_searches', JSON.stringify(next));
};

 const { data: results = [], isFetching} = useQuery({
 queryKey: ['global_search', effectiveCompanyId, debouncedQuery, activeScope, targetTable],
 queryFn: async () => {
 if (!debouncedQuery.trim()) return [];
 const startTime = performance.now();
 
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 
 // Fuzzy search across common JSON keys
 const q = `%${debouncedQuery}%`;
 const orFilter = `data->>title.ilike.${q},data->>name.ilike.${q},data->>description.ilike.${q},data->>content.ilike.${q}`;
 dbQueryStr += `(title LIKE ? OR description LIKE ?)`; dbQueryParams.push(`%${debouncedQuery}%`, `%${debouncedQuery}%`);

 // Scope filtering
 if (activeScope === 'documents') dbQuery = dbQuery.like('record_type', '%document%');
 if (activeScope === 'contacts') dbQuery = dbQuery.like('record_type', '%contact%');

 const { data, error} = await dbQuery.limit(50).order('created_at', { ascending: false});
 
 setSearchTime(Math.round(performance.now() - startTime));
 if (error && error.code !== '42P01') throw error;
 
 return data || [];
},
 enabled: !!effectiveCompanyId && debouncedQuery.length > 1
});

 // Group results
 const groupedResults = useMemo(() => {
 const groups = {};
 results.forEach(record => {
 const type = record.record_type || 'uncategorized';
 if (!groups[type]) groups[type] = [];
 groups[type].push(record);
});
 return groups;
}, [results]);

 const highlightMatch = (text) => {
 if (!text || typeof text !== 'string') return text;
 if (!debouncedQuery) return text;
 
 const parts = text.split(new RegExp(`(${debouncedQuery})`, 'gi'));
 return parts.map((part, i) => 
 part.toLowerCase() === debouncedQuery.toLowerCase() ? (
 <span key={i} className="bg-amber-200/50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 px-0.5 rounded-md">{part}</span>
 ) : part
 );
};

 const renderSnippet = (data) => {
 if (!data) return null;
 const textFields = ['description', 'content', 'message', 'notes', 'summary'];
 for (const field of textFields) {
 if (data[field] && typeof data[field] === 'string' && data[field].toLowerCase().includes(debouncedQuery.toLowerCase())) {
 return highlightMatch(data[field].length > 150 ? data[field].slice(0, 150) + '...' : data[field]);
}
}
 return null;
};

 return (
 <div className="flex flex-col h-full bg-background font-sans">
 {/* Search Hero */}
 <div className="bg-card border-b border-primary/40 pt-12 pb-6 px-6 sm:px-10 shrink-0 relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-500"></div>
 <div className="max-w-4xl mx-auto space-y-6">
 <div className="flex flex-col gap-2 text-center md:text-left">
 <h1 className="text-3xl font-extrabold tracking-tight tracking-[-0.02em]">Global Search</h1>
 <p className="text-[#71717a] dark:text-gray-400">Search across all records, pages, and workspaces.</p>
 </div>

 <div className="relative group">
 <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#71717a] dark:text-gray-400 group-focus-within:text-primary transition-colors">
 <Search className="w-6 h-6" />
 </div>
 <input 
 type="text"
 value={query}
 onChange={e => setQuery(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && saveRecentSearch(query)}
 placeholder="Type to search..."
 className="w-full h-16 pl-14 pr-16 bg-muted/50 border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl text-lg font-medium text-foreground placeholder:text-[#71717a] dark:text-gray-400/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all "
 autoFocus
 />
 <div className="absolute inset-y-0 right-0 flex items-center pr-4">
 {isFetching ? (
 <OrbitLoader size="md" />
 ) : (
 <kbd className="hidden sm:inline-flex h-7 items-center gap-2 rounded-md bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 px-2 font-mono text-[11px] font-medium text-[#71717a] dark:text-gray-400 ">
 <Command className="w-3 h-3" /> K
 </kbd>
 )}
 </div>
 </div>

 {/* Scopes */}
 <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
 {SCOPES.map(scope => (
 <button
 key={scope.id}
 onClick={() => setActiveScope(scope.id)}
 className={cn(
 "px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap",
 activeScope === scope.id 
 ? "bg-foreground text-background " 
 : "bg-muted text-[#71717a] dark:text-gray-400 hover:bg-muted/80 hover:text-foreground"
 )}
 >
 {scope.label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-muted/10">
 <div className="max-w-4xl mx-auto">
 
 {!query.trim() ? (
 /* Empty State / Recents */
 <div className="space-y-8 animate-in fade-in">
 {recentSearches.length > 0 && (
 <div>
 <h3 className="text-sm font-semibold uppercase tracking-wider text-[#71717a] dark:text-gray-400 mb-4 flex items-center gap-2 tracking-[0.04em]">
 <History className="w-4 h-4" /> Recent Searches
 </h3>
 <div className="flex flex-wrap gap-2">
 {recentSearches.map(s => (
 <button 
 key={s} 
 onClick={() => setQuery(s)}
 className="px-3 py-1.5 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm hover:border-primary/50 transition-colors  hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 >
 {s}
 </button>
 ))}
 </div>
 </div>
 )}
 
 <div className="text-center py-20 text-[#71717a] dark:text-gray-400">
 <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
 <h2 className="text-xl font-semibold text-foreground mb-2">What are you looking for?</h2>
 <p className="max-w-md mx-auto text-sm leading-relaxed">
 Start typing to instantly search across all your enterprise data, documents, CRM records, and workspaces.
 </p>
 </div>
 </div>
 ) : results.length === 0 && !isFetching && debouncedQuery.length > 1 ? (
 /* No Results */
 <div className="text-center py-20 animate-in fade-in">
 <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[#71717a] dark:text-gray-400/30" />
 <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
 <p className="text-[#71717a] dark:text-gray-400">We couldn't find anything matching "{debouncedQuery}". Try checking for typos or using different keywords.</p>
 </div>
 ) : (
 /* Results Grid */
 <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
 {results.length > 0 && (
 <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider tracking-[0.04em]">
 Found {results.length} results in {searchTime}ms
 </p>
 )}

 {Object.entries(groupedResults).map(([type, items]) => (
 <div key={type} className="space-y-4">
 <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 capitalize">
 <LayoutGrid className="w-5 h-5 text-primary" />
 {type.replace(/_/g, ' ')} <span className="text-[#71717a] dark:text-gray-400 font-normal text-sm ml-2">({items.length})</span>
 </h3>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {items.map(record => {
 const data = targetTable === 'industry_records' ? record.data : record;
 const title = data.title || data.name || data.project_name || data.subject || 'Untitled Record';
 const snippet = renderSnippet(data);
 
 return (
 <div key={record.id} className="group bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 hover:border-primary/40 rounded-2xl p-5 transition-all relative overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors"></div>
 
 <div className="flex justify-between items-start mb-2">
 <h4 className="font-semibold text-base text-foreground line-clamp-1 pr-4">
 {highlightMatch(title)}
 </h4>
 <a href="#" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
 <ArrowRight className="w-4 h-4" />
 </a>
 </div>
 
 {snippet && (
 <p className="text-sm text-[#71717a] dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
 {snippet}
 </p>
 )}
 
 <div className="flex items-center gap-3 text-[10px] uppercase font-semibold tracking-wider text-[#71717a] dark:text-gray-400 mt-auto pt-3 border-t border-primary/40 tracking-[0.04em]">
 <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {new Date(record.created_at).toLocaleDateString()}</span>
 {data.status && (
 <span className="px-1.5 py-0.5 bg-muted rounded-md">{data.status}</span>
 )}
 </div>
 </div>
 );
})}
 </div>
 </div>
 ))}
 </div>
 )}

 </div>
 </div>
 </div>
 );
}
