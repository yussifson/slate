import React, { useState, useEffect, useRef} from 'react';
import { useNavigate} from 'react-router-dom';
import { motion, AnimatePresence} from 'framer-motion';
import { Search, Compass, Zap, History, X, Command, CornerDownLeft} from 'lucide-react';
import { cn} from '@/lib/utils';

import { supabase} from "@/api/supabaseClient";

export default function UnivCommandPalette({ companyId, workspaceConfig}) {
 const [isOpen, setIsOpen] = useState(false);
 const [query, setQuery] = useState('');
 const [activeIndex, setActiveIndex] = useState(0);
 const inputRef = useRef(null);
 const navigate = useNavigate();

 // Keyboard shortcut listener (Ctrl+K or Cmd+K)
 useEffect(() => {
 const handleKeyDown = (e) => {
 if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
 e.preventDefault();
 setIsOpen((prev) => !prev);
}
};
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

 // Reset state when opening
 useEffect(() => {
 if (isOpen) {
 setQuery('');
 setActiveIndex(0);
 setTimeout(() => inputRef.current?.focus(), 100);
}
}, [isOpen]);

 // Map workspace pages to items
 const pages = (workspaceConfig?.pages || []).map(p => ({
 id: `page-${p.component_id}`,
 label: p.page_name,
 category: 'Pages',
 icon: Compass,
 action: () => navigate(`/${p.page_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
}));

 // Quick actions
 const quickActions = [
 { id: 'qa-1', label: 'New Invoice', category: 'Quick Actions', icon: Zap, action: () => alert('New Invoice')},
 { id: 'qa-2', label: 'Invite User', category: 'Quick Actions', icon: Zap, action: () => alert('Invite User')},
 { id: 'qa-3', label: 'Open Settings', category: 'Quick Actions', icon: Zap, action: () => alert('Settings')},
 ];

 // Combine and filter items based on query
 const allItems = [...pages, ...quickActions];
 
 const filteredItems = query 
 ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
 : allItems.slice(0, 8); // Show only top 8 if no query

 // Keyboard navigation within the palette
 useEffect(() => {
 const handleNavigation = (e) => {
 if (!isOpen) return;
 if (e.key === 'ArrowDown') {
 e.preventDefault();
 setActiveIndex((prev) => (prev + 1) % filteredItems.length);
} else if (e.key === 'ArrowUp') {
 e.preventDefault();
 setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
} else if (e.key === 'Enter') {
 e.preventDefault();
 if (filteredItems[activeIndex]) {
 filteredItems[activeIndex].action();
 setIsOpen(false);
}
} else if (e.key === 'Escape') {
 e.preventDefault();
 setIsOpen(false);
}
};
 window.addEventListener('keydown', handleNavigation);
 return () => window.removeEventListener('keydown', handleNavigation);
}, [isOpen, filteredItems, activeIndex]);

 // Reset active index when query changes
 useEffect(() => {
 setActiveIndex(0);
}, [query]);

 // Group items by category for rendering
 const groupedItems = filteredItems.reduce((acc, item) => {
 if (!acc[item.category]) acc[item.category] = [];
 acc[item.category].push(item);
 return acc;
}, {});

 if (!isOpen) return null;

 return (
 <AnimatePresence>
 <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0}}
 animate={{ opacity: 1}}
 exit={{ opacity: 0}}
 className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
 onClick={() => setIsOpen(false)}
 />

 {/* Command Palette Modal */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -20}}
 animate={{ opacity: 1, scale: 1, y: 0}}
 exit={{ opacity: 0, scale: 0.95, y: -20}}
 transition={{ duration: 0.2, ease: "easeOut"}}
 className="relative w-full max-w-2xl bg-card/95 backdrop-blur-xl border border-primary/40 rounded-2xl overflow-hidden flex flex-col max-h-[70vh]"
 >
 {/* Search Input */}
 <div className="relative border-b border-primary/40 shrink-0">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
 <input
 ref={inputRef}
 type="text"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search apps, commands, or records..."
 className="w-full h-14 pl-12 pr-12 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground focus:ring-0"
 />
 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
 <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground">
 <span className="text-xs">esc</span>
 </kbd>
 </div>
 </div>

 {/* Results List */}
 <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
 {filteredItems.length === 0 ? (
 <div className="py-14 text-center text-muted-foreground">
 <Command className="w-8 h-8 mx-auto mb-3 opacity-20" />
 <p className="text-sm">No results found for "{query}"</p>
 </div>
 ) : (
 <div className="space-y-4 py-2">
 {Object.entries(groupedItems).map(([category, items]) => (
 <div key={category}>
 <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
 {category}
 </div>
 <div className="space-y-1">
 {items.map((item) => {
 const globalIndex = filteredItems.findIndex(i => i.id === item.id);
 const isActive = globalIndex === activeIndex;
 const Icon = item.icon;
 
 return (
 <div
 key={item.id}
 onMouseEnter={() => setActiveIndex(globalIndex)}
 onClick={() => { item.action(); setIsOpen(false);}}
 className={cn(
 "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors",
 isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
 )}
 >
 <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-background border ", isActive ? "border-primary/30 text-primary" : "border-primary/40 text-muted-foreground")}>
 <Icon className="w-4 h-4" />
 </div>
 <span className="flex-1 font-medium text-sm">{item.label}</span>
 {isActive && <CornerDownLeft className="w-4 h-4 text-primary opacity-70" />}
 </div>
 );
})}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 
 {/* Footer */}
 <div className="bg-muted/30 border-t border-primary/40 px-4 py-3 text-xs flex items-center justify-between shrink-0">
 <span className="text-muted-foreground flex items-center gap-2">
 <span className="font-semibold text-foreground">Slate Command</span> by Airflake
 </span>
 <div className="flex items-center gap-3 text-muted-foreground">
 <span className="flex items-center gap-1"><kbd className="bg-background border rounded px-1.5 py-0.5 font-mono ">↑</kbd> <kbd className="bg-background border rounded px-1.5 py-0.5 font-mono ">↓</kbd> to navigate</span>
 <span className="flex items-center gap-1"><kbd className="bg-background border rounded px-1.5 py-0.5 font-mono ">↵</kbd> to select</span>
 </div>
 </div>
 </motion.div>
 </div>
 </AnimatePresence>
 );
}
