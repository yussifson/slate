import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Folder, UploadCloud, Search, MoreVertical, Download, Trash2, FileImage, FileCode, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivDocument({
  title = "Document Manager",
  subtitle = "Store, organize, and preview your files securely."
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const mockFiles = [
    { id: 1, name: 'Project Requirements.pdf', size: '2.4 MB', type: 'pdf', modified: '2 hrs ago', icon: FileText, color: 'text-red-500 bg-red-100 dark:bg-red-500/10' },
    { id: 2, title: 'Design Assets', type: 'folder', items: 12, modified: '1 day ago', icon: Folder, color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/10' },
    { id: 3, name: 'Hero Image.png', size: '4.1 MB', type: 'image', modified: '3 days ago', icon: FileImage, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10' },
    { id: 4, name: 'config.json', size: '12 KB', type: 'code', modified: '1 week ago', icon: FileCode, color: 'text-purple-500 bg-purple-100 dark:bg-purple-500/10' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      toast.success(`${e.dataTransfer.files.length} file(s) uploaded successfully.`);
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
          className={`shrink-0 w-full border-2 border-dashed rounded-2xl p-8 mb-6 text-center transition-colors flex flex-col items-center justify-center ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-card hover:bg-muted/30'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Drag & drop files here</h3>
          <p className="text-sm text-muted-foreground mt-1">or click to browse from your computer</p>
          <button className="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            Browse Files
          </button>
        </div>

        {/* File Grid */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-6 sm:col-span-5">Name</div>
            <div className="col-span-3 sm:col-span-3 text-right">Size / Items</div>
            <div className="col-span-3 hidden sm:block text-right">Last Modified</div>
            <div className="col-span-3 sm:col-span-1 text-right"></div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {mockFiles.map((file, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={file.id} 
                className="grid grid-cols-12 gap-4 p-4 border-b border-border hover:bg-muted/30 transition-colors items-center group cursor-pointer"
              >
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${file.color}`}>
                    <file.icon className="w-5 h-5" />
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
                  <button className="p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
