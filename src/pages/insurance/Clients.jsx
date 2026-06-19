import { useTranslation } from "react-i18next";
import React from 'react';

const InsuranceClients = () => {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 tracking-[-0.02em]">{t("insurance_clients", "Insurance Clients")}</h1>
      <p className="text-[#71717a] dark:text-gray-400">{t("manage_your_insurance_clients_", "Manage your insurance clients here.")}</p>
    </div>
  );
};

export default InsuranceClients;
