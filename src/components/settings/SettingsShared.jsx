import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

export function SectionCard({ title, subtitle, onSave, saving, children }) {
  return (
    <div className="bg-card/45 backdrop-blur-xl rounded-3xl border border-border/60 shadow-2xl shadow-black/5 p-8 space-y-8 transition-all duration-300 hover:shadow-3xl hover:border-border/80">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>}
        </div>
        {onSave && (
          <Button 
            onClick={onSave} 
            disabled={saving} 
            size="sm" 
            className="gap-2 bg-foreground text-background hover:bg-foreground/90 shadow-md font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shrink-0 rounded-xl px-5 h-10"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
      <div className="pt-2">{children}</div>
    </div>
  );
}

export function FormRow({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

export function Field({ label, children, full }) {
  return (
    <div className={`space-y-2.5 ${full ? "md:col-span-2" : ""}`}>
      <Label className="text-xs font-bold text-foreground/70 tracking-widest uppercase">{label}</Label>
      <div className="relative rounded-xl shadow-sm">{children}</div>
    </div>
  );
}
