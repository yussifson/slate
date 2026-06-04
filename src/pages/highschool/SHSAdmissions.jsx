import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSAdmissions() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("shs_admissions", "High School Admissions")} subtitle="Manage CSSPS placements and entrance applications." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>SHS Admissions module is under construction.</p>
      </div>
    </div>
  );
}
