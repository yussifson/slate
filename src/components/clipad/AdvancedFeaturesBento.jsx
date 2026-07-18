import React from 'react';
import { Video, Brain, Calendar, HeadphonesIcon, LayoutGrid, Search, TrendingUp, Users, Workflow, Sparkles, Network } from 'lucide-react';

const features = [
  {
    title: "HD Async Video",
    description: "Record your screen and camera in pristine 1080p. Send updates instantly without scheduling yet another meeting.",
    icon: Video,
    span: "md:col-span-2 md:row-span-2",
    size: "large",
    visual: (
      <div className="absolute inset-0 right-0 top-1/2 translate-x-[20%] translate-y-[-30%] w-64 h-48 bg-[#141B22] rounded-xl border border-[#1C2935] shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
        <div className="h-6 w-full bg-[#0B0F14] border-b border-[#1C2935] flex items-center px-2 gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="w-full h-24 bg-[#0B0F14] rounded flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[#0AF395]/10 animate-pulse"></div>
             <Video className="w-8 h-8 text-[#0AF395]/60" />
          </div>
          <div className="h-2 w-3/4 bg-[#1C2935] rounded"></div>
          <div className="h-2 w-1/2 bg-[#1C2935] rounded"></div>
        </div>
      </div>
    )
  },
  {
    title: "Orbit Intelligence",
    description: "Connects your spaces into a living enterprise brain that answers any question.",
    icon: Network,
    span: "md:col-span-1 md:row-span-1",
    size: "small",
    visual: (
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-30 group-hover:rotate-12 transition-all duration-700">
        <Brain className="w-48 h-48 text-[#0AF395]" />
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
        <div className="bg-[#0B0F14] border border-[#1C2935] rounded-lg p-3 space-y-2 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0AF395] animate-pulse"></div>
            <div className="h-1.5 w-16 bg-[#1C2935] rounded"></div>
          </div>
          <div className="h-1.5 w-full bg-[#1C2935] rounded"></div>
          <div className="h-1.5 w-4/5 bg-[#1C2935] rounded"></div>
        </div>
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
    title: "Calendar Sync",
    description: "Deep integration with Google and Outlook.",
    icon: Calendar,
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
    title: "Global Search",
    description: "Find exactly what was said in any video, instantly.",
    icon: Search,
    span: "md:col-span-2 md:row-span-1",
    size: "wide",
    visual: (
      <div className="absolute inset-y-0 right-0 w-1/2 flex items-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-4 group-hover:translate-x-0">
        <div className="w-full bg-[#0B0F14] border border-[#0AF395]/30 rounded-full flex items-center px-4 py-2 shadow-[0_0_15px_rgba(10,243,149,0.15)]">
          <Search className="w-4 h-4 text-[#0AF395] mr-2" />
          <div className="h-2 w-1/2 bg-[#1C2935] rounded"></div>
        </div>
      </div>
    )
  }
];

export default function AdvancedFeaturesBento() {
  return (
    <div className="w-full bg-[#0B0F14] py-32 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0AF395]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-[#0AF395] font-mono text-sm font-bold tracking-widest uppercase mb-4">
            Total Operational Intelligence
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            The ultimate toolkit for modern teams.
          </h3>
          <p className="text-[#A7B0BA] text-lg leading-relaxed">
            Everything you need to communicate, organize, and compound knowledge. Built seamlessly into one powerful platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[160px]">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={`relative group bg-[#141B22] rounded-3xl border border-[#1C2935] overflow-hidden hover:border-[#0AF395]/50 transition-colors duration-500 ${feature.span}`}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0AF395]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {feature.visual}

                <div className="relative z-10 p-6 md:p-8 flex flex-col h-full justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B0F14] border border-[#1C2935] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-[#0AF395]/50 transition-all duration-500">
                    <Icon className="w-6 h-6 text-[#0AF395]" />
                  </div>
                  
                  <div className={`mt-6 ${feature.size === 'small' ? 'mt-4' : ''}`}>
                    <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                    <p className="text-[#A7B0BA] text-sm leading-relaxed max-w-[85%]">
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
