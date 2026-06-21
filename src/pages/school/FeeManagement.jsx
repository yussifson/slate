import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Receipt, Search, CreditCard, DollarSign, AlertCircle, FileText, CheckCircle, Trash2, MoreVertical, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePayment } from '@/hooks/integrations/usePayment';
import { useNotifications } from '@/hooks/integrations/useNotifications';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useCompanyId } from "@/hooks/useCompanyId";
import { motion, AnimatePresence } from 'framer-motion';

export default function FeeManagement() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { processPayment, isProcessing } = usePayment();
  const { notifyTeam } = useNotifications();
  const queryClient = useQueryClient();
  
  const { data: dbRecords = [], isLoading: isDbLoading } = useQuery({ 
    queryKey: ["clients", companyId], 
    queryFn: () => base44.entities.Client.filter({ company_id: companyId, type: 'student' }), 
    enabled: !!companyId 
  });
  
  const mutateRecord = useMutation({
    mutationFn: (data) => data.id ? base44.entities.Client.update(data.id, data) : base44.entities.Client.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", companyId] })
  });

  const studentsFees = dbRecords.map(r => {
    let extra = {};
    try { extra = JSON.parse(r.notes || '{}'); } catch(e) {}
    
    const feeStatus = extra.feeStatus || 'Owing';
    const totalDue = feeStatus === 'Paid' ? 1200 : (feeStatus === 'Partial' ? 1200 : 1200);
    const paid = feeStatus === 'Paid' ? 1200 : (feeStatus === 'Partial' ? 400 : 0);
    return {
      id: r.id,
      student: r.name || 'Unknown Student',
      studentId: r.id_number || 'STU-000',
      class: extra.class || 'Grade 7B',
      totalDue,
      paid,
      balance: totalDue - paid,
      status: feeStatus,
      rawRecord: r
    };
  });

  const [search, setSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollName, setEnrollName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [viewDetails, setViewDetails] = useState(null);

  const filtered = studentsFees.filter(f =>
    f.student.toLowerCase().includes(search.toLowerCase()) ||
    f.studentId.includes(search)
  );

  const totalCollected = studentsFees.reduce((sum, f) => sum + f.paid, 0);
  const totalOutstanding = studentsFees.reduce((sum, f) => sum + f.balance, 0);
  const fullyPaidCount = studentsFees.filter(f => f.status === 'Paid').length;

  const handlePay = (student) => {
    setSelectedStudent(student);
    setPaymentAmount(student.balance);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedStudent || paymentAmount <= 0) return;
    try {
      const paymentResult = await processPayment({
        amount: paymentAmount,
        currency: 'USD',
        description: `Tuition payment for ${selectedStudent.student}`,
        customerName: selectedStudent.student
      });

      if (paymentResult.success) {
        const currentRaw = selectedStudent.rawRecord;
        const isFull = paymentAmount >= selectedStudent.balance;
        const nextStatus = isFull ? 'Paid' : 'Partial';

        let extra = {};
        try { extra = JSON.parse(currentRaw.notes || '{}'); } catch(e) {}
        extra.feeStatus = nextStatus;

        mutateRecord.mutate({
          id: currentRaw.id,
          notes: JSON.stringify(extra)
        }, {
          onSuccess: () => {
            toast.success(`Recorded payment of $${paymentAmount} for ${selectedStudent.student}`);
            if (paymentAmount >= 500) {
              notifyTeam({
                companyId,
                provider: 'slack',
                channel: 'general',
                message: `💰 *Major Fee Collection:* $${paymentAmount} received from ${selectedStudent.student}.`
              });
            }
            setShowPaymentModal(false);
            setSelectedStudent(null);
          },
          onError: (err) => {
            toast.error('Failed to log payment: ' + err.message);
          }
        });
      }
    } catch (err) {
      toast.error('Payment processing failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 font-dmsans p-4 md:p-8 bg-[#f4fdf8] min-h-screen text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-emerald-900 tracking-tight uppercase tracking-[-0.02em] tracking-[0.04em]">{t("fee_management", "Financial Ledger")}</h1>
          <p className="text-[#1E3A8A] dark:text-blue-400 font-medium text-lg mt-1">{t("track_student_tuition_and_paym", "Track student tuition, arrears, and payments")}</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setShowEnrollModal(true)} className="gap-2 bg-emerald-500/10 hover:bg-emerald-600 text-white rounded-none border-2 border-emerald-900 font-semibold px-6 py-6 text-lg transition-colors">
            <Plus className="w-6 h-6" /> {t("quick_enroll", "Quick Enroll")}
          </Button>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-emerald-100 border-2 border-emerald-900 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <DollarSign className="w-24 h-24 text-emerald-900" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-emerald-900 flex items-center justify-center text-emerald-100">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-emerald-900 text-lg uppercase tracking-[0.04em]">{t("total_collected", "Collected")}</h3>
          </div>
          <p className="text-5xl font-black text-emerald-900 relative z-10 tracking-[-0.02em]">${totalCollected.toLocaleString()}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-red-100 border-2 border-red-900 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <AlertCircle className="w-24 h-24 text-red-900" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-red-900 flex items-center justify-center text-red-100">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-red-900 text-lg uppercase tracking-[0.04em]">{t("outstanding_arrears", "Arrears")}</h3>
          </div>
          <p className="text-5xl font-black text-red-900 relative z-10 tracking-[-0.02em]">${totalOutstanding.toLocaleString()}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-lime-200 border-2 border-lime-900 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <CheckCircle className="w-24 h-24 text-lime-900" />
          </div>
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 bg-lime-900 flex items-center justify-center text-lime-100">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lime-900 text-lg uppercase tracking-[0.04em]">{t("fully_paid_students", "Cleared")}</h3>
          </div>
          <p className="text-5xl font-black text-lime-900 relative z-10 tracking-[-0.02em]">{fullyPaidCount} <span className="text-xl font-semibold text-lime-800">/ {studentsFees.length}</span></p>
        </motion.div>
      </div>

      <div className="border-2 border-emerald-900 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
        <div className="p-4 border-b-2 border-emerald-900 bg-[#F0F4FF] dark:bg-blue-900/20">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E3A8A] dark:text-blue-400" />
            <Input placeholder="Search student tuition listings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 bg-white border-2 border-emerald-900 rounded-none h-14 text-lg font-medium focus-visible:ring-0 focus-visible:border-emerald-600 placeholder:text-emerald-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-20 text-center text-[#1E3A8A] dark:text-blue-400 font-semibold text-xl uppercase animate-pulse tracking-[0.04em]">{t("loading_fee_ledger", "Loading ledger...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-emerald-800">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="font-black text-2xl uppercase tracking-[-0.02em] tracking-[0.04em]">{t("no_students_enrolled", "No Records Found")}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-emerald-900 text-emerald-50">
                <tr>
                  <th className="px-6 py-5 text-sm font-black uppercase tracking-widest tracking-[0.04em]">{t("student", "Student")}</th>
                  <th className="px-6 py-5 text-sm font-black uppercase tracking-widest tracking-[0.04em]">{t("class", "Class")}</th>
                  <th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-right tracking-[0.04em]">{t("total_due", "Total Due")}</th>
                  <th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-right tracking-[0.04em]">{t("paid", "Paid")}</th>
                  <th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-right tracking-[0.04em]">{t("balance", "Balance")}</th>
                  <th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-center tracking-[0.04em]">{t("status", "Status")}</th>
                  <th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-right tracking-[0.04em]">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-emerald-100">
                <AnimatePresence>
                  {filtered.map(f => (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={f.id} className="hover:bg-[#F0F4FF] dark:bg-blue-900/20 transition-colors group">
                      <td className="px-6 py-5">
                        <Link to={`/students`} className="font-black text-emerald-900 text-lg hover:text-[#1E3A8A] dark:text-blue-400 transition-colors">{f.student}</Link>
                        <p className="text-sm text-[#1E3A8A] dark:text-blue-400 font-semibold uppercase tracking-wider tracking-[0.04em]">{f.studentId}</p>
                      </td>
                      <td className="px-6 py-5 text-emerald-800 font-semibold">{f.class}</td>
                      <td className="px-6 py-5 text-right font-black text-emerald-900 text-lg">${f.totalDue}</td>
                      <td className="px-6 py-5 text-right font-black text-[#1E3A8A] dark:text-blue-400 text-lg">${f.paid}</td>
                      <td className="px-6 py-5 text-right font-black text-red-600 text-lg">${f.balance}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-block px-4 py-1.5 text-xs font-black uppercase tracking-widest border-2 ${
                          f.status === 'Paid' ? 'bg-lime-200 border-lime-900 text-lime-900' :
                          f.status === 'Owing' ? 'bg-red-200 border-red-900 text-red-900' : 'bg-amber-200 border-amber-900 text-amber-900'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 border-2 border-transparent group-hover:border-emerald-900 group-hover:bg-emerald-100 rounded-none transition-all">
                              <MoreVertical className="h-5 w-5 text-emerald-900" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 border-2 border-emerald-900 rounded-none p-0 bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
                            <DropdownMenuItem className="font-semibold cursor-pointer rounded-none focus:bg-emerald-100 focus:text-emerald-900 p-3" onClick={() => setViewDetails(f)}>{t("view_details", "View Details")}</DropdownMenuItem>
                            {f.balance > 0 ? (
                              <DropdownMenuItem className="font-semibold cursor-pointer rounded-none focus:bg-emerald-100 focus:text-emerald-900 p-3" onClick={() => handlePay(f)}>{t("record_payment", "Record Payment")}</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="font-semibold cursor-pointer rounded-none focus:bg-emerald-100 focus:text-emerald-900 p-3">{t("generate_receipt", "Generate Receipt")}</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border-4 border-emerald-900 w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-2xl font-black text-emerald-900 flex items-center gap-3 mb-6 uppercase tracking-[-0.02em] tracking-[0.04em]"><CreditCard className="w-8 h-8 text-[#1E3A8A] dark:text-blue-400" /> {t("record_payment", "Record Payment")}</h2>
            
            <div className="bg-[#F0F4FF] dark:bg-blue-900/20 p-4 border-2 border-emerald-900 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase text-xs tracking-widest tracking-[0.04em]">{t("student", "Student")}</span>
                <span className="font-black text-emerald-900 text-lg">{selectedStudent.student}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-emerald-900/20 pt-2 mt-2">
                <span className="font-semibold text-[#1E3A8A] dark:text-blue-400 uppercase text-xs tracking-widest tracking-[0.04em]">{t("current_balance", "Balance")}</span>
                <span className="font-black text-red-600 text-2xl tracking-[-0.02em]">${selectedStudent.balance}</span>
              </div>
            </div>

            <div className="space-y-6 school-page-enter font-dmsans">
              <div>
                <label className="text-sm font-black text-emerald-900 uppercase tracking-widest block mb-2 tracking-[0.04em]">{t("amount_paying", "Amount Paying ($)")}</label>
                <Input
                  className="h-14 text-2xl font-black border-2 border-emerald-900 rounded-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-[#F0F4FF] dark:bg-blue-900/20 tracking-[-0.02em]"
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-sm font-black text-emerald-900 uppercase tracking-widest block mb-2 tracking-[0.04em]">{t("payment_method", "Payment Method")}</label>
                <select className="w-full h-14 border-2 border-emerald-900 bg-[#F0F4FF] dark:bg-blue-900/20 px-4 font-semibold text-emerald-900 focus:outline-none focus:border-emerald-500 rounded-none appearance-none">
                  <option>{t("cash", "Cash")}</option>
                  <option>{t("bank_transfer", "Bank Transfer")}</option>
                  <option>{t("mobile_money", "Mobile Money")}</option>
                  <option>{t("cheque", "Cheque")}</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-4 pt-8">
              <Button variant="outline" className="flex-1 h-14 border-2 border-emerald-900 text-emerald-900 font-black uppercase tracking-widest rounded-none hover:bg-emerald-100 tracking-[0.04em]" onClick={() => setShowPaymentModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 h-14 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold border-2 border-emerald-900 font-black uppercase tracking-widest rounded-none transition-colors tracking-[0.04em]" onClick={handleConfirmPayment}>
                {isProcessing ? 'Processing...' : t("confirm_payment", "Confirm")}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border-4 border-emerald-900 w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
            <h2 className="text-2xl font-black text-emerald-900 flex items-center gap-3 mb-2 uppercase tracking-[-0.02em] tracking-[0.04em]"><Plus className="w-8 h-8 text-[#1E3A8A] dark:text-blue-400" /> {t("quick_enroll", "Quick Enroll")}</h2>
            <p className="text-[#1E3A8A] dark:text-blue-400 font-medium mb-6">{t("quickly_register_a_student_to_", "Register a student to generate their billing profile.")}</p>
            
            <div className="space-y-6 school-page-enter font-dmsans">
              <div>
                <label className="text-sm font-black text-emerald-900 uppercase tracking-widest block mb-2 tracking-[0.04em]">{t("student_full_name", "Student Full Name")}</label>
                <Input
                  className="h-14 text-lg font-semibold border-2 border-emerald-900 rounded-none focus-visible:ring-0 focus-visible:border-emerald-500 bg-[#F0F4FF] dark:bg-blue-900/20"
                  value={enrollName}
                  onChange={e => setEnrollName(e.target.value)}
                  placeholder="e.g. Kwame Mensah"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-8">
              <Button variant="outline" className="flex-1 h-14 border-2 border-emerald-900 text-emerald-900 font-black uppercase tracking-widest rounded-none hover:bg-emerald-100 tracking-[0.04em]" onClick={() => setShowEnrollModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 h-14 bg-[#1E3A8A] hover:bg-[#172554] text-white shadow-md shadow-[#1E3A8A]/20 transition-all hover:-translate-y-0.5 rounded-xl font-semibold border-2 border-emerald-900 font-black uppercase tracking-widest rounded-none transition-colors tracking-[0.04em]" onClick={() => {
                if (!enrollName.trim()) return toast.error("Enter student name");
                const studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
                mutateRecord.mutate({
                  company_id: companyId,
                  type: 'student',
                  name: enrollName.trim(),
                  id_number: studentId,
                  status: 'active',
                  notes: JSON.stringify({ feeStatus: 'Owing', class: 'Grade 7B', avatar: enrollName.trim().substring(0,2).toUpperCase() })
                }, {
                  onSuccess: () => {
                    toast.success(`Enrolled ${enrollName} successfully!`);
                    setShowEnrollModal(false);
                    setEnrollName('');
                  }
                });
              }}>{t("enroll_bill", "Enroll & Bill")}</Button>
            </div>
          </motion.div>
        </div>
      )}

      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md border-l-4 border-emerald-900 bg-white p-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
          <div className="p-8 bg-emerald-900 text-white">
            <SheetHeader>
              <SheetTitle className="text-3xl font-black text-white uppercase tracking-tight tracking-[-0.02em] tracking-[0.04em]">{t("fee_details", "Fee Details")}</SheetTitle>
              <SheetDescription className="text-emerald-200 font-medium">{t("read_only_overview_of_student_", "Student tuition and arrears overview.")}</SheetDescription>
            </SheetHeader>
          </div>
          
          {viewDetails && (
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b-2 border-emerald-100">
                <div className="w-20 h-20 bg-emerald-100 border-2 border-emerald-900 flex items-center justify-center text-emerald-900 font-black text-3xl tracking-[-0.02em]">
                  {viewDetails.student.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight tracking-[-0.02em] tracking-[0.04em]">
                    <Link to="/students" className="hover:text-[#1E3A8A] dark:text-blue-400 transition-colors">{viewDetails.student}</Link>
                  </h3>
                  <p className="text-lg text-[#1E3A8A] dark:text-blue-400 font-semibold">{viewDetails.studentId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F0F4FF] dark:bg-blue-900/20 border-2 border-emerald-900 p-4">
                  <p className="text-xs text-[#1E3A8A] dark:text-blue-400 uppercase font-black tracking-widest mb-1 tracking-[0.04em]">{t("class", "Class")}</p>
                  <Link to="/classes" className="text-emerald-900 hover:text-[#1E3A8A] dark:text-blue-400 font-black text-lg transition-colors">{viewDetails.class}</Link>
                </div>
                <div className="bg-[#F0F4FF] dark:bg-blue-900/20 border-2 border-emerald-900 p-4">
                  <p className="text-xs text-[#1E3A8A] dark:text-blue-400 uppercase font-black tracking-widest mb-2 tracking-[0.04em]">{t("status", "Status")}</p>
                  <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest border-2 ${
                    viewDetails.status === 'Paid' ? 'bg-lime-200 border-lime-900 text-lime-900' :
                    viewDetails.status === 'Owing' ? 'bg-red-200 border-red-900 text-red-900' : 'bg-amber-200 border-amber-900 text-amber-900'
                  }`}>
                    {viewDetails.status}
                  </span>
                </div>
                <div className="bg-[#F0F4FF] dark:bg-blue-900/20 border-2 border-emerald-900 p-4">
                  <p className="text-xs text-[#1E3A8A] dark:text-blue-400 uppercase font-black tracking-widest mb-1 tracking-[0.04em]">{t("total_due", "Total Due")}</p>
                  <p className="font-black text-emerald-900 text-2xl tracking-[-0.02em]">${viewDetails.totalDue}</p>
                </div>
                <div className="bg-[#F0F4FF] dark:bg-blue-900/20 border-2 border-emerald-900 p-4">
                  <p className="text-xs text-[#1E3A8A] dark:text-blue-400 uppercase font-black tracking-widest mb-1 tracking-[0.04em]">{t("paid", "Paid")}</p>
                  <p className="font-black text-[#1E3A8A] dark:text-blue-400 text-2xl tracking-[-0.02em]">${viewDetails.paid}</p>
                </div>
                <div className="bg-red-50 border-2 border-red-900 p-6 col-span-2">
                  <p className="text-sm text-red-800 uppercase font-black tracking-widest mb-2 tracking-[0.04em]">{t("outstanding_balance", "Outstanding Balance")}</p>
                  <p className="font-black text-red-600 text-5xl tracking-[-0.02em]">${viewDetails.balance}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
