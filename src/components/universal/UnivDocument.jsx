import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompanyId } from '@/lib/hooks/useCompanyId';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Folder, File, FileText, Upload, Plus, Search, 
  Trash2, Edit2, Loader2, HardDrive, Download, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivDocument() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'file' });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['univ_documents', companyId],
    queryFn: async () => {
      const res = await base44.db.from('univ_documents').select('*').eq('company_id', companyId).order('type', { ascending: false }).order('name', { ascending: true });
      if (res.error) throw res.error;
      return res.data;
    },
    enabled: !!companyId
  });

  const mutateRecord = useMutation({
    mutationFn: async (payload) => {
      return await base44.db.from('univ_documents').insert([{ ...payload, company_id: companyId, parent_id: currentFolder }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_documents']);
      toast.success("Document added");
      setIsModalOpen(false);
      setFormData({ name: '', type: 'file' });
    }
  });

  const deleteRecord = useMutation({
    mutationFn: async (id) => await base44.db.from('univ_documents').delete().eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries(['univ_documents']);
      toast.success("Document deleted");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutateRecord.mutate(formData);
  };

  const filteredData = documents.filter(d => 
    (currentFolder ? d.parent_id === currentFolder : !d.parent_id) &&
    d.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFiles = documents.filter(d => d.type === 'file').length;
  const totalStorage = "45 MB"; // mock

  return (
    <div className="h-full flex flex-col gap-6 w-full bg-background p-4 sm:p-6 lg:p-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <HardDrive className="w-7 h-7 text-primary" /> Document Drive
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage files, folders, and resources.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setFormData({ name: '', type: 'folder' }); setIsModalOpen(true); }} className="h-10 px-4 bg-muted text-foreground hover:bg-muted/80 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <Folder className="w-4 h-4" /> New Folder
          </button>
          <button onClick={() => { setFormData({ name: '', type: 'file' }); setIsModalOpen(true); }} className="h-10 px-4 bg-primary text-white hover:bg-primary/90 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Upload File
          </button>
        </div>
      </div>

      <div className="flex gap-4 shrink-0 overflow-x-auto pb-2 custom-scrollbar">
        <div className="bg-card border border-border px-5 py-4 rounded-2xl shadow-sm min-w-[200px]">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Storage</p>
          <p className="text-2xl font-black text-foreground mt-1">{totalStorage}</p>
          <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden"><div className="w-[10%] h-full bg-primary rounded-full"></div></div>
        </div>
        <div className="bg-card border border-border px-5 py-4 rounded-2xl shadow-sm min-w-[200px]">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Files</p>
          <p className="text-2xl font-black text-foreground mt-1">{totalFiles}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search drive..." 
            className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 px-2">
        <button onClick={() => setCurrentFolder(null)} className={`text-sm font-bold ${!currentFolder ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>My Drive</button>
        {currentFolder && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-bold text-foreground">{documents.find(d => d.id === currentFolder)?.name}</span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-card border border-border rounded-2xl shadow-sm p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <HardDrive className="w-12 h-12 opacity-20 mb-3" />
            <p className="font-medium">This folder is empty</p>
            <p className="text-sm">Upload files or create a folder to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredData.map(d => (
              <div 
                key={d.id} 
                onClick={() => d.type === 'folder' && setCurrentFolder(d.id)}
                className="group relative flex flex-col items-center p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card rounded-md shadow-sm border border-border p-1">
                  {d.type === 'file' && <button className="p-1 hover:text-primary"><Download className="w-3 h-3" /></button>}
                  <button onClick={(e) => { e.stopPropagation(); deleteRecord.mutate(d.id); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </div>
                {d.type === 'folder' ? (
                  <Folder className="w-14 h-14 text-blue-400 fill-blue-400/20 mb-3" />
                ) : (
                  <FileText className="w-14 h-14 text-slate-400 fill-slate-400/20 mb-3" />
                )}
                <p className="text-sm font-bold text-foreground text-center truncate w-full">{d.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl flex flex-col">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-black text-foreground">{formData.type === 'folder' ? 'New Folder' : 'Upload File'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1.5">{formData.type === 'folder' ? 'Folder Name' : 'File Name'}</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:outline-none text-sm" placeholder={formData.type === 'folder' ? 'Marketing Assets' : 'document.pdf'} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-4 bg-muted rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={mutateRecord.isPending} className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-bold">{mutateRecord.isPending ? 'Saving...' : formData.type === 'folder' ? 'Create' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
