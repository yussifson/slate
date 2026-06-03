import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageRenderer from '@/components/pages/PageRenderer';
import PageHeader from '@/components/shared/PageHeader';
import OrbitBoltPagesWorkspace from '@/components/orbitbolt/OrbitBoltPagesWorkspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Check, Settings2, Sparkles, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCompanyId } from '@/hooks/useCompanyId';

// Default mock schema for fleet-dashboard if not in DB
const DEFAULT_SCHEMA = {
  pageTitle: "Fleet & Delivery Overview",
  route: "fleet-dashboard",
  layout: [
    {
      id: "block_1",
      component: "MetricCard",
      dataConfig: { table: "User", filter: { role: "driver" }, aggregation: "count", label: "Active Drivers", icon: "Users" },
      styleConfig: { colSpan: 4, theme: "light", padding: "p-6" }
    }
  ]
};

export default function CustomPageViewer() {
  const { pageId } = useParams();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [isOrbitBoltOpen, setIsOrbitBoltOpen] = useState(false);
  
  // Local state for editing before saving
  const [localSchema, setLocalSchema] = useState(null);

  const { data: dbSchema, isLoading } = useQuery({
    queryKey: ['custom_page', pageId],
    queryFn: async () => {
      if (!companyId || !pageId) return null;
      const records = await base44.entities.LegalCase.filter({
        company_id: companyId,
        case_type: 'custom_page',
        title: pageId
      });
      if (records.length > 0 && records[0].data) {
        return records[0].data;
      }
      return pageId === 'fleet-dashboard' ? DEFAULT_SCHEMA : null;
    },
    enabled: !!pageId
  });

  // Sync dbSchema to localSchema when not editing
  React.useEffect(() => {
    if (dbSchema && !isEditMode) {
      setLocalSchema(dbSchema);
    }
  }, [dbSchema, isEditMode]);

  const saveMutation = useMutation({
    mutationFn: async (schemaToSave) => {
      const existing = await base44.entities.LegalCase.filter({ case_type: 'custom_page', title: pageId });
      if (existing.length > 0) {
        return base44.entities.LegalCase.update(existing[0].id, { notes: JSON.stringify(schemaToSave) });
      } else {
        return base44.entities.LegalCase.create({
          company_id: companyId,
          case_type: 'custom_page',
          title: pageId,
          status: 'Active',
          notes: JSON.stringify(schemaToSave)
        });
      }
    },
    onSuccess: () => {
      toast.success("Page saved successfully!");
      setIsEditMode(false);
      setSelectedBlockId(null);
      queryClient.invalidateQueries({ queryKey: ['custom_page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['custom_pages_list'] });
    },
    onError: (err) => {
      toast.error("Failed to save: " + err.message);
    }
  });

  const handleApplySchema = (newSchema) => {
    setLocalSchema(newSchema);
    setIsEditMode(true);
  };

  const schema = isEditMode ? localSchema : dbSchema;

  if (isLoading) {
    return <div className="p-20 text-center text-muted-foreground">Loading Page...</div>;
  }

  if (!schema) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="w-16 h-16 text-muted-foreground opacity-30 mb-4" />
        <h2 className="text-xl font-bold text-card-foreground">Page Not Found</h2>
        <p className="text-muted-foreground mt-2 max-w-md">The custom page "{pageId}" does not exist. Use Orbit Bolt to generate it.</p>
        <Button onClick={() => setIsOrbitBoltOpen(true)} className="mt-6 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Sparkles className="w-4 h-4" /> Generate with OrbitBolt
        </Button>
        {isOrbitBoltOpen && (
          <OrbitBoltPagesWorkspace 
            onClose={() => setIsOrbitBoltOpen(false)}
            onApplySchema={handleApplySchema}
          />
        )}
      </div>
    );
  }

  const selectedBlock = schema.layout?.find(b => b.id === selectedBlockId);

  const updateBlockStyle = (key, value) => {
    if (!selectedBlockId) return;
    setLocalSchema(prev => {
      const newLayout = prev.layout.map(b => {
        if (b.id === selectedBlockId) {
          return { ...b, styleConfig: { ...b.styleConfig, [key]: value } };
        }
        return b;
      });
      return { ...prev, layout: newLayout };
    });
  };

  const savePage = () => {
    saveMutation.mutate(localSchema);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)]">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-4 space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader title={schema.pageTitle} subtitle={`Dynamic Route: /pages/${pageId}`} />
          <div className="flex gap-2">
            <Button onClick={() => setIsOrbitBoltOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <Sparkles className="w-4 h-4" /> OrbitBolt AI
            </Button>
            {!isEditMode ? (
              <Button onClick={() => setIsEditMode(true)} variant="outline" className="gap-2">
                <Edit3 className="w-4 h-4" /> Edit Layout
              </Button>
            ) : (
              <>
                <Button onClick={() => { setIsEditMode(false); setSelectedBlockId(null); }} variant="outline">
                  Cancel
                </Button>
                <Button onClick={savePage} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <Save className="w-4 h-4" /> Save Page
                </Button>
              </>
            )}
          </div>
        </div>

        <div className={isEditMode ? "p-4 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5" : ""}>
          <PageRenderer 
            schema={schema} 
            onBlockClick={isEditMode ? setSelectedBlockId : undefined}
            selectedBlockId={isEditMode ? selectedBlockId : null}
          />
        </div>
      </div>

      {/* Editing Sidebar */}
      {isEditMode && (
        <div className="w-80 shrink-0 border-l border-border bg-card p-5 overflow-y-auto h-full ml-4 shadow-sm rounded-l-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">Properties</h3>
          </div>

          {!selectedBlockId ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <p>Select a block on the canvas to edit its properties.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase">Component Type</Label>
                <div className="mt-1 font-medium bg-muted p-2 rounded-md">{selectedBlock?.component}</div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="font-semibold text-sm">Appearance</h4>
                
                <div>
                  <Label>Theme</Label>
                  <Select value={selectedBlock?.styleConfig?.theme || 'light'} onValueChange={v => updateBlockStyle('theme', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Column Span (1-12)</Label>
                  <Select value={String(selectedBlock?.styleConfig?.colSpan || 12)} onValueChange={v => updateBlockStyle('colSpan', parseInt(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 Columns (1/3 width)</SelectItem>
                      <SelectItem value="6">6 Columns (Half width)</SelectItem>
                      <SelectItem value="8">8 Columns (2/3 width)</SelectItem>
                      <SelectItem value="12">12 Columns (Full width)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Padding Class</Label>
                  <Input 
                    value={selectedBlock?.styleConfig?.padding || ''} 
                    onChange={e => updateBlockStyle('padding', e.target.value)} 
                    placeholder="e.g. p-4, p-6, py-8"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="font-semibold text-sm">Data Binding (Read Only)</h4>
                <div className="text-xs bg-slate-900 text-green-400 p-3 rounded-lg font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedBlock?.dataConfig, null, 2)}
                </div>
                <p className="text-[10px] text-muted-foreground">To change data binding, ask Orbit Bolt AI.</p>
              </div>

            </div>
          )}
        </div>
      )}

      {isOrbitBoltOpen && (
        <OrbitBoltPagesWorkspace 
          onClose={() => setIsOrbitBoltOpen(false)}
          onApplySchema={handleApplySchema}
        />
      )}
    </div>
  );
}
