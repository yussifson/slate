import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, FileJson } from "lucide-react";
import { exportToCSV, exportToJSON } from "@/lib/exportUtils";

export default function ExportButton({ data, filename, label = "Export" }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2.5">
          <Download className="w-3.5 h-3.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(data, filename)} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-primary" />
          {t("export_as_csv", "Export as CSV")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToJSON(data, filename)} className="gap-2 cursor-pointer">
          <FileJson className="w-4 h-4 text-primary" />
          {t("export_as_json", "Export as JSON")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}