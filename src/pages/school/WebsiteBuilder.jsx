import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutTemplate, Monitor, Paintbrush, Globe, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";

export default function WebsiteBuilder() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [siteName, setSiteName] = useState('');
  const [themeColor, setThemeColor] = useState('blue');

  const { data: config = null } = useQuery({
    queryKey: ['school_website_config', companyId],
    queryFn: async () => {
      const all = await base44.getEntities('school_website_config', companyId);
      return all[0] || null; // Return the first config
    },
    enabled: !!companyId
  });

  const saveConfig = useMutation({
    mutationFn: () => {
      if (!siteName.trim()) throw new Error("Site Name is required");
      if (config) {
        return base44.updateEntity(config.id, {
          title: siteName,
          data: { theme: themeColor }
        });
      } else {
        return base44.createEntity({
          company_id: companyId,
          case_type: 'school_website_config',
          client_id: session?.user?.id,
          title: siteName,
          status: 'published',
          data: { theme: themeColor }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['school_website_config', companyId]);
      toast.success("School website configuration saved!");
    },
    onError: (err) => toast.error(err.message)
  });

  // Init state from config if available
  React.useEffect(() => {
    if (config) {
      setSiteName(config.title || '');
      setThemeColor(config.data?.theme || 'blue');
    }
  }, [config]);

  const colors = [
    { id: 'blue', class: 'bg-blue-600' },
    { id: 'emerald', class: 'bg-emerald-600' },
    { id: 'purple', class: 'bg-purple-600' },
    { id: 'orange', class: 'bg-orange-600' },
    { id: 'slate', class: 'bg-slate-800' }
  ];

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center relative shadow-xl">
              <LayoutTemplate className="w-10 h-10 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Website Builder</h1>
              <p className="text-slate-300 font-medium text-lg">Customize your school's public-facing portal</p>
            </div>
          </div>
          <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl px-8 shadow-lg shadow-blue-600/20 h-12">
            <Save className="w-4 h-4 mr-2" /> Save & Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
            <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> Site Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">School / Site Name</label>
                <Input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="e.g. Springfield High" className="mt-1 bg-white/50 dark:bg-background/50 border-slate-200 dark:border-slate-800 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-xl">
            <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2"><Paintbrush className="w-5 h-5 text-blue-500" /> Theme Color</h3>
            <div className="flex gap-4">
              {colors.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setThemeColor(c.id)}
                  className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110 ${c.class} shadow-md`}
                >
                  {themeColor === c.id && <CheckCircle className="w-5 h-5 text-white drop-shadow" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-white/20 p-8 shadow-xl h-full flex flex-col">
            <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2"><Monitor className="w-5 h-5 text-slate-400" /> Live Preview</h3>
            
            <div className="flex-1 border-4 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-inner flex flex-col bg-white">
              {/* Fake Browser Chrome */}
              <div className="bg-slate-100 dark:bg-slate-900 h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-amber-400"></div><div className="w-3 h-3 rounded-full bg-emerald-400"></div></div>
                <div className="mx-auto bg-white dark:bg-slate-800 rounded-md px-32 py-1 text-[10px] text-slate-400 font-mono">school.portal.com</div>
              </div>
              
              {/* Fake Website Content */}
              <div className="flex-1 flex flex-col">
                <div className={`h-48 flex items-center justify-center text-white ${themeColor === 'blue' ? 'bg-blue-600' : themeColor === 'emerald' ? 'bg-emerald-600' : themeColor === 'purple' ? 'bg-purple-600' : themeColor === 'orange' ? 'bg-orange-600' : 'bg-slate-800'}`}>
                  <h1 className="text-4xl font-black">{siteName || "Your School Name"}</h1>
                </div>
                <div className="p-8 flex-1 bg-slate-50 flex gap-6">
                  <div className="w-2/3 space-y-4">
                    <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-1/3 space-y-4">
                    <div className="h-24 w-full bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
