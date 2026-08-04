import React, { useState, useMemo } from 'react';
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
    <div className="space-y-8 font-dmsans p-4 md:p-8 bg-[#F0F4FF] dark:bg-blue-900/20 min-h-screen text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#1E3A8A] tracking-tight uppercase tracking-[-0.02em]">{t("fee_management", "Fee Management")}</h1>
          <p className="text-blue-800 font-medium text-lg mt-1">{t("track_student_tuition", "Track student tuition, structures, and payments")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab('ledger')} variant={activeTab === 'ledger' ? 'default' : 'outline'} className="rounded-none font-bold">Ledger</Button>
          <Button onClick={() => setActiveTab('structures')} variant={activeTab === 'structures' ? 'default' : 'outline'} className="rounded-none font-bold">Structures</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center font-bold text-xl animate-pulse">Loading data...</div>
      ) : activeTab === 'ledger' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-2 border-emerald-500 p-6 shadow-sm">
              <h3 className="font-semibold text-emerald-700 text-lg uppercase mb-2">Total Collected</h3>
              <p className="text-4xl font-black text-emerald-900">${totalCollected.toLocaleString()}</p>
            </div>
            <div className="bg-white border-2 border-red-500 p-6 shadow-sm">
              <h3 className="font-semibold text-red-700 text-lg uppercase mb-2">Total Outstanding</h3>
              <p className="text-4xl font-black text-red-900">${totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="bg-white border-2 border-blue-500 p-6 shadow-sm">
              <h3 className="font-semibold text-blue-700 text-lg uppercase mb-2">Fully Paid Students</h3>
              <p className="text-4xl font-black text-blue-900">{fullyPaidCount} <span className="text-xl text-blue-700">/ {filteredLedger.length}</span></p>
            </div>
          </div>

          <div className="bg-white border-2 border-[#1E3A8A] p-4 flex flex-wrap gap-4 items-center">
            <Input placeholder="Search students..." value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} className="w-full md:w-64 rounded-none border-[#1E3A8A]" />
            <select value={ledgerClass} onChange={e => setLedgerClass(e.target.value)} className="h-10 px-3 border border-[#1E3A8A] rounded-none">
              <option value="All">All Classes</option>
              {classRecords.map(c => <option key={c.id} value={c.data?.class_name || ''}>{c.data?.class_name}</option>)}
            </select>
            <select value={ledgerStatus} onChange={e => setLedgerStatus(e.target.value)} className="h-10 px-3 border border-[#1E3A8A] rounded-none">
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Owing">Owing</option>
            </select>
            <select value={ledgerTerm} onChange={e => setLedgerTerm(e.target.value)} className="h-10 px-3 border border-[#1E3A8A] rounded-none">
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
            <select value={ledgerAcademicYear} onChange={e => setLedgerAcademicYear(e.target.value)} className="h-10 px-3 border border-[#1E3A8A] rounded-none">
              <option value="2023/2024">2023/2024</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>

          <div className="bg-white border-2 border-[#1E3A8A] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1E3A8A] text-white">
                <tr>
                  <th className="px-4 py-3 font-bold">Student</th>
                  <th className="px-4 py-3 font-bold">Class</th>
                  <th className="px-4 py-3 font-bold">Amount Due</th>
                  <th className="px-4 py-3 font-bold">Paid</th>
                  <th className="px-4 py-3 font-bold">Balance</th>
                  <th className="px-4 py-3 font-bold text-center">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A8A]/20">
                {filteredLedger.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-500">No records found</td></tr>
                ) : filteredLedger.map(student => (
                  <tr key={student.student_id} className="hover:bg-blue-50">
                    <td className="px-4 py-3 font-bold">{student.student_name}</td>
                    <td className="px-4 py-3">{student.class_name}</td>
                    <td className="px-4 py-3">${student.amountDue}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">${student.amountPaid}</td>
                    <td className="px-4 py-3 text-red-600 font-bold">${student.balance}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                        student.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 
                        student.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>{student.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-none" onClick={() => setViewHistoryModal(student)}>History</Button>
                      <Button size="sm" className="rounded-none bg-[#1E3A8A] text-white" disabled={student.amountDue === 0 || student.status === 'Paid'} onClick={() => handleRecordPayment(student)}>Pay</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center bg-white p-4 border-2 border-[#1E3A8A]">
            <h2 className="text-xl font-bold text-[#1E3A8A]">Fee Structures</h2>
            <Button onClick={() => { setEditingStructure(null); setStructureForm({class_name: '', level: 'Primary', term: 'Term 1', academic_year: '2024/2025', amount: '', description: ''}); setStructureModalOpen(true); }} className="rounded-none bg-[#1E3A8A] text-white"><Plus className="w-4 h-4 mr-2" /> New Structure</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {feeStructures.length === 0 ? (
              <div className="col-span-full text-center p-8 text-gray-500">No fee structures found. Create one.</div>
            ) : feeStructures.map(s => (
              <div key={s.id} className="bg-white border-2 border-[#1E3A8A] p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-xl">{s.data?.class_name}</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-bold">{s.data?.term}</span>
                </div>
                <p className="text-3xl font-black text-[#1E3A8A] mb-2">${s.data?.amount}</p>
                <p className="text-sm text-gray-600 mb-4">{s.data?.academic_year} - {s.data?.level}</p>
                {s.data?.description && <p className="text-sm bg-gray-50 p-2 mb-4">{s.data?.description}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-none" onClick={() => { setEditingStructure(s); setStructureForm(s.data); setStructureModalOpen(true); }}>Edit</Button>
                  <Button variant="destructive" className="flex-1 rounded-none" onClick={() => handleDeleteStructure(s.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      {paymentModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 max-w-md w-full border-4 border-[#1E3A8A]">
            <h2 className="text-2xl font-black mb-4">Record Payment</h2>
            <div className="mb-4 bg-gray-50 p-3">
              <p className="font-bold">{selectedStudent.student_name} - {selectedStudent.class_name}</p>
              <p className="text-red-600 font-bold">Balance Due: ${selectedStudent.balance}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Amount Paying</label>
                <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={selectedStudent.balance} className="rounded-none border-[#1E3A8A]" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full h-10 px-3 border border-[#1E3A8A] rounded-none">
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Date</label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="rounded-none border-[#1E3A8A]" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Notes</label>
                <Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="rounded-none border-[#1E3A8A]" />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)} className="flex-1 rounded-none">Cancel</Button>
              <Button onClick={submitPayment} className="flex-1 bg-[#1E3A8A] text-white rounded-none">Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {viewHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 max-w-2xl w-full border-4 border-[#1E3A8A] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black">Payment History</h2>
              <Button variant="ghost" onClick={() => setViewHistoryModal(null)}>Close</Button>
            </div>
            <p className="font-bold mb-4">{viewHistoryModal.student_name} - {viewHistoryModal.class_name}</p>
            
            {viewHistoryModal.payments.length === 0 ? (
              <p className="text-gray-500">No payments recorded.</p>
            ) : (
              <div className="space-y-3">
                {viewHistoryModal.payments.map(p => (
                  <div key={p.id} className="border border-gray-200 p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold">${p.data?.amount_paid} <span className="text-sm font-normal text-gray-500">via {p.data?.payment_method}</span></p>
                      <p className="text-xs text-gray-500">{p.data?.payment_date} | {p.data?.receipt_number}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1">Bal: ${p.data?.balance}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {structureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-6 max-w-md w-full border-4 border-[#1E3A8A]">
            <h2 className="text-xl font-black mb-4">{editingStructure ? 'Edit' : 'New'} Structure</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Class</label>
                <select value={structureForm.class_name} onChange={e => setStructureForm({...structureForm, class_name: e.target.value})} className="w-full h-10 px-3 border border-[#1E3A8A] rounded-none">
                  <option value="">Select Class</option>
                  {classRecords.map(c => <option key={c.id} value={c.data?.class_name || ''}>{c.data?.class_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">Term</label>
                  <select value={structureForm.term} onChange={e => setStructureForm({...structureForm, term: e.target.value})} className="w-full h-10 px-3 border border-[#1E3A8A] rounded-none">
                    <option>Term 1</option>
                    <option>Term 2</option>
                    <option>Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">Year</label>
                  <select value={structureForm.academic_year} onChange={e => setStructureForm({...structureForm, academic_year: e.target.value})} className="w-full h-10 px-3 border border-[#1E3A8A] rounded-none">
                    <option>2023/2024</option>
                    <option>2024/2025</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Total Amount ($)</label>
                <Input type="number" value={structureForm.amount} onChange={e => setStructureForm({...structureForm, amount: e.target.value})} className="rounded-none border-[#1E3A8A]" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Description (Optional)</label>
                <Input value={structureForm.description} onChange={e => setStructureForm({...structureForm, description: e.target.value})} className="rounded-none border-[#1E3A8A]" />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStructureModalOpen(false)} className="flex-1 rounded-none">Cancel</Button>
              <Button onClick={handleSaveStructure} className="flex-1 bg-[#1E3A8A] text-white rounded-none">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
