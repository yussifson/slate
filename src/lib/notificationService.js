import { base44 } from "@/api/base44Client";

/**
 * Global Notification & Reminder Engine
 * Wires system actions to user notifications with strict role-based & personal targeting.
 */

export const notificationService = {
  /**
   * Send personalized notification directly to specific user emails or user IDs.
   * Scoped strictly so only those targeted individuals can receive/see them.
   */
  async notifyUsers(userIdsOrEmails, title, message, link = "#", type = "info") {
    if (!userIdsOrEmails || userIdsOrEmails.length === 0) return;
    const list = Array.isArray(userIdsOrEmails) ? userIdsOrEmails : [userIdsOrEmails];
    
    for (const target of list) {
      if (!target) continue;
      const cleanTarget = String(target).trim();
      const isEmail = cleanTarget.includes("@");
      
      const payload = {
        title,
        message,
        link,
        type,
        is_read: false,
        created_date: new Date().toISOString(),
        recipient_email: isEmail ? cleanTarget.toLowerCase() : null,
        user_id: !isEmail ? cleanTarget : null,
      };

      try {
        await base44.entities.Notification.create(payload);
      } catch (err) {
        console.warn("Failed to create personal notification:", err);
      }
    }
  },

  /**
   * Send role-targeted notification (e.g. 'finance', 'sales', 'warehouse', 'production', 'hr').
   */
  async notifyRole(roleOrDept, title, message, link = "#", type = "info") {
    if (!roleOrDept) return;
    const role = String(roleOrDept).toLowerCase().trim();
    
    try {
      await base44.entities.Notification.create({
        title: `[ROLE:${role.toUpperCase()}] ${title}`,
        message,
        link,
        type,
        is_read: false,
        created_date: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Failed to create role notification:", err);
    }
  },

  /**
   * Targeted notification for the entire sales team
   */
  async notifySalesTeam(title, message, link = "/sales/orders", type = "sales") {
    return this.notifyRole("sales", title, message, link, type);
  },

  /**
   * Targeted notification for a specific salesperson / driver
   */
  async notifyPersonalSales(repEmail, title, message, link = "/sales/orders", type = "sales") {
    if (!repEmail) return;
    return this.notifyUsers([repEmail], title, message, link, type);
  },

  /**
   * System-wide check for advanced reminders (called via polling)
   */
  async checkSystemTriggers() {
    try {
      const now = new Date();
      const existingNotifs = await base44.entities.Notification.list();
      
      // 1. Low Stock Alerts (Raw Materials) -> Warehouse & Admin & Finance
      const materials = await base44.entities.RawMaterial.list();
      for (const m of materials) {
        if (Number(m.current_stock || 0) <= Number(m.reorder_level || 0)) {
           const title = `Urgent: Low Stock (${m.name})`;
           const alreadyNotified = existingNotifs.some(n => n.title && n.title.includes(m.name) && !n.is_read);
           if (!alreadyNotified) {
             await this.notifyRole('warehouse', title, `Current stock (${m.current_stock}) is below reorder level. Please request procurement.`, '/warehouse/raw-materials', 'warning');
             await this.notifyRole('finance', title, `Warehouse is running low on ${m.name}.`, '/warehouse/raw-materials', 'warning');
           }
        }
      }

      // 2. Unpaid Invoices over 3 days old -> Finance & Admin ONLY
      const invoices = await base44.entities.Invoice.list();
      for (const inv of invoices) {
        if (inv.status === 'unpaid') {
          const invDate = new Date(inv.issue_date || inv.created_date);
          const daysOld = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
          if (daysOld >= 3) {
            const title = `Overdue Invoice: ${inv.invoice_number}`;
            const alreadyNotified = existingNotifs.some(n => n.title && n.title.includes(inv.invoice_number) && !n.is_read);
            if (!alreadyNotified) {
              await this.notifyRole('finance', title, `Invoice ${inv.invoice_number} has been unpaid for ${daysOld} days.`, '/finance/invoices', 'error');
            }
          }
        }
      }

      // 3. Pending Procurement Approvals -> Finance & Admin ONLY
      const requests = await base44.entities.ProcurementRequest.list();
      for (const req of requests) {
        if (req.status === 'pending_finance') {
           const title = `Pending Finance Approval: ${req.request_number}`;
           if (!existingNotifs.some(n => n.title && n.title.includes(req.request_number) && !n.is_read)) {
             await this.notifyRole('finance', title, `Procurement request needs your approval.`, '/warehouse/procurement', 'info');
           }
        }
      }
      
      // 4. Inactive Customers -> Sales team
      const customers = await base44.entities.Customer.list();
      for (const cust of customers) {
        if (cust.last_purchase_date) {
          const lastPurch = new Date(cust.last_purchase_date);
          const daysInactive = Math.floor((now - lastPurch) / (1000 * 60 * 60 * 24));
          if (daysInactive >= 14) {
             const title = `Inactive Customer Alert: ${cust.name}`;
             if (!existingNotifs.some(n => n.title && n.title.includes(cust.name) && !n.is_read)) {
               // If customer has an assigned driver/sales rep, notify that rep personally
               if (cust.assigned_driver && cust.assigned_driver.includes("@")) {
                 await this.notifyPersonalSales(cust.assigned_driver, title, `${cust.name} hasn't ordered in ${daysInactive} days. Please follow up.`, '/sales/customers');
               } else {
                 await this.notifyRole('sales', title, `${cust.name} hasn't ordered in ${daysInactive} days. Please follow up.`, '/sales/customers', 'warning');
               }
             }
          }
        }
      }

    } catch(err) {
      console.error("Failed to run system triggers", err);
    }
  }
};
