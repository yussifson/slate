import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/api/PharmacyAPI.js', 'utf8');

const i = c.indexOf('async updateInventoryStatus(companyId, inventoryId, newStatus, userId) {\r\n    try {\r\n      const now = getSafeISO8601();');
const end = c.indexOf('// PRESCRIPTIONS', i);

const broken = c.substring(i, end);

const fixed = `async updateInventoryStatus(companyId, inventoryId, newStatus, userId) {\r
    try {\r
      const now = getSafeISO8601();\r
\r
      // Get old value for audit\r
      const oldResult = await powerSync.execute(\r
        'SELECT status FROM univ_pharmacy_inventory WHERE id = ?',\r
        [inventoryId]\r
      );\r
      const oldValue = oldResult.rows._array?.[0] || {};\r
\r
      await powerSync.execute(\r
        'UPDATE univ_pharmacy_inventory SET status = ?, updated_at = ? WHERE id = ? AND company_id = ?',\r
        [newStatus, now, inventoryId, companyId]\r
      );\r
\r
      await this.logAuditAction(companyId, 'UPDATE', 'Inventory Status', inventoryId, oldValue, { status: newStatus }, userId);\r
      return { success: true, message: 'Inventory status updated' };\r
    } catch (e) {\r
      console.error('[Pharmacy API] Update inventory status error:', e);\r
      throw new Error(\`Failed to update inventory status: \${e.message}\`);\r
    }\r
  }\r
\r
  async deleteInventory(companyId, inventoryId, userId) {\r
    try {\r
      await powerSync.execute(\r
        'DELETE FROM univ_pharmacy_inventory WHERE id = ? AND company_id = ?',\r
        [inventoryId, companyId]\r
      );\r
      return { success: true, message: 'Inventory item deleted successfully' };\r
    } catch (e) {\r
      console.error('[Pharmacy API] Delete inventory error:', e);\r
      throw new Error(\`Failed to delete inventory: \${e.message}\`);\r
    }\r
  }\r
\r
  // ========================================\r
  // SALES & TRANSACTIONS\r
  // ========================================\r
\r
  async createSale(companyId, saleData, userId) {\r
    try {\r
      const saleId = generateUUID();\r
      const now = getSafeISO8601();\r
\r
      await powerSync.execute(\r
        \`INSERT INTO univ_pharmacy_sales (id, company_id, receipt_number, customer_id, sale_date,\r
         total_items, subtotal, tax_amount, discount_amount, grand_total, amount_paid,\r
         change_amount, payment_method, cashier_id, shift_id, created_at, updated_at)\r
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,\r
        [saleId, companyId, saleData.receiptNumber, saleData.customerId, now,\r
         saleData.items?.length || 0, saleData.subtotal || 0, saleData.taxAmount || 0,\r
         saleData.discountAmount || 0, saleData.grandTotal || 0, saleData.amountPaid || 0,\r
         saleData.changeAmount || 0, saleData.paymentMethod, userId, saleData.shiftId, now, now]\r
      );\r
\r
      // Create sale items\r
      if (saleData.items && Array.isArray(saleData.items)) {\r
        for (const item of saleData.items) {\r
          const itemId = generateUUID();\r
          await powerSync.execute(\r
            \`INSERT INTO univ_pharmacy_sale_items (id, company_id, sale_id, drug_id, drug_name,\r
             quantity_sold, unit_price, line_total, batch_number, inventory_id, created_at)\r
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,\r
            [itemId, companyId, saleId, item.drugId, item.drugName, item.quantitySold,\r
             item.unitPrice, item.lineTotal, item.batchNumber, item.inventoryId, now]\r
          );\r
\r
          // Update inventory\r
          if (item.inventoryId) {\r
            await this.updateInventoryQuantity(companyId, item.inventoryId, -item.quantitySold, 'Sale', userId);\r
          }\r
        }\r
      }\r
\r
      await this.logAuditAction(companyId, 'CREATE', 'Sale', saleId, null, saleData, userId);\r
\r
      return { success: true, saleId, receiptNumber: saleData.receiptNumber };\r
    } catch (e) {\r
      console.error('[Pharmacy API] Create sale error:', e);\r
      throw new Error(\`Failed to create sale: \${e.message}\`);\r
    }\r
  }\r
\r
  async getSales(companyId, filterOptions = {}) {\r
    try {\r
      let query = 'SELECT * FROM univ_pharmacy_sales WHERE company_id = ?';\r
      const params = [companyId];\r
\r
      if (filterOptions.startDate) {\r
        query += ' AND sale_date >= ?';\r
        params.push(filterOptions.startDate);\r
      }\r
\r
      if (filterOptions.endDate) {\r
        query += ' AND sale_date <= ?';\r
        params.push(filterOptions.endDate);\r
      }\r
\r
      query += ' ORDER BY sale_date DESC';\r
\r
      const result = await powerSync.execute(query, params);\r
      return result.rows._array || Array.from(result.rows);\r
    } catch (e) {\r
      console.error('[Pharmacy API] Get sales error:', e);\r
      return [];\r
    }\r
  }\r
\r
  // ========================================\r
  `;

c = c.replace(broken, fixed);
writeFileSync('src/api/PharmacyAPI.js', c);
console.log('PharmacyAPI.js restored successfully.');
