import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSProgrammes() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("academic_programmes", "Academic Programmes")} subtitle="Manage Sciences, Arts, Business, and Core vs Elective subjects." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>Programmes module is under construction.</p>
      </div>
    </div>
  );
}
