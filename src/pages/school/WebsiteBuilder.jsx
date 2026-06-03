import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Globe, Image as ImageIcon, Type, MousePointerClick, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WebsiteBuilder() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-[85vh] space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <Layout className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Website Builder</h1>
            <p className="text-sm text-muted-foreground">Manage your school's public-facing website</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Globe className="w-4 h-4" /> View Live Site</Button>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2"><Save className="w-4 h-4" /> Publish Changes</Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Toolbar */}
        <div className="w-64 bg-card rounded-2xl border border-border shadow-sm flex flex-col p-4 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Sections</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-2 bg-muted/50"><Layout className="w-4 h-4" /> Header & Nav</Button>
              <Button variant="ghost" className="w-full justify-start gap-2"><ImageIcon className="w-4 h-4" /> Hero Banner</Button>
              <Button variant="ghost" className="w-full justify-start gap-2"><Type className="w-4 h-4" /> About Us Text</Button>
              <Button variant="ghost" className="w-full justify-start gap-2"><Layout className="w-4 h-4" /> Programs Grid</Button>
              <Button variant="ghost" className="w-full justify-start gap-2"><Layout className="w-4 h-4" /> Footer</Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Elements</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted p-3 rounded-xl flex flex-col items-center justify-center gap-1 cursor-grab hover:bg-muted/80 text-center">
                <Type className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium">Text Block</span>
              </div>
              <div className="bg-muted p-3 rounded-xl flex flex-col items-center justify-center gap-1 cursor-grab hover:bg-muted/80 text-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium">Image</span>
              </div>
              <div className="bg-muted p-3 rounded-xl flex flex-col items-center justify-center gap-1 cursor-grab hover:bg-muted/80 text-center">
                <MousePointerClick className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium">Button</span>
              </div>
              <div className="bg-muted p-3 rounded-xl flex flex-col items-center justify-center gap-1 cursor-grab hover:bg-muted/80 text-center">
                <Layout className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium">Spacer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="flex-1 bg-muted/30 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-4xl bg-background rounded-xl shadow-2xl border border-border min-h-full overflow-hidden">
            {/* Mock Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-8 bg-card group relative">
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-pink-500 transition-colors pointer-events-none z-10" />
              <div className="font-bold text-xl tracking-tight">Springfield Academy</div>
              <div className="flex gap-4 text-sm font-medium">
                <span>Home</span><span>About</span><span>Admissions</span><span>Contact</span>
              </div>
            </div>
            {/* Mock Hero */}
            <div className="h-96 bg-primary/10 flex flex-col items-center justify-center text-center p-12 group relative">
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-pink-500 transition-colors pointer-events-none z-10 flex items-start justify-end p-2">
                <Button size="sm" className="opacity-0 group-hover:opacity-100 bg-pink-600 hover:bg-pink-700 text-white shadow-lg pointer-events-auto h-7 text-xs">Edit Section</Button>
              </div>
              <h1 className="text-5xl font-extrabold mb-4 text-primary">Empowering the Leaders of Tomorrow</h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl">A community dedicated to academic excellence and holistic development for all our students.</p>
              <Button size="lg" className="rounded-full shadow-xl">Apply Now</Button>
            </div>
            {/* Mock Grid */}
            <div className="p-12 grid grid-cols-3 gap-8">
              {[1,2,3].map(i => (
                <div key={i} className="h-48 bg-muted rounded-2xl group relative">
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-pink-500 rounded-2xl transition-colors pointer-events-none z-10" />
                  <div className="w-full h-32 bg-primary/5 rounded-t-2xl flex items-center justify-center text-muted-foreground"><ImageIcon className="w-8 h-8 opacity-20" /></div>
                  <div className="p-4"><div className="h-4 w-1/2 bg-muted-foreground/20 rounded mb-2"/><div className="h-3 w-full bg-muted-foreground/10 rounded"/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
