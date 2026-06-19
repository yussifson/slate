import React from 'react';
import { motion} from 'framer-motion';

export default function GenericCalendar({ data, dateKey, titleKey}) {
 if (!data || data.length === 0) return <div className="p-8 text-center text-[#71717a] dark:text-gray-400">No data for Calendar view.</div>;

 const days = Array.from({ length: 35}, (_, i) => {
 const dayNum = i - 2; 
 if (dayNum < 1 || dayNum > 31) return { day: '', inactive: true};
 return { day: dayNum, inactive: false, isToday: dayNum === 10}; 
});

 return (
 <div className="flex-1 flex flex-col min-w-[600px] bg-card rounded-md-xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="grid grid-cols-7 border-b border-primary/40 bg-muted/30 shrink-0">
 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
 <div key={day} className="py-3 text-center text-[11px] font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-widest border-r border-primary/40 last:border-r-0 tracking-[0.04em]">
 {day}
 </div>
 ))}
 </div>
 <div className="flex-1 grid grid-cols-7 grid-rows-5 min-h-[500px]">
 {days.map((d, i) => {
 const dayEvents = d.inactive ? [] : data.filter(ev => {
 const str = String(ev[dateKey] || '');
 if(str.includes(String(d.day))) return true;
 return (ev.id || i).toString().charCodeAt(0) % 31 === d.day;
});

 return (
 <div key={i} className={`border-r border-b border-primary/40 p-2 ${d.inactive ? 'bg-muted/10' : 'bg-card hover:bg-muted/5'} transition-colors relative min-h-[100px]`}>
 {d.day && (
 <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md-full text-sm font-semibold ${d.isToday ? 'bg-primary text-primary-foreground ' : 'text-foreground'}`}>
 {d.day}
 </span>
 )}
 {!d.inactive && dayEvents.length > 0 && (
 <div className="mt-2 space-y-1">
 {dayEvents.map((ev, idx) => (
 <motion.div 
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 key={ev.id || idx} 
 className="px-2 py-1 flex justify-between items-center text-[10px] font-semibold rounded-md cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
 >
 <span className="truncate">{ev[titleKey] || 'Event'}</span>
 </motion.div>
 ))}
 </div>
 )}
 </div>
 );
})}
 </div>
 </div>
 );
}
