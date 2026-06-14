import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { Search, Plus, Trash2, FileWarning, CheckCircle, Clock, MoreVertical, Edit, Eye, Sparkles} from 'lucide-react';
import { Link} from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import { Button} from '@/components/ui/button';
import { Input} from '@/components/ui/input';
import { useIndustryRecords, useMutateIndustryRecord, useDeleteIndustryRecord} from '@/hooks/useIndustryData';
import { toast} from 'react-hot-toast';
import ConfirmationModal from '@/components/ConfirmationModal';
import AIDocumentParser from '@/components/shared/AIDocumentParser';
import AIRiskAnalyzer from '@/components/shared/AIRiskAnalyzer';
import AISearchBar from '@/components/shared/AISearchBar';

const CLAIM_FIELDS = [
 { key: 'claimantName', label: 'Claimant Name', type: 'text'},
 { key: 'policyNumber', label: 'Policy Number', type: 'text'},
 { key: 'claimType', label: 'Claim Type', type: 'text'},
 { key: 'claimAmount', label: 'Claim Amount', type: 'number'},
 { key: 'status', label: 'Status', type: 'text'},
 { key: 'incidentDate', label: 'Incident Date', type: 'date'},
];

const statusColors = {
 'Submitted': 'bg-muted text-muted-foreground',
 'Under Review': 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
 'Approved': 'bg-slate-100 text-primary dark:bg-primary/30 dark:text-primary/70',
 'Rejected': 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
 'Paid': 'bg-slate-100 text-primary/90 dark:bg-primary/30 dark:text-primary/70',
};

