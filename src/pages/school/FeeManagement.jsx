import React, { useState, useMemo } from 'react';
import './SchoolTheme.css';
import { useTranslation } from "react-i18next";
import { Receipt, Search, DollarSign, AlertCircle, CheckCircle, Plus, FileText, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeeManagement() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'structures'
  
  const { data: studentRecords = [], isLoading: loadingStudents } = useIndustryRecords('school_student');
  const { data: feeRecords = [], isLoading: loadingFees } = useIndustryRecords('school_fee');
  const { data: feeStructures = [], isLoading: loadingStructures } = useIndustryRecords('school_fee_structure');
  const { data: classRecords = [], isLoading: loadingClasses } = useIndustryRecords('school_class');
  
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();
  
  // Ledger state
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerClass, setLedgerClass] = useState('All');
  const [ledgerTerm, setLedgerTerm] = useState('Term 1');
  const [ledgerStatus, setLedgerStatus] = useState('All'); // All, Paid, Partial, Owing
  const [ledgerAcademicYear, setLedgerAcademicYear] = useState('2024/2025');
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  
  const [viewHistoryModal, setViewHistoryModal] = useState(null);
  
  // Structure state
  const [structureModalOpen, setStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureForm, setStructureForm] = useState({
    class_name: '', level: 'Primary', term: 'Term 1', academic_year: '2024/2025', amount: '', description: ''
  });

  // Calculate Ledger Data
  const ledgerData = useMemo(() => {
    return studentRecords.map(s => {
      const studentData = s.data || {};
      const studentClass = studentData.class_name || '';
      
      // Find fee structure for this student's class, term, year
      const structure = feeStructures.find(fs => 
        fs.data?.class_name === studentClass && 
        fs.data?.term === ledgerTerm && 
        fs.data?.academic_year === ledgerAcademicYear
      );
      
      const amountDue = structure ? Number(structure.data?.amount || 0) : 0;
      
      // Find all payments for this student, term, year
      const payments = feeRecords.filter(f => 
        f.data?.student_id === s.id && 
        f.data?.term === ledgerTerm && 
        f.data?.academic_year === ledgerAcademicYear
      );
      
      const amountPaid = payments.reduce((sum, p) => sum + Number(p.data?.amount_paid || 0), 0);
      const balance = amountDue - amountPaid;
      
      let status = 'Owing';
      if (amountDue > 0) {
        if (amountPaid >= amountDue) status = 'Paid';
        else if (amountPaid > 0) status = 'Partial';
      } else {
         status = 'N/A'; // No fee structure
      }

      return {
        student_id: s.id,
        student_name: studentData.first_name ? `${studentData.first_name} ${studentData.last_name || ''}` : (studentData.name || 'Unknown Student'),
        class_name: studentClass,
        amountDue,
        amountPaid,
        balance,
        status,
        payments
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

    const payload = {
      student_id: selectedStudent.student_id,
      student_name: selectedStudent.student_name,
      class_name: selectedStudent.class_name,
      term: ledgerTerm,
      academic_year: ledgerAcademicYear,
      amount_due: selectedStudent.amountDue,
      amount_paid: amount,
      balance: newBalance,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      receipt_number: 'REC-' + Date.now().toString(36).toUpperCase(),
      status: newStatus,
      notes: paymentNotes
    };

    mutateRecord.mutate({
      recordType: 'school_fee',
      payload,
      status: 'active',
      searchText: `${selectedStudent.student_name} ${ledgerTerm} ${ledgerAcademicYear}`
    }, {
      onSuccess: () => {
        toast.success(`Payment of $${amount} recorded for ${selectedStudent.student_name}`);
        setPaymentModalOpen(false);
      }
    });
  };

  const handleSaveStructure = () => {
    if (!structureForm.class_name || !structureForm.amount) return toast.error("Class and Amount required");
    
    mutateRecord.mutate({
      id: editingStructure?.id,
      recordType: 'school_fee_structure',
      payload: { ...structureForm, amount: Number(structureForm.amount) },
      status: 'active',
      searchText: `${structureForm.class_name} ${structureForm.term} ${structureForm.academic_year}`
    }, {
      onSuccess: () => {
        toast.success("Fee structure saved");
        setStructureModalOpen(false);
      }
    });
  };

  const handleDeleteStructure = (id) => {
    if (window.confirm("Delete this fee structure?")) {
      deleteRecord.mutate({ id, recordType: 'school_fee_structure' }, {
        onSuccess: () => toast.success("Deleted")
      });
    }
  };

  const isLoading = loadingStudents || loadingFees || loadingStructures || loadingClasses;

  return (
    <div className="school-theme-root space-y-8 font-outfit p-4 md:p-8 bg-[#FCFAF7] dark:bg-zinc-950 min-h-screen text-[#1F1E1C] dark:text-zinc-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1F1E1C] dark:text-zinc-50">{t("fee_management", "Fee Management")}</h1>
          <p className="text-zinc-500 font-medium text-lg mt-1">{t("track_student_tuition", "Track student tuition, structures, and payments")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab('ledger')} variant={activeTab === 'ledger' ? 'default' : 'outline'} className="rounded-full font-bold transition-all">Ledger</Button>
          <Button onClick={() => setActiveTab('structures')} variant={activeTab === 'structures' ? 'default' : 'outline'} className="rounded-full font-bold transition-all">Structures</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center font-bold text-xl animate-pulse">Loading data...</div>
      ) : activeTab === 'ledger' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-emerald-600 text-lg uppercase mb-2">Total Collected</h3>
              <p className="text-4xl font-bold text-emerald-900 dark:text-emerald-400">${totalCollected.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-rose-600 text-lg uppercase mb-2">Total Outstanding</h3>
              <p className="text-4xl font-bold text-rose-900 dark:text-rose-400">${totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
              <h3 className="font-semibold text-indigo-600 text-lg uppercase mb-2">Fully Paid Students</h3>
              <p className="text-4xl font-bold text-indigo-900 dark:text-indigo-400">{fullyPaidCount} <span className="text-xl text-indigo-700 dark:text-indigo-500">/ {filteredLedger.length}</span></p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] p-6 flex flex-wrap gap-4 items-center">
            <Input placeholder="Search students..." value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} className="w-full md:w-64 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
            <select value={ledgerClass} onChange={e => setLedgerClass(e.target.value)} className="h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
              <option value="All">All Classes</option>
              {classRecords.map(c => <option key={c.id} value={c.data?.class_name || ''}>{c.data?.class_name}</option>)}
            </select>
            <select value={ledgerStatus} onChange={e => setLedgerStatus(e.target.value)} className="h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Owing">Owing</option>
            </select>
            <select value={ledgerTerm} onChange={e => setLedgerTerm(e.target.value)} className="h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            <select value={ledgerAcademicYear} onChange={e => setLedgerAcademicYear(e.target.value)} className="h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
              <option value="2023/2024">2023/2024</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#FAF8F5] dark:bg-zinc-800/50 text-[#1F1E1C] dark:text-zinc-50 border-b border-[#F0EBE1] dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Class</th>
                  <th className="px-6 py-4 font-semibold">Amount Due</th>
                  <th className="px-6 py-4 font-semibold">Paid</th>
                  <th className="px-6 py-4 font-semibold">Balance</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1] dark:divide-zinc-800">
                {filteredLedger.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-zinc-500">No records found</td></tr>
                ) : filteredLedger.map(student => (
                  <tr key={student.student_id} className="hover:bg-[#FAF8F5] dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{student.student_name}</td>
                    <td className="px-6 py-4">{student.class_name}</td>
                    <td className="px-6 py-4">${student.amountDue}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium">${student.amountPaid}</td>
                    <td className="px-6 py-4 text-rose-600 font-medium">${student.balance}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                        student.status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>{student.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-full bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 border-[#E4DFD5] dark:border-zinc-700" onClick={() => setViewHistoryModal(student)}>History</Button>
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white shadow-md transition-all hover:scale-[1.02]" disabled={student.amountDue === 0 || student.status === 'Paid'} onClick={() => handleRecordPayment(student)}>Pay</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)]">
            <h2 className="text-xl font-bold">Fee Structures</h2>
            <Button onClick={() => { setEditingStructure(null); setStructureForm({class_name: '', level: 'Primary', term: 'Term 1', academic_year: '2024/2025', amount: '', description: ''}); setStructureModalOpen(true); }} className="rounded-full bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white font-semibold transition-all hover:scale-[1.02] shadow-[0_4px_12px_rgba(99,102,241,0.15)]"><Plus className="w-4 h-4 mr-2" /> New Structure</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {feeStructures.length === 0 ? (
              <div className="col-span-full text-center p-8 text-zinc-500">No fee structures found. Create one.</div>
            ) : feeStructures.map(s => (
              <div key={s.id} className="bg-white dark:bg-zinc-900 border border-[#F0EBE1] dark:border-zinc-800 p-6 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl">{s.data?.class_name}</h3>
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold rounded-full">{s.data?.term}</span>
                </div>
                <p className="text-3xl font-bold mb-2">${s.data?.amount}</p>
                <p className="text-sm text-zinc-500 mb-4">{s.data?.academic_year} - {s.data?.level}</p>
                {s.data?.description && <p className="text-sm bg-[#FAF8F5] dark:bg-zinc-800/50 rounded-xl p-3 mb-4 border border-[#F0EBE1] dark:border-zinc-700">{s.data?.description}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-[#FAF8F5] dark:hover:bg-zinc-700 border-[#E4DFD5] dark:border-zinc-700" onClick={() => { setEditingStructure(s); setStructureForm(s.data); setStructureModalOpen(true); }}>Edit</Button>
                  <Button variant="destructive" className="flex-1 rounded-full" onClick={() => handleDeleteStructure(s.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {paymentModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 p-8 max-w-md w-full border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Record Payment</h2>
            <div className="mb-6 bg-[#FAF8F5] dark:bg-zinc-800/50 p-4 rounded-xl border border-[#F0EBE1] dark:border-zinc-700">
              <p className="font-semibold">{selectedStudent.student_name} - {selectedStudent.class_name}</p>
              <p className="text-rose-600 font-bold mt-1">Balance Due: ${selectedStudent.balance}</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Amount Paying</label>
                <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={selectedStudent.balance} className="rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Date</label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Notes</label>
                <Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)} className="flex-1 rounded-full border-[#E4DFD5] dark:border-zinc-700">Cancel</Button>
              <Button onClick={submitPayment} className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white shadow-md transition-all hover:scale-[1.02]">Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {viewHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 p-8 max-w-2xl w-full border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Payment History</h2>
              <Button variant="ghost" onClick={() => setViewHistoryModal(null)} className="rounded-full">Close</Button>
            </div>
            <p className="font-semibold mb-6 text-lg">{viewHistoryModal.student_name} - {viewHistoryModal.class_name}</p>
            
            {viewHistoryModal.payments.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No payments recorded.</p>
            ) : (
              <div className="space-y-4">
                {viewHistoryModal.payments.map(p => (
                  <div key={p.id} className="border border-[#F0EBE1] dark:border-zinc-700 rounded-xl p-4 flex justify-between items-center bg-[#FAF8F5] dark:bg-zinc-800/50">
                    <div>
                      <p className="font-bold text-lg">${p.data?.amount_paid} <span className="text-sm font-medium text-zinc-500">via {p.data?.payment_method}</span></p>
                      <p className="text-sm text-zinc-500 mt-1">{p.data?.payment_date} | {p.data?.receipt_number}</p>
                    </div>
                    <span className="text-sm font-semibold bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-[#E4DFD5] dark:border-zinc-700">Bal: ${p.data?.balance}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {structureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 p-8 max-w-md w-full border border-[#F0EBE1] dark:border-zinc-800 rounded-[2rem] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{editingStructure ? 'Edit' : 'New'} Structure</h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Class</label>
                <select value={structureForm.class_name} onChange={e => setStructureForm({...structureForm, class_name: e.target.value})} className="w-full h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                  <option value="">Select Class</option>
                  {classRecords.map(c => <option key={c.id} value={c.data?.class_name || ''}>{c.data?.class_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Term</label>
                  <select value={structureForm.term} onChange={e => setStructureForm({...structureForm, term: e.target.value})} className="w-full h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Year</label>
                  <select value={structureForm.academic_year} onChange={e => setStructureForm({...structureForm, academic_year: e.target.value})} className="w-full h-10 px-3 rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600">
                    <option>2023/2024</option>
                    <option>2024/2025</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Total Amount ($)</label>
                <Input type="number" value={structureForm.amount} onChange={e => setStructureForm({...structureForm, amount: e.target.value})} className="rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Description (Optional)</label>
                <Input value={structureForm.description} onChange={e => setStructureForm({...structureForm, description: e.target.value})} className="rounded-xl border-1.5 border-[#E4DFD5] dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" onClick={() => setStructureModalOpen(false)} className="flex-1 rounded-full border-[#E4DFD5] dark:border-zinc-700">Cancel</Button>
              <Button onClick={handleSaveStructure} className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-orange-500 hover:opacity-90 text-white shadow-md transition-all hover:scale-[1.02]">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
