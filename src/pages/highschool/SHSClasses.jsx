import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSClasses() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("shs_classes", "High School Classes")} subtitle="Manage forms, streams, and assigned tutors." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>SHS Classes module is under construction.</p>
      </div>
    </div>
  );
}
