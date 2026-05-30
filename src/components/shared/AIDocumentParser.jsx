import { useTranslation } from "react-i18next";
import { useState, useRef } from 'react';
import { Upload, FileScan, CheckCircle2, X, Loader2, Sparkles } from 'lucide-react';
import { analyzeImage } from '@/lib/cloudflareAI';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

/**
 * AIDocumentParser
 * Drop zone for images/receipts/invoices to auto-fill form data.
 * 
 * Props:
 *   onExtracted: (data) => void (passes extracted JSON object)
 *   fieldsContext: string (optional context about what fields to extract)
 */
export default function AIDocumentParser({ onExtracted, fieldsContext = 'invoice details' }) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG/PNG).');
      return;
    }

    setPreview(URL.createObjectURL(file));
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const prompt = `Extract ${fieldsContext} from this image. Return ONLY a valid JSON object with the extracted keys and values. Do not include markdown formatting or extra text. Example: {"amount": "150.00", "date": "2023-10-01"}`;
      
      const responseText = await analyzeImage(bytes, prompt);
      
      // Attempt to parse JSON from the response
      let extractedData = {};
      try {
        extractedData = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          extractedData = JSON.parse(match[0]);
        } else {
          throw new Error('Could not parse JSON from AI response.');
        }
      }

      toast.success('Document successfully parsed!');
      if (onExtracted) onExtracted(extractedData);
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to parse document: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  return (
    <div className="bg-card border border-dashed border-primary/40 rounded-xl p-6 text-center transition-all hover:bg-primary/5 group relative overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => processFile(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <FileScan className="w-10 h-10 text-primary animate-pulse relative z-10" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-spin" />
          </div>
          <p className="text-sm font-bold text-primary">{t("ai_is_analyzing_document", "AI is analyzing document...")}</p>
        </div>
      ) : preview ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
            <img src={preview} alt="Document Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setPreview(null); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t(
            "document_scanned_you_can_edit_",
            "Document scanned. You can edit the extracted fields below."
          )}</p>
        </div>
      ) : (
        <div 
          onDragOver={(e) => e.preventDefault()} 
          onDrop={handleDrop}
          className="flex flex-col items-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-card-foreground">{t("upload_document_for_ai_auto_fi", "Upload Document for AI Auto-Fill")}</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {t(
              "drag_drop_an_invoice_receipt_o",
              "Drag & drop an invoice, receipt, or ID card here. Our AI will automatically extract and fill the fields."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
