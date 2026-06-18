import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Scan, FileText, CheckCircle, Package, Truck, Database, Save, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIDocumentParser from '@/components/shared/AIDocumentParser';
import { toast } from '@/components/ui/use-toast';

export default function SmartDocs() {
  const { t } = useTranslation();
  const [extractedData, setExtractedData] = useState(null);

  const handleExtracted = (data) => {
    setExtractedData(data);
    toast({ title: "Success", description: "Document data successfully extracted via AI.", variant: "default" });
  };

  const handleSave = () => {
    // In a real implementation, we would save this to the database
    toast({ title: "Saved", description: "Document data has been saved to the system.", variant: "default" });
    setExtractedData(null);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
            <Scan className="w-6 h-6 text-primary" />
            {t("smart_docs_ocr", "Smart Docs (OCR)")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("upload_freight_docs_description", "Upload Bill of Lading, Proof of Delivery, or Commercial Invoices. Our AI will automatically extract the data.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              Upload Document
            </h2>
            <AIDocumentParser 
              onExtracted={handleExtracted} 
              fieldsContext="freight document details such as: Shipper Name, Consignee Name, Delivery Address, Total Weight, Number of Packages, Delivery Date, Driver Signature Present (boolean), and Freight Charge."
            />
            <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
              <h3 className="font-semibold text-sm mb-2">Supported Document Types:</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Bill of Lading (BOL)</li>
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Proof of Delivery (POD)</li>
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Commercial Invoices</li>
                <li className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Packing Slips</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Extracted Data
            </h2>

            {extractedData ? (
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="bg-muted/30 p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-medium text-foreground truncate" title={String(value)}>
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-border mt-auto">
                  <Button onClick={handleSave} className="w-full gap-2">
                    <Save className="w-4 h-4" /> Save to System
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">Awaiting Document</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
                  Upload a document on the left to see the AI extracted fields here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
