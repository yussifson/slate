import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { powerSync } from "@/api/PowerSyncConnector";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/hooks/useCompanyId";
import { Blocks } from "lucide-react";

export default function CreateModulePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { company } = useCompany();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Blocks");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const moduleId = crypto.randomUUID();
      await powerSync.execute(
        `INSERT INTO module_definitions (id, company_id, name, description, icon, is_active, created_at) VALUES (?, ?, ?, ?, ?, 'true', ?)`,
        [moduleId, company?.id || '00000000-0000-0000-0000-000000000000', name, description, icon, new Date().toISOString()]
      );

      // Default fields
      await powerSync.execute(
        `INSERT INTO field_definitions (id, company_id, module_id, name, field_type, is_required, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), company?.id || '00000000-0000-0000-0000-000000000000', moduleId, "Name", "text", "true", 0, new Date().toISOString()]
      );

      toast({
        title: "Module Created",
        description: `Successfully created ${name}.`,
      });

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      navigate(`/m/${slug}`);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to create module.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Create New Module"
        subtitle="Define a custom workspace for your business processes."
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Module Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Patient Referrals"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this module tracks..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Icon Name (Lucide React)</label>
            <input 
              type="text" 
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g. Activity, Users, Settings"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Blocks className="w-4 h-4" />
              {isSubmitting ? "Creating..." : "Create Module"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
