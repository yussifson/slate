import { powerSync } from '@/api/PowerSyncConnector';
import React, { useState, useEffect } from 'react';
import { supabase } from "@/api/supabaseClient";
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Plus, Upload, CheckCircle2, Clock, MoreHorizontal, FileSignature, Edit2, Trash2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivLegalDocument() {
  const companyId = useCompanyId();
  const [view, setView] = useState('Default');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [form, setForm] = useState({
    document_title: '', document_type: 'Contract', status: 'Draft'
  });

  useEffect(() => {
    if (companyId) {
      fetchDocuments();
      const channel = supabase.channel('legal_docs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_legal_documents', filter: `company_id=eq.${companyId}` }, () => fetchDocuments())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const __res = await powerSync.execute(`SELECT * FROM univ_legal_documents WHERE company_id = ? ORDER BY created_at DESC`, [companyId]);
      setDocuments(__res.rows ? (__res.rows._array || Array.from(__res.rows)) : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (d = null) => {
    if (d) {
      setEditingDoc(d);
      setForm({ ...d });
    } else {
      setEditingDoc(null);
      setForm({ document_title: '', document_type: 'Contract', status: 'Draft' });
    }
    setIsModalOpen(true);
  };

  const saveDocument = async (e) => {
    e.preventDefault();
    try {
      if (editingDoc) {
        await powerSync.execute(`UPDATE univ_legal_documents SET document_title = ?, document_type = ?, status = ? WHERE id = ?`, 
          [form.document_title, form.document_type, form.status, editingDoc.id]);
        toast.success('Document updated');
      } else {
        const id = crypto.randomUUID();
        await powerSync.execute(`INSERT INTO univ_legal_documents (id, company_id, document_title, document_type, status) VALUES (?, ?, ?, ?, ?)`, 
          [id, companyId, form.document_title, form.document_type, form.status]);
        toast.success('Document added');
      }
      setIsModalOpen(false);
      fetchDocuments();
    } catch (err) {
      toast.error(err.message || 'Failed to save document');
    }
  };

  const deleteDocument = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    try {
      await powerSync.execute(`DELETE FROM univ_legal_documents WHERE id = ?`, [id]);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const filtered = documents.filter(d => 
    `${d.document_title} ${d.document_type} ${d.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-background overflow-hidden ${view !== 'Default' ? 'hide-default' : ''}`}>
      <div className="view-header flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight tracking-[-0.02em]">Legal Documents</h2>
          <p className="text-sm text-[#71717a] dark:text-gray-400 mt-1">Manage contracts, pleadings, affidavits, and case evidence.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b border-primary/40 flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a] dark:text-gray-400" />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={d.id} 
                onClick={() => openModal(d)}
                className="bg-card border-[0.5px] border-black/9 dark:border-white/8 rounded-2xl p-5 hover:border-primary/40 transition-colors group flex flex-col h-full cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileSignature className="w-5 h-5" />
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button onClick={(e) => deleteDocument(d.id, e)} className="text-[#71717a] hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-foreground text-lg mb-1 line-clamp-1" title={d.document_title}>{d.document_title}</h3>
                <p className="text-xs font-semibold text-[#71717a] dark:text-gray-400 uppercase tracking-wider mb-4">{d.document_type}</p>

                <div className="mt-auto pt-4 border-t border-border/40 flex justify-between items-center">
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-lg flex items-center gap-2 w-fit ${
                    d.status === 'Filed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : 
                    d.status === 'Final' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10' : 
                    d.status === 'Under Review' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10' : 
                    'bg-muted text-foreground'
                  }`}>
                    {d.status === 'Filed' && <CheckCircle2 className="w-3 h-3" />}
                    {d.status === 'Under Review' && <Clock className="w-3 h-3" />}
                    {d.status}
                  </span>
                  <span className="text-[10px] text-[#71717a] dark:text-gray-400">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-[#71717a] dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No legal documents found.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-card w-full max-w-sm rounded-2xl flex flex-col shadow-xl border-[0.5px] border-black/9 dark:border-white/8">
              <div className="p-5 border-b border-border/40 flex justify-between items-center">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">{editingDoc ? 'Edit Document' : 'Upload Document'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-muted rounded-full text-[#71717a] hover:text-foreground"><XCircle className="w-5 h-5"/></button>
              </div>
              <form onSubmit={saveDocument} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Title</label>
                  <input required value={form.document_title} onChange={e=>setForm({...form, document_title: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Type</label>
                  <select required value={form.document_type} onChange={e=>setForm({...form, document_type: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Contract</option>
                    <option>Pleading</option>
                    <option>Affidavit</option>
                    <option>Evidence</option>
                    <option>Discovery</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Status</label>
                  <select value={form.status} onChange={e=>setForm({...form, status: e.target.value})} className="mt-1 w-full h-10 px-3 bg-background border-[0.5px] border-black/9 dark:border-white/8 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option>Draft</option>
                    <option>Under Review</option>
                    <option>Final</option>
                    <option>Filed</option>
                  </select>
                </div>
                <div className="mt-4 pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90">Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
