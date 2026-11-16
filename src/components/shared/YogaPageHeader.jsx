import React from "react";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/dashboard": "Executive Dashboard",
  "/real-estate/properties": "Property Directory",
  "/real-estate/clients": "Client Directory & CRM",
  "/real-estate/viewings": "Viewings & Inspections",
  "/real-estate/offers": "Offers & Deals",
  "/real-estate/counter-offers": "Counter Offers",
  "/real-estate/crm-leads": "CRM & Inquiries",
  "/real-estate/leases": "Tenancy Leases",
  "/real-estate/lease-renewals": "Lease Renewals",
  "/real-estate/maintenance": "Property Maintenance",
  "/real-estate/contractors": "Contractors Directory",
  "/finance": "Finance & Accounting",
  "/finance/accounting": "Firm Accounting",
  "/invoices": "Invoices",
  "/jcl/project-finance": "Project Finance",
  "/jcl/procurement": "Procurement Overview",
  "/jcl/requisitions": "Requisitions",
  "/jcl/purchase-orders": "Purchase Orders",
  "/jcl/inventory": "Materials & Inventory",
  "/engineering": "Engineering & Projects",
  "/engineering/drawings": "Architectural Drawings",
  "/jcl/projects": "Construction Projects",
  "/jcl/project-operations": "Site Operations",
  "/jcl/project-collaboration": "Project Collaboration",
  "/boq": "Bill of Quantities (BOQ)",
  "/jcl/front-desk": "Front Desk & Visitors",
  "/jcl/item-register": "Item Register",
  "/jcl/employee-assets": "Asset Custody Register",
  "/hr": "HR Overview",
  "/team": "Staff & Employees",
  "/roles": "Roles & Permissions",
  "/departments": "Departments",
  "/attendance": "Attendance Tracking",
  "/performance": "Performance Reviews",
  "/calendar": "Operations Calendar",
  "/tasks": "Operational Tasks",
  "/time-tracking": "Time Tracking",
  "/pipeline": "Deal Pipelines",
  "/smart-docs": "Smart Documents",
  "/settings": "Workspace Settings",
};

export default function PageHeader({ title, subtitle, actions, breadcrumb }) {
  const location = useLocation();
  const pageTitle = title || PAGE_TITLES[location.pathname] || "Page";
  const today = format(new Date(), "EEEE, do MMMM yyyy");

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div>
        {breadcrumb && (
          <p className="text-xs text-muted-foreground mb-1 font-medium">{breadcrumb}</p>
        )}
        <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-snug">{pageTitle}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" />
            {today}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 sm:mt-1 w-full sm:w-auto justify-start sm:justify-end">{actions}</div>
      )}
    </div>
  );
}
