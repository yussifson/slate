import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, FileText, Plus, Upload, CheckCircle2, Clock, MoreHorizontal, FileSignature } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivLegalDocument() {
  const companyId = useCompanyId();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchDocuments();
      const channel = supabase.channel('legal_docs_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_legal_documents', filter: `company_id=eq.${companyId}` }, () => {
          fetchDocuments();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_legal_documents')
        .select('*').eq('company_id', companyId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setDocuments(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const newDoc = {
      company_id: companyId,
      document_title: 'New Legal Document',
      document_type: 'Contract',
      status: 'Draft'
    };
    try {
      const { error } = await supabase.from('univ_legal_documents').insert(newDoc);
      if (error) throw error;
      toast.success('Document added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add document');
    }
  };

  const filtered = documents.filter(d => 
    `${d.document_title} ${d.document_type} ${d.status}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Legal Documents</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage contracts, pleadings, affidavits, and case evidence.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleUpload} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                className="bg-background border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-sm group flex flex-col h-full cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FileSignature className="w-5 h-5" />
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                
                <h3 className="font-bold text-foreground text-lg mb-1 line-clamp-1" title={d.document_title}>{d.document_title}</h3>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{d.document_type}</p>

                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                  <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border flex items-center gap-1 w-fit ${
                    d.status === 'Filed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    d.status === 'Final' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    d.status === 'Under Review' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {d.status === 'Filed' && <CheckCircle2 className="w-3 h-3" />}
                    {d.status === 'Under Review' && <Clock className="w-3 h-3" />}
                    {d.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
               <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No legal documents found.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
