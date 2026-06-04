import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSTimetable() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("shs_timetable", "Timetable & Scheduling")} subtitle="Manage academic periods and campus events." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>SHS Timetable module is under construction.</p>
      </div>
    </div>
  );
}
