import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Receipt, Search, CreditCard, DollarSign, AlertCircle, FileText, CheckCircle, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { usePayment } from '@/hooks/integrations/usePayment';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useCompanyId } from "@/hooks/useCompanyId";

export default function FeeManagement() {
  const { t } = useTranslation();
  const companyId = useCompanyId();
  const { processPayment, isProcessing } = usePayment();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('student');
  const mutateRecord = useMutateIndustryRecord();

  // Map student records to fee listings
  const studentsFees = dbRecords.map(r => {
    const feeStatus = r.data?.feeStatus || 'Owing';
    const totalDue = feeStatus === 'Paid' ? 1200 : (feeStatus === 'Partial' ? 1200 : 1200);
    const paid = feeStatus === 'Paid' ? 1200 : (feeStatus === 'Partial' ? 400 : 0);
    return {
      id: r.id,
      student: r.data?.name || 'Unknown Student',
      studentId: r.data?.studentId || 'STU-000',
      class: r.data?.class || 'Grade 7B',
      totalDue,
      paid,
      balance: totalDue - paid,
      status: feeStatus,
      rawRecord: r
    };
  });

  const [search, setSearch] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

        const updatedData = {
          ...currentRaw.data,
          feeStatus: nextStatus
        };

        mutateRecord.mutate({
          id: currentRaw.id,
          recordType: 'student',
          payload: updatedData,
          status: currentRaw.status || 'Active',
          searchText: `${updatedData.name} ${updatedData.studentId}`
        }, {
          onSuccess: () => {
            toast.success(`Recorded payment of $${paymentAmount} for ${selectedStudent.student}`);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("fee_management", "Fee Management")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("track_student_tuition_and_paym", "Track student tuition and payments")}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center text-green-600 dark:text-green-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{t("total_collected", "Total Collected")}</h3>
          </div>
          <p className="text-3xl font-bold text-card-foreground">${totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{t("outstanding_arrears", "Outstanding Arrears")}</h3>
          </div>
          <p className="text-3xl font-bold text-card-foreground">${totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">{t("fully_paid_students", "Fully Paid Students")}</h3>
          </div>
          <p className="text-3xl font-bold text-card-foreground">{fullyPaidCount} <span className="text-sm font-medium text-muted-foreground">/ {studentsFees.length}</span></p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search student tuition listings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_fee_ledger", "Loading fee ledger...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600" />
              <p className="font-semibold text-lg text-card-foreground">{t("no_students_enrolled", "No students enrolled")}</p>
              <p className="text-xs mt-1">{t(
                "tuition_bills_are_automaticall",
                "Tuition bills are automatically configured upon enrolling students in the directory."
              )}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("student", "Student")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("class", "Class")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("total_due", "Total Due")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("paid", "Paid")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("balance", "Balance")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("status", "Status")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(f => {
                  return (
                    <tr key={f.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/students`} className="font-semibold text-primary hover:underline">{f.student}</Link>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{f.studentId}</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground"><Link to="/classes" className="hover:underline text-blue-600">{f.class}</Link></td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">${f.totalDue}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">${f.paid}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">${f.balance}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          f.status === 'Paid' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                          f.status === 'Owing' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setViewDetails(f)}>{t("view_details", "View Details")}</DropdownMenuItem>
                            {f.balance > 0 ? (
                              <DropdownMenuItem onClick={() => handlePay(f)}>{t("record_payment", "Record Payment")}</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem>{t("generate_receipt", "Generate Receipt")}</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> {t("record_payment", "Record Payment")}</h2>
            <div className="bg-muted dark:bg-muted/30 p-3 rounded-lg border border-border text-sm mb-4">
              <p className="text-muted-foreground">{t("student", "Student:")} <strong className="text-card-foreground">{selectedStudent.student}</strong></p>
              <p className="text-muted-foreground">{t("current_balance", "Current Balance:")} <strong className="text-red-600">${selectedStudent.balance}</strong></p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("amount_paying", "Amount Paying ($)")}</label>
                <Input
                  className="mt-1 text-lg font-bold"
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("payment_method", "Payment Method")}</label>
                <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <option>{t("cash", "Cash")}</option>
                  <option>{t("bank_transfer", "Bank Transfer")}</option>
                  <option>{t("mobile_money", "Mobile Money")}</option>
                  <option>{t("cheque", "Cheque")}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmPayment}>{t("confirm_payment", "Confirm Payment")}</Button>
            </div>
          </div>
        </div>
      )}
      <Sheet open={!!viewDetails} onOpenChange={(open) => !open && setViewDetails(null)}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("fee_details", "Fee Details")}</SheetTitle>
            <SheetDescription>{t(
              "read_only_overview_of_student_",
              "Read-only overview of student tuition and arrears."
            )}</SheetDescription>
          </SheetHeader>
          {viewDetails && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {viewDetails.student.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">
                    <Link to="/students" className="hover:underline">{viewDetails.student}</Link>
                  </h3>
                  <p className="text-sm text-muted-foreground">{viewDetails.studentId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("class", "Class")}</p>
                  <Link to="/classes" className="text-primary hover:underline font-medium">{viewDetails.class}</Link>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("status", "Status")}</p>
                  <span className={`inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    viewDetails.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    viewDetails.status === 'Owing' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {viewDetails.status}
                  </span>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("total_due", "Total Due")}</p>
                  <p className="font-medium text-foreground">${viewDetails.totalDue}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("paid", "Paid")}</p>
                  <p className="font-medium text-green-600">${viewDetails.paid}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">{t("outstanding_balance", "Outstanding Balance")}</p>
                  <p className="font-bold text-red-600 mt-1 text-lg">${viewDetails.balance}</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
