import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Search, Plus, Trash2, FileSignature, CheckCircle2, XCircle, AlertTriangle, MoreVertical, Eye, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord } from '@/hooks/useIndustryData';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Underwriting() {
  const { t } = useTranslation();
  const { data: dbRecords = [], isLoading: isDbLoading } = useIndustryRecords('underwriting_application');
  const mutateRecord = useMutateIndustryRecord();
  const deleteRecord = useDeleteIndustryRecord();

  const applications = dbRecords.map(r => ({
    id: r.id,
    decision: r.status || 'Pending Review',
    ...r.data
  }));

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);

  const [formData, setFormData] = useState({
    applicantName: '',
    productType: 'Life Insurance',
    riskLevel: 'Low',
    premiumQuote: '',
    sumInsuredRequested: ''
  });
  const [viewRecord, setViewRecord] = useState(null);

  const handleCreateApplication = () => {
    if (!formData.applicantName.trim()) {
      return toast.error("Please enter applicant name");
    }
    
    if (editTargetId) {
      mutateRecord.mutate({
        id: editTargetId,
        recordType: 'underwriting_application',
        payload: { ...formData },
        status: formData.status || 'Pending Review',
        searchText: `${formData.applicantName} ${formData.productType}`
      }, {
        onSuccess: () => {
          toast.success('Application updated successfully!');
          setShowModal(false);
          setFormData({
            applicantName: '', productType: 'Life Insurance', riskLevel: 'Low', 
            premiumQuote: '', sumInsuredRequested: ''
          });
        },
        onError: (err) => toast.error('Failed to update application: ' + err.message)
      });
    } else {
      const applicationId = `UW-${Math.floor(1000 + Math.random() * 9000)}`;

      mutateRecord.mutate({
        recordType: 'underwriting_application',
        payload: { ...formData, applicationId, submittedDate: new Date().toISOString().split('T')[0] },
        status: 'Pending Review',
        searchText: `${formData.applicantName} ${formData.productType} ${applicationId}`
      }, {
        onSuccess: () => {
          toast.success('Application added successfully!');
          setShowModal(false);
          setFormData({
            applicantName: '', productType: 'Life Insurance', riskLevel: 'Low', 
            premiumQuote: '', sumInsuredRequested: ''
          });
        },
        onError: (err) => toast.error('Failed to add application: ' + err.message)
      });
    }
  };

  const handleEdit = (app) => {
    setFormData({
      applicantName: app.applicantName || '',
      productType: app.productType || 'Life Insurance',
      riskLevel: app.riskLevel || 'Low',
      premiumQuote: app.premiumQuote || '',
      sumInsuredRequested: app.sumInsuredRequested || '',
      status: app.decision
    });
    setShowModal(true);
  };

  const openNewModal = () => {
    setFormData({
      applicantName: '', productType: 'Life Insurance', riskLevel: 'Low', 
      premiumQuote: '', sumInsuredRequested: ''
    });
    setShowModal(true);
  };

  const handleUpdateDecision = (app, newDecision) => {
    const payload = { ...app };
    delete payload.id;
    delete payload.decision;
    
    mutateRecord.mutate({
      id: app.id,
      recordType: 'underwriting_application',
      payload,
      status: newDecision,
      searchText: `${app.applicantName} ${app.applicationId}`
    }, {
      onSuccess: () => toast.success(`Decision updated to ${newDecision}`)
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteRecord.mutate({ id: deleteTargetId, recordType: 'underwriting_application' }, {
      onSuccess: () => {
        toast.success('Application removed!');
        setDeleteTargetId(null);
      },
      onError: (err) => {
        toast.error('Failed to remove: ' + err.message);
        setDeleteTargetId(null);
      }
    });
  };

  const filtered = applications.filter(a => 
    a.applicantName?.toLowerCase().includes(search.toLowerCase()) || 
    a.applicationId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{t("underwriting", "Underwriting")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t(
            "evaluate_risk_and_process_insu",
            "Evaluate risk and process insurance applications"
          )}</p>
        </div>
        <Button onClick={openNewModal} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4" /> {t("new_application", "New Application")}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground"><FileSignature className="w-4 h-4"/> {t("total_applications", "Total Applications")}</div>
          <p className="text-2xl font-bold text-card-foreground">{applications.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-600"><Clock className="w-4 h-4"/> {t("pending_review", "Pending Review")}</div>
          <p className="text-2xl font-bold text-card-foreground">{applications.filter(a => a.decision === 'Pending Review').length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-green-600"><CheckCircle2 className="w-4 h-4"/> {t("approved", "Approved")}</div>
          <p className="text-2xl font-bold text-card-foreground">{applications.filter(a => a.decision === 'Approved' || a.decision === 'Conditionally Approved').length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-red-600"><AlertTriangle className="w-4 h-4"/> {t("high_risk", "High Risk")}</div>
          <p className="text-2xl font-bold text-card-foreground">{applications.filter(a => a.riskLevel === 'High').length}</p>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search application ID or applicant..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isDbLoading ? (
            <div className="py-12 text-center text-muted-foreground">{t("loading_applications", "Loading applications...")}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-600" />
              <p className="font-semibold text-lg text-card-foreground">{t("no_applications_found", "No applications found")}</p>
              <p className="text-xs mt-1">{t(
                "submit_a_new_application_to_se",
                "Submit a new application to see it here."
              )}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("app_id", "App ID")}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("applicant_product", "Applicant & Product")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("risk_level", "Risk Level")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("quote_sum", "Quote & Sum")}</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("decision", "Decision")}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(app => {
                  return (
                    <tr key={app.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono font-bold text-purple-600">{app.applicationId}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{app.submittedDate}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-card-foreground">{app.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{app.productType}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide ${
                          app.riskLevel === 'Low' ? 'bg-green-100 text-green-700' : 
                          app.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {app.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-card-foreground">${Number(app.premiumQuote).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t("mo", "/mo")}</span></p>
                        <p className="text-[10px] text-muted-foreground">{t("sum", "Sum: $")}{Number(app.sumInsuredRequested).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={app.decision}
                          onChange={e => handleUpdateDecision(app, e.target.value)}
                          className={`rounded-md border border-input px-2 py-1 text-xs font-bold ${
                            app.decision === 'Approved' ? 'bg-green-100 text-green-700' : 
                            app.decision === 'Conditionally Approved' ? 'bg-blue-100 text-blue-700' : 
                            app.decision === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <option value="Pending Review">{t("pending", "Pending")}</option>
                          <option value="Approved">{t("approve", "Approve")}</option>
                          <option value="Conditionally Approved">{t("conditional", "Conditional")}</option>
                          <option value="Rejected">{t("reject", "Reject")}</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t("open_menu", "Open menu")}</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewRecord(app)}>{t("view_details", "View Details")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(app)}>{t("edit", "Edit")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTargetId(app.id)} className="text-red-600">{t("delete", "Delete")}</DropdownMenuItem>
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Underwriting Application' : 'New Underwriting Application'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("applicant_name", "Applicant Name")}</label>
                <Input value={formData.applicantName} onChange={e => setFormData({...formData, applicantName: e.target.value})} placeholder="Jane Doe" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("product_type", "Product Type")}</label>
                  <select value={formData.productType} onChange={e => setFormData({...formData, productType: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option>{t("life_insurance", "Life Insurance")}</option>
                    <option>{t("health_insurance", "Health Insurance")}</option>
                    <option>{t("property_insurance", "Property Insurance")}</option>
                    <option>{t("auto_insurance", "Auto Insurance")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("risk_level", "Risk Level")}</label>
                  <select value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option>{t("low", "Low")}</option>
                    <option>{t("medium", "Medium")}</option>
                    <option>{t("high", "High")}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("premium_quote", "Premium Quote ($)")}</label>
                  <Input type="number" value={formData.premiumQuote} onChange={e => setFormData({...formData, premiumQuote: e.target.value})} placeholder="500" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">{t("sum_requested", "Sum Requested ($)")}</label>
                  <Input type="number" value={formData.sumInsuredRequested} onChange={e => setFormData({...formData, sumInsuredRequested: e.target.value})} placeholder="50000" className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditTargetId(null); }}>{t("cancel", "Cancel")}</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleCreateApplication}>{editTargetId ? 'Save Changes' : 'Submit Application'}</Button>
            </div>
          </div>
        </div>
      )}
      <Sheet open={viewDetailsId !== null} onOpenChange={(open) => !open && setViewDetailsId(null)}>
        <SheetContent className="bg-card text-card-foreground">
          <SheetHeader>
            <SheetTitle>{t("record_details", "Record Details")}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {viewDetailsId && (() => {
              const record = applications.find(r => r.id === viewDetailsId);
              if (!record) return null;
              return Object.entries(record).map(([key, value]) => {
                if (key === 'id') return null;
                return (
                  <div key={key}>
                    <label className="text-xs font-bold text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <p className="font-medium">{String(value)}</p>
                  </div>
                );
              });
            })()}
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Application"
        message="Are you sure you want to completely remove this application? This cannot be undone."
      />
      <Sheet open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("application_details", "Application Details")}</SheetTitle>
            <SheetDescription>{t(
              "view_complete_information_for_",
              "View complete information for this underwriting application."
            )}</SheetDescription>
          </SheetHeader>
          {viewRecord && (
            <div className="mt-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("application_id", "Application ID")}</h4>
                <p className="text-base font-semibold">{viewRecord.applicationId}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("applicant_name", "Applicant Name")}</h4>
                <p className="text-base">{viewRecord.applicantName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("product_type", "Product Type")}</h4>
                <p className="text-base">{viewRecord.productType}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("decision", "Decision")}</h4>
                <p className="text-base">{viewRecord.decision}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("risk_level", "Risk Level")}</h4>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide inline-block mt-1 ${
                  viewRecord.riskLevel === 'Low' ? 'bg-green-100 text-green-700' : 
                  viewRecord.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {viewRecord.riskLevel}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("premium_quote", "Premium Quote")}</h4>
                <p className="text-base">${Number(viewRecord.premiumQuote).toLocaleString()}{t("mo", "/mo")}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("sum_insured_requested", "Sum Insured Requested")}</h4>
                <p className="text-base">${Number(viewRecord.sumInsuredRequested).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">{t("submitted_date", "Submitted Date")}</h4>
                <p className="text-base">{viewRecord.submittedDate}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
