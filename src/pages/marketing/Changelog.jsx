import { useTranslation} from "react-i18next";
import { GitCommit, Star, Zap} from 'lucide-react';

export default function Changelog() {
 const { t} = useTranslation();
 const updates = [
 {
 version: 'v2.4.0',
 date: 'October 15, 2026',
 title: 'Advanced AI Analytics & Reporting',
 type: 'feature',
 changes: [
 'Added predictive analytics dashboard for enterprise accounts',
 'New custom report builder with drag-and-drop interface',
 'Improved export capabilities for PDF and Excel'
 ]
},
 {
 version: 'v2.3.5',
 date: 'September 28, 2026',
 title: 'Performance Optimization & Bug Fixes',
 type: 'improvement',
 changes: [
 'Reduced initial load time by 40% across all workspaces',
 'Fixed an issue with calendar syncing in specific timezones',
 'Enhanced mobile responsiveness for data tables'
 ]
},
 {
 version: 'v2.3.0',
 date: 'August 10, 2026',
 title: 'Global Automation Engine',
 type: 'feature',
 changes: [
 'Introduced visual workflow builder for custom automations',
 'Added 50+ new automation triggers and actions',
 'Webhook support for third-party integrations'
 ]
}
 ];

 return (
 <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
 <div className="mb-16">
 <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 tracking-[-0.02em]">{t("changelog", "Changelog")}</h1>
 <p className="text-xl text-slate-600">{t(
 "new_updates_and_improvements_t",
 "New updates and improvements to Slate."
 )}</p>
 </div>
 <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
 {updates.map((update, idx) => {
 return (
 <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
 <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
 {update.type === 'feature' ? <Star className="w-4 h-4 fill-current" /> : <Zap className="w-4 h-4 fill-current" />}
 </div>
 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 transition- hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-semibold text-primary bg-slate-50 px-3 py-1 rounded-full">{update.version}</span>
 <time className="text-sm font-medium text-slate-500">{update.date}</time>
 </div>
 <h3 className="text-xl font-semibold text-slate-900 mb-4">{update.title}</h3>
 <ul className="space-y-2">
 {update.changes.map((change, i) => {
 return (
 <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
 <GitCommit className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
 <span>{change}</span>
 </li>
 );
})}
 </ul>
 </div>
 </div>
 );
})}
 </div>
 </div>
 );
}
