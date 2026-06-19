import React, { useState, useRef } from 'react';
import { UploadCloud, Folder, File, Search, MoreVertical, Trash2, Download, Image as ImageIcon, Video, FileText, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/api/supabaseClient';
import { powerSync } from '@/api/PowerSyncConnector';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

export default function MediaManager() {
 const { toast } = useToast();
 const companyId = useCompanyId();
 const { user } = useAuth();
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState('');
 const [activeFolder, setActiveFolder] = useState('All Assets');
 const [isUploading, setIsUploading] = useState(false);
 const fileInputRef = useRef(null);

 const { data: assets = [], isLoading } = useQuery({
   queryKey: ['online_media', companyId],
   queryFn: async () => {
     if (!companyId) return [];
     const res = await powerSync.execute('SELECT * FROM online_media WHERE company_id = ? ORDER BY created_at DESC', [companyId]);
     return res.rows._array || [];
   },
   enabled: !!companyId
 });

 const filteredAssets = assets.filter(a => 
   (activeFolder === 'All Assets' || a.folder === activeFolder) &&
   a.name.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const handleUpload = async (event) => {
   const file = event.target.files?.[0];
   if (!file) return;

   setIsUploading(true);
   toast({ title: "Uploading...", description: "Your file is being uploaded to the media library."});

   try {
     const fileExt = file.name.split('.').pop();
     const fileName = `${companyId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
     
     // Upload to Supabase Storage
     const { data, error } = await supabase.storage.from('assets').upload(fileName, file);
     
     if (error && error.message !== 'The resource already exists') throw error;
     
     const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName);

     let type = 'document';
     if (file.type.startsWith('image/')) type = 'image';
     if (file.type.startsWith('video/')) type = 'video';

     const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

     // Save to PowerSync
     const mediaId = `med_${Math.random().toString(36).substr(2, 9)}`;
     await powerSync.execute(
       `INSERT INTO online_media (id, company_id, created_at, name, type, size, url, folder, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
       [mediaId, companyId, new Date().toISOString(), file.name, type, sizeMB, publicUrl, activeFolder === 'All Assets' ? 'General' : activeFolder, user?.id]
     );

     queryClient.invalidateQueries(['online_media', companyId]);
     toast({ title: "Success", description: "File uploaded successfully." });
   } catch (error) {
     console.error("Upload error", error);
     toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
   } finally {
     setIsUploading(false);
     if (fileInputRef.current) fileInputRef.current.value = '';
   }
 };

 const handleDelete = async (id) => {
   if (!window.confirm("Are you sure you want to delete this asset?")) return;
   try {
     await powerSync.execute('DELETE FROM online_media WHERE id = ?', [id]);
     queryClient.invalidateQueries(['online_media', companyId]);
     toast({ title: "Deleted", description: "Asset removed successfully." });
   } catch (error) {
     toast({ title: "Error", description: "Could not delete asset.", variant: "destructive" });
   }
 };

 const getIcon = (type) => {
 switch(type) {
 case 'video': return <Video className="w-5 h-5 text-[var(--color-info)]" />;
 case 'image': return <ImageIcon className="w-5 h-5 text-[var(--color-success)]" />;
 case 'document': return <FileText className="w-5 h-5 text-[var(--color-warning)]" />;
 default: return <File className="w-5 h-5 text-[var(--color-text-secondary)]" />;
}
};

 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="border-b border-primary/40 pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight tracking-[-0.02em]">Media Library</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage all your uploaded videos, documents, and images centrally.</p>
 </div>
 <div>
   <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} />
   <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-md-[var(--radius-md)] hover:opacity-90 transition-opacity">
     {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} 
     {isUploading ? "Uploading..." : "Upload Asset"}
   </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <div className="lg:col-span-1 space-y-4">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] p-4">
 <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Folders</h3>
 <div className="space-y-1">
 <button onClick={() => setActiveFolder('All Assets')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md-[var(--radius-md)] font-medium transition-colors ${activeFolder === 'All Assets' ? 'bg-[var(--color-surface-1)] text-[var(--primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]'}`}>
 <div className="flex items-center gap-3">
 <Folder className="w-4 h-4" /> All Assets
 </div>
 <span className="text-xs bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full tracking-[0.04em]">{assets.length}</span>
 </button>
 <button onClick={() => setActiveFolder('Course Videos')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md-[var(--radius-md)] transition-colors ${activeFolder === 'Course Videos' ? 'bg-[var(--color-surface-1)] text-[var(--primary)] font-medium' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]'}`}>
 <div className="flex items-center gap-3">
 <Video className="w-4 h-4" /> Course Videos
 </div>
 </button>
 <button onClick={() => setActiveFolder('Documents')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md-[var(--radius-md)] transition-colors ${activeFolder === 'Documents' ? 'bg-[var(--color-surface-1)] text-[var(--primary)] font-medium' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]'}`}>
 <div className="flex items-center gap-3">
 <FileText className="w-4 h-4" /> Documents
 </div>
 </button>
 </div>
 </div>

 <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer hover:border-[var(--primary)] transition-colors bg-[var(--color-surface-0)] border-[0.5px] border-dashed border-primary/40 rounded-md-[var(--radius-xl)] p-6 text-center">
 <div className="w-16 h-16 bg-[var(--color-surface-1)] rounded-full flex items-center justify-center mx-auto mb-4">
 <UploadCloud className="w-8 h-8 text-[var(--primary)]" />
 </div>
 <h4 className="font-semibold text-[var(--color-text-primary)]">Quick Upload</h4>
 <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4 tracking-[0.04em]">Drag & drop files here</p>
 <button className="text-sm text-[var(--primary)] font-medium hover:underline">Browse Files</button>
 </div>
 </div>

 <div className="lg:col-span-3">
 <div className="bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-xl)] overflow-hidden flex flex-col h-[600px]">
 <div className="p-4 border-b border-primary/40 flex gap-4 bg-[var(--color-surface-1)]">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
 <input 
 type="text" 
 placeholder="Search assets..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[var(--color-surface-0)] border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-md-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[var(--color-surface-0)] border-b border-primary/40 text-[var(--color-text-secondary)] sticky top-0">
 <tr>
 <th className="px-6 py-3 font-semibold">Name</th>
 <th className="px-6 py-3 font-semibold">Size</th>
 <th className="px-6 py-3 font-semibold">Date Added</th>
 <th className="px-6 py-3 font-semibold text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-text-primary)]">
 {filteredAssets.length === 0 ? (
 <tr>
 <td colSpan="4" className="px-6 py-12 text-center text-[var(--color-text-tertiary)]">
 <File className="w-12 h-12 mx-auto mb-3 opacity-20" />
 <p className="font-medium text-[var(--color-text-secondary)]">No assets found</p>
 </td>
 </tr>
 ) : (
 filteredAssets.map((asset) => (
 <tr key={asset.id} className="hover:bg-[var(--color-surface-1)] transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-md-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center">
 {getIcon(asset.type)}
 </div>
 <span className="font-medium">{asset.name}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-[var(--color-text-secondary)]">{asset.size || '-'}</td>
 <td className="px-6 py-4 text-[var(--color-text-secondary)]">{new Date(asset.created_at).toLocaleDateString()}</td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <a href={asset.url} target="_blank" rel="noreferrer" className="p-1.5 block text-[var(--color-text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors">
 <Download className="w-4 h-4" />
 </a>
 <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-lg transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 <button className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors">
 <MoreVertical className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
