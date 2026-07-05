import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Check, LayoutTemplate, Save } from "lucide-react";

const TEMPLATES = [
  { id: 'modern', name: 'Modern', description: 'Clean and structured layout with strong typography' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple, distraction-free receipt with maximum whitespace' },
  { id: 'classic', name: 'Classic', description: 'Traditional register-style receipt layout' },
  { id: 'thermal', name: 'Thermal Print', description: 'Optimized for 80mm/58mm thermal receipt printers' },
  { id: 'detailed', name: 'Detailed Invoice', description: 'Includes full tabular breakdown and tax summaries' },
];

export function ReceiptSettings({ company, onSave, saving }) {
  const [formData, setFormData] = useState({
    receipt_template: 'modern',
    receipt_header: '',
    receipt_footer: '',
    receipt_show_logo: true
  });

  useEffect(() => {
    if (company) {
      setFormData({
        receipt_template: company.receipt_template || 'modern',
        receipt_header: company.receipt_header || '',
        receipt_footer: company.receipt_footer || 'Thank you for your business!',
        receipt_show_logo: company.receipt_show_logo ?? true
      });
    }
  }, [company]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Receipt Configuration</h2>
        <p className="text-muted-foreground mt-2">Customize the appearance and contents of printed receipts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-emerald-500" />
              Select Template
            </h3>
            <div className="grid gap-3">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleChange('receipt_template', tpl.id)}
                  className={`flex items-start text-left p-4 rounded-2xl border-2 transition-all ${
                    formData.receipt_template === tpl.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm'
                      : 'border-border/50 bg-card hover:border-emerald-500/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`font-bold ${formData.receipt_template === tpl.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                      {tpl.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{tpl.description}</p>
                  </div>
                  {formData.receipt_template === tpl.id && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
          <h3 className="text-lg font-bold">Content & Branding</h3>
          
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/50">
            <div>
              <p className="font-bold text-foreground">Show Company Logo</p>
              <p className="text-sm text-muted-foreground">Display your logo at the top of the receipt</p>
            </div>
            <Switch
              checked={formData.receipt_show_logo}
              onCheckedChange={(v) => handleChange('receipt_show_logo', v)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Custom Header Text</label>
            <Textarea
              placeholder="e.g. 123 Health Ave, NY\nTel: +1 234 567 890"
              className="min-h-[100px] rounded-xl bg-muted/30 focus-visible:ring-1 focus-visible:ring-emerald-500 resize-none"
              value={formData.receipt_header}
              onChange={(e) => handleChange('receipt_header', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Appears below the company name/logo.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Custom Footer Text</label>
            <Textarea
              placeholder="Thank you for your business!"
              className="min-h-[100px] rounded-xl bg-muted/30 focus-visible:ring-1 focus-visible:ring-emerald-500 resize-none"
              value={formData.receipt_footer}
              onChange={(e) => handleChange('receipt_footer', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Appears at the very bottom of the receipt.</p>
          </div>

          <div className="pt-4 border-t border-border/30 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-12 font-bold shadow-sm"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
