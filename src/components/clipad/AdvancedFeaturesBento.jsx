import React from 'react';
import { Video, Brain, HeadphonesIcon, LayoutGrid, Search, TrendingUp, Sparkles, Network, Database, BookOpen, Clock } from 'lucide-react';

const features = [
  {
    title: "Organizational Memory",
    description: "The core of your enterprise. Every video, meeting, and decision is automatically captured, transcribed, and intelligently linked. Never lose context again, even as your team scales.",
    icon: Database,
    span: "md:col-span-2 md:row-span-2",
    size: "large",
    visual: (
      <div className="absolute inset-0 right-0 top-1/2 translate-x-[15%] translate-y-[-25%] w-72 h-56 bg-white dark:bg-[#141B22] rounded-xl border border-slate-200 dark:border-[#1C2935] shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
        <div className="h-6 w-full bg-slate-100 dark:bg-[#0B0F14] border-b border-slate-200 dark:border-[#1C2935] flex items-center px-2 gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="w-full h-28 bg-slate-50 dark:bg-[#0B0F14] rounded flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
             <Network className="w-10 h-10 text-primary/60" />
          </div>
          <div className="h-2 w-3/4 bg-slate-200 dark:bg-[#1C2935] rounded"></div>
          <div className="h-2 w-1/2 bg-slate-200 dark:bg-[#1C2935] rounded"></div>
        </div>
      </div>
    )
  },
  {
    title: "AI Meeting Insights",
    description: "Automatic transcription, key decisions, and action items generated the second your meeting ends.",
    icon: Sparkles,
    span: "md:col-span-1 md:row-span-2",
    size: "tall",
    visual: (
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
        <div className="bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1C2935] rounded-lg p-3 space-y-2 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            <div className="h-1.5 w-16 bg-slate-200 dark:bg-[#1C2935] rounded"></div>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-[#1C2935] rounded"></div>
          <div className="h-1.5 w-4/5 bg-slate-200 dark:bg-[#1C2935] rounded"></div>
        </div>
      </div>
    )
  },
  {
    title: "HD Async Video",
    description: "Record your screen and camera in pristine 1080p. Send updates instantly.",
    icon: Video,
    span: "md:col-span-1 md:row-span-1",
    size: "small",
    visual: (
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 dark:group-hover:opacity-20 group-hover:rotate-12 transition-all duration-700">
        <Video className="w-32 h-32 text-primary" />
      </div>
    )
  },
  {
    title: "Live Escalation",
    description: "Instantly route users to real human agents within the same chat interface.",
    icon: HeadphonesIcon,
    span: "md:col-span-1 md:row-span-1",
    size: "small",
  },
  {
    title: "Smart Spaces",
    description: "Organize teams, projects, and topics securely.",
    icon: LayoutGrid,
    span: "md:col-span-1 md:row-span-1",
    size: "small",
  },
  {
    title: "Decision Ledger",
    description: "A chronological record of every key decision made across the organization.",
    icon: BookOpen,
    span: "md:col-span-1 md:row-span-1",
    size: "small",
  },
  {
    title: "Global Search",
    description: "Find exactly what was said in any video, instantly.",
    icon: Search,
    span: "md:col-span-2 md:row-span-1",
    size: "wide",
    visual: (
      <div className="absolute inset-y-0 right-0 w-1/2 flex items-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-4 group-hover:translate-x-0">
        <div className="w-full bg-white dark:bg-[#0B0F14] border border-primary/30 rounded-full flex items-center px-4 py-2 shadow-lg dark:shadow-[0_0_15px_rgba(10,243,149,0.15)]">
          <Search className="w-4 h-4 text-primary mr-2" />
          <div className="h-2 w-1/2 bg-slate-200 dark:bg-[#1C2935] rounded"></div>
        </div>
      </div>
    )
  },
  {
    title: "Enterprise Analytics",
    description: "Track ROI, adoption, and organizational health.",
    icon: TrendingUp,
    span: "md:col-span-1 md:row-span-1",
    size: "small",
  },
  {
    title: "Async Standups",
    description: "Keep remote teams aligned without disruptive meetings.",
    icon: Clock,
    span: "md:col-span-1 md:row-span-1",
    size: "small",
  }
];

export default function AdvancedFeaturesBento() {
  return (
    <div className="w-full bg-slate-50 dark:bg-background py-32 relative overflow-hidden transition-colors duration-300">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-primary font-mono text-sm font-bold tracking-widest uppercase mb-4">
            Total Operational Intelligence
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            The ultimate toolkit for modern teams.
          </h3>
          <p className="text-slate-500 dark:text-muted-foreground text-lg leading-relaxed">
            Everything you need to communicate, organize, and compound knowledge. Built seamlessly into one powerful platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-auto md:auto-rows-[200px]">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`relative group bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-border overflow-hidden hover:border-primary/50 dark:hover:border-primary/50 transition-colors duration-500 shadow-sm hover:shadow-md ${feature.span}`}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {feature.visual}

                <div className="relative z-10 p-6 md:p-8 flex flex-col h-full">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1C2935] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500 mb-6">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="mt-auto">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h4>
                    <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed md:max-w-[85%]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
