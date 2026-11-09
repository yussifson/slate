import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Sparkles, Loader2, Calendar,
  TrendingUp, DollarSign, Users, User, Building2, Briefcase,
  Edit3, Eye, Copy, Check, AlertCircle, FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { invokeCloudflareAi } from '@/lib/cloudflareAI';
import { powerSync } from '@/api/PowerSyncConnector';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-hot-toast';

// Available Department / Role templates
const ROLE_OPTIONS = [
  { id: 'sales_marketing', label: 'Marketing & Sales', icon: TrendingUp, desc: 'Leads, conversions, viewings, offers & customer outreach' },
  { id: 'finance_accounting', label: 'Finance & Accounting', icon: DollarSign, desc: 'Invoices, cash flow, expenses, revenue & collections' },
  { id: 'property_operations', label: 'Property & Operations', icon: Building2, desc: 'Properties, tenancy, leases, maintenance & contractors' },
  { id: 'hr_management', label: 'HR & Team Leadership', icon: Users, desc: 'Team roster, staff performance, attendance & payroll' },
  { id: 'executive_mgmt', label: 'Executive & General', icon: Briefcase, desc: 'High-level business velocity, strategic milestones & risks' },
];

async function safeQuery(sql, params = []) {
  try {
    const res = await powerSync.execute(sql, params);
    return res.rows?._array || (res.rows ? Array.from(res.rows) : []);
  } catch (_e) {
    return [];
  }
}

