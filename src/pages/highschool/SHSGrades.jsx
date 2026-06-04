import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSGrades() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("shs_grades", "WASSCE & Grading")} subtitle="Manage Core and Elective subject grading." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>SHS Grades module is under construction.</p>
      </div>
    </div>
  );
}
