/**
 * Enhanced export and branded corporate print engine.
 * Embeds corporate header, logo, official timestamps, styled summary table, and watermark.
 */

export function exportToCSV(data, filename, companyInfo = {}) {
  if (!data || data.length === 0) return;
  const keys = Object.keys(data[0]);
  const header = keys.map(k => `"${String(k).replace(/_/g, ' ').toUpperCase()}"`).join(",");
  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k] ?? "";
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );

  const compHeader = companyInfo?.name
    ? `"${companyInfo.name} - Official Corporate Export"\n"Generated: ${new Date().toLocaleString()}"\n\n`
    : "";

  const csv = "\uFEFF" + compHeader + [header, ...rows].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function exportToJSON(data, filename) {
  if (!data || data.length === 0) return;
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Branded Corporate Print
 * Opens an executive print-formatted document window with company branding, table data, and styling.
 */
export function printCorporateDoc({ title, subtitle, data, columns, company = {} }) {
  if (!data || data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }));
  const companyName = company?.name || company?.company_name || 'JCL Group';
  const companyLogo = company?.logo_url || company?.avatar_url || '';
  const tagline = company?.tagline || 'Excellence In Property & Engineering Solutions';
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title || 'Corporate Report'} - ${companyName}</title>
  <style>
    @media print {
      @page { margin: 15mm 12mm 15mm 12mm; size: auto; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #005A9C;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo {
      height: 48px;
      width: auto;
      object-fit: contain;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #005A9C;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .company-tagline {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .doc-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 11px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-bottom: 2px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      background: #e2e8f0;
      color: #334155;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-left">
      ${companyLogo ? `<img src="${companyLogo}" class="logo" alt="Logo" />` : `<div style="width:40px;height:40px;border-radius:8px;background:#005A9C;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;">${companyName.charAt(0)}</div>`}
      <div>
        <h1 class="company-title">${companyName}</h1>
        <div class="company-tagline">${tagline}</div>
      </div>
    </div>
    <div class="doc-meta">
      <h2 class="doc-title">${title}</h2>
      <div class="doc-sub">${subtitle || 'Official Record'} • ${genDate}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        ${cols.map(c => `<th>${c.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
        <tr>
          ${cols.map(c => {
            const val = row[c.key] ?? '';
            const display = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return `<td>${display}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>CONFIDENTIAL • FOR OFFICIAL USE ONLY • ${companyName}</div>
    <div>Page 1 of 1 • System Generated on ${genDate}</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
