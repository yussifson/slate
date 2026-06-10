import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, LayoutGrid, Plus, Zap, ArrowRight, ShieldCheck, Database, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function OrbitDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 pt-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-primary mb-4 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {t("welcome_to_orbit_build", "Welcome to Orbit Build")}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {t(
              "you_ve_chosen_to_start_with_a_",
              "You've chosen a blank slate. Use Orbit AI to dynamically generate custom modules, databases, and automated workflows."
            )}
          </p>
        </div>

        {/* Call to Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Build New Module</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Describe what you need (e.g., "A ticketing system for IT support") and let Orbit construct the UI and database.
            </p>
            <Button className="w-full bg-slate-50 text-primary/90 hover:bg-slate-100 shadow-none border-none group-hover:bg-primary group-hover:text-white transition-colors">
              Start Building <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Configure Data</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Import existing data or set up your core relational tables using our visual schema builder.
            </p>
            <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Manage Databases
            </Button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Automations</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Connect your modules together with trigger-based workflows and autonomous AI agents.
            </p>
            <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-slate-900/10">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-primary/30 shrink-0 border border-white/5">
            <Layers className="w-8 h-8" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-bold text-white mb-2">Core Tools Ready</h4>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
              While your workslate is empty, your core operational tools (Inbox, Chat, Boards, and Settings) are fully active and available in the sidebar.
            </p>
          </div>
          <div className="shrink-0 w-full md:w-auto">
            <Button className="w-full md:w-auto bg-white text-slate-900 hover:bg-slate-100 shadow-lg">
              Explore Core Tools
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
