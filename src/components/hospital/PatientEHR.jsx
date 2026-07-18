import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { powerSync } from '@/api/PowerSyncConnector';
import { Activity, Beaker, Bed, Search, User, ShieldAlert, Pill, FileText, AlertTriangle, AlertCircle, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PatientEHR({ patientId, companyId }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['univ_patients', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const res = await powerSync.execute(
        'SELECT * FROM univ_patients WHERE id = ?',
        [patientId]
      );
      return res.rows._array[0];
    },
    enabled: !!patientId
  });

  const { data: vitals = [] } = useQuery({
    queryKey: ['univ_vitals', patientId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM univ_vitals WHERE patient_id = ? ORDER BY recorded_at DESC',
        [patientId]
      );
      return res.rows._array;
    },
    enabled: !!patientId
  });

  const { data: allergies = [] } = useQuery({
    queryKey: ['univ_allergies', patientId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM univ_allergies WHERE patient_id = ?',
        [patientId]
      );
      return res.rows._array;
    },
    enabled: !!patientId
  });

  const { data: immunisations = [] } = useQuery({
    queryKey: ['univ_immunisations', patientId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM univ_immunisations WHERE patient_id = ? ORDER BY date_given DESC',
        [patientId]
      );
      return res.rows._array;
    },
    enabled: !!patientId
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ['univ_lab_results', patientId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM univ_lab_results WHERE patient_id = ? ORDER BY date DESC',
        [patientId]
      );
      return res.rows._array;
    },
    enabled: !!patientId
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['univ_prescriptions', patientId],
    queryFn: async () => {
      const res = await powerSync.execute(
        'SELECT * FROM univ_prescriptions WHERE patient_id = ? ORDER BY prescribed_date DESC',
        [patientId]
      );
      return res.rows._array;
    },
    enabled: !!patientId
  });

  if (patientLoading) {
    return <div className="p-8 text-center text-[#71717a]">{t("loading_ehr_data_")}</div>;
  }

  if (!patient) {
    return <div className="p-8 text-center text-[#71717a]">{t("patient_not_found_")}</div>;
  }

  const tabs = [
    { id: 'overview', label: t("overview"), icon: User },
    { id: 'vitals', label: t("vitals"), icon: Activity },
    { id: 'allergies', label: t("allergies"), icon: ShieldAlert },
    { id: 'prescriptions', label: t("prescriptions"), icon: Pill },
    { id: 'labs', label: t("lab_results"), icon: Beaker },
    { id: 'immunisations', label: t("immunisations"), icon: Syringe },
  ];

  return (
    <div className="bg-card rounded-xl border-[0.5px] border-black/9 dark:border-white/8 shadow-sm overflow-hidden flex flex-col h-[800px]">
      <div className="p-6 border-b border-black/9 dark:border-white/8 bg-slate-50/50 dark:bg-card/50 flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-semibold border-[0.5px] border-primary/20">
            {patient.first_name?.[0]}{patient.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">
              {patient.first_name} {patient.last_name}
            </h2>
            <div className="text-sm text-[#71717a] flex gap-3 mt-1">
              <span>{patient.gender || t('unknown')}</span>
              <span>•</span>
              <span>DOB: {patient.date_of_birth || t('na')}</span>
              <span>•</span>
              <span>ID: {patient.id?.slice(0,8)}</span>
            </div>
            {patient.denial_risk_score > 0.7 && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t("high_claim_denial_risk")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-black/9 dark:border-white/8 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-[#71717a] hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-card/30">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> {t("latest_vitals")}</h3>
              {vitals.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#71717a]">{t("blood_pressure")}</span>
                    <span className="font-medium">{vitals[0].blood_pressure}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#71717a]">{t("heart_rate")}</span>
                    <span className="font-medium">{vitals[0].heart_rate} bpm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#71717a]">{t("temperature")}</span>
                    <span className="font-medium">{vitals[0].temperature} °C</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#71717a]">{t("no_vitals_recorded_")}</p>
              )}
            </div>

            <div className="bg-card p-5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500" /> {t("allergies")}</h3>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map(a => (
                    <span key={a.id} className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                      {a.allergen} ({a.severity})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#71717a]">{t("no_known_allergies_")}</p>
              )}
            </div>
            
            <div className="bg-card p-5 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 col-span-1 md:col-span-2">
               <h3 className="font-semibold mb-4 flex items-center gap-2"><Pill className="w-4 h-4 text-primary" /> {t("active_prescriptions")}</h3>
               {prescriptions.filter(p => p.status === 'Active').length > 0 ? (
                 <div className="space-y-2">
                    {prescriptions.filter(p => p.status === 'Active').slice(0, 3).map(p => (
                       <div key={p.id} className="flex justify-between text-sm items-center p-2 rounded-lg border-[0.5px] border-black/5 dark:border-white/5 bg-slate-50 dark:bg-secondary/50">
                         <span className="font-medium">{p.medication_name}</span>
                         <span className="text-[#71717a]">{p.dosage}</span>
                       </div>
                    ))}
                 </div>
               ) : (
                  <p className="text-sm text-[#71717a]">{t("no_active_prescriptions_")}</p>
               )}
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-4">
            {vitals.map(vital => (
              <div key={vital.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#71717a] mb-1">{new Date(vital.recorded_at).toLocaleString()}</div>
                  <div className="flex gap-4">
                    <span className="text-sm"><b>BP:</b> {vital.blood_pressure}</span>
                    <span className="text-sm"><b>HR:</b> {vital.heart_rate} bpm</span>
                    <span className="text-sm"><b>Temp:</b> {vital.temperature} °C</span>
                    <span className="text-sm"><b>SpO2:</b> {vital.oxygen_saturation}%</span>
                  </div>
                </div>
                {vital.is_abnormal && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
                    <AlertCircle className="w-3 h-3" /> {t("abnormal")}
                  </span>
                )}
              </div>
            ))}
            {vitals.length === 0 && <p className="text-sm text-[#71717a] text-center mt-8">{t("no_vitals_data_found_")}</p>}
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-4">
            {labResults.map(lab => (
              <div key={lab.id} className={`bg-card p-4 rounded-xl border-[0.5px] ${lab.is_abnormal ? 'border-amber-300 bg-amber-50/10' : 'border-black/9 dark:border-white/8'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{lab.test_name}</h4>
                  <div className="text-xs text-[#71717a]">{new Date(lab.date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-semibold">{lab.result_value}</span>
                    <span className="text-sm text-[#71717a] ml-1">{lab.unit}</span>
                  </div>
                  {lab.is_abnormal && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      {t("out_of_range")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#71717a] mt-2">Ref Range: {lab.reference_range}</div>
              </div>
            ))}
            {labResults.length === 0 && <p className="text-sm text-[#71717a] text-center mt-8">{t("no_lab_results_found_")}</p>}
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            {prescriptions.map(p => (
              <div key={p.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-primary">{p.medication_name}</h4>
                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                    p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-sm"><b>{t("dosage")}</b> {p.dosage}</div>
                <div className="text-sm text-[#71717a]"><b>{t("instructions")}</b> {p.instructions}</div>
                <div className="text-xs text-[#71717a] mt-1 flex justify-between">
                  <span>Prescribed: {new Date(p.prescribed_date).toLocaleDateString()}</span>
                  {p.end_date && <span>Ends: {new Date(p.end_date).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
            {prescriptions.length === 0 && <p className="text-sm text-[#71717a] text-center mt-8">{t("no_prescriptions_found_")}</p>}
          </div>
        )}

        {activeTab === 'allergies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allergies.map(a => (
              <div key={a.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{a.allergen}</h4>
                  <div className="text-sm text-[#71717a] mt-1">{a.reaction}</div>
                </div>
                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md border ${
                  a.severity === 'Severe' ? 'bg-red-50 text-red-700 border-red-200' : 
                  a.severity === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                  'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {a.severity}
                </span>
              </div>
            ))}
            {allergies.length === 0 && <p className="text-sm text-[#71717a] text-center mt-8 col-span-2">{t("no_allergies_recorded_")}</p>}
          </div>
        )}
        
        {activeTab === 'immunisations' && (
          <div className="space-y-4">
            {immunisations.map(imm => (
              <div key={imm.id} className="bg-card p-4 rounded-xl border-[0.5px] border-black/9 dark:border-white/8 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-primary">{imm.vaccine_name}</h4>
                  <div className="text-sm text-[#71717a] mt-1">Administered by: {imm.administered_by}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{new Date(imm.date_given).toLocaleDateString()}</div>
                  {imm.next_due_date && <div className="text-xs text-amber-600 mt-1">Next Due: {new Date(imm.next_due_date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
            {immunisations.length === 0 && <p className="text-sm text-[#71717a] text-center mt-8">{t("no_immunisations_recorded_")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