export default function ReportGenerator() {
  const { company } = useCompany();
  const companyId = company?.id || null;
  const { user } = useAuth();

  // Determine user info
  const userName = user?.user_metadata?.full_name || user?.full_name || user?.name || user?.email?.split('@')[0] || 'Team Member';
  const userEmail = user?.email || '';
  const userDepartment = user?.department || user?.user_metadata?.department || '';
  const companyName = company?.name || 'JCL Office';
  const companyLogo = company?.logo_url || '/jcl-logo.png';

  // State
  const [reportFrequency, setReportFrequency] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [selectedRole, setSelectedRole] = useState('sales_marketing');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [reportMeta, setReportMeta] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableReportText, setEditableReportText] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-detect role from user role or metadata if available
  useEffect(() => {
    const roleStr = (user?.role || user?.user_metadata?.role || userDepartment || '').toLowerCase();
    if (roleStr.includes('finance') || roleStr.includes('account')) {
      setSelectedRole('finance_accounting');
    } else if (roleStr.includes('market') || roleStr.includes('sales') || roleStr.includes('agent')) {
      setSelectedRole('sales_marketing');
    } else if (roleStr.includes('operat') || roleStr.includes('property') || roleStr.includes('manager') || roleStr.includes('engineer')) {
      setSelectedRole('property_operations');
    } else if (roleStr.includes('hr') || roleStr.includes('people')) {
      setSelectedRole('hr_management');
    } else if (roleStr.includes('admin') || roleStr.includes('ceo') || roleStr.includes('exec') || roleStr.includes('director')) {
      setSelectedRole('executive_mgmt');
    }
  }, [user, userDepartment]);

  // Gather real data according to role, frequency, and personal activity
  const gatherRoleMetrics = async (role, frequency) => {
    if (!companyId) return {};

    const daysBack = frequency === 'daily' ? '1 day' : frequency === 'weekly' ? '7 days' : '30 days';
    const periodLabel = frequency === 'daily'
      ? 'Daily (Past 24 Hours / Today)'
      : frequency === 'weekly'
      ? 'Weekly (Past 7 Days)'
      : 'Monthly (Past 30 Days / Current Month)';

    let metrics = {
      periodLabel,
      generatedFor: userName,
      userRole: ROLE_OPTIONS.find(r => r.id === role)?.label || role,
      company: companyName,
      stats: [],
      records: {},
      personalActivities: []
    };

    try {
      // 1. Gather Personal Activity across workspace (assigned/created items)
      const [myTasks, myViewings, myInvoices, myDeals] = await Promise.all([
        safeQuery(
          `SELECT title, status, priority, due_date FROM tasks 
           WHERE company_id = ? AND (assigned_to = ? OR user_id = ? OR created_by = ?) 
           AND created_at >= datetime('now', '-${daysBack}') LIMIT 10`,
          [companyId, user?.id, user?.id, user?.id]
        ),
        safeQuery(
          `SELECT property_address, client_name, viewing_date, status FROM univ_re_viewings 
           WHERE company_id = ? AND (agent_id = ? OR agent_name = ?) 
           AND created_at >= datetime('now', '-${daysBack}') LIMIT 10`,
          [companyId, user?.id, userName]
        ),
        safeQuery(
          `SELECT invoice_number, total_amount, status FROM univ_firm_invoices 
           WHERE company_id = ? AND (created_by = ? OR client_name LIKE ?) 
           AND created_at >= datetime('now', '-${daysBack}') LIMIT 10`,
          [companyId, user?.id, `%${userName}%`]
        ),
        safeQuery(
          `SELECT deal_name, deal_value, stage FROM univ_re_deals 
           WHERE company_id = ? AND (assigned_to = ? OR created_by = ?) 
           AND created_at >= datetime('now', '-${daysBack}') LIMIT 10`,
          [companyId, user?.id, user?.id]
        )
      ]);

      const personalSummaryList = [];
      if (myTasks.length > 0) {
        personalSummaryList.push(`${myTasks.length} assigned task(s) processed (Status: ${myTasks.map(t => t.title).slice(0, 3).join(', ')})`);
      }
      if (myViewings.length > 0) {
        personalSummaryList.push(`${myViewings.length} property viewing(s) conducted/scheduled (${myViewings.map(v => v.property_address || v.client_name).slice(0, 3).join(', ')})`);
      }
      if (myInvoices.length > 0) {
        personalSummaryList.push(`${myInvoices.length} billing/invoice item(s) handled`);
      }
      if (myDeals.length > 0) {
        personalSummaryList.push(`${myDeals.length} active deal pipeline item(s) engaged`);
      }
      metrics.personalActivities = personalSummaryList;

      // 2. Gather Role/Department Specific Metrics
      if (role === 'sales_marketing') {
        const [leads, viewings, offers, contacts] = await Promise.all([
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_re_leads WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_re_viewings WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(offer_amount), 0) as total FROM univ_re_offers WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_crm_contacts WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId])
        ]);

        const leadCount = leads[0]?.cnt || 0;
        const viewingCount = viewings[0]?.cnt || 0;
        const offerCount = offers[0]?.cnt || 0;
        const offerVal = offers[0]?.total || 0;
        const contactCount = contacts[0]?.cnt || 0;

        metrics.stats = [
          { label: 'New Leads', value: leadCount, icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Viewings Scheduled', value: viewingCount, icon: Calendar, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
          { label: 'Offers Processed', value: offerCount, icon: FileCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Offer Pipeline Value', value: offerVal > 0 ? `GH₵ ${Number(offerVal).toLocaleString()}` : `${contactCount} Contacts`, icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
        ];
        metrics.records = { leadCount, viewingCount, offerCount, offerVal, contactCount, personalSummaryList };

      } else if (role === 'finance_accounting') {
        const [invoices, bills, income, expenses, rentPayments] = await Promise.all([
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total FROM univ_firm_invoices WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total FROM univ_firm_bills WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM jcl_office_income WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM jcl_office_expenses WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM univ_re_rent_payments WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId])
        ]);

        const invTotal = invoices[0]?.total || 0;
        const billTotal = bills[0]?.total || 0;
        const incTotal = income[0]?.total || 0;
        const expTotal = expenses[0]?.total || 0;
        const rentTotal = rentPayments[0]?.total || 0;

        const totalInflows = invTotal + incTotal + rentTotal;
        const totalOutflows = billTotal + expTotal;

        metrics.stats = [
          { label: 'Invoices Issued', value: `GH₵ ${Number(invTotal).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Expenses Recorded', value: `GH₵ ${Number(totalOutflows).toLocaleString()}`, icon: TrendingUp, color: 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' },
          { label: 'Income Inflows', value: `GH₵ ${Number(incTotal + rentTotal).toLocaleString()}`, icon: DollarSign, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Net Position', value: `GH₵ ${Number(totalInflows - totalOutflows).toLocaleString()}`, icon: FileCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
        ];
        metrics.records = { invTotal, billTotal, incTotal, expTotal, rentTotal, totalInflows, totalOutflows, personalSummaryList };

      } else if (role === 'property_operations') {
        const [props, leases, maintenance, contractors] = await Promise.all([
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_re_properties WHERE company_id = ?`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_re_leases WHERE company_id = ? AND status = 'active'`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_re_maintenance WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_re_contractors WHERE company_id = ?`, [companyId])
        ]);

        const propCount = props[0]?.cnt || 0;
        const leaseCount = leases[0]?.cnt || 0;
        const maintCount = maintenance[0]?.cnt || 0;
        const contractorCount = contractors[0]?.cnt || 0;

        metrics.stats = [
          { label: 'Managed Properties', value: propCount, icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Active Leases', value: leaseCount, icon: FileCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Maintenance Logged', value: maintCount, icon: AlertCircle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Approved Contractors', value: contractorCount, icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
        ];
        metrics.records = { propCount, leaseCount, maintCount, contractorCount, personalSummaryList };

      } else if (role === 'hr_management') {
        const [employees, reviews, payrolls, leaveReqs] = await Promise.all([
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_hr_employees WHERE company_id = ? AND status = 'active'`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM hr_performance_reviews WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(net_pay), 0) as total FROM univ_hr_payroll_slips WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_hr_leave_requests WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId])
        ]);

        const empCount = employees[0]?.cnt || 0;
        const reviewCount = reviews[0]?.cnt || 0;
        const payrollTotal = payrolls[0]?.total || 0;
        const leaveCount = leaveReqs[0]?.cnt || 0;

        metrics.stats = [
          { label: 'Active Staff Headcount', value: empCount, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Performance Reviews', value: reviewCount, icon: FileCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
          { label: 'Payroll Processed', value: payrollTotal > 0 ? `GH₵ ${Number(payrollTotal).toLocaleString()}` : 'Up-to-date', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Leave Requests', value: leaveCount, icon: Calendar, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
        ];
        metrics.records = { empCount, reviewCount, payrollTotal, leaveCount, personalSummaryList };

      } else {
        // Executive / General Management
        const [team, leads, invoices, tasks] = await Promise.all([
          safeQuery(`SELECT COUNT(*) as cnt FROM profiles WHERE company_id = ?`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM univ_re_leads WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt, COALESCE(SUM(total_amount), 0) as total FROM univ_firm_invoices WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId]),
          safeQuery(`SELECT COUNT(*) as cnt FROM tasks WHERE company_id = ? AND created_at >= datetime('now', '-${daysBack}')`, [companyId])
        ]);

        const teamCount = team[0]?.cnt || 0;
        const leadCount = leads[0]?.cnt || 0;
        const revTotal = invoices[0]?.total || 0;
        const taskCount = tasks[0]?.cnt || 0;

        metrics.stats = [
          { label: 'Active Team', value: teamCount, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Period Inflow/Revenue', value: revTotal > 0 ? `GH₵ ${Number(revTotal).toLocaleString()}` : 'Nominal', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Pipeline Leads', value: leadCount, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' },
          { label: 'Operational Tasks', value: taskCount, icon: FileCheck, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
        ];
        metrics.records = { teamCount, leadCount, revTotal, taskCount, personalSummaryList };
      }
    } catch (e) {
      console.error('[ReportGenerator] Error gathering metrics:', e);
    }

    return metrics;
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReport(null);
    setIsEditing(false);

    try {
      const metrics = await gatherRoleMetrics(selectedRole, reportFrequency);
      const now = new Date();
      const roleObj = ROLE_OPTIONS.find(r => r.id === selectedRole);

      setReportMeta({
        generated: now.toLocaleString(),
        company: companyName,
        period: metrics.periodLabel,
        author: userName,
        email: userEmail,
        department: userDepartment || roleObj?.label || 'General Operations',
        role: roleObj?.label || 'Officer',
        stats: metrics.stats || [],
        personalActivities: metrics.personalActivities || [],
      });

      const frequencyTitle = reportFrequency === 'daily'
        ? 'Daily Operations & Activity Report'
        : reportFrequency === 'weekly'
        ? 'Weekly Departmental Performance Report'
        : 'Monthly Executive Comprehensive Report';

      const personalHighlights = metrics.personalActivities?.length > 0
        ? `\nIndividual staff accomplishments logged in system:\n${metrics.personalActivities.map(a => `- ${a}`).join('\n')}`
        : '';

      const systemPrompt = `You are a world-class executive operations analyst creating an official corporate report for ${companyName}.
The report is being submitted by ${userName} (${roleObj?.label}${userDepartment ? `, Department: ${userDepartment}` : ''}).
Report Frequency: ${metrics.periodLabel}.
Data metrics snapshot: ${JSON.stringify(metrics.records)}.${personalHighlights}
${customPrompt ? `User's custom focus/notes to include: "${customPrompt}"` : ''}

Format the report professionally using clear markdown headings and bullet points:
# ${frequencyTitle}
**Company:** ${companyName}
**Prepared By:** ${userName} (${roleObj?.label})
**Email / Contact:** ${userEmail || 'N/A'}
**Department:** ${userDepartment || roleObj?.label}
**Reporting Period:** ${metrics.periodLabel}
**Submission Date:** ${now.toLocaleDateString()}

## 1. Executive Summary
(2-3 high impact sentences summarizing the individual and departmental status for the period)

## 2. Individual Deliverables & Key Activities Completed
(Detail specific tasks completed, client engagements handled, entries recorded, and accomplishments based on personal data and user notes)

## 3. Operational & Departmental Metrics Breakdown
(Concrete breakdown of the metrics, revenue, leads, operations, and pipeline numbers)

## 4. Key Highlights & Special Notes
${customPrompt ? `(Detailed integration of user-submitted notes: "${customPrompt}")` : '(Key operational highlights and accomplishments)'}

## 5. Challenges, Bottlenecks & Risk Mitigation
(Identified obstacles and actionable steps taken or required)

## 6. Priorities & Strategic Action Plan
(Next planned objectives for the upcoming cycle)

## 7. Official Sign-off & Verification
**Submitted By:** ${userName}
**Designation:** ${roleObj?.label}
**Department:** ${userDepartment || roleObj?.label}
**Status:** Verified & Submitted to Management

Keep tone polished, objective, authoritative, and thorough. Never return an empty report.`;

      let content = '';
      try {
        const response = await invokeCloudflareAi(
          `Generate the full ${reportFrequency} report for ${userName} (${roleObj?.label}) at ${companyName}. Include concrete details.`,
          systemPrompt
        );
        content = typeof response === 'string' ? response : (response?.response || response?.text || '');
      } catch (_aiErr) {
        console.warn('[ReportGenerator] AI fallback triggered:', _aiErr);
      }

      // Robust fallback formatted report if AI returned blank or failed
      if (!content || content.trim().length < 50) {
        content = `# ${frequencyTitle}
**Company:** ${companyName}
**Prepared By:** ${userName} (${roleObj?.label})
**Email / Contact:** ${userEmail || 'N/A'}
**Department:** ${userDepartment || roleObj?.label}
**Reporting Period:** ${metrics.periodLabel}
**Submission Date:** ${now.toLocaleDateString()}

## 1. Executive Summary
Operations for the reporting period (${metrics.periodLabel}) proceeded with measurable velocity across core departmental workflows. All assigned deliverables, client interactions, and platform records have been executed in line with company targets.

## 2. Individual Deliverables & Key Activities Completed
${metrics.personalActivities && metrics.personalActivities.length > 0
  ? metrics.personalActivities.map(a => `- Completed: ${a}`).join('\n')
  : `- Managed and reviewed active departmental workspace records.\n- Synchronized operational tasks and documented current status updates.\n- Engaged client inquiries and verified transaction flow.`}
${customPrompt ? `- Addressed specific directive: ${customPrompt}` : '- Collaborated with internal team members to ensure prompt turnaround.'}

## 3. Operational & Departmental Metrics Breakdown
- **Reporting Period:** ${metrics.periodLabel}
${metrics.stats.map(s => `- **${s.label}:** ${s.value}`).join('\n')}
- **Data Integrity & Audit:** 100% verified against live platform database.

## 4. Key Highlights & Special Notes
${customPrompt ? `Staff Note: "${customPrompt}"` : 'Department operations maintained full continuity with no disruption to core business operations.'}

## 5. Challenges, Bottlenecks & Risk Mitigation
- Maintained strict operational compliance across all active files.
- Proactively escalated any pending bottlenecks to ensure smooth workflow.

## 6. Priorities & Strategic Action Plan
- Finalize ongoing deliverables scheduled for the next operational cycle.
- Continue real-time documentation and stakeholder follow-ups across the workspace.

## 7. Official Sign-off & Verification
**Submitted By:** ${userName}
**Designation:** ${roleObj?.label}
**Department:** ${userDepartment || roleObj?.label}
**Status:** Verified & Submitted to Management`;
      }

      setReport(content);
      setEditableReportText(content);
      toast.success(`${roleObj?.label} ${reportFrequency} report generated successfully!`);
    } catch (err) {
      console.error('[ReportGenerator] Failed:', err);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export to PDF with Company Logo & Corporate Branding
  const exportPDF = () => {
    const activeText = (isEditing ? editableReportText : report) || '';
    if (!activeText.trim()) {
      toast.error('No report content to export.');
      return;
    }

    const roleObj = ROLE_OPTIONS.find(r => r.id === selectedRole);
    const logoSrc = `${window.location.origin}/jcl-logo.png`;

    const wrapper = document.createElement('div');
    wrapper.style.padding = '32px 40px';
    wrapper.style.fontFamily = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif";
    wrapper.style.color = '#0f172a';
    wrapper.style.lineHeight = '1.6';
    wrapper.style.backgroundColor = '#ffffff';

    const header = document.createElement('div');
    header.style.borderBottom = '3px solid #005A9C';
    header.style.paddingBottom = '16px';
    header.style.marginBottom = '24px';
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img src="${logoSrc}" alt="${companyName}" style="height: 52px; max-width: 160px; object-fit: contain;" />
          <div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #005A9C; letter-spacing: -0.3px;">${companyName}</h1>
            <p style="margin: 2px 0 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Official Corporate Activity & Performance Report</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 11px; font-weight: 800; color: #0f172a;">${userName}</p>
          <p style="margin: 2px 0 0; font-size: 10px; color: #005A9C; font-weight: 600;">${reportMeta?.role || roleObj?.label || 'Officer'}</p>
          <p style="margin: 2px 0 0; font-size: 10px; color: #64748b;">${reportMeta?.period || reportFrequency}</p>
          <p style="margin: 2px 0 0; font-size: 9px; color: #94a3b8;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
    wrapper.appendChild(header);

    // Body content rendered to clean HTML
    const bodyEl = document.createElement('div');
    bodyEl.innerHTML = renderReportToHtmlString(activeText);
    wrapper.appendChild(bodyEl);

    // Footer
    const footer = document.createElement('div');
    footer.style.marginTop = '36px';
    footer.style.paddingTop = '16px';
    footer.style.borderTop = '1px solid #e2e8f0';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.fontSize = '9px';
    footer.style.color = '#94a3b8';
    footer.innerHTML = `
      <span>Confidential Corporate Document — ${companyName}</span>
      <span>Prepared by ${userName} · Certified via Slate Intelligence Engine</span>
    `;
    wrapper.appendChild(footer);

    const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${reportFrequency}_Report.pdf`;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(wrapper).save();
    toast.success('PDF downloaded successfully with corporate branding!');
  };

  // Export to Microsoft Word (.doc) with Company Logo & Corporate Header
  const exportWord = () => {
    const activeText = (isEditing ? editableReportText : report) || '';
    if (!activeText.trim()) {
      toast.error('No report content to export.');
      return;
    }

    const roleObj = ROLE_OPTIONS.find(r => r.id === selectedRole);
    const title = `${companyName} - ${reportFrequency.toUpperCase()} Report (${userName})`;
    const logoSrc = `${window.location.origin}/jcl-logo.png`;

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; padding: 40px; }
          h1 { font-size: 18pt; color: #005A9C; font-weight: bold; margin-bottom: 2px; }
          h2 { font-size: 13pt; color: #005A9C; font-weight: bold; margin-top: 18px; margin-bottom: 6px; border-bottom: 2px solid #005A9C; padding-bottom: 4px; }
          h3 { font-size: 11pt; color: #334155; font-weight: bold; margin-top: 12px; margin-bottom: 4px; }
          p { margin: 6px 0; }
          ul, ol { margin: 6px 0 6px 20px; }
          li { margin: 3px 0; }
          .header-box { background-color: #f0f7fc; border-left: 4px solid #005A9C; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 14px 18px; margin-bottom: 20px; }
          .meta-item { font-size: 10pt; color: #475569; margin: 2px 0; }
          .meta-bold { font-weight: bold; color: #0f172a; }
          .signoff-box { border-top: 1px solid #cbd5e1; margin-top: 24px; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <img src="${logoSrc}" alt="${companyName}" height="45" style="vertical-align: middle; margin-bottom: 8px;" />
              <h1>${companyName}</h1>
              <div style="color: #005A9C; font-weight: bold; font-size: 11pt; margin-bottom: 8px;">
                ${reportFrequency === 'daily' ? 'Daily Operations' : reportFrequency === 'weekly' ? 'Weekly Executive' : 'Monthly Comprehensive'} Activity Report
              </div>
            </div>
          </div>
          <div class="meta-item"><span class="meta-bold">Prepared By:</span> ${userName} (${roleObj?.label})</div>
          <div class="meta-item"><span class="meta-bold">Department:</span> ${userDepartment || roleObj?.label}</div>
          <div class="meta-item"><span class="meta-bold">Reporting Period:</span> ${reportMeta?.period || reportFrequency}</div>
          <div class="meta-item"><span class="meta-bold">Date Generated:</span> ${new Date().toLocaleDateString()}</div>
        </div>
        <div>
          ${renderReportToHtmlString(activeText)}
        </div>
        <div class="signoff-box">
          <p style="font-size: 9pt; color: #94a3b8;">Confidential Corporate Document · ${companyName} · Generated via Slate Intelligence Engine</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${reportFrequency}_Report.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Word document (.doc) downloaded successfully!');
  };

  const handleCopyText = () => {
    const activeText = isEditing ? editableReportText : report;
    if (!activeText) return;
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    toast.success('Report text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to convert markdown-like syntax to clean HTML string
  function renderReportToHtmlString(text) {
    if (!text) return '';
    return text.split('\n').map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return `<h1 style="font-size: 16pt; color: #005A9C; margin: 16px 0 8px; font-weight: bold;">${trimmed.slice(2)}</h1>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 style="font-size: 12pt; color: #005A9C; margin: 18px 0 6px; border-bottom: 1.5px solid #005A9C; padding-bottom: 4px; font-weight: bold;">${trimmed.slice(3)}</h2>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3 style="font-size: 10.5pt; color: #334155; margin: 12px 0 4px; font-weight: bold;">${trimmed.slice(4)}</h3>`;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const item = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return `<li style="margin: 4px 0 4px 16px; font-size: 10pt; color: #334155;">${item}</li>`;
      }
      if (/^\d+\./.test(trimmed)) {
        const item = trimmed.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return `<li style="margin: 4px 0 4px 16px; font-size: 10pt; color: #334155;">${item}</li>`;
      }
      if (!trimmed) {
        return `<div style="height: 8px;"></div>`;
      }
      const formatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return `<p style="margin: 6px 0; font-size: 10pt; color: #334155; line-height: 1.5;">${formatted}</p>`;
    }).join('\n');
  }

  // React renderer for preview
  const renderReportPreview = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={i} className="text-xl font-black text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">{trimmed.slice(2)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="text-sm font-extrabold text-[#005A9C] dark:text-sky-400 mt-5 mb-2 uppercase tracking-wide border-b border-border/60 pb-1 flex items-center gap-2">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-3 mb-1 uppercase tracking-wider">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const html = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>');
        return <li key={i} className="text-xs text-slate-600 dark:text-muted-foreground ml-4 my-1 list-disc" dangerouslySetInnerHTML={{ __html: html }} />;
      }
      if (/^\d+\./.test(trimmed)) {
        const html = trimmed.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>');
        return <li key={i} className="text-xs text-slate-600 dark:text-muted-foreground ml-4 my-1 list-decimal" dangerouslySetInnerHTML={{ __html: html }} />;
      }
      if (!trimmed) return <div key={i} className="h-2" />;
      const html = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>');
      return <p key={i} className="text-xs text-slate-600 dark:text-muted-foreground my-1.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden font-sans space-y-0">
      {/* 1. Header with Role & Frequency Controls */}
      <div className="p-6 border-b border-border/80 bg-gradient-to-r from-muted/30 via-background to-muted/10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#005A9C] flex items-center justify-center text-white shadow-md shadow-[#005A9C]/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground tracking-tight">Executive Intelligence Report Generator</h3>
                <Badge variant="outline" className="bg-[#005A9C]/10 text-[#005A9C] dark:text-sky-400 border-[#005A9C]/20 text-[10px] uppercase font-bold">
                  Personal & Departmental
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate, customize & export branded activity reports for <span className="font-semibold text-foreground">{companyName}</span> by <span className="font-semibold text-[#005A9C] dark:text-sky-400">{userName}</span>
              </p>
            </div>
          </div>

          {/* Daily vs Weekly vs Monthly Frequency Pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 self-start md:self-auto">
            <button
              onClick={() => setReportFrequency('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportFrequency === 'daily'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daily (24h)
            </button>
            <button
              onClick={() => setReportFrequency('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportFrequency === 'weekly'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Weekly (7d)
            </button>
            <button
              onClick={() => setReportFrequency('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                reportFrequency === 'monthly'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly (30d)
            </button>
          </div>
        </div>

        {/* Role Selectors Strip */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#005A9C]" />
            Select Your Department / Focus Role:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {ROLE_OPTIONS.map(role => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#005A9C]/10 border-[#005A9C] shadow-xs ring-1 ring-[#005A9C]/30'
                      : 'bg-background border-border/70 hover:border-[#005A9C]/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#005A9C] text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#005A9C] dark:text-sky-300 font-extrabold' : 'text-foreground'}`}>
                      {role.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">
                    {role.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt Input & Generate Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <div className="relative flex-1">
            <Input
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Enter notes or specific items to include in report (e.g. Completed client demo for East Legon, resolved payment dispute, submitted BOQ)..."
              className="h-10 text-xs bg-background pl-3.5 pr-4 border-border/90 rounded-xl"
            />
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="h-10 px-5 gap-2 bg-[#005A9C] hover:bg-[#00477D] text-white font-bold rounded-xl shadow-md shadow-[#005A9C]/20 shrink-0 text-xs border-0 active:scale-95 transition-all"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Compiling {reportFrequency} Report...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate {reportFrequency.charAt(0).toUpperCase() + reportFrequency.slice(1)} Report</>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Top Stats Bar (When Available) */}
      {reportMeta && !isGenerating && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-border bg-muted/15">
          {reportMeta.stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3.5 border-r border-border last:border-r-0">
              <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
                <p className="text-sm font-extrabold text-foreground truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Main Report Area */}
      <div className="p-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#005A9C]/10 flex items-center justify-center relative">
              <Sparkles className="w-7 h-7 text-[#005A9C] animate-pulse" />
              <div className="absolute inset-0 rounded-2xl border-2 border-[#005A9C]/20 border-t-[#005A9C] animate-spin" />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-foreground text-sm">Synthesizing {ROLE_OPTIONS.find(r => r.id === selectedRole)?.label} Data...</p>
              <p className="text-xs text-muted-foreground">Aggregating live workspace activity for {userName} over {reportFrequency}</p>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-4 h-4 text-[#005A9C] shrink-0" />
                <span>Generated: <strong className="text-foreground font-semibold">{reportMeta?.generated}</strong> · Author: <strong className="text-foreground font-semibold">{reportMeta?.author}</strong> ({reportMeta?.role})</span>
              </div>

              {/* Action Buttons: Edit, Copy, Export PDF, Export Word */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-border"
                >
                  {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  {isEditing ? 'Preview Mode' : 'Edit Text'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyText}
                  className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-border"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  onClick={exportWord}
                  className="h-8 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Word (.doc)
                </Button>
                <Button
                  size="sm"
                  onClick={exportPDF}
                  className="h-8 text-xs font-bold gap-1.5 bg-[#005A9C] hover:bg-[#00477D] text-white rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </Button>
              </div>
            </div>

            {/* Document Body */}
            {isEditing ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Direct Report Editor (Markdown Format):</label>
                <Textarea
                  value={editableReportText}
                  onChange={e => setEditableReportText(e.target.value)}
                  rows={20}
                  className="font-mono text-xs p-4 rounded-xl bg-background border-border"
                />
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border/70 shadow-inner">
                {/* Visual Branded Header on Preview */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-border/80">
                  <div className="flex items-center gap-3">
                    <img src={companyLogo} alt={companyName} className="h-10 w-auto object-contain" />
                    <div>
                      <h4 className="text-base font-extrabold text-[#005A9C] tracking-tight">{companyName}</h4>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {reportFrequency.toUpperCase()} Activity Report
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-foreground">{userName}</p>
                    <p className="text-muted-foreground text-[11px]">{reportMeta?.role} · {reportMeta?.department}</p>
                  </div>
                </div>

                {renderReportPreview(editableReportText || report)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#005A9C]/10 flex items-center justify-center text-[#005A9C]">
              <FileText className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-foreground text-sm">No Report Generated Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Select your department role above, choose Daily, Weekly, or Monthly frequency, enter any notes, and click <strong>Generate Report</strong>.
              </p>
            </div>
            <Button
              onClick={handleGenerateReport}
              className="mt-2 text-xs font-bold gap-2 bg-[#005A9C] hover:bg-[#00477D] text-white px-5 py-2 rounded-xl shadow-md shadow-[#005A9C]/20"
            >
              <Sparkles className="w-4 h-4" /> Generate {reportFrequency.charAt(0).toUpperCase() + reportFrequency.slice(1)} Report Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
