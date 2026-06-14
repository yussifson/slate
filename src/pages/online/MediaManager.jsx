import React, { useState} from 'react';
import { UploadCloud, Folder, File, Search, MoreVertical, Trash2, Download, Image as ImageIcon, Video, FileText} from 'lucide-react';
import { useToast} from "@/components/ui/use-toast";

export default function MediaManager() {
 const { toast} = useToast();
 const [searchTerm, setSearchTerm] = useState('');

 const [assets, setAssets] = useState([]);

 const filteredAssets = assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

 const handleUpload = () => {
 toast({ title: "Upload Started", description: "Your file is being uploaded to the media library."});
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
 <div className="border-b border-[var(--color-border-subtle)] pb-4 flex justify-between items-end">
 <div>
 <h1 className="font-display font-semibold text-[var(--text-3xl)] text-[var(--color-text-primary)] tracking-tight">Media Library</h1>
 <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1">Manage all your uploaded videos, documents, and images centrally.</p>
 </div>
 <button onClick={handleUpload} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
 <UploadCloud className="w-4 h-4" /> Upload Asset
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <div className="lg:col-span-1 space-y-4">
 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-4">
 <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Folders</h3>
 <div className="space-y-1">
 <button className="w-full flex items-center justify-between px-3 py-2 text-sm bg-[var(--color-surface-1)] text-[var(--primary)] rounded-[var(--radius-md)] font-medium">
 <div className="flex items-center gap-3">
 <Folder className="w-4 h-4" /> All Assets
 </div>
 <span className="text-xs bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full">{assets.length}</span>
 </button>
 <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)] rounded-[var(--radius-md)] transition-colors">
 <div className="flex items-center gap-3">
 <Folder className="w-4 h-4" /> Course Videos
 </div>
 </button>
 <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)] rounded-[var(--radius-md)] transition-colors">
 <div className="flex items-center gap-3">
 <Folder className="w-4 h-4" /> Documents
 </div>
 </button>
 </div>
 </div>

 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-6 text-center">
 <div className="w-16 h-16 bg-[var(--color-surface-1)] rounded-full flex items-center justify-center mx-auto mb-4">
 <UploadCloud className="w-8 h-8 text-[var(--primary)]" />
 </div>
 <h4 className="font-semibold text-[var(--color-text-primary)]">Quick Upload</h4>
 <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4">Drag & drop files here</p>
 <button className="text-sm text-[var(--primary)] font-medium hover:underline">Browse Files</button>
 </div>
 </div>

 <div className="lg:col-span-3">
 <div className="bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] overflow-hidden flex flex-col h-[600px]">
 <div className="p-4 border-b border-[var(--color-border-subtle)] flex gap-4 bg-[var(--color-surface-1)]">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
 <input 
 type="text" 
 placeholder="Search assets..." 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-[var(--color-surface-0)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] pl-9 pr-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] font-body"
 />
 </div>
 </div>

 <div className="flex-1 overflow-y-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-[var(--color-surface-0)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] sticky top-0">
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
 <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center">
 {getIcon(asset.type)}
 </div>
 <span className="font-medium">{asset.name}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-[var(--color-text-secondary)]">{asset.size}</td>
 <td className="px-6 py-4 text-[var(--color-text-secondary)]">{asset.date}</td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors">
 <Download className="w-4 h-4" />
 </button>
 <button className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-subtle)] rounded-md transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 <button className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors">
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
