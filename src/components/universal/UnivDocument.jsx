import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Folder, UploadCloud, Search, MoreVertical, Download, Trash2, FileImage, FileCode, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function UnivDocument({
  title = "Document Manager",
  subtitle = "Store, organize, and preview your files securely.",
  companyId,
  pageName
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['orbit_records', companyId, pageName],
    queryFn: async () => {
      if (!companyId || !pageName) return [];
      const { data, error } = await supabase
        .from('industry_records')
        .select('*')
        .eq('company_id', companyId)
        .eq('industry', 'orbit_build_data')
        .eq('record_type', pageName)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !!pageName
  });

  const uploadMutation = useMutation({
    mutationFn: async (fileData) => {
      const { data, error } = await supabase
        .from('industry_records')
        .insert([{
          company_id: companyId,
          industry: 'orbit_build_data',
          record_type: pageName,
          data: fileData,
          search_text: Object.values(fileData).join(' ')
        }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      toast({ title: 'Success', description: 'File uploaded successfully.' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('industry_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orbit_records', companyId, pageName]);
      queryClient.invalidateQueries(['orbit_dynamic_records', companyId]);
      toast({ title: 'Deleted', description: 'File removed.' });
    }
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const processFiles = (files) => {
    Array.from(files).forEach(file => {
      let type = 'document';
      let icon = 'FileText';
      let color = 'text-blue-500 bg-blue-100 dark:bg-blue-500/10';
      
      if (file.type.startsWith('image/')) {
        type = 'image';
        icon = 'FileImage';
        color = 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10';
      } else if (file.type.includes('pdf')) {
        type = 'pdf';
        icon = 'FileText';
        color = 'text-red-500 bg-red-100 dark:bg-red-500/10';
      } else if (file.name.match(/\.(js|jsx|ts|tsx|json|html|css)$/i)) {
        type = 'code';
        icon = 'FileCode';
        color = 'text-purple-500 bg-purple-100 dark:bg-purple-500/10';
      }

      uploadMutation.mutate({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type,
        iconStr: icon,
        color,
        modified: new Date().toLocaleDateString()
      });
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const displayData = records.map(r => ({ id: r.id, ...r.data }));

  const filteredData = displayData.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const renderIcon = (iconStr) => {
    switch(iconStr) {
      case 'FileImage': return <FileImage className="w-5 h-5" />;
      case 'FileCode': return <FileCode className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex items-center justify-between mb-6 shrink-0 px-4 sm:px-6 pt-6">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
           <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="relative w-64 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 sm:px-6 pb-6 overflow-hidden">
        {/* Upload Zone */}
        <div 
          className={`shrink-0 w-full border-2 border-dashed rounded-2xl p-8 mb-6 text-center transition-colors flex flex-col items-center justify-center cursor-pointer ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-card hover:bg-muted/30'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Drag & drop files here</h3>
          <p className="text-sm text-muted-foreground mt-1">or click to browse from your computer</p>
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileInput}
          />
          {uploadMutation.isPending && (
            <div className="mt-4 flex items-center gap-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </div>
          )}
        </div>

        {/* File Grid */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-6 sm:col-span-5">Name</div>
            <div className="col-span-3 sm:col-span-3 text-right">Size / Items</div>
            <div className="col-span-3 hidden sm:block text-right">Last Modified</div>
            <div className="col-span-3 sm:col-span-1 text-right"></div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {isLoading ? (
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
               </div>
            ) : (
              <AnimatePresence>
                {filteredData.map((file, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    key={file.id} 
                    className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group cursor-pointer"
                  >
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${file.color}`}>
                        {renderIcon(file.iconStr)}
                      </div>
                      <div className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {file.name || file.title}
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-right text-sm text-muted-foreground font-medium">
                      {file.type === 'folder' ? `${file.items} items` : file.size}
                    </div>
                    <div className="col-span-3 hidden sm:block text-right text-sm text-muted-foreground">
                      {file.modified}
                    </div>
                    <div className="col-span-3 sm:col-span-1 flex justify-end items-center gap-2">
                      <button className="p-1.5 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"><Download className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }} className="p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {deleteMutation.isPending && deleteMutation.variables === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {!isLoading && filteredData.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                <Folder className="w-12 h-12 mb-4 opacity-20" />
                <p>No files found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
