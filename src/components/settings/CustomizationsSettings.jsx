import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptSettings } from "@/components/settings/ReceiptSettings";
import { Sparkles, FileText, LayoutTemplate } from "lucide-react";

export function CustomizationsSettings({ company, onSave, saving }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Customizations</h2>
        <p className="text-muted-foreground mt-2">Tailor the platform features to your specific business needs.</p>
      </div>

      <Tabs defaultValue="receipts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="receipts" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Receipts
          </TabsTrigger>
          <TabsTrigger value="other" disabled className="flex items-center gap-2 opacity-50">
            <Sparkles className="w-4 h-4" />
            More Soon
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="receipts" className="mt-0 border-none p-0 outline-none">
          <div className="bg-card rounded-3xl border border-border/50 shadow-sm p-6 lg:p-8">
            <ReceiptSettings company={company} onSave={onSave} saving={saving} hideHeader />
          </div>
        </TabsContent>
        
        <TabsContent value="other">
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl border-border/50">
            <LayoutTemplate className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-bold">More Customizations Coming</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              We're building more ways to customize your workspace. Check back soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
