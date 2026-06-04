import { useTranslation } from "react-i18next";
import { ModuleBanner } from '@/components/school/SchoolViewKit';

export default function SHSHouses() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <ModuleBanner title={t("house_management", "House Management")} subtitle="Manage boarding houses, capacity, and Housemasters." />
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
        <p>House Management module is under construction.</p>
      </div>
    </div>
  );
}
