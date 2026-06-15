import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect, useMemo} from 'react';

import { supabase} from "@/api/supabaseClient";
import { useCompanyId} from '@/hooks/useCompanyId';
import { motion, AnimatePresence} from 'framer-motion';
import { useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import { useToast} from '@/components/ui/use-toast';
import { cn} from '@/lib/utils';
import {
 Folder, FileText, Plus, Search, MoreVertical, Edit3, Trash2,
 Clock, Save, X, Eye, FileEdit, Pin, ChevronRight, ChevronDown, Check
} from 'lucide-react';

// Status badges mapping
const STATUS_COLORS = {
 Draft: 'bg-slate-100 text-slate-600 border-primary/40 dark:bg-slate-800 dark:text-slate-400 dark:border-primary/40',
 Published: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
 Archived: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
};

export default function UnivKnowledgeBase({
 title = 'Knowledge Base',
 subtitle = 'Company wiki and documentation',
 companyId,
 pageName,
 tableName
}) {
 const { toast} = useToast();
 const queryClient = useQueryClient();
 const hookCompanyId = useCompanyId();
 const effectiveCompanyId = companyId || hookCompanyId;
 const effectivePageName = pageName || 'knowledge_base';
 const targetTable = tableName || 'industry_records';

 const [activeCategory, setActiveCategory] = useState(null);
 const [activeArticle, setActiveArticle] = useState(null);
 const [isEditing, setIsEditing] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [expandedCategories, setExpandedCategories] = useState(new Set());
 
 const [editorForm, setEditorForm] = useState({ title: '', content: '', category: '', status: 'Draft', pinned: false});
 const [newCategoryName, setNewCategoryName] = useState('');
 const [isAddingCategory, setIsAddingCategory] = useState(false);
 const [currentUserEmail, setCurrentUserEmail] = useState('');

 useEffect(() => {
 supabase.auth.getUser().then(({ data}) => {
 if (data?.user?.email) setCurrentUserEmail(data.user.email);
});
}, []);

 // Fetch Categories
 const { data: categories = []} = useQuery({
 queryKey: ['kb_categories', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_kb_categories`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 // Fetch Articles
 const { data: articles = []} = useQuery({
 queryKey: ['kb_articles', effectiveCompanyId, effectivePageName],
 queryFn: async () => {
 if (!effectiveCompanyId) return [];
 let dbQueryStr = `SELECT * FROM ${targetTable} WHERE company_id = ?`; let dbQueryParams = [effectiveCompanyId];
 if (targetTable === 'industry_records') {
 query = query.eq('industry', 'orbit_build_data').eq('record_type', `${effectivePageName}_kb_articles`);
}
 const { data, error} = await query;
 if (error && error.code !== '42P01') throw error;
 return (data || []).map(r => ({ id: r.id, created_at: r.created_at, updated_at: r.updated_at, ...(targetTable === 'industry_records' ? r.data : r)}));
},
 enabled: !!effectiveCompanyId
});

 const invalidate = () => {
 queryClient.invalidateQueries(['kb_categories', effectiveCompanyId, effectivePageName]);
 queryClient.invalidateQueries(['kb_articles', effectiveCompanyId, effectivePageName]);
};

 const saveArticleMutation = useMutation({
 mutationFn: async (article) => {
 const isNew = !article.id;
 let payload;
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_kb_articles`, data: article};
} else {
 payload = { ...article, company_id: effectiveCompanyId};
}

 if (isNew) {
 payload.data = { ...payload.data, author: currentUserEmail};
 await (async () => { const _payload = payload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); const _plhdr = _keys.map(()=>'?').join(', '); await powerSync.execute(`INSERT INTO ${targetTable} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals);})();
 const error = null; const data = [];
 if (error) throw error;
 return data[0];
} else {
 const updatePayload = targetTable === 'industry_records' ? { data: article} : article;
 await (async () => { const _payload = updatePayload; const _keys = Object.keys(_payload); const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE ${targetTable} SET ${_keys.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._vals, article.id]);})();
 const error = null; const data = [];
 if (error) throw error;
 return data[0];
}
},
 onSuccess: (data) => {
 invalidate();
 toast({ title: 'Article saved successfully'});
 setIsEditing(false);
 // Map returned data to state format
 const savedArticle = targetTable === 'industry_records' ? { id: data.id, created_at: data.created_at, updated_at: data.updated_at, ...data.data} : data;
 setActiveArticle(savedArticle);
},
 onError: (err) => toast({ title: 'Failed to save', description: err.message, variant: 'destructive'})
});

 const deleteArticleMutation = useMutation({
 mutationFn: async (id) => {
 await powerSync.execute(`DELETE FROM ${targetTable} WHERE id = ?`, [id]);
 const error = null;
 if (error) throw error;
},
 onSuccess: () => {
 invalidate();
 toast({ title: 'Article deleted'});
 setActiveArticle(null);
}
});

 const saveCategoryMutation = useMutation({
 mutationFn: async (name) => {
 let payload;
 const catData = { name};
 if (targetTable === 'industry_records') {
 payload = { company_id: effectiveCompanyId, industry: 'orbit_build_data', record_type: `${effectivePageName}_kb_categories`, data: catData};
} else {
 payload = { ...catData, company_id: effectiveCompanyId};
}
 const { error} = await (async () => {
 const _payload = payload;
 const _keys = Object.keys(_payload);
 const _vals = Object.values(_payload).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _plhdr = _keys.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO ${targetTable} (${_keys.join(', ')}) VALUES (${_plhdr})`, _vals); return { error: null};})();
 if (error) throw error;
},
 onSuccess: () => {
 invalidate();
 setIsAddingCategory(false);
 setNewCategoryName('');
 toast({ title: 'Category added'});
}
});

 const filteredArticles = useMemo(() => {
 let filtered = articles;
 if (activeCategory) {
 filtered = filtered.filter(a => a.category === activeCategory);
}
 if (searchQuery) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(a => 
 (a.title || '').toLowerCase().includes(q) || 
 (a.content || '').toLowerCase().includes(q)
 );
}
 return filtered.sort((a, b) => {
 if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
 return new Date(b.created_at) - new Date(a.created_at);
});
}, [articles, activeCategory, searchQuery]);

 const toggleCategory = (catName) => {
 const next = new Set(expandedCategories);
 if (next.has(catName)) next.delete(catName);
 else next.add(catName);
 setExpandedCategories(next);
};

 const handleCreateArticle = () => {
 setEditorForm({
 title: '',
 content: '',
 category: activeCategory || (categories[0]?.name || ''),
 status: 'Draft',
 pinned: false
});
 setActiveArticle(null);
 setIsEditing(true);
};

 const handleEditArticle = (article) => {
 setEditorForm({ ...article});
 setActiveArticle(article);
 setIsEditing(true);
};

 const handleSave = () => {
 if (!editorForm.title.trim()) {
 toast({ title: 'Title is required', variant: 'destructive'});
 return;
}
 saveArticleMutation.mutate(editorForm);
};

 const renderContent = (content) => {
 // Very basic markdown rendering for preview
 if (!content) return null;
 const html = content
 .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
 .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
 .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold mt-6 mb-4">$1</h1>')
 .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
 .replace(/\*(.*)\*/gim, '<em>$1</em>')
 .replace(/\n/gim, '<br />');
 
 return <div dangerouslySetInnerHTML={{ __html: html}} className="prose dark:prose-invert max-w-none" />;
};

 return (
 <div className="flex h-full w-full bg-background overflow-hidden text-foreground font-sans">
 
 {/* SIDEBAR */}
 <div className="w-64 flex-shrink-0 border-r border-primary/40 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col">
 <div className="p-4 border-b border-primary/40">
 <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
 <Folder className="w-5 h-5 text-primary" />
 {title}
 </h2>
 <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
 </div>

 <div className="p-3">
 <button 
 onClick={() => setActiveCategory(null)}
 className={cn(
 "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
 !activeCategory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
 )}
 >
 <FileText className="w-4 h-4" />
 All Articles
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1 custom-scrollbar">
 <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex justify-between items-center">
 Categories
 <button onClick={() => setIsAddingCategory(true)} className="hover:text-primary transition-colors">
 <Plus className="w-3.5 h-3.5" />
 </button>
 </div>

 {isAddingCategory && (
 <div className="px-2 mb-2 flex items-center gap-2">
 <input 
 autoFocus
 type="text"
 value={newCategoryName}
 onChange={e => setNewCategoryName(e.target.value)}
 onKeyDown={e => {
 if (e.key === 'Enter') saveCategoryMutation.mutate(newCategoryName);
 if (e.key === 'Escape') setIsAddingCategory(false);
}}
 className="w-full h-8 px-2 text-sm bg-background border border-primary/40 rounded-md focus:outline-none focus:border-primary"
 placeholder="Category name..."
 />
 <button onClick={() => setIsAddingCategory(false)} className="text-muted-foreground hover:text-foreground">
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {categories.map(cat => {
 const isExpanded = expandedCategories.has(cat.name);
 const isActive = activeCategory === cat.name;
 const catArticles = articles.filter(a => a.category === cat.name);
 return (
 <div key={cat.id || cat.name} className="space-y-0.5">
 <button
 onClick={() => {
 setActiveCategory(cat.name);
 if (!isExpanded) toggleCategory(cat.name);
}}
 className={cn(
 "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors",
 isActive ? "bg-primary/5 text-primary font-medium" : "text-foreground hover:bg-muted"
 )}
 >
 <div className="flex items-center gap-2 overflow-hidden">
 <button 
 onClick={(e) => { e.stopPropagation(); toggleCategory(cat.name);}}
 className="p-0.5 hover:bg-muted rounded text-muted-foreground"
 >
 {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
 </button>
 <Folder className={cn("w-4 h-4", isActive ? "fill-primary/20 text-primary" : "text-muted-foreground")} />
 <span className="truncate">{cat.name}</span>
 </div>
 <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded-full">{catArticles.length}</span>
 </button>
 <AnimatePresence>
 {isExpanded && (
 <motion.div
 initial={{ height: 0, opacity: 0}}
 animate={{ height: 'auto', opacity: 1}}
 exit={{ height: 0, opacity: 0}}
 className="overflow-hidden pl-7"
 >
 {catArticles.map(art => (
 <button
 key={art.id}
 onClick={() => { setActiveArticle(art); setIsEditing(false);}}
 className={cn(
 "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors truncate",
 activeArticle?.id === art.id ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:bg-muted hover:text-foreground"
 )}
 >
 <FileText className="w-3 h-3 shrink-0" />
 <span className="truncate">{art.title || 'Untitled'}</span>
 </button>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
})}
 </div>
 </div>

 {/* ARTICLE LIST */}
 <div className="w-80 flex-shrink-0 border-r border-primary/40 flex flex-col bg-background">
 <div className="p-4 border-b border-primary/40 space-y-3">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-foreground">
 {activeCategory || 'All Articles'}
 </h3>
 <button 
 onClick={handleCreateArticle}
 className="p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors "
 >
 <Plus className="w-4 h-4" />
 </button>
 </div>
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input 
 type="text"
 placeholder="Search articles..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-9 pl-9 pr-3 bg-muted/50 border border-transparent rounded-lg text-sm focus:bg-background focus:border-primary focus:outline-none transition-all"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
 {filteredArticles.length === 0 ? (
 <div className="text-center p-6 text-muted-foreground text-sm">
 No articles found.
 </div>
 ) : (
 filteredArticles.map(art => (
 <button
 key={art.id}
 onClick={() => { setActiveArticle(art); setIsEditing(false);}}
 className={cn(
 "w-full text-left p-3 rounded-xl border transition-all duration-200",
 activeArticle?.id === art.id 
 ? "bg-primary/5 border-primary/30 " 
 : "bg-background border-transparent hover:border-primary/40 hover:bg-muted/30"
 )}
 >
 <div className="flex items-start justify-between gap-2 mb-1">
 <h4 className={cn("font-semibold text-sm truncate", activeArticle?.id === art.id ? "text-primary" : "text-foreground")}>
 {art.title || 'Untitled'}
 </h4>
 {art.pinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />}
 </div>
 <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
 {art.content || 'No content...'}
 </p>
 <div className="flex items-center gap-2 mt-3 text-[10px] font-medium uppercase tracking-wider">
 <span className={cn("px-1.5 py-0.5 rounded border", STATUS_COLORS[art.status || 'Draft'])}>
 {art.status || 'Draft'}
 </span>
 <span className="text-muted-foreground/70">
 {new Date(art.created_at).toLocaleDateString()}
 </span>
 </div>
 </button>
 ))
 )}
 </div>
 </div>

 {/* EDITOR / VIEWER */}
 <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
 {!activeArticle && !isEditing ? (
 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
 <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
 <FileText className="w-10 h-10 text-muted-foreground/50" />
 </div>
 <h2 className="text-xl font-bold text-foreground mb-2">Knowledge Base</h2>
 <p className="max-w-md text-sm leading-relaxed">
 Select an article from the list to view its contents, or create a new one to document your team's knowledge.
 </p>
 <button 
 onClick={handleCreateArticle}
 className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors -primary/20 flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Create First Article
 </button>
 </div>
 ) : isEditing ? (
 <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
 <div className="h-16 px-6 border-b border-primary/40 flex items-center justify-between bg-card/50 shrink-0">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
 <FileEdit className="w-4 h-4" />
 </div>
 <span className="font-semibold text-foreground text-sm">
 {editorForm.id ? 'Edit Article' : 'New Article'}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setIsEditing(false)}
 className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 >
 Cancel
 </button>
 <button 
 onClick={handleSave}
 disabled={saveArticleMutation.isPending}
 className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
 >
 <Save className="w-4 h-4" />
 {saveArticleMutation.isPending ? 'Saving...' : 'Save Changes'}
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
 <div className="max-w-3xl mx-auto space-y-6">
 <input 
 type="text"
 value={editorForm.title}
 onChange={e => setEditorForm({...editorForm, title: e.target.value})}
 placeholder="Article Title..."
 className="w-full text-4xl font-extrabold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30 focus:ring-0 px-0"
 />
 
 <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-muted/30 border border-primary/40">
 <div className="flex-1 min-w-[200px]">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Category</label>
 <select 
 value={editorForm.category}
 onChange={e => setEditorForm({...editorForm, category: e.target.value})}
 className="w-full h-9 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:outline-none focus:border-primary"
 >
 <option value="">Select Category</option>
 {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
 </select>
 </div>
 <div className="w-48">
 <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Status</label>
 <select 
 value={editorForm.status}
 onChange={e => setEditorForm({...editorForm, status: e.target.value})}
 className="w-full h-9 px-3 rounded-lg border border-primary/40 bg-background text-sm focus:outline-none focus:border-primary"
 >
 <option value="Draft">Draft</option>
 <option value="Published">Published</option>
 <option value="Archived">Archived</option>
 </select>
 </div>
 <div className="flex items-end pb-1">
 <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
 <input 
 type="checkbox"
 checked={editorForm.pinned}
 onChange={e => setEditorForm({...editorForm, pinned: e.target.checked})}
 className="rounded border-primary/40 text-primary focus:ring-primary"
 />
 <Pin className="w-4 h-4 text-muted-foreground" /> Pin to top
 </label>
 </div>
 </div>

 <div className="h-px bg-primary/40 my-6" />

 <textarea 
 value={editorForm.content}
 onChange={e => setEditorForm({...editorForm, content: e.target.value})}
 placeholder="Write your article content here... (Markdown supported)"
 className="w-full min-h-[400px] text-base leading-relaxed bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 resize-y focus:ring-0 px-0 font-mono"
 />
 </div>
 </div>
 </div>
 ) : (
 <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
 <div className="h-16 px-6 border-b border-primary/40 flex items-center justify-between bg-card/50 shrink-0">
 <div className="flex items-center gap-3">
 <span className={cn("px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border", STATUS_COLORS[activeArticle.status || 'Draft'])}>
 {activeArticle.status || 'Draft'}
 </span>
 <span className="text-sm text-muted-foreground flex items-center gap-1">
 <Folder className="w-3.5 h-3.5" /> {activeArticle.category}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => handleEditArticle(activeArticle)}
 className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
 >
 <Edit3 className="w-4 h-4" /> Edit
 </button>
 <button 
 onClick={() => {
 if (window.confirm('Delete this article?')) deleteArticleMutation.mutate(activeArticle.id);
}}
 className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
 <div className="max-w-3xl mx-auto">
 <h1 className="text-4xl font-extrabold text-foreground mb-4">
 {activeArticle.title}
 </h1>
 
 <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10 pb-6 border-b border-primary/40">
 <div className="flex items-center gap-1.5">
 <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
 {activeArticle.author?.charAt(0).toUpperCase() || 'U'}
 </div>
 {activeArticle.author || 'Unknown Author'}
 </div>
 <div className="flex items-center gap-1.5">
 <Clock className="w-4 h-4" />
 Last updated {new Date(activeArticle.updated_at || activeArticle.created_at).toLocaleDateString()}
 </div>
 </div>

 <div className="text-foreground leading-relaxed">
 {renderContent(activeArticle.content)}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 </div>
 );
}
