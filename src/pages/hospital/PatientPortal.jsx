import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { Calendar, FileText, Activity, Download, Plus, Pill, Beaker, Bot, Sparkles, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from 'react-hot-toast';
import { useCompanyId } from "@/hooks/useCompanyId";
import { powerSync } from '@/api/PowerSyncConnector';
import { useAuth } from '@/lib/AuthContext';
import { generateText } from '@/lib/cloudflareAI';

export default function PatientPortal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const isProOrAbove = user?.role === 'system_admin' || user?.subscription_plan === 'Pro' || user?.subscription_plan === 'Enterprise';

  const [aiAdvice, setAiAdvice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Fetch Patient Profile (assume the logged in user is a patient, mapping by email)
  const { data: patientProfile, isLoading: isPatientLoading } = useQuery({
    queryKey: ['portal_patient', companyId, user?.email],
    queryFn: async () => {
      if (!companyId || !user?.email) return null;
      const rows = await powerSync.getAll(
        `SELECT id, COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') as name, date_of_birth, blood_type, gender 
         FROM univ_patients WHERE company_id = ? AND email = ? LIMIT 1`,
        [companyId, user.email]
      );
      return rows?.[0] || null;
    },
    enabled: !!companyId && !!user?.email
  });

  // 2. Fetch Appointments
  const { data: appts = [] } = useQuery({
    queryKey: ['portal_appts', companyId, patientProfile?.name],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT date, time, type, status, doctor_id as doctor FROM univ_appointments WHERE company_id = ? AND client_name = ? ORDER BY date DESC, time ASC LIMIT 3`,
        [companyId, patientProfile.name]
      );
      return rows || [];
    },
    enabled: !!patientProfile?.name
  });

  // 3. Fetch Prescriptions
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['portal_prescriptions', companyId, patientProfile?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT medication, dosage FROM univ_prescriptions WHERE company_id = ? AND patient_id = ? AND status = 'Active'`,
        [companyId, patientProfile.id]
      );
      return rows || [];
    },
    enabled: !!patientProfile?.id
  });

  // 4. Fetch Lab Results
  const { data: labResults = [] } = useQuery({
    queryKey: ['portal_labs', companyId, patientProfile?.id],
    queryFn: async () => {
      const rows = await powerSync.getAll(
        `SELECT test_name, status, result_value FROM univ_lab_results WHERE company_id = ? AND patient_id = ? ORDER BY test_date DESC LIMIT 5`,
        [companyId, patientProfile.id]
      );
      return rows || [];
    },
    enabled: !!patientProfile?.id
  });

  const handleAIHealthCoach = async () => {
    if (!isProOrAbove) {
      toast.error('AI Health Coach is available on Pro or Enterprise plans.');
      return;
    }
    if (!patientProfile) return;
    setIsGenerating(true);
    setAiAdvice('');
    try {
      const prompt = `You are an empathetic AI Health Coach. Give a 3-sentence personalized health advice based on the patient's data: 
Name: ${patientProfile.name}
Active Prescriptions: ${prescriptions.map(p => p.medication).join(', ') || 'None'}
Recent Labs: ${labResults.map(l => l.test_name + '('+l.result_value+')').join(', ') || 'None'}`;
      const response = await generateText(prompt);
      setAiAdvice(response);
    } catch (e) {
      toast.error('AI Health Coach failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isPatientLoading) {
    return <div className="py-12 text-center text-[#71717a]">Loading your health profile...</div>;
  }

  if (!patientProfile) {
    return (
      <div className="py-12 text-center max-w-md mx-auto bg-card rounded-xl border border-primary/20 p-6">
        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary animate-pulse" />
        <p className="font-semibold text-lg text-card-foreground">No health profile found</p>
        <p className="text-sm text-[#71717a] mt-1 mb-4">Please contact your healthcare provider to link your account to your medical records using email {user?.email}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.06) 0%, rgba(255,255,255,0) 100%)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">Welcome, {patientProfile.name}</h1>
          <p className="text-primary/10 max-w-xl">View your medical records, upcoming appointments, and secure lab results in one place.</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Activity className="w-64 h-64" />
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-card rounded-2xl border border-primary/20 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-primary/90 text-3xl font-semibold shrink-0 uppercase tracking-tight">
          {patientProfile.name?.substring(0, 2)}
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-semibold text-card-foreground mb-1 tracking-tight">{patientProfile.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-[#71717a] font-medium">
            <span>Blood Type: <strong className="text-red-500">{patientProfile.blood_type || 'Unknown'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Gender: {patientProfile.gender || 'Unknown'}</span>
          </div>
        </div>
        <div>
          <Button onClick={handleAIHealthCoach} disabled={isGenerating} className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-sm">
            {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : (!isProOrAbove ? <Lock className="w-4 h-4" /> : <Bot className="w-4 h-4" />)}
            {isGenerating ? 'Analyzing...' : 'AI Health Coach'}
          </Button>
        </div>
      </div>

      {aiAdvice && (
        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20 shadow-sm">
          <h3 className="font-semibold text-primary flex items-center gap-2 mb-2"><Bot className="w-5 h-5"/> Your Personalized Health Advice</h3>
          <p className="text-sm font-medium text-foreground">{aiAdvice}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Stats & Appts) */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-primary/20 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Pill className="w-4 h-4" /></div>
                <h3 className="font-semibold text-foreground">Active Prescriptions</h3>
              </div>
              <p className="text-3xl font-extrabold text-card-foreground mb-1">{prescriptions.length}</p>
              <p className="text-xs text-[#71717a]">Medications</p>
            </div>
            
            <div className="bg-card rounded-xl border border-primary/20 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Beaker className="w-4 h-4" /></div>
                <h3 className="font-semibold text-foreground">Lab Results</h3>
              </div>
              <p className="text-3xl font-extrabold text-primary mb-1">{labResults.filter(l => l.status === 'Completed').length}</p>
              <p className="text-xs text-[#71717a]">Ready for viewing</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-primary/20 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-primary/20 bg-muted/50">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-[#71717a]" /> Recent Appointments</h3>
            </div>
            <div className="divide-y divide-border p-2">
              {appts.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-colors">
                  <div className="w-20 shrink-0 text-center flex flex-col items-center">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md w-full">{item.date}</span>
                    <span className="text-[10px] font-semibold text-[#71717a] mt-1">{item.time}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-card-foreground text-sm">{item.type}</p>
                    <p className="text-xs text-[#71717a]">{item.doctor}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase ${item.status === 'Scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>{item.status}</span>
                </div>
              ))}
              {appts.length === 0 && (
                <div className="py-6 text-center text-xs text-[#71717a]">No recent appointments.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Lab Results) */}
        <div className="space-y-6 school-page-enter font-dmsans">
          <div className="bg-card rounded-xl border border-primary/20 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-primary/20 bg-muted/50">
              <h3 className="font-semibold text-card-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-[#71717a]" /> Recent Lab Tests</h3>
            </div>
            <div className="divide-y divide-border p-2">
              {labResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#71717a]">No results available yet.</div>
              ) : labResults.map((lab, idx) => (
                <div key={idx} className="p-3 hover:bg-muted/50 rounded-xl transition-colors">
                  <p className="text-sm font-semibold text-card-foreground mb-0.5">{lab.test_name}</p>
                  <p className="text-xs text-[#71717a]">Result: <span className="font-medium text-foreground">{lab.result_value || 'Pending'}</span></p>
                  <div className="mt-2">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${lab.status === 'Completed' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>{lab.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
