/**
 * OmniCore Starter Automation Rule (Phase 9)
 * 
 * WHEN invoice is overdue IF daysOverdue > 14 THEN create a follow-up task
 * referencing the invoice and customer.
 * 
 * Pure composition, idempotent, and condition-checked.
 */

export const OverdueInvoiceRule = {
  id: 'rule_overdue_invoice_followup',
  name: 'Overdue Invoice Follow-up Task',
  description: 'WHEN an invoice is overdue IF daysOverdue > 14 THEN recommend/create a follow-up task for the customer referencing the invoice.',
  trigger: 'invoice_overdue',
  enabled: true,

  /**
   * Evaluate rule against candidates
   * 
   * @param {object} context - { companyId, overdueInvoices, existingTasks, options }
   * @returns {Array<object>} List of evaluated rule matches
   */
  evaluate(context = {}) {
    const { overdueInvoices = [], existingTasks = [], options = {} } = context;
    const minDaysOverdue = Number(options.minDaysOverdue !== undefined ? options.minDaysOverdue : 14);

    const matches = [];

    for (const item of overdueInvoices) {
      const data = item.backingData || item;
      const daysOverdue = Number(data.daysOverdue || 0);

      // IF condition: daysOverdue > minDaysOverdue
      if (daysOverdue > minDaysOverdue) {
        const invoiceRef = String(data.invoiceNumber || data.invoiceId || '');

        // Idempotency check: does an active / open follow-up task already exist for this invoice?
        const alreadyActioned = (existingTasks || []).some(t => {
          const s = (t.status || '').toLowerCase();
          const isOpen = s !== 'completed' && s !== 'done' && s !== 'closed' && s !== 'cancelled';
          const matchRef = (t.title && t.title.includes(invoiceRef)) ||
                          (t.description && t.description.includes(invoiceRef)) ||
                          (t.metadata?.invoiceId === data.invoiceId);
          return isOpen && matchRef;
        });

        const candidateTask = {
          title: `Follow up on overdue invoice #${invoiceRef}`,
          description: `Automated follow-up task: Invoice #${invoiceRef} for ${data.customerName || 'Customer'} ($${Number(data.amount || 0).toLocaleString()}) is ${daysOverdue} days overdue.`,
          priority: daysOverdue >= 30 ? 'high' : 'medium',
          status: 'todo',
          customerId: data.customerId || null,
          metadata: {
            source: 'automation_engine',
            ruleId: this.id,
            invoiceId: data.invoiceId,
            invoiceNumber: data.invoiceNumber,
            daysOverdue,
            amount: data.amount
          }
        };

        matches.push({
          ruleId: this.id,
          ruleName: this.name,
          trigger: this.trigger,
          triggerData: {
            invoiceId: data.invoiceId,
            invoiceNumber: data.invoiceNumber,
            customerId: data.customerId,
            customerName: data.customerName,
            amount: data.amount,
            daysOverdue
          },
          conditionMet: true,
          conditionDetails: `daysOverdue (${daysOverdue}) > ${minDaysOverdue}`,
          alreadyActioned,
          actionType: 'create_task',
          candidateTask,
          explanation: `Invoice #${invoiceRef} is ${daysOverdue} days overdue (exceeds ${minDaysOverdue} days threshold). ${alreadyActioned ? 'Open follow-up task already exists (skipped).' : 'Candidate follow-up task will be created.'}`
        });
      }
    }

    return matches;
  }
};

export default OverdueInvoiceRule;
