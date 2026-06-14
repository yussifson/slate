import { powerSync} from '@/api/PowerSyncConnector';
import React, { useState, useEffect} from 'react';

import GenericGrid from '@/components/views/GenericGrid';
import GenericKanban from '@/components/views/GenericKanban';
import GenericCalendar from '@/components/views/GenericCalendar';
import GenericDashboard from '@/components/views/GenericDashboard';

import { useCompanyId} from '@/hooks/useCompanyId';

import { supabase} from "@/api/supabaseClient";
import { motion, AnimatePresence} from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Type, File, UploadCloud, Link} from 'lucide-react';

export default function UnivBrandAsset() {
 const companyId = useCompanyId();
 const [view, setView] = useState('Default');

 const [data, setData] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isEditing, setIsEditing] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [formData, setFormData] = useState({
 asset_name: '',
 asset_type: 'Logo',
 file_url: '',
 uploaded_by: ''
});

 useEffect(() => {
 fetchData();
}, []);

 const fetchData = async () => {
 setLoading(true);
 const __res = await powerSync.execute(`SELECT * FROM univ_brandasset WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
 const records = __res.rows ? (__res.rows._array || Array.from(__res.rows)) : [];
 const error = null;
 if (!error && records) setData(records);
 setLoading(false);
};

 const handleSave = async () => {
 if (editingId) {
 await (async () => { const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId}; const _k = Object.keys(_p); const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v); await powerSync.execute(`UPDATE univ_brandasset SET ${_k.map(k=>k+' = ?').join(', ')} WHERE id = ?`, [..._v, editingId]);})();
 const error = null; const data = [];
} else {
 await (async () => {
 const _p = { ...formData, id: crypto.randomUUID(), company_id: companyId};
 const _k = Object.keys(_p);
 const _v = Object.values(_p).map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
 const _pl = _k.map(()=>'?').join(', ');
 await powerSync.execute(`INSERT INTO univ_brandasset (${_k.join(', ')}) VALUES (${_pl})`, _v); return { error: null};})();
}
 setFormData({ asset_name: '', asset_type: 'Logo', file_url: '', uploaded_by: ''});
 setIsEditing(false);
 setEditingId(null);
 fetchData();
};

 const handleEdit = (item) => {
 setFormData({
 asset_name: item.asset_name || '',
 asset_type: item.asset_type || 'Logo',
 file_url: item.file_url || '',
 uploaded_by: item.uploaded_by || ''
});
 setEditingId(item.id);
 setIsEditing(true);
};

 const handleDelete = async (id) => {
 await powerSync.execute(`DELETE FROM univ_brandasset WHERE id = ?`, [id]);
 fetchData();
};

 const getAssetIcon = (type) => {
 switch (type) {
 case 'Logo': return <ImageIcon className="w-8 h-8 text-blue-500" />;
 case 'Font': return <Type className="w-8 h-8 text-orange-500" />;
 case 'Guidelines': return <File className="w-8 h-8 text-purple-500" />;
 default: return <ImageIcon className="w-8 h-8 text-muted-foreground" />;
}
};

 
 const handleExport = () => {
 const exportData = (typeof records !== 'undefined' ? records : (typeof data !== 'undefined' ? data : []));
 if (!exportData || exportData.length === 0) return alert('No data to export');
 const keys = Object.keys(exportData[0]).filter(k => k !== 'company_id' && k !== 'id');
 const csv = [keys.join(','), ...exportData.map(r => keys.map(k => '"' + (r[k]||'').toString().replace(/"/g, '""') + '"').join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url; a.download = 'export.csv'; a.click();
};

 return (
 <div className="p-6 max-w-6xl mx-auto bg-background min-h-screen ${view !== 'Default' ? 'hide-default' : ''}">
 <div className="view-header flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
 <UploadCloud className="text-pink-600 w-8 h-8" />
 Brand Assets
 </h1>
 <p className="text-muted-foreground mt-2">Centralized hub for logos, fonts, and brand guidelines.</p>
 </div>
 {!isEditing && (
 <div className="flex items-center gap-2">

 
 <div className="flex bg-muted p-1 rounded-lg border border-border mr-2 hidden sm:flex">
 {["Default","Grid","Calendar","Dashboard"].map(v => (
 <button 
 key={v} 
 onClick={() => setView(v)} 
 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${view === v ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
 >
 {v}
 </button>
 ))}
 </div>
<button onClick={handleExport} className="h-10 px-4 bg-secondary text-secondary-foreground rounded-full text-sm font-bold flex items-center gap-2 hover:bg-secondary/80 -[0_2px_8px_-2px_rgba(0,0,0,0.1)] transition-all active:scale-95">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 Export CSV
 </button>

 <button
 onClick={() => setIsEditing(true)}
 className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
 >
 <Plus className="w-5 h-5" />
 Add Asset
 </button>
 </div>
 )}
 </div>

 <AnimatePresence>
 {isEditing && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 exit={{ opacity: 0, scale: 0.95}}
 className="bg-card p-6 rounded-xl border border-border mb-8"
 >
 <h2 className="text-xl font-semibold mb-4 text-foreground">
 {editingId ? 'Edit Asset' : 'Upload New Asset'}
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Asset Name</label>
 <input
 type="text"
 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
 value={formData.asset_name}
 onChange={(e) => setFormData({ ...formData, asset_name: e.target.value})}
 placeholder="e.g. Primary Logo (Dark Mode)"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Asset Type</label>
 <select
 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-card"
 value={formData.asset_type}
 onChange={(e) => setFormData({ ...formData, asset_type: e.target.value})}
 >
 <option value="Logo">Logo / Image</option>
 <option value="Font">Typography / Font</option>
 <option value="Guidelines">Brand Guidelines</option>
 <option value="Other">Other</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">File URL</label>
 <div className="relative">
 <Link className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
 <input
 type="url"
 className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
 value={formData.file_url}
 onChange={(e) => setFormData({ ...formData, file_url: e.target.value})}
 placeholder="https://..."
 />
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">Uploaded By</label>
 <input
 type="text"
 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
 value={formData.uploaded_by}
 onChange={(e) => setFormData({ ...formData, uploaded_by: e.target.value})}
 />
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <button
 onClick={() => {
 setIsEditing(false);
 setEditingId(null);
 setFormData({ asset_name: '', asset_type: 'Logo', file_url: '', uploaded_by: ''});
}}
 className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
 >
 <X className="w-4 h-4" /> Cancel
 </button>
 <button
 onClick={handleSave}
 className="flex items-center gap-2 bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
 >
 <Save className="w-4 h-4" /> Save
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {loading ? (
 <div className="flex justify-center py-12">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
 {data.map((item) => (
 <motion.div
 key={item.id}
 initial={{ opacity: 0, scale: 0.95}}
 animate={{ opacity: 1, scale: 1}}
 className="bg-card rounded-xl border border-border overflow-hidden transition-all group"
 >
 <div className="h-32 bg-background border-b border-border flex items-center justify-center relative">
 {getAssetIcon(item.asset_type)}
 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded-lg p-1 ">
 <button onClick={() => handleEdit(item)} className="p-1.5 text-muted-foreground hover:text-pink-600 rounded-md hover:bg-pink-50 transition-colors">
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 <div className="p-4">
 <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">{item.asset_type}</span>
 <h3 className="font-semibold text-foreground line-clamp-1 mb-2" title={item.asset_name}>{item.asset_name || 'Unnamed Asset'}</h3>
 <div className="flex justify-between items-center mt-3">
 <span className="text-xs text-muted-foreground truncate pr-2">By {item.uploaded_by || 'Unknown'}</span>
 {item.file_url && (
 <a href={item.file_url} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-800 text-xs font-medium flex items-center gap-1">
 <Link className="w-3 h-3" /> View
 </a>
 )}
 </div>
 </div>
 </motion.div>
 ))}
 {data.length === 0 && !isEditing && (
 <div className="col-span-full py-16 text-center bg-card rounded-xl border border-dashed border-primary/50">
 <UploadCloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
 <p className="text-muted-foreground text-lg">No brand assets uploaded.</p>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
