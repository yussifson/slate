import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { Calendar, FileText, Activity, Download, Plus, Pill, Beaker } from 'lucide-react';
import { useIndustryRecords } from '@/hooks/useIndustryData';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadDocumentDialog } from "@/components/cases/CaseDocumentRepo";
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import { useAuth } from '@/lib/AuthContext';

export default function PatientPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  // Real Database Hooks
  const { data: patients = [], isLoading: isPatientsLoading } = useIndustryRecords('patient');
  const { data: appts = [], isLoading: isApptsLoading } = useIndustryRecords('appt');

  // A real system would filter by user email, but for demo we just take the first patient record
  const mappedPatients = patients.map(r => ({ id: r.id, ...r.data }));
  const activePatient = mappedPatients[0];

  const mappedAppts = appts.map(r => ({ id: r.id, ...r.data }))
    .filter(a => a.patient === activePatient?.name)
    .slice(0, 3);

  const { data: documents = [] } = useQuery({
    queryKey: ["patient-docs", activePatient?.id],
    queryFn: () => base44.entities.Document.filter({ client_id: activePatient?.id }),
    enabled: !!activePatient?.id,
  });

  const createDocMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-docs", activePatient?.id] });
      toast.success("Document uploaded successfully");
      setShowUpload(false);
    },
  });

  const handleUploadSubmit = (docData) => {
    createDocMutation.mutate({
      ...docData,
      company_id: activePatient?.company_id,
      client_id: activePatient?.id,
      client_name: activePatient?.name,
      uploaded_by: 'Patient',
      shared_with_client: true,
    });
  };

  if (isPatientsLoading || isApptsLoading) {
    return <div className="py-12 text-center text-muted-foreground">{t("loading_your_health_profile", "Loading your health profile...")}</div>;
  }

  if (mappedPatients.length === 0) {
    return (
      <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border border-border p-6 shadow-sm">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary animate-pulse" />
        <p className="font-semibold text-lg text-card-foreground">{t("no_health_profile_found", "No health profile found")}</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{t(
          "please_contact_your_healthcare",
          "Please contact your healthcare provider to link your account to your medical records."
        )}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t("welcome", "Welcome,")} {activePatient.name}</h1>
          <p className="text-primary/10 max-w-xl">{t(
            "view_your_medical_records_upco",
            "View your medical records, upcoming appointments, and secure lab results in one place."
          )}</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Activity className="w-64 h-64" />
        </div>
      </div>
      {/* Patient Profile Card */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-primary/90 text-3xl font-bold shrink-0 shadow-inner uppercase">
          {activePatient.name?.substring(0, 2)}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold text-card-foreground mb-1">{activePatient.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground font-medium">
            <span className="bg-muted px-3 py-1 rounded-full text-foreground">{activePatient.age} {t("yrs", "yrs")}</span>
            <span>{t("blood_type", "Blood Type:")} <strong className="text-red-500">{activePatient.bloodType}</strong></span>
            <span className="text-slate-300">•</span>
            <span>{t("patient_id", "Patient ID:")} {activePatient.patientId}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Stats & Appts) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-primary/20 flex items-center justify-center text-primary"><Pill className="w-4 h-4" /></div>
                <h3 className="font-bold text-foreground">{t("active_prescriptions", "Active Prescriptions")}</h3>
              </div>
              <p className="text-3xl font-extrabold text-card-foreground mb-1">2</p>
              <p className="text-xs text-muted-foreground">{t("medications", "Medications")}</p>
            </div>
            
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-primary/20 flex items-center justify-center text-primary"><Beaker className="w-4 h-4" /></div>
                <h3 className="font-bold text-foreground">{t("lab_results", "Lab Results")}</h3>
              </div>
              <p className="text-3xl font-extrabold text-primary mb-1">{t("new", "New")}</p>
              <p className="text-xs text-muted-foreground">{t("ready_for_viewing", "Ready for viewing")}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-muted-foreground" /> {t("upcoming_appointments", "Upcoming Appointments")}</h3>
            </div>
            <div className="divide-y divide-border p-2">
              {mappedAppts.map((item, i) => {
                return (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted dark:hover:bg-muted/30 rounded-lg transition-colors">
                    <div className="w-20 shrink-0 text-center flex flex-col items-center">
                      <span className="text-xs font-bold text-primary bg-slate-50 dark:bg-primary/20 px-2 py-1 rounded w-full">{item.date}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground mt-1">{item.time}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-card-foreground text-sm">{item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.doctor}</p>
                    </div>
                    <span className="bg-amber-100 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">{item.status}</span>
                  </div>
                );
              })}
              {mappedAppts.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">{t("no_upcoming_appointments_sched", "No upcoming appointments scheduled.")}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Documents & Lab Results) */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
              <h3 className="font-bold text-card-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-muted-foreground" /> {t("medical_records_labs", "Medical Records & Labs")}</h3>
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setShowUpload(true)}>
                <Plus className="w-3.5 h-3.5" /> {t("upload", "Upload")}
              </Button>
            </div>
            <div className="divide-y divide-border p-2">
              {documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">{t("no_records_available_yet", "No records available yet.")}</div>
              ) : documents.map(doc => {
                return (
                  <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted dark:hover:bg-muted/30 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-card-foreground mb-0.5 truncate max-w-[150px]">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(doc.created_date), "MMM d, yyyy")} • {doc.category?.replace('_', ' ')}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/90 hover:bg-slate-50">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {showUpload && (
        <UploadDocumentDialog
          onClose={() => setShowUpload(false)}
          onSubmit={handleUploadSubmit}
          isUploading={createDocMutation.isPending}
          companyId={activePatient?.company_id}
          caseId={activePatient?.id}
        />
      )}
    </div>
  );
}
