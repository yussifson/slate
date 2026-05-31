import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Plus, RefreshCw, BarChart2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MODULE_DETAILS = {
  "/products": {
    title: "Product Catalog",
    description: "Manage your inventory item pricing, variations, barcode mappings, and stock alert levels."
  },
  "/org-chart": {
    title: "Organization Chart",
    description: "Visualize, search, and manage department hierarchies, reporting lines, and staffing structures."
  },
  "/disciplinary": {
    title: "Disciplinary Cases",
    description: "Securely document, investigate, and resolve employee incidents, hearings, and compliance actions."
  },
  "/dispatch": {
    title: "Logistics Dispatch Board",
    description: "Real-time fleet scheduling, route optimization, driver assignment, and manifest tracking."
  },
  "/shifts": {
    title: "Shift Scheduling",
    description: "Optimize staff rosters, manage shift swaps, track attendance times, and review clock-in logs."
  },
  "/benefits": {
    title: "Employee Benefits",
    description: "Administer employee health insurance tiers, retirement contributions, perks, and wellness programs."
  },
  "/routes": {
    title: "Route Planning",
    description: "Define optimization pathways, geo-fenced delivery routes, stop sequences, and transit estimates."
  },
  "/training": {
    title: "Training & Certifications",
    description: "Coordinate staff onboarding modules, mandatory skills training, certifications, and progress records."
  },
  "/loyalty": {
    title: "Customer Loyalty",
    description: "Configure reward points multipliers, customer tier thresholds, discounts, and rewards redemption."
  },
  "/pickups": {
    title: "Pickup Schedule",
    description: "Log, schedule, and assign customer pickup requests, dispatch vehicles, and track load statuses."
  },
  "/orders": {
    title: "Sales Orders",
    description: "Track customer purchase orders from receipt to fulfillment, packaging, shipping, and billing."
  }
};

export default function GenericModulePage({ title: propTitle, description: propDescription }) {
  const { toast } = useToast();
  const path = window.location.pathname;
  
  const matched = MODULE_DETAILS[path] || {
    title: "Industry Workspace Module",
    description: "Operational space for advanced multi-industry transaction logs, metrics, and workflows."
  };

  const title = propTitle || matched.title;
  const description = propDescription || matched.description;

  const handleAction = (actionName) => {
    toast({
      title: `${actionName} initiated`,
      description: `This high-fidelity feature is operating in live multi-industry sandbox mode.`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={title}
        subtitle={description}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => handleAction("Quick Action")} size="sm" className="gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Add Record
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Records</p>
            <p className="text-2xl font-bold text-foreground">124</p>
            <p className="text-xs text-green-600 mt-1 font-medium">+12% this month</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Active Status</p>
            <p className="text-2xl font-bold text-foreground">98.4%</p>
            <p className="text-xs text-muted-foreground mt-1">Excellent performance</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Pending Updates</p>
            <p className="text-2xl font-bold text-foreground">3</p>
            <p className="text-xs text-amber-600 mt-1 font-medium">Requires review</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Main Workspace Simulation Area */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Operational Workspace</h3>
            <p className="text-xs text-muted-foreground">Standard record management system & analytics pipeline</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleAction("Sync")} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Sync Data
          </Button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="font-bold text-slate-800 text-base">{title} Workspace Loaded</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This space manages your specific industry pipeline records, automated status trackers, and dynamic reporting tools.
            </p>
          </div>
          <div className="flex gap-2.5 pt-2">
            <Button size="sm" variant="outline" onClick={() => handleAction("Template Import")}>Import Template</Button>
            <Button size="sm" onClick={() => handleAction("Create Schema")}>Define Custom Fields</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
