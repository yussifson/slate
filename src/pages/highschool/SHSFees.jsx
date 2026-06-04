import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSFees() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("shs_finance", "High School Finance")} subtitle="Manage PTA dues, Boarding fees, and general billing." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>SHS Finance module is under construction.</p>
      </div>
    </div>
  );
}