export default function Claims() {
 const { t} = useTranslation();
 const { data: dbRecords = [], isLoading: isDbLoading} = useIndustryRecords('claim');
 const mutateRecord = useMutateIndustryRecord();
 const deleteRecord = useDeleteIndustryRecord();

 const claims = dbRecords.map(r => ({
 id: r.id,
 status: r.status || 'Submitted',
 ...r.data
}));

 const [search, setSearch] = useState('');
 const [aiFilters, setAiFilters] = useState({ logic: 'AND', conditions: []});
 const [showModal, setShowModal] = useState(false);
 const [showRiskAnalyzer, setShowRiskAnalyzer] = useState(false);
 const [deleteTargetId, setDeleteTargetId] = useState(null);
 const [viewDetailsId, setViewDetailsId] = useState(null);
 const [editTargetId, setEditTargetId] = useState(null);

 const [formData, setFormData] = useState({
 policyNumber: '',
 claimantName: '',
 claimType: 'Auto',
 incidentDate: new Date().toISOString().split('T')[0],
 claimAmount: '',
 description: ''
});

 const handleCreateClaim = () => {
 if (!formData.claimantName.trim() || !formData.policyNumber.trim()) {
 return toast.error("Please enter claimant and policy details");
}
 
 const isEdit = !!editTargetId;
 const finalClaimNumber = isEdit
 ? claims.find(c => c.id === editTargetId)?.claimNumber
 : `CLM-${Math.floor(1000 + Math.random() * 9000)}`;
 const finalStatus = isEdit
 ? claims.find(c => c.id === editTargetId)?.status
 : 'Submitted';

 mutateRecord.mutate({
 ...(editTargetId ? { id: editTargetId} : {}),
 recordType: 'claim',
 payload: { ...formData, claimNumber: finalClaimNumber},
 status: finalStatus,
 searchText: `${formData.claimantName} ${formData.policyNumber} ${finalClaimNumber}`
}, {
 onSuccess: () => {
 toast.success(isEdit ? 'Claim updated successfully!' : 'Claim submitted successfully!');
 setShowModal(false);
 setEditTargetId(null);
 setFormData({ policyNumber: '', claimantName: '', claimType: 'Auto', incidentDate: new Date().toISOString().split('T')[0], claimAmount: '', description: ''});
},
 onError: (err) => toast.error(`Failed to ${isEdit ? 'update' : 'submit'} claim: ` + err.message)
});
};

 const openNewModal = () => {
 setEditTargetId(null);
 setFormData({ policyNumber: '', claimantName: '', claimType: 'Auto', incidentDate: new Date().toISOString().split('T')[0], claimAmount: '', description: ''});
 setShowModal(true);
};

 const handleUpdateStatus = (claim, newStatus) => {
 const payload = { ...claim};
 delete payload.id;
 delete payload.status;
 mutateRecord.mutate({
 id: claim.id, recordType: 'claim', payload, status: newStatus,
 searchText: `${claim.claimantName} ${claim.policyNumber} ${claim.claimNumber}`
}, { onSuccess: () => toast.success(`Status updated to ${newStatus}`)});
};

 const handleDelete = () => {
 if (!deleteTargetId) return;
 deleteRecord.mutate({ id: deleteTargetId, recordType: 'claim'}, {
 onSuccess: () => { toast.success('Claim removed!'); setDeleteTargetId(null);},
 onError: (err) => { toast.error('Failed to remove: ' + err.message); setDeleteTargetId(null);}
});
};

 // Apply AI filters
 const applyAIFilter = (record) => {
 if (!aiFilters.conditions.length) return true;
 const results = aiFilters.conditions.map(({ field, operator, value}) => {
 const fieldVal = String(record[field] || '').toLowerCase();
 const filterVal = String(value).toLowerCase();
 switch (operator) {
 case 'equals': return fieldVal === filterVal;
 case 'not_equals': return fieldVal !== filterVal;
 case 'contains': return fieldVal.includes(filterVal);
 case 'starts_with': return fieldVal.startsWith(filterVal);
 case 'greater_than': return parseFloat(record[field]) > parseFloat(value);
 case 'less_than': return parseFloat(record[field]) < parseFloat(value);
 default: return true;
}
});
 return aiFilters.logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
};

 const filtered = claims
 .filter(c =>
 c.claimantName?.toLowerCase().includes(search.toLowerCase()) ||
 c.claimNumber?.toLowerCase().includes(search.toLowerCase()) ||
 c.policyNumber?.toLowerCase().includes(search.toLowerCase())
 )
 .filter(applyAIFilter);

 const totalAmount = claims.reduce((sum, c) => sum + (Number(c.claimAmount) || 0), 0);
 const viewRecord = claims.find(r => r.id === viewDetailsId);

 const isStaleClaim = (claim) => {
 if (claim.status !== 'Submitted' && claim.status !== 'Under Review') return false;
 if (!claim.incidentDate) return false;
 const diffTime = new Date() - new Date(claim.incidentDate);
 const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
 return diffDays > 30;
};

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-card-foreground">{t("claims_processing", "Claims Processing")}</h1>
 <p className="text-sm text-muted-foreground mt-0.5">{t(
 "manage_and_evaluate_policyhold",
 "Manage and evaluate policyholder claims"
 )}</p>
 </div>
 <div className="flex gap-2">
 <Button onClick={() => setShowRiskAnalyzer(true)} variant="outline" className="gap-2 border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20">
 <Sparkles className="w-4 h-4" /> {t("ai_risk_scan", "AI Risk Scan")}
 </Button>
 <Button onClick={openNewModal} className="gap-2 bg-primary hover:bg-primary text-white">
 <Plus className="w-4 h-4" /> {t("file_new_claim", "File New Claim")}
 </Button>
 </div>
 </div>
 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="bg-card rounded-xl border border-border p-4 ">
 <div className="flex items-center gap-2 mb-2 text-muted-foreground"><FileWarning className="w-4 h-4"/> {t("total_claims", "Total Claims")}</div>
 <p className="text-2xl font-bold text-card-foreground">{claims.length}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 ">
 <div className="flex items-center gap-2 mb-2 text-amber-600"><Clock className="w-4 h-4"/> {t("under_review", "Under Review")}</div>
 <p className="text-2xl font-bold text-card-foreground">{claims.filter(c => c.status === 'Under Review').length}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 ">
 <div className="flex items-center gap-2 mb-2 text-primary"><CheckCircle className="w-4 h-4"/> {t("approved", "Approved")}</div>
 <p className="text-2xl font-bold text-card-foreground">{claims.filter(c => c.status === 'Approved' || c.status === 'Paid').length}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-4 ">
 <div className="flex items-center gap-2 mb-2 text-primary"><span className="font-bold text-sm">$</span> {t("total_claimed", "Total Claimed")}</div>
 <p className="text-2xl font-bold text-card-foreground">${totalAmount.toLocaleString()}</p>
 </div>
 </div>
 {/* AI Search */}
 <AISearchBar
 fields={CLAIM_FIELDS}
 onApplyFilters={(f) => setAiFilters(f)}
 />
 {/* Table */}
 <div className="bg-card rounded-xl border border-border overflow-hidden">
 <div className="p-4 border-b border-border bg-muted/50">
 <div className="relative max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input placeholder="Search claim number, policy or claimant..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
 </div>
 </div>
 <div className="overflow-x-auto">
 {isDbLoading ? (
 <div className="py-12 text-center text-muted-foreground">{t("loading_claims", "Loading claims...")}</div>
 ) : filtered.length === 0 ? (
 <div className="py-12 text-center text-muted-foreground">
 <FileWarning className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
 <p className="font-semibold text-lg text-card-foreground">{t("no_claims_found", "No claims found")}</p>
 <p className="text-xs mt-1">{t(
 "file_a_new_claim_or_adjust_you",
 "File a new claim or adjust your filters."
 )}</p>
 </div>
 ) : (
 <table className="w-full text-sm">
 <thead className="bg-card border-b border-border">
 <tr>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("claim_info", "Claim Info")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("claimant", "Claimant")}</th>
 <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{t("description", "Description")}</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("amount", "Amount")}</th>
 <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">{t("status", "Status")}</th>
 <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">{t("action", "Action")}</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filtered.map(claim => {
 return (
 <tr key={claim.id} className="hover:bg-muted/50 transition-colors">
 <td className="px-6 py-4">
 <p className="font-mono font-bold text-primary">{claim.claimNumber}</p>
 <Link to="/insurance/policies" className="text-primary hover:underline text-xs mt-0.5 font-medium block">{claim.policyNumber}</Link>
 <p className="text-[10px] text-muted-foreground mt-0.5">{claim.incidentDate}</p>
 </td>
 <td className="px-6 py-4">
 <p className="font-bold text-card-foreground">{claim.claimantName}</p>
 <p className="text-xs text-muted-foreground">{claim.claimType} {t("claim", "Claim")}</p>
 </td>
 <td className="px-6 py-4 text-muted-foreground font-medium max-w-xs truncate">{claim.description}</td>
 <td className="px-6 py-4 text-right">
 <p className="font-bold text-card-foreground">${Number(claim.claimAmount).toLocaleString()}</p>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="flex flex-col items-center gap-1.5">
 <select
 value={claim.status}
 onChange={e => handleUpdateStatus(claim, e.target.value)}
 className={`rounded-md border border-input px-2 py-1 text-xs font-bold w-full ${statusColors[claim.status] || 'bg-muted text-muted-foreground'}`}
 >
 <option value="Submitted">{t("submitted", "Submitted")}</option>
 <option value="Under Review">{t("under_review", "Under Review")}</option>
 <option value="Approved">{t("approved", "Approved")}</option>
 <option value="Rejected">{t("rejected", "Rejected")}</option>
 <option value="Paid">{t("paid", "Paid")}</option>
 </select>
 {isStaleClaim(claim) && (
 <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse w-full text-center">
 {t("sla_breach_30d", "SLA Breach (>30d)")}
 </span>
 )}
 </div>
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
 <DropdownMenuItem onClick={() => setViewDetailsId(claim.id)}>
 <Eye className="mr-2 h-4 w-4" /> {t("view_details", "View Details")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => {
 setFormData({ policyNumber: claim.policyNumber || '', claimantName: claim.claimantName || '', claimType: claim.claimType || 'Auto', incidentDate: claim.incidentDate || '', claimAmount: claim.claimAmount || '', description: claim.description || ''});
 setEditTargetId(claim.id);
 setShowModal(true);
}}>
 <Edit className="mr-2 h-4 w-4" /> {t("edit", "Edit")}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setDeleteTargetId(claim.id)} className="text-red-600 focus:text-red-600">
 <Trash2 className="mr-2 h-4 w-4" /> {t("delete", "Delete")}
 </DropdownMenuItem>
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
 {/* AI Risk Analyzer Modal */}
 {showRiskAnalyzer && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-2xl border border-border p-6 space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-amber-500" /> {t("ai_risk_analyzer_claims", "AI Risk Analyzer — Claims")}
 </h2>
 <Button variant="ghost" size="sm" onClick={() => setShowRiskAnalyzer(false)}>{t("close", "Close")}</Button>
 </div>
 <AIRiskAnalyzer records={claims} recordType="insurance claims" />
 </div>
 </div>
 )}
 {/* Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
 <div className="bg-card rounded-2xl w-full max-w-lg p-6 space-y-4 border border-border overflow-y-auto max-h-[90vh]">
 <h2 className="text-lg font-bold text-card-foreground">{editTargetId ? 'Edit Claim' : 'File New Claim'}</h2>

 {/* AI Document Parser */}
 {!editTargetId && (
 <AIDocumentParser
 fieldsContext="insurance claim details including policy number, claimant name, claim type, incident date, and claim amount"
 onExtracted={(data) => setFormData(prev => ({ ...prev, ...data}))}
 />
 )}

 <div className="space-y-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("policy_number", "Policy Number")}</label>
 <Input value={formData.policyNumber} onChange={e => setFormData({...formData, policyNumber: e.target.value})} placeholder="POL-12345" className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("claimant_name", "Claimant Name")}</label>
 <Input value={formData.claimantName} onChange={e => setFormData({...formData, claimantName: e.target.value})} placeholder="Jane Doe" className="mt-1" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("claim_type", "Claim Type")}</label>
 <select value={formData.claimType} onChange={e => setFormData({...formData, claimType: e.target.value})} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
 <option>{t("auto", "Auto")}</option>
 <option>{t("health", "Health")}</option>
 <option>{t("property", "Property")}</option>
 <option>{t("life", "Life")}</option>
 <option>{t("business", "Business")}</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("incident_date", "Incident Date")}</label>
 <Input type="date" value={formData.incidentDate} onChange={e => setFormData({...formData, incidentDate: e.target.value})} className="mt-1" />
 </div>
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("claim_amount", "Claim Amount ($)")}</label>
 <Input type="number" value={formData.claimAmount} onChange={e => setFormData({...formData, claimAmount: e.target.value})} placeholder="1500" className="mt-1" />
 </div>
 <div>
 <label className="text-xs font-bold text-muted-foreground uppercase">{t("description_details", "Description / Details")}</label>
 <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the incident..." className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-20 resize-none text-foreground" />
 </div>
 </div>
 <div className="flex gap-3 pt-4">
 <Button variant="outline" className="flex-1" onClick={() => { setShowModal(false); setEditTargetId(null);}}>{t("cancel", "Cancel")}</Button>
 <Button className="flex-1 bg-primary hover:bg-primary text-white" onClick={handleCreateClaim}>{editTargetId ? 'Save Changes' : 'Submit Claim'}</Button>
 </div>
 </div>
 </div>
 )}
 {/* View Details Sheet */}
 <Sheet open={viewDetailsId !== null} onOpenChange={(open) => !open && setViewDetailsId(null)}>
 <SheetContent className="bg-card text-card-foreground overflow-y-auto">
 <SheetHeader>
 <SheetTitle>{t("claim_details", "Claim Details")}</SheetTitle>
 <SheetDescription>{t("full_record_for_claim", "Full record for claim")} {viewRecord?.claimNumber}</SheetDescription>
 </SheetHeader>
 <div className="mt-6 space-y-4">
 {viewRecord && Object.entries(viewRecord).map(([key, value]) => {
 if (key === 'id') return null;
 return (
 <div key={key} className="border-b border-border pb-3">
 <label className="text-xs font-bold text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
 <p className="font-medium mt-1">
 {key === 'policyNumber' ? (
 <Link to="/insurance/policies" className="text-primary hover:underline">{String(value)}</Link>
 ) : (
 String(value)
 )}
 </p>
 </div>
 );
})}
 </div>
 </SheetContent>
 </Sheet>
 <ConfirmationModal
 isOpen={deleteTargetId !== null}
 onClose={() => setDeleteTargetId(null)}
 onConfirm={handleDelete}
 title="Delete Claim"
 message="Are you sure you want to completely remove this claim record? This cannot be undone."
 />
 </div>
 );
}
