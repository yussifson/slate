import { Globe, X, ChevronDown} from 'lucide-react';
import { useState} from 'react';
import { setTierOverride, clearTierOverride, TIER_META} from '@/lib/pricing';

const ALL_TIERS = [
 { value: 'global', label: 'Global', sub: 'US, UK, EU, Gulf, AU, JP...'},
 { value: 'emerging', label: 'Emerging', sub: 'Africa, SE Asia, LatAm...'},
 { value: 'community', label: 'Community', sub: 'NGO, church, mosque, nonprofit'},
 { value: 'education', label: 'Education', sub: 'School, university, vocational'},
];

export function GeoBanner({ country, tier, onTierChange}) {
 const [open, setOpen] = useState(false);
 const meta = TIER_META[tier];

 function applyOverride(newTier) {
 setTierOverride(newTier);
 setOpen(false);
 if (onTierChange) onTierChange(newTier);
}

 function resetToGeo() {
 clearTierOverride();
 setOpen(false);
 if (onTierChange) onTierChange('global');
}

 return (
 <div className="relative">
 <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
 <div className="flex items-center gap-2 flex-1">
 <Globe className="w-4 h-4 text-primary shrink-0" />
 <p className="text-sm font-semibold text-primary">
 Showing <span className="font-black">{meta.name}</span> pricing
 {country && country !== 'manual' && <span className="font-normal text-primary/70"> — detected from {country}</span>}
 {meta.badge && (
 <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider">{meta.badge}</span>
 )}
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => setOpen(v => !v)}
 className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-white px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
 >
 Change region
 <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
 </button>
 </div>
 </div>

 {open && (
 <div className="absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 sm:w-72 bg-white border border-primary/40 rounded-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
 <div className="px-3 py-2 mb-1">
 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select your region</p>
 </div>
 {ALL_TIERS.map(t => (
 <button
 key={t.value}
 onClick={() => applyOverride(t.value)}
 className={`w-full flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-slate-50 ${
 tier === t.value ? 'bg-primary/5 text-primary' : 'text-slate-700'
}`}
 >
 <span className="text-sm font-bold">{t.label}</span>
 <span className="text-xs text-slate-500 font-medium">{t.sub}</span>
 </button>
 ))}
 <div className="border-t border-primary/40 mt-1 pt-1">
 <p className="text-[10px] text-slate-400 font-medium px-3 py-2">
 Community &amp; education pricing requires admin verification at signup.
 </p>
 </div>
 </div>
 )}
 </div>
 );
}
