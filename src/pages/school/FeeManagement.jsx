import React, { useState, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Receipt, Search, DollarSign, AlertCircle, CheckCircle, Plus, FileText, CreditCard, MoreHorizontal, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { motion } from 'framer-motion';
import SchoolPageShell from '@/components/school/SchoolPageShell';

const statusConfig = {
  Paid: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20', dot: 'bg-emerald-500', icon: CheckCircle },
  Partial: { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20', dot: 'bg-amber-500', icon: Clock },
  Owing: { cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20', dot: 'bg-rose-500', icon: AlertCircle },
};

export default function FeeManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ledger');
  
  const { data: studentRecords = [], isLoading: loadingStudents } = useIndustryRecords('school_student');
  const { data: feeRecords = [], isLoading: loadingFees } = useIndustryRecords('school_fee');
  const { data: feeStructures = [], isLoading: loadingStructures } = useIndustryRecords('school_fee_structure');
  const { data: classRecords = [], isLoading: loadingClasses } = useIndustryRecords('school_class');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerClass, setLedgerClass] = useState('All');
  const [ledgerTerm, setLedgerTerm] = useState('Term 1');
  const [ledgerStatus, setLedgerStatus] = useState('All');
  const [ledgerAcademicYear, setLedgerAcademicYear] = useState('2024/2025');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [viewHistoryModal, setViewHistoryModal] = useState(null);
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureForm, setStructureForm] = useState({ class_name: '', level: 'Primary', term: 'Term 1', academic_year: '2024/2025', amount: '', description: '' });

  const classList = useMemo(() => classRecords.map(c => c.data?.name).filter(Boolean), [classRecords]);

  const ledgerData = useMemo(() => {
    return studentRecords.map(s => {
      const studentData = s.data || {};
      const studentClass = studentData.class_name || '';
      const structure = feeStructures.find(fs => fs.data?.class_name === studentClass && fs.data?.term === ledgerTerm && fs.data?.academic_year === ledgerAcademicYear);
      const amountDue = structure ? Number(structure.data?.amount || 0) : 0;
      const payments = feeRecords.filter(f => f.data?.student_id === s.id && f.data?.term === ledgerTerm && f.data?.academic_year === ledgerAcademicYear);
      const amountPaid = payments.reduce((sum, p) => sum + Number(p.data?.amount_paid || 0), 0);
      const balance = amountDue - amountPaid;
      let status = 'Owing';
      if (amountDue > 0) {
        if (amountPaid >= amountDue) status = 'Paid';
        else if (amountPaid > 0) status = 'Partial';
      } else { status = 'N/A'; }
      return {
        student_id: s.id,
        student_name: studentData.first_name ? `${studentData.first_name} ${studentData.last_name || ''}` : (studentData.name || 'Unknown Student'),
        class_name: studentClass, amountDue, amountPaid, balance, status, payments
      };
    });
  }, [studentRecords, feeStructures, feeRecords, ledgerTerm, ledgerAcademicYear]);

  const filteredLedger = ledgerData.filter(d => {
    if (d.status === 'N/A') return false;
    if (ledgerClass !== 'All' && d.class_name !== ledgerClass) return false;
    if (ledgerStatus !== 'All' && d.status !== ledgerStatus) return false;
    if (ledgerSearch && !d.student_name.toLowerCase().includes(ledgerSearch.toLowerCase())) return false;
    return true;
  });

  const totalCollected = filteredLedger.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalOutstanding = filteredLedger.reduce((sum, d) => sum + d.balance, 0);
  const fullyPaidCount = filteredLedger.filter(d => d.status === 'Paid').length;

  const handleRecordPayment = (student) => {
    setSelectedStudent(student);
    setPaymentAmount(student.balance || '');
    setPaymentMethod('Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const submitPayment = () => {
    if (!selectedStudent || !paymentAmount) return toast.error("Enter amount");
    const amount = Number(paymentAmount);
    if (amount <= 0) return toast.error("Amount must be greater than 0");
    const newPaid = selectedStudent.amountPaid + amount;
    const newBalance = selectedStudent.amountDue - newPaid;
    let newStatus = 'Owing';
    if (newPaid >= selectedStudent.amountDue) newStatus = 'Paid';
    else if (newPaid > 0) newStatus = 'Partial';
    const payload = { student_id: selectedStudent.student_id, student_name: selectedStudent.student_name, class_name: selectedStudent.class_name, term: ledgerTerm, academic_year: ledgerAcademicYear, amount_due: selectedStudent.amountDue, amount_paid: amount, balance: newBalance, payment_method: paymentMethod, payment_date: paymentDate, receipt_number: 'REC-' + Date.now().toString(36).toUpperCase(), status: newStatus, notes: paymentNotes };
    mutateRecord.mutate({ recordType: 'school_fee', payload, status: 'active', searchText: `${selectedStudent.student_name} ${ledgerTerm} ${ledgerAcademicYear}` }, { onSuccess: () => { toast.success(`Payment of GHS ${amount} recorded!`); setPaymentModalOpen(false); } });
  };

  const handleSaveStructure = () => {
    if (!structureForm.class_name || !structureForm.amount) return toast.error("Class and Amount required");
    mutateRecord.mutate({ id: editingStructure?.id, recordType: 'school_fee_structure', payload: { ...structureForm, amount: Number(structureForm.amount) }, status: 'active', searchText: `${structureForm.class_name} ${structureForm.term} ${structureForm.academic_year}` }, { onSuccess: () => { toast.success("Fee structure saved"); setStructureModalOpen(false); } });
  };

  const handleDeleteStructure = (id) => {
    if (window.confirm("Delete this fee structure?")) deleteRecord.mutate({ id, recordType: 'school_fee_structure' }, { onSuccess: () => toast.success("Deleted") });
  };

  const isLoading = loadingStudents || loadingFees || loadingStructures || loadingClasses;
  const inputCls = "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <SchoolPageShell
      title="Fee Management"
      subtitle="Track student tuition, structures, and payments"
      breadcrumb={['School', 'Fees']}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-muted/50 p-1">
            {['ledger', 'structures'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{tab === 'ledger' ? 'Ledger' : 'Fee Structures'}</button>
            ))}
          </div>
          {activeTab === 'structures' && (
            <Button onClick={() => { setEditingStructure(null); setStructureForm({ class_name: '', level: 'Primary', term: 'Term 1', academic_year: '2024/2025', amount: '', description: '' }); setStructureModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm h-10 px-5 text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" /> Add Structure
            </Button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading fee data...</div>
      ) : activeTab === 'ledger' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {[
              { label: 'Total Collected', value: `GHS ${totalCollected.toLocaleString()}`, icon: CheckCircle, theme: 'green' },
              { label: 'Outstanding Balance', value: `GHS ${totalOutstanding.toLocaleString()}`, icon: AlertCircle, theme: 'rose' },
              { label: 'Fully Paid Accounts', value: `${fullyPaidCount} students`, icon: CreditCard, theme: 'blue' },
            ].map(({ label, value, icon: Icon, theme }) => {
              const styles = {
                green: {
                  card: 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20',
                  iconBg: 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/30',
                  iconColor: 'text-emerald-600 dark:text-emerald-400'
                },
                rose: {
                  card: 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-100/60 dark:border-rose-900/20',
                  iconBg: 'bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100/30',
                  iconColor: 'text-rose-600 dark:text-rose-400'
                },
                blue: {
                  card: 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-100/60 dark:border-blue-900/20',
                  iconBg: 'bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/30',
                  iconColor: 'text-blue-600 dark:text-blue-400'
                }
              };
              const themeStyle = styles[theme] || styles.blue;
              return (
                <div 
                  key={label}
                  className={`border rounded-[2.2rem] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] hover:-translate-y-1 hover:shadow-[0_32px_64px_rgba(0,0,0,0.04)] transition-all duration-300 flex items-center gap-5 relative overflow-hidden group ${themeStyle.card}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50/50 dark:from-zinc-800/10 to-transparent rounded-full pointer-events-none" />
                  <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${themeStyle.iconBg}`}>
                    <Icon className={`w-5 h-5 ${themeStyle.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight leading-none">{value}</p>
                    <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-2">{label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-100 dark:border-zinc-800/80 rounded-[1.75rem] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-3 mb-6">
            <select value={ledgerTerm} onChange={e => setLedgerTerm(e.target.value)} className="h-10 rounded-xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 px-3 text-sm text-slate-700 dark:text-zinc-200 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/80">
              <option className="dark:bg-zinc-900">Term 1</option><option className="dark:bg-zinc-900">Term 2</option><option className="dark:bg-zinc-900">Term 3</option>
            </select>
            <select value={ledgerAcademicYear} onChange={e => setLedgerAcademicYear(e.target.value)} className="h-10 rounded-xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 px-3 text-sm text-slate-700 dark:text-zinc-200 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/80">
              <option className="dark:bg-zinc-900">2024/2025</option><option className="dark:bg-zinc-900">2023/2024</option><option className="dark:bg-zinc-900">2025/2026</option>
            </select>
            <select value={ledgerClass} onChange={e => setLedgerClass(e.target.value)} className="h-10 rounded-xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 px-3 text-sm text-slate-700 dark:text-zinc-200 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/80">
              <option value="All" className="dark:bg-zinc-900">All Classes</option>{classList.map(c => <option key={c} value={c} className="dark:bg-zinc-900">{c}</option>)}
            </select>
            <select value={ledgerStatus} onChange={e => setLedgerStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 px-3 text-sm text-slate-700 dark:text-zinc-200 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/80">
              <option value="All" className="dark:bg-zinc-900">All Statuses</option><option className="dark:bg-zinc-900">Paid</option><option className="dark:bg-zinc-900">Partial</option><option className="dark:bg-zinc-900">Owing</option>
            </select>
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search student..." value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)}
                className="pl-10 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border-slate-200/50 dark:border-zinc-700/50 text-sm h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#0066fe] transition-all" />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {['Student', 'Class', 'Amount Due', 'Amount Paid', 'Balance', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredLedger.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">No fee records found for this term/filter.</td></tr>
                  ) : filteredLedger.map(d => {
                    const cfg = statusConfig[d.status] || statusConfig.Owing;
                    const StatusIcon = cfg.icon;
                    const paidPct = d.amountDue > 0 ? Math.min(100, Math.round((d.amountPaid / d.amountDue) * 100)) : 0;
                    return (
                      <tr key={d.student_id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-semibold text-foreground">{d.student_name}</td>
                        <td className="px-5 py-4 text-muted-foreground">{d.class_name}</td>
                        <td className="px-5 py-4 font-medium text-foreground">GHS {d.amountDue.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-emerald-600">GHS {d.amountPaid.toLocaleString()}</span>
                          <div className="w-20 bg-muted rounded-full h-1 mt-1.5">
                            <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
                          </div>
                        </td>
                        <td className={`px-5 py-4 font-bold ${d.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>GHS {d.balance.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{d.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {d.status !== 'Paid' && (
                              <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3" onClick={() => handleRecordPayment(d)}>
                                <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay
                              </Button>
                            )}
                            {d.payments.length > 0 && (
                              <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors" onClick={() => setViewHistoryModal(d)}>
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // Fee Structures Tab
        <>
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {['Class', 'Level', 'Term', 'Academic Year', 'Amount', 'Description', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {feeStructures.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">No fee structures yet. Click "Add Structure" to create one.</td></tr>
                  ) : feeStructures.map(fs => (
                    <tr key={fs.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">{fs.data?.class_name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{fs.data?.level}</td>
                      <td className="px-5 py-4 text-muted-foreground">{fs.data?.term}</td>
                      <td className="px-5 py-4 text-muted-foreground">{fs.data?.academic_year}</td>
                      <td className="px-5 py-4 font-bold text-foreground">GHS {Number(fs.data?.amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-muted-foreground truncate max-w-[150px]">{fs.data?.description}</td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onClick={() => { setEditingStructure(fs); setStructureForm({ class_name: fs.data?.class_name || '', level: fs.data?.level || 'Primary', term: fs.data?.term || 'Term 1', academic_year: fs.data?.academic_year || '2024/2025', amount: fs.data?.amount || '', description: fs.data?.description || '' }); setStructureModalOpen(true); }}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteStructure(fs.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5">
              <h2 className="text-lg font-bold text-white">Record Payment</h2>
              <p className="text-emerald-100 text-sm">{selectedStudent.student_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded-xl border border-border/50">
                <div><p className="text-muted-foreground text-xs">Amount Due</p><p className="font-bold text-foreground">GHS {selectedStudent.amountDue.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground text-xs">Balance</p><p className="font-bold text-rose-600">GHS {selectedStudent.balance.toLocaleString()}</p></div>
              </div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount Paid</label><Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="mt-1.5 h-10" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={`mt-1.5 ${inputCls}`}><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Cheque</option></select>
              </div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Date</label><Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="mt-1.5 h-10" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</label><Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="mt-1.5 h-10" placeholder="Optional notes..." /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submitPayment} disabled={mutateRecord.isPending}>{mutateRecord.isPending ? 'Saving...' : 'Record Payment'}</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Fee Structure Modal */}
      {structureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
              <h2 className="text-lg font-bold text-white">{editingStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class *</label>
                  <select value={structureForm.class_name} onChange={e => setStructureForm({...structureForm, class_name: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                    <option value="">Select Class...</option>{classList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Level</label>
                  <select value={structureForm.level} onChange={e => setStructureForm({...structureForm, level: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                    <option>Nursery</option><option>Kindergarten</option><option>Primary</option><option>JHS</option><option>SHS</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Term</label>
                  <select value={structureForm.term} onChange={e => setStructureForm({...structureForm, term: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                    <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Academic Year</label>
                  <select value={structureForm.academic_year} onChange={e => setStructureForm({...structureForm, academic_year: e.target.value})} className={`mt-1.5 ${inputCls}`}>
                    <option>2024/2025</option><option>2023/2024</option><option>2025/2026</option>
                  </select>
                </div>
              </div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount (GHS) *</label><Input type="number" value={structureForm.amount} onChange={e => setStructureForm({...structureForm, amount: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. 1200" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label><Input value={structureForm.description} onChange={e => setStructureForm({...structureForm, description: e.target.value})} className="mt-1.5 h-10" placeholder="e.g. Tuition + Levies" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-10" onClick={() => setStructureModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveStructure} disabled={mutateRecord.isPending}>Save Structure</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment History Modal */}
      {viewHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground">{viewHistoryModal.student_name}</h2>
                <p className="text-sm text-muted-foreground">Payment History · {ledgerTerm} · {ledgerAcademicYear}</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setViewHistoryModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {viewHistoryModal.payments.map(p => (
                <div key={p.id} className="border border-border/50 p-4 rounded-xl bg-muted/20">
                  <div className="flex justify-between">
                    <span className="font-bold text-emerald-600">GHS {Number(p.data?.amount_paid || 0).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{p.data?.payment_date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.data?.payment_method} · {p.data?.receipt_number}</p>
                  {p.data?.notes && <p className="text-xs text-muted-foreground mt-1">{p.data?.notes}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </SchoolPageShell>
  );
}
