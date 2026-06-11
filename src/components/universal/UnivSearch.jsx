import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, ArrowRight, Filter, Folder, User, FileText, Settings, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivSearch() {
  const companyId = useCompanyId();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const recentSearches = ['Acme Corp Invoice', 'Sarah Connor Contact', 'Q3 Marketing Plan', 'API Documentation'];

  useEffect(() => {
    if (!companyId || query.trim().length === 0) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const searchStr = `%${query}%`;
        const resultsArray = [];

        // 1. Search Contacts
        const { data: contacts, error: contactsErr } = await supabase
          .from('univ_contacts')
          .select('*').eq('company_id', companyId)
          .eq('company_id', companyId)
          .or(`first_name.ilike.${searchStr},last_name.ilike.${searchStr},company_name.ilike.${searchStr}`);
        
        if (contacts && !contactsErr) {
          contacts.forEach(c => {
            resultsArray.push({
              id: c.id,
              title: `${c.first_name} ${c.last_name}`,
              subtitle: `Contacts / ${c.company_name || c.type || 'Lead'}`,
              type: 'contact',
              icon: User,
              color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
            });
          });
        }

        // 2. Search Invoices
        const { data: invoices, error: invoicesErr } = await supabase
          .from('univ_invoices')
          .select('*').eq('company_id', companyId)
          .eq('company_id', companyId)
          .or(`client_name.ilike.${searchStr},invoice_number.ilike.${searchStr}`);

        if (invoices && !invoicesErr) {
          invoices.forEach(inv => {
            resultsArray.push({
              id: inv.id,
              title: `${inv.client_name} - ${inv.invoice_number}`,
              subtitle: `Invoices / ${inv.status} - $${inv.amount}`,
              type: 'file',
              icon: FileText,
              color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
            });
          });
        }

        // 3. Search Projects
        const { data: projects, error: projectsErr } = await supabase
          .from('univ_projects')
          .select('*').eq('company_id', companyId)
          .eq('company_id', companyId)
          .ilike('name', searchStr);

        if (projects && !projectsErr) {
          projects.forEach(p => {
            resultsArray.push({
              id: p.id,
              title: p.name,
              subtitle: `Projects / ${p.status || 'Active'}`,
              type: 'project',
              icon: Folder,
              color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
            });
          });
        }

        // 4. Search Documents
        const { data: docs, error: docsErr } = await supabase
          .from('univ_documents')
          .select('*').eq('company_id', companyId)
          .eq('company_id', companyId)
          .ilike('name', searchStr);

        if (docs && !docsErr) {
          docs.forEach(d => {
            resultsArray.push({
              id: d.id,
              title: d.name,
              subtitle: `Files / ${d.type || 'Document'}`,
              type: 'file',
              icon: FileText,
              color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
            });
          });
        }

        setResults(resultsArray);
      } catch (err) {
        console.error(err);
        toast.error(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, companyId]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="max-w-4xl w-full mx-auto py-12 px-4 sm:px-6 relative z-10 flex flex-col items-center">
        
        <div className="text-center mb-8">
           <h2 className="text-3xl font-bold text-foreground tracking-tight">Global Search</h2>
           <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">Find records, contacts, files, and projects instantly across your entire workspace.</p>
        </div>

        {/* Search Input */}
        <div className="w-full max-w-2xl relative">
          <div className={`relative flex items-center bg-card border-2 rounded-2xl shadow-sm transition-all duration-300 ${isFocused ? 'border-primary ring-4 ring-primary/10 shadow-md' : 'border-border hover:border-border/80'}`}>
            <Search className={`w-6 h-6 absolute left-4 ${isFocused ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
            <input 
              type="text"
              placeholder="Search anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 250)}
              className="w-full h-16 pl-14 pr-14 bg-transparent rounded-2xl text-lg focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-12 p-1 text-muted-foreground hover:text-foreground transition-colors">
                 <X className="w-5 h-5" />
              </button>
            )}
            <div className="absolute right-4 text-xs font-semibold text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-muted hidden sm:block">⌘K</div>
          </div>

          {/* Dropdown Results */}
          <AnimatePresence>
            {isFocused && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 w-full mt-3 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col"
              >
                {!query ? (
                  <div className="p-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> Recent Searches
                    </h4>
                    <ul className="space-y-1">
                      {recentSearches.map(s => (
                        <li key={s}>
                          <button 
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium text-foreground flex justify-between items-center group"
                            onClick={() => setQuery(s)}
                          >
                            {s}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <p className="text-sm">Searching workspace...</p>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="p-2">
                        {results.map((res, i) => (
                          <button key={i} className="w-full text-left p-3 hover:bg-muted/50 rounded-xl transition-colors flex items-center gap-4 group">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${res.color}`}>
                              <res.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{res.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{res.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-foreground">No results found for "{query}"</p>
                        <p className="text-xs mt-1">Try adjusting your spelling or filters.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Search Footer */}
                <div className="p-3 bg-muted/50 border-t border-border flex justify-between items-center text-xs text-muted-foreground font-medium">
                   <span>Press <kbd className="border border-border bg-card px-1 rounded mx-1 font-sans">Enter</kbd> to view all results</span>
                   <button className="flex items-center gap-1 hover:text-foreground transition-colors"><Filter className="w-3.5 h-3.5" /> Advanced Filters</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-6 overflow-x-auto max-w-2xl w-full pb-2 hide-scrollbar justify-center">
           {['All', 'Contacts', 'Invoices', 'Files', 'Projects'].map(filter => (
             <button key={filter} className="px-4 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap">
               {filter}
             </button>
           ))}
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </div>
  );
}
