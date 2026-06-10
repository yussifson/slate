import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useCompanyId } from '@/hooks/useCompanyId';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, User, Building2, Phone, Mail, MoreHorizontal, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UnivContactManagement() {
  const companyId = useCompanyId();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (companyId) {
      fetchContacts();
      const channel = supabase.channel('contacts_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'univ_contacts', filter: `company_id=eq.${companyId}` }, () => {
          fetchContacts();
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [companyId]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('univ_contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('first_name', { ascending: true });
      if (error && error.code !== '42P01') throw error;
      setContacts(data || []);
    } catch (err) {
      // Mock data removed for production empty states
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    const newContact = {
      company_id: companyId,
      first_name: 'New',
      last_name: 'Contact',
      email: `contact${Math.floor(Math.random() * 1000)}@example.com`,
      type: 'Customer'
    };
    try {
      const { error } = await supabase.from('univ_contacts').insert(newContact);
      if (error) throw error;
      toast.success('Contact added');
    } catch (err) {
      if (err.code === '42P01') toast.error("Database table not initialized yet.");
      else toast.error('Failed to add contact');
    }
  };

  const filtered = contacts.filter(c => 
    `${c.first_name} ${c.last_name} ${c.email} ${c.organization}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-1">
        <div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight">Contacts</h2>
           <p className="text-sm text-muted-foreground mt-1">Manage people and organizations.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleAddContact} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        {[
          { label: 'Total Contacts', value: contacts.length, icon: User, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/10' },
          { label: 'Customers', value: contacts.filter(c => c.type === 'Customer').length, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-500/10' },
          { label: 'Partners & Vendors', value: contacts.filter(c => c.type !== 'Customer').length, icon: User, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-500/10' }
        ].map((k, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground font-medium">{k.label}</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{k.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${k.bg} ${k.color}`}><k.icon className="w-5 h-5" /></div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Organization</th>
                <th className="p-4 font-semibold">Contact Info</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  key={c.id} 
                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {c.first_name.charAt(0)}{c.last_name.charAt(0)}
                      </div>
                      <div className="font-semibold text-foreground">{c.first_name} {c.last_name}</div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {c.organization ? (
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {c.organization}</span>
                    ) : '—'}
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {c.email && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {c.email}</span>}
                        {c.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {c.phone}</span>}
                     </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md border ${
                      c.type === 'Customer' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                      c.type === 'Partner' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-muted-foreground">
                    <User className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
