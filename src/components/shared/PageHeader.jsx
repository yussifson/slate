import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="text-sm text-[#71717a] dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
