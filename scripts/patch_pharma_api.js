import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/api/PharmacyAPI.js', 'utf8');

const newMethod = `  async updatePrescriptionStatus(companyId, prescriptionId, newStatus, userId) {
    try {
      const now = getSafeISO8601();
      await powerSync.execute(
        'UPDATE univ_pharmacy_prescriptions SET prescription_status = ?, updated_at = ? WHERE id = ? AND company_id = ?',
        [newStatus, now, prescriptionId, companyId]
      );
      return { success: true, message: 'Prescription status updated' };
    } catch (e) {
      console.error('[Pharmacy API] Update prescription status error:', e);
      throw new Error('Failed to update prescription status: ' + e.message);
    }
  }

  async getPrescriptions`;

c = c.replace('  async getPrescriptions', newMethod);
writeFileSync('src/api/PharmacyAPI.js', c);
console.log('Done - updatePrescriptionStatus added');
