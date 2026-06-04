import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSDashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("shs_dashboard", "High School Dashboard")} subtitle="Overview of your high school campus." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>SHS Dashboard is under construction.</p>
      </div>
    </div>
  );
}
