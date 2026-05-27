import { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, AlertCircle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useMutateIndustryRecord } from '@/hooks/useIndustryData';

export default function CSVImportModal({ isOpen, onClose, recordType, onComplete }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [step, setStep] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  
  const { toast } = useToast();
  const mutateRecord = useMutateIndustryRecord();

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setData(results.data);
        setStep(2);
      },
      error: (error) => {
        toast({ title: 'Error parsing CSV', description: error.message, variant: 'destructive' });
      }
    });
  };

  const handleMappingChange = (csvHeader, dbField) => {
    setMapping(prev => ({ ...prev, [csvHeader]: dbField }));
  };

  const handleImport = async () => {
    setIsImporting(true);
    let successCount = 0;
    
    // Map data
    for (const row of data) {
      const payload = {};
      Object.entries(mapping).forEach(([csvHeader, dbField]) => {
        if (dbField && row[csvHeader]) {
          payload[dbField] = row[csvHeader];
        }
      });
      
      if (Object.keys(payload).length > 0) {
        try {
          await mutateRecord.mutateAsync({
            recordType,
            payload,
            status: 'Active',
            searchText: Object.values(payload).join(' ')
          });
          successCount++;
        } catch (err) {
          console.error("Failed to import row", row, err);
        }
      }
    }
    
    setIsImporting(false);
    toast({ title: 'Import Complete', description: `Successfully imported ${successCount} records.` });
    if (onComplete) onComplete(successCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">Import {recordType}s</h2>
            <p className="text-sm text-muted-foreground mt-1">Upload a CSV file to bulk import records.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:bg-muted/30 transition-colors">
              <UploadCloud className="w-12 h-12 mx-auto text-indigo-500 mb-4" />
              <h3 className="text-lg font-bold mb-2">Drag and drop your CSV here</h3>
              <p className="text-sm text-muted-foreground mb-6">Or click to browse your files</p>
              <label className="bg-primary text-white px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors">
                Select File
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 p-3 rounded-lg border border-green-200 dark:border-green-900/50">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Successfully loaded <strong>{data.length}</strong> rows. Map the columns below.</span>
              </div>

              <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">CSV Column</th>
                      <th className="px-4 py-3 text-center"><ArrowRight className="w-4 h-4 mx-auto" /></th>
                      <th className="px-4 py-3 text-left font-semibold">Map to Database Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {headers.map(header => (
                      <tr key={header}>
                        <td className="px-4 py-3 font-medium">{header}</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            placeholder="e.g. name, email, status"
                            value={mapping[header] || ''}
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleImport} disabled={isImporting} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                  {isImporting ? 'Importing...' : `Import ${data.length} Records`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
