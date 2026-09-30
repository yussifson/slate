/**
 * OmniCore New Customer Onboarding Automation Rule (Phase B)
 * 
 * WHEN a new customer is registered IF customer is in lead/new status or lacks onboarding task
 * THEN create a structured onboarding welcome task for account management.
 * 
 * Pure composition, idempotent, and condition-checked.
 */

export const CustomerOnboardingRule = {
  id: 'rule_customer_onboarding_task',
  name: 'New Customer Onboarding Task',
  description: 'WHEN a new customer is registered IF customer is lead/new or unregistered THEN create an onboarding welcome task.',
  trigger: 'customer_registered',
  enabled: true,

  /**
   * Evaluate rule against customer list
   * 
   * @param {object} context - { companyId, customers, existingTasks, options }
   * @returns {Array<object>} List of evaluated rule matches
   */
  evaluate(context = {}) {
    const { customers = [], existingTasks = [], options = {} } = context;

    const matches = [];

    for (const cust of customers) {
      const customerId = String(cust.id || '');
      const customerName = cust.name || 'Valued Customer';
      const status = (cust.status || 'lead').toLowerCase();

      // IF condition: lead/new status or explicit option
      const isCandidate = status === 'lead' || status === 'new' || options.includeAllCustomers;

      if (isCandidate) {
        // Idempotency check: does an active OR completed onboarding task already exist for this customer?
        const alreadyActioned = (existingTasks || []).some(t => {
          const matchId = t.customerId === customerId || t.metadata?.customerId === customerId;
          const matchRule = t.metadata?.ruleId === this.id || (t.title && t.title.toLowerCase().includes(`onboard`) && t.title.includes(customerName));
          return matchId || matchRule;
        });

        const candidateTask = {
          title: `Onboard New Customer: ${customerName}`,
          description: `Automated onboarding task: Conduct introductory welcome call, verify service requirements, and configure account profile for ${customerName} (${cust.email || 'No email provided'}).`,
          priority: 'high',
          status: 'todo',
          customerId,
          metadata: {
            source: 'automation_engine',
            ruleId: this.id,
            customerId,
            customerName,
            customerEmail: cust.email || null,
            phone: cust.phone || null
          }
        };

        matches.push({
          ruleId: this.id,
          ruleName: this.name,
          trigger: this.trigger,
          triggerData: {
            customerId,
            customerName,
            status,
            email: cust.email
          },
          conditionMet: true,
          conditionDetails: `Customer status is '${status}'`,
          alreadyActioned,
          actionType: 'create_task',
          candidateTask,
          explanation: `Customer ${customerName} is newly registered or in '${status}' state. ${alreadyActioned ? 'Onboarding task already exists (skipped).' : 'Candidate onboarding task will be created.'}`
        });
      }
    }

    return matches;
  }
};

export default CustomerOnboardingRule;
