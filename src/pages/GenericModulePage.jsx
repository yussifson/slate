import React, { useState, useEffect } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Plus, RefreshCw, BarChart2, ShieldCheck, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import DynamicTable from "@/components/ui/DynamicTable";
import DynamicForm from "@/components/ui/DynamicForm";
import DynamicDashboard from "@/components/ui/DynamicDashboard";
import { powerSync } from "@/api/PowerSyncConnector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function GenericModulePage({ title: propTitle, description: propDescription }) {
  const { toast } = useToast();
  const path = window.location.pathname.replace('/', '');
  
  const [moduleDef, setModuleDef] = useState(null);
  const [fieldDefs, setFieldDefs] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchDynamicData = async () => {
    try {
      setIsLoading(true);
      const modResults = await powerSync.getAll(`
        SELECT * FROM module_definitions WHERE is_active = 'true' LIMIT 1
      `);
      
      if (modResults.length > 0) {
        const mod = modResults[0];
        setModuleDef(mod);
        
        const fields = await powerSync.getAll(`
          SELECT * FROM field_definitions WHERE module_id = ? ORDER BY order_index ASC
        `, [mod.id]);
        setFieldDefs(fields);

        const recs = await powerSync.getAll(`
          SELECT * FROM dynamic_records WHERE module_id = ?
        `, [mod.id]);
        const parsedRecords = recs.map(r => ({ ...r, data: JSON.parse(r.data || '{}') }));
        setRecords(parsedRecords);
      }
    } catch (err) {
      console.error("Failed to load dynamic module", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicData();
  }, [path]);

  const title = propTitle || moduleDef?.name || "Dynamic Workspace";
  const description = propDescription || moduleDef?.description || "Loading configuration...";

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchDynamicData(); // Refresh records
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={title}
        subtitle={description}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5 shadow-sm bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> Add Record
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-slate-900">{records.length}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">Module Status</p>
            <p className="text-2xl font-bold text-slate-900">Active</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-500 mb-1">Custom Fields</p>
            <p className="text-2xl font-bold text-slate-900">{fieldDefs.length}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </div>

      {!isLoading && moduleDef && (
        <DynamicDashboard records={records} moduleDef={moduleDef} />
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm p-6 mt-6">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>Loading module definitions...</p>
          </div>
        ) : !moduleDef ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
            <p className="font-medium text-slate-700 text-lg">No Dynamic Modules Found</p>
            <p className="text-sm mt-1">Use the AI Assistant to generate a new module.</p>
          </div>
        ) : (
          <DynamicTable data={records} fieldDefinitions={fieldDefs} />
        )}
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Record</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new record in {title}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {moduleDef && (
              <DynamicForm 
                moduleDef={moduleDef} 
                fieldDefinitions={fieldDefs} 
                onSuccess={handleAddSuccess}
                onCancel={() => setIsAddModalOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
