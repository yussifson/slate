import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import CompanyFormDialog from "@/components/superadmin/CompanyFormDialog";
import FirmStaffManager from "@/components/superadmin/FirmStaffManager";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { format } from "date-fns";

const COUNTRIES = ["Ghana", "Nigeria", "Sierra Leone"];

export default function Companies() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [managingStaffFirm, setManagingStaffFirm] = useState(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => base44.entities.Company.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: async ({ form, adminName }) => {
      const company = await base44.entities.Company.create(form);
      // If admin email provided, invite them and create staff record
      if (form.admin_email) {
        await base44.users.inviteUser(form.admin_email, "admin");
        await base44.entities.StaffRecord.create({
          company_id: company.id,
          user_email: form.admin_email,
          full_name: adminName || form.admin_email.split("@")[0],
          role: "company_admin",
          status: "active",
          currency: form.currency || "GHS",
        });
      }
      return company;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["companies"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["companies"] }); setEditingCompany(null); },
  });

  const filtered = companies.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
    const matchCountry = countryFilter === "all" || c.country === countryFilter;
    return matchSearch && matchCountry;
  });

  const columns = [
    {
      header: "Company",
      render: row => {
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{row.name?.[0]}</span>
            </div>
            <div>
              <p className="font-medium text-sm">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.email}</p>
            </div>
          </div>
        );
      }
    },
    { header: "Country", render: row => {
      return <span className="text-sm">{row.country}</span>;
    } },
    {
      header: "Plan",
      render: row => {
        return <Badge variant="outline" className="text-[10px] capitalize">{SUBSCRIPTION_PLANS[row.subscription_plan]?.name || row.subscription_plan}</Badge>;
      }
    },
    {
      header: "Subscription",
      render: row => {
        return (
          <Badge className={`text-[10px] ${row.subscription_status === "active" ? "bg-green-100 text-green-700" : row.subscription_status === "trial" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
            {row.subscription_status}
          </Badge>
        );
      }
    },
    {
      header: "Status",
      render: row => {
        return (
          <Badge className={`text-[10px] ${row.status === "active" ? "bg-green-100 text-green-700" : row.status === "suspended" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
            {row.status}
          </Badge>
        );
      }
    },
    {
      header: "Created",
      render: row => {
        return <span className="text-xs text-muted-foreground">{format(new Date(row.created_date), "MMM d, yyyy")}</span>;
      }
    },
    {
      header: "",
      render: row => {
        return (
          <Button
            variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); setManagingStaffFirm(row); }}
          >
            <Users className="w-3 h-3" /> {t("team", "Team")}
          </Button>
        );
      }
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        subtitle={`${companies.length} registered law firms`}
        actions={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> {t("add_company", "Add Company")}</Button>}
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search companies..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_countries", "All Countries")}</SelectItem>
            {COUNTRIES.map(c => {
              return <SelectItem key={c} value={c}>{c}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        onRowClick={(row) => setEditingCompany(row)}
        emptyTitle="No companies yet"
        emptyDescription="Register the first law firm to get started."
        emptyIcon={Building2}
      />
      <CompanyFormDialog
        open={showForm || !!editingCompany}
        onClose={() => { setShowForm(false); setEditingCompany(null); }}
        onSubmit={({ form, adminName }) => editingCompany ? updateMutation.mutate({ id: editingCompany.id, data: form }) : createMutation.mutate({ form, adminName })}
        initialData={editingCompany}
      />
      {managingStaffFirm && (
        <FirmStaffManager
          firm={managingStaffFirm}
          onClose={() => setManagingStaffFirm(null)}
        />
      )}
    </div>
  );
}