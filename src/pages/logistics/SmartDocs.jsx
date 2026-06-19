import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Scan, FileText, CheckCircle, Database, Save, UploadCloud, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIDocumentParser from '@/components/shared/AIDocumentParser';
import { toast } from '@/components/ui/use-toast';
import { usePowerSync } from '@powersync/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export default function SmartDocs() {
  const { t } = useTranslation();
  const powerSync = usePowerSync();
  const { user } = useAuth();
  const companyId = user?.app_metadata?.company_id || '00000000-0000-0000-0000-000000000000';
  
  const [extractedData, setExtractedData] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch historical docs
  const { data: historicalDocs } = useQuery({
    queryKey: ['logistics_smart_docs', companyId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM logistics_smart_docs WHERE company_id = ? ORDER BY created_at DESC', 
        [companyId]
      );
      return res.rows?._array || [];
    }
  });

  const handleExtracted = (data, file) => {
    setExtractedData(data);
    setCurrentFile(file);
  };

  const handleSave = async () => {
    if (!extractedData || !currentFile) return;
    setIsSaving(true);
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = currentFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${companyId}/smart_docs/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, currentFile);
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      const fileUrl = publicUrlData.publicUrl;
      const docId = crypto.randomUUID();

      // 2. Insert into PowerSync Database
      await powerSync.execute(
        `INSERT INTO logistics_smart_docs (id, company_id, document_type, file_url, extracted_data, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [docId, companyId, 'bol', fileUrl, JSON.stringify(extractedData), 'verified']
      );

      toast({ title: "Saved", description: "Document and extracted data saved successfully.", variant: "default" });
      setExtractedData(null);
      setCurrentFile(null);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save document.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2 tracking-[-0.02em] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <Scan className="w-6 h-6 text-primary" />
            {t("smart_docs_ocr", "Smart Docs (OCR)")}
          </h1>
          <p className="text-[#71717a] dark:text-gray-400 mt-1">
            {t("upload_freight_docs_description", "Upload Bill of Lading, Proof of Delivery, or Commercial Invoices. Our AI will automatically extract the data.")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <UploadCloud className="w-5 h-5 text-primary" />
              Upload Document
            </h2>
            <AIDocumentParser 
              onExtracted={handleExtracted} 
              fieldsContext="freight document details such as: Shipper Name, Consignee Name, Delivery Address, Total Weight, Number of Packages, Delivery Date, Driver Signature Present (boolean), and Freight Charge."
            />
          </div>
          
          {/* Historical Docs */}
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-md-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
             <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <Database className="w-5 h-5 text-primary" />
              Recently Processed
            </h2>
            <div className="space-y-3">
              {historicalDocs?.map(doc => {
                const data = JSON.parse(doc.extracted_data || '{}');
                return (
                  <div key={doc.id} className="p-3 border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8 rounded-md-xl flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold truncate max-w-[200px]">{data['Shipper Name'] || data['Consignee Name'] || 'Freight Document'}</p>
                        <p className="text-xs text-[#71717a] dark:text-gray-400 flex items-center gap-2 tracking-[0.04em]">
                           <Calendar className="w-3 h-3" />
                           {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md-full tracking-[0.04em]">
                        {doc.status}
                      </span>
                    </div>
                  </div>
                )
              })}
              {(!historicalDocs || historicalDocs.length === 0) && (
                <p className="text-sm text-[#71717a] dark:text-gray-400 italic">No historical documents found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/20 rounded-md-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]-sm min-h-[400px] flex flex-col sticky top-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
              <CheckCircle className="w-5 h-5 text-primary" />
              Extracted Data Review
            </h2>

            {extractedData ? (
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="bg-muted/30 p-3 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 border-[0.5px] border-black/9 dark:border-white/8">
                      <div className="text-xs text-[#71717a] dark:text-gray-400 uppercase font-semibold mb-1 tracking-[0.04em]">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-medium text-foreground truncate" title={String(value)}>
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-[0.5px] border-black/9 dark:border-white/8 mt-auto">
                  <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                    {isSaving ? "Saving..." : "Save & Verify"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <FileText className="w-16 h-16 text-[#71717a] dark:text-gray-400 mb-4" />
                <p className="text-[#71717a] dark:text-gray-400 font-medium">Awaiting Document</p>
                <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1 max-w-[250px]">
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
