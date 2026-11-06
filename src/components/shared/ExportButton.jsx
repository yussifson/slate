import { useTranslation } from "react-i18next";
import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Download, FileText, FileJson, Printer } from "lucide-react";
import { exportToCSV, exportToJSON, printCorporateDoc } from "@/lib/exportUtils";
import { useCompany } from "@/hooks/useCompanyId";

export default function ExportButton({ data, filename, label = "Export", title, subtitle, columns }) {
  const { t } = useTranslation();
  const { data: company } = useCompany();

  const docTitle = title || filename?.replace(/[_-]/g, ' ') || 'Corporate Report';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-medium border-border/80">
          <Download className="w-3.5 h-3.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => printCorporateDoc({ title: docTitle, subtitle, data, columns, company })} className="gap-2 cursor-pointer font-medium text-xs">
          <Printer className="w-4 h-4 text-primary" />
          {t("print_corporate_doc", "Print with Branding")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportToCSV(data, filename, company)} className="gap-2 cursor-pointer text-xs">
          <FileText className="w-4 h-4 text-emerald-600" />
          {t("export_as_csv", "Export CSV (Excel)")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToJSON(data, filename)} className="gap-2 cursor-pointer text-xs">
          <FileJson className="w-4 h-4 text-blue-600" />
          {t("export_as_json", "Export JSON")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
