import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Video, LayoutGrid, CheckCircle, Database, Network } from 'lucide-react';

export default function WithCliPadSection() {
  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden relative">
      {/* Background Glows for Harmony */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Visual Side: The Harmony */}
        <div className="relative h-[500px] w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center order-2 lg:order-1">
          
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
          {/* Central Brain Hub */}
          <motion.div 
            animate={{ boxShadow: ['0px 0px 20px rgba(16,185,129,0.2)', '0px 0px 60px rgba(16,185,129,0.5)', '0px 0px 20px rgba(16,185,129,0.2)'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute z-20 w-32 h-32 bg-slate-800 rounded-full border border-emerald-500/30 flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }}></div>
            <Brain className="w-12 h-12 text-emerald-400 relative z-10" />
          </motion.div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full z-0 opacity-30">
            <motion.path 
              d="M 100 150 C 150 150, 200 250, 250 250" 
              stroke="url(#grad1)" strokeWidth="3" fill="transparent" strokeDasharray="5,5"
              animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.path 
              d="M 100 350 C 150 350, 200 250, 250 250" 
              stroke="url(#grad2)" strokeWidth="3" fill="transparent" strokeDasharray="5,5"
              animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.path 
              d="M 450 250 C 350 250, 300 250, 250 250" 
              stroke="url(#grad3)" strokeWidth="3" fill="transparent" strokeDasharray="5,5"
              animate={{ strokeDashoffset: [0, 20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>

          {/* Connected Nodes */}
          <motion.div 
            animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 left-16 w-16 h-16 bg-slate-800 rounded-2xl border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/20 z-10"
          >
            <Video className="w-6 h-6 text-violet-400" />
          </motion.div>

          <motion.div 
            animate={{ y: [0, 5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-24 left-16 w-16 h-16 bg-slate-800 rounded-2xl border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20 z-10"
          >
            <LayoutGrid className="w-6 h-6 text-blue-400" />
          </motion.div>

          <motion.div 
            animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-1/2 right-12 w-48 bg-slate-800/80 backdrop-blur-sm rounded-xl border border-amber-500/30 p-3 shadow-lg shadow-amber-500/10 z-10 -translate-y-1/2"
          >
             <div className="flex items-center gap-2 mb-2">
               <Database className="w-4 h-4 text-amber-400" />
               <span className="text-xs font-bold text-slate-200">Decision Ledger</span>
             </div>
             <div className="h-1.5 w-full bg-slate-700 rounded-full mb-1"></div>
             <div className="h-1.5 w-3/4 bg-slate-700 rounded-full"></div>
          </motion.div>

          {/* Floating Success Notifications */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="absolute top-12 right-20 bg-emerald-500/10 backdrop-blur-md p-3 rounded-xl border border-emerald-500/30 flex items-center gap-3 z-30"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-100">Meeting Summarized</span>
          </motion.div>

        </div>

        {/* Copy Side */}
        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">The CliPad Way</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            The harmony of <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">total organizational memory.</span>
          </h2>
          <p className="text-slate-500 text-lg md:text-xl leading-relaxed mb-8">
            When every meeting, video, and decision feeds automatically into one intelligent hub, your team moves faster than ever before.
          </p>
          
          <div className="space-y-6">
            {[
              { icon: Network, title: 'Everything in One Place', desc: 'Spaces, chat, and HD meetings natively unified in a single, beautiful workspace.' },
              { icon: Brain, title: 'Instant AI Summaries', desc: 'No more waiting for someone to type up notes. AI delivers action items seconds after the call ends.' },
              { icon: Database, title: 'Compounding Knowledge', desc: 'New hires get up to speed instantly by searching the collective memory of the entire organization.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                  <p className="text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
