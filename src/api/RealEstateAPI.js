/**
 * RealEstateAPI.js
 * 
 * Client-side API handlers for Real Estate vertical operations.
 * Handles CRUD operations for properties, clients, viewings, offers, transactions, leases, etc.
 */

import { powerSync } from '@/api/PowerSyncConnector';

// Generate UUIDs for Supabase compatibility
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const RealEstateAPI = {
  // ────────────────────────────────────────────────────────
  // PROPERTIES
  // ────────────────────────────────────────────────────────

  async getProperties(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_properties WHERE company_id = ?';
      const params = [companyId];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.agentId) {
        query += ' AND agent_id = ?';
        params.push(filters.agentId);
      }
      if (filters.propertyType) {
        query += ' AND property_type = ?';
        params.push(filters.propertyType);
      }

      query += ' ORDER BY created_at DESC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getProperties failed:', e);
      throw e;
    }
  },

  async createProperty(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_properties (id, company_id, address, city, state, country, zip_code, property_type, 
         bedrooms, bathrooms, square_feet, lot_size, price, status, agent_id, agent_name, description, features, year_built, listing_date, last_updated, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.address, data.city, data.state, data.country, data.zipCode, data.propertyType, 
         data.bedrooms, data.bathrooms, data.squareFeet, data.lotSize, data.price, data.status || 'active', 
         data.agentId, data.agentName, data.description, JSON.stringify(data.features || []), data.yearBuilt, now, now, now]
      );

      // Log to audit trail
      powerSync.execute(
        'INSERT INTO audit_logs (user_id, action, record_type, record_id, changes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 'create', 'property', id, JSON.stringify(data), now]
      ).catch(e => console.warn('Audit log error:', e));
      return id;
    } catch (e) {
      console.error('[RE API] createProperty failed:', e);
      throw e;
    }
  },

  async updateProperty(companyId, propertyId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      updates.push('last_updated = ?');
      params.push(new Date().toISOString());
      params.push(companyId);
      params.push(propertyId);

      const query = `UPDATE univ_re_properties SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
      // Audit logged inline during property update
    } catch (e) {
      console.error('[RE API] updateProperty failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // CLIENTS (Buyers/Sellers/Tenants)
  // ────────────────────────────────────────────────────────

  async getClients(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_clients WHERE company_id = ?';
      const params = [companyId];

      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }
      if (filters.agentId) {
        query += ' AND assigned_agent = ?';
        params.push(filters.agentId);
      }
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getClients failed:', e);
      throw e;
    }
  },

  async createClient(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_clients (id, company_id, name, email, phone, type, address, city, state, 
         country, budget, preferences, status, assigned_agent, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.name, data.email, data.phone, data.type, data.address, data.city, 
         data.state, data.country, data.budget, JSON.stringify(data.preferences || []), 
         'active', data.assignedAgent, data.notes, now]
      );
      // Audit logged inline during client creation
      return id;
    } catch (e) {
      console.error('[RE API] createClient failed:', e);
      throw e;
    }
  },

  async updateClient(companyId, clientId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      params.push(companyId);
      params.push(clientId);

      const query = `UPDATE univ_re_clients SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateClient failed:', e);
      throw e;
    }
  },

  async deleteClient(companyId, clientId, userId) {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_clients WHERE company_id = ? AND id = ?',
        [companyId, clientId]
      );
    } catch (e) {
      console.error('[RE API] deleteClient failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // VIEWINGS
  // ────────────────────────────────────────────────────────

  async getViewings(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_viewings WHERE company_id = ?';
      const params = [companyId];

      if (filters.propertyId) {
        query += ' AND property_id = ?';
        params.push(filters.propertyId);
      }
      if (filters.clientId) {
        query += ' AND client_id = ?';
        params.push(filters.clientId);
      }
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY viewing_date ASC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getViewings failed:', e);
      throw e;
    }
  },

  async createViewing(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_viewings (id, company_id, property_id, property_address, client_id, client_name, 
         agent_id, agent_name, viewing_date, viewing_time, status, duration_minutes, feedback, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.propertyId, data.propertyAddress, data.clientId, data.clientName, 
         data.agentId, data.agentName, data.viewingDate, data.viewingTime, 'scheduled', 
         data.durationMinutes || 30, data.feedback, data.notes, now]
      );
      
      // Audit logged inline during viewing creation
      return id;
    } catch (e) {
      console.error('[RE API] createViewing failed:', e);
      throw e;
    }
  },

  async updateViewing(companyId, viewingId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      params.push(companyId);
      params.push(viewingId);

      const query = `UPDATE univ_re_viewings SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateViewing failed:', e);
      throw e;
    }
  },

  async deleteViewing(companyId, viewingId, userId) {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_viewings WHERE company_id = ? AND id = ?',
        [companyId, viewingId]
      );
    } catch (e) {
      console.error('[RE API] deleteViewing failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // OFFERS
  // ────────────────────────────────────────────────────────

  async getOffers(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_offers WHERE company_id = ?';
      const params = [companyId];

      if (filters.propertyId) {
        query += ' AND property_id = ?';
        params.push(filters.propertyId);
      }
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY offer_date DESC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getOffers failed:', e);
      throw e;
    }
  },

  async createOffer(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_offers (id, company_id, property_id, property_address, buyer_id, buyer_name, 
         offer_amount, earnest_money, contingencies, offer_date, expiration_date, status, agent_id, agent_name, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.propertyId, data.propertyAddress, data.buyerId, data.buyerName, 
         data.offerAmount, data.earnestMoney, JSON.stringify(data.contingencies || []), 
         now, data.expirationDate, 'pending', data.agentId, data.agentName, data.notes, now]
      );
      // Audit logged inline during offer creation
      return id;
    } catch (e) {
      console.error('[RE API] createOffer failed:', e);
      throw e;
    }
  },

  async updateOffer(companyId, offerId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      params.push(companyId);
      params.push(offerId);

      const query = `UPDATE univ_re_offers SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateOffer failed:', e);
      throw e;
    }
  },

  async deleteOffer(companyId, offerId, userId) {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_offers WHERE company_id = ? AND id = ?',
        [companyId, offerId]
      );
    } catch (e) {
      console.error('[RE API] deleteOffer failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // TRANSACTIONS
  // ────────────────────────────────────────────────────────

  async getTransactions(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_transactions WHERE company_id = ?';
      const params = [companyId];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY closing_date DESC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getTransactions failed:', e);
      throw e;
    }
  },

  async createTransaction(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

  await powerSync.execute(
  `INSERT INTO univ_re_transactions (id, company_id, property_id, property_address, seller_id, seller_name,
  buyer_id, buyer_name, sale_price, closing_date, status, agent_id, agent_name, documents, notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [id, companyId, data.propertyId, data.propertyAddress, data.sellerId, data.sellerName,
  data.buyerId, data.buyerName, data.salePrice, data.closingDate, data.status || 'offer_accepted',
  data.agentId, data.agentName, JSON.stringify(data.documents || []), data.notes, now]
  );
      // Audit logged inline during transaction creation
      return id;
    } catch (e) {
      console.error('[RE API] createTransaction failed:', e);
      throw e;
    }
  },

  async updateTransaction(companyId, transactionId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      params.push(companyId);
      params.push(transactionId);

      const query = `UPDATE univ_re_transactions SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateTransaction failed:', e);
      throw e;
    }
  },

  async deleteTransaction(companyId, transactionId, userId) {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_transactions WHERE company_id = ? AND id = ?',
        [companyId, transactionId]
      );
    } catch (e) {
      console.error('[RE API] deleteTransaction failed:', e);
      throw e;
    }
  },

  // ──────────────���───────���─────────────────────────────────
  // LEASES
  // ────────────────────────────────────────────────────────

  async getLeases(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_leases WHERE company_id = ?';
      const params = [companyId];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY start_date DESC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getLeases failed:', e);
      throw e;
    }
  },

  async createLease(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_leases (id, company_id, property_id, property_address, tenant_id, tenant_name, 
         landlord_id, landlord_name, start_date, end_date, monthly_rent, security_deposit, status, terms, agent_id, agent_name, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.propertyId, data.propertyAddress, data.tenantId, data.tenantName, 
         data.landlordId, data.landlordName, data.startDate, data.endDate, data.monthlyRent, 
         data.securityDeposit, 'active', JSON.stringify(data.terms || []), data.agentId, data.agentName, now]
      );
      // Audit logged inline during lease creation
      return id;
    } catch (e) {
      console.error('[RE API] createLease failed:', e);
      throw e;
    }
  },

  async updateLease(companyId, leaseId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      params.push(companyId);
      params.push(leaseId);

      const query = `UPDATE univ_re_leases SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateLease failed:', e);
      throw e;
    }
  },

  async deleteLease(companyId, leaseId, userId) {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_leases WHERE company_id = ? AND id = ?',
        [companyId, leaseId]
      );
    } catch (e) {
      console.error('[RE API] deleteLease failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // RENT PAYMENTS
  // ────────────────────────────────────────────────────────

  async getRentPayments(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_rent_payments WHERE company_id = ?';
      const params = [companyId];

      if (filters.leaseId) {
        query += ' AND lease_id = ?';
        params.push(filters.leaseId);
      }
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY due_date ASC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getRentPayments failed:', e);
      throw e;
    }
  },

  async recordRentPayment(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_rent_payments (id, company_id, lease_id, property_id, tenant_id, tenant_name, 
         amount, due_date, payment_date, payment_method, status, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.leaseId, data.propertyId, data.tenantId, data.tenantName, 
         data.amount, data.dueDate, now, data.paymentMethod, 'paid', data.notes, now]
      );
      // Audit logged inline during rent payment creation
      return id;
    } catch (e) {
      console.error('[RE API] recordRentPayment failed:', e);
      throw e;
    }
  },

  async updateRentPayment(companyId, paymentId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      params.push(companyId);
      params.push(paymentId);

      const query = `UPDATE univ_re_rent_payments SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateRentPayment failed:', e);
      throw e;
    }
  },

  async deleteRentPayment(companyId, paymentId, userId) {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_rent_payments WHERE company_id = ? AND id = ?',
        [companyId, paymentId]
      );
    } catch (e) {
      console.error('[RE API] deleteRentPayment failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // MAINTENANCE REQUESTS
  // ────��───────────────────────────────────────────────────

  async getMaintenanceRequests(companyId, filters = {}) {
    try {
      let query = 'SELECT * FROM univ_re_maintenance_requests WHERE company_id = ?';
      const params = [companyId];

      if (filters.propertyId) {
        query += ' AND property_id = ?';
        params.push(filters.propertyId);
      }
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';
      const res = await powerSync.execute(query, params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getMaintenanceRequests failed:', e);
      throw e;
    }
  },

  async createMaintenanceRequest(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();

      await powerSync.execute(
        `INSERT INTO univ_re_maintenance_requests (id, company_id, property_id, property_address, reported_by, 
         reported_by_name, issue_description, priority, status, assigned_to, completion_date, cost, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.propertyId, data.propertyAddress, data.reportedBy, data.reportedByName, 
         data.issueDescription, data.priority || 'normal', 'open', data.assignedTo, null, data.cost || 0, data.notes, now]
      );
      // Audit logged inline during maintenance request creation
      return id;
    } catch (e) {
      console.error('[RE API] createMaintenanceRequest failed:', e);
      throw e;
    }
  },

  async updateMaintenanceRequest(companyId, requestId, data, userId) {
    try {
      const updates = [];
      const params = [];

      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'company_id' && key !== 'created_at') {
          updates.push(`${key} = ?`);
          params.push(typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        }
      });

      params.push(companyId);
      params.push(requestId);

      const query = `UPDATE univ_re_maintenance_requests SET ${updates.join(', ')} 
                     WHERE company_id = ? AND id = ?`;
      
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateMaintenanceRequest failed:', e);
      throw e;
    }
  },

  async deleteMaintenanceRequest(companyId, requestId, userId) {
    try {
      await powerSync.execute(
        'DELETE FROM univ_re_maintenance_requests WHERE company_id = ? AND id = ?',
        [companyId, requestId]
      );
    } catch (e) {
      console.error('[RE API] deleteMaintenanceRequest failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // TEAM MANAGEMENT
  // ────────────────────────────────────────────────────────

  async createTeamMember(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      await powerSync.execute(
        `INSERT INTO univ_re_team_members (id, company_id, user_id, name, email, phone, role, status, 
         avatar_url, bio, license_number, license_expiry, commission_rate, join_date, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.userId || null, data.name, data.email, data.phone || null, 
         data.role || 'agent', 'active', data.avatarUrl || null, data.bio || null, 
         data.licenseNumber || null, data.licenseExpiry || null, data.commissionRate || 0, 
         data.joinDate || new Date().toISOString().split('T')[0], now, now]
      );
      return id;
    } catch (e) {
      console.error('[RE API] createTeamMember failed:', e);
      throw e;
    }
  },

  async getTeamMembers(companyId) {
    try {
      const res = await powerSync.execute(
        'SELECT * FROM univ_re_team_members WHERE company_id = ? AND status != ? ORDER BY join_date DESC',
        [companyId, 'deleted']
      );
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getTeamMembers failed:', e);
      throw e;
    }
  },

  async updateTeamMember(companyId, memberId, data, userId) {
    try {
      const updates = [];
      const params = [];
      
      Object.keys(data).forEach(key => {
        if (!['id', 'company_id', 'created_at'].includes(key)) {
          updates.push(`${key} = ?`);
          params.push(data[key]);
        }
      });
      
      params.push(new Date().toISOString());
      params.push(companyId);
      params.push(memberId);
      
      const query = `UPDATE univ_re_team_members SET ${updates.join(', ')}, updated_at = ? 
                     WHERE company_id = ? AND id = ?`;
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateTeamMember failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // MARKET INTELLIGENCE
  // ────────────────────────────────────────────────────────

  async createMLSListing(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      await powerSync.execute(
        `INSERT INTO univ_re_mls_listings (id, company_id, mls_id, property_address, city, state, zip_code,
         price, list_date, sold_date, days_on_market, bedrooms, bathrooms, square_feet, lot_size,
         property_type, status, agent_name, brokerage, description, source, last_updated, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.mlsId, data.address, data.city, data.state, data.zipCode,
         data.price, data.listDate, data.soldDate || null, data.daysOnMarket || 0,
         data.bedrooms, data.bathrooms, data.squareFeet, data.lotSize,
         data.propertyType, data.status || 'active', data.agentName, data.brokerage,
         data.description, 'mls', now, now]
      );
      return id;
    } catch (e) {
      console.error('[RE API] createMLSListing failed:', e);
      throw e;
    }
  },

  async getComparableAnalysis(companyId, filters = {}) {
    try {
      let query = `SELECT * FROM univ_re_comparable_analysis WHERE company_id = ?`;
      const params = [companyId];
      
      if (filters.propertyId) {
        query += ' AND property_id = ?';
        params.push(filters.propertyId);
      }
      
      const res = await powerSync.execute(query + ' ORDER BY analysis_date DESC', params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getComparableAnalysis failed:', e);
      throw e;
    }
  },

  async createComparableAnalysis(companyId, data, userId) {
    try {
      const id = generateUUID();
      
      await powerSync.execute(
        `INSERT INTO univ_re_comparable_analysis (id, company_id, property_id, analysis_date, subject_address,
         subject_price, comparable_1_address, comparable_1_price, comparable_1_adjustment,
         comparable_2_address, comparable_2_price, comparable_2_adjustment,
         comparable_3_address, comparable_3_price, comparable_3_adjustment,
         estimated_value, confidence_level, notes, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.propertyId || null, data.analysisDate || new Date().toISOString().split('T')[0],
         data.subjectAddress, data.subjectPrice, data.comp1Address, data.comp1Price, data.comp1Adjustment,
         data.comp2Address, data.comp2Price, data.comp2Adjustment,
         data.comp3Address, data.comp3Price, data.comp3Adjustment,
         data.estimatedValue, data.confidenceLevel || 80, data.notes, userId, new Date().toISOString()]
      );
      return id;
    } catch (e) {
      console.error('[RE API] createComparableAnalysis failed:', e);
      throw e;
    }
  },

  async getMarketTrends(companyId, filters = {}) {
    try {
      let query = `SELECT * FROM univ_re_market_trends WHERE company_id = ?`;
      const params = [companyId];
      
      if (filters.city) {
        query += ' AND city = ?';
        params.push(filters.city);
      }
      if (filters.state) {
        query += ' AND state = ?';
        params.push(filters.state);
      }
      
      const res = await powerSync.execute(query + ' ORDER BY metric_date DESC', params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getMarketTrends failed:', e);
      throw e;
    }
  },

  // ────────────────────────────────────────────────────────
  // CRM LEAD MANAGEMENT
  // ────────────────────────────────────────────────────────

  async createLead(companyId, data, userId) {
    try {
      const id = generateUUID();
      const now = new Date().toISOString();
      
      await powerSync.execute(
        `INSERT INTO univ_re_leads (id, company_id, first_name, last_name, email, phone, source,
         property_interest, budget_min, budget_max, lead_type, status, stage, assigned_agent_id,
         lead_score, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, data.firstName, data.lastName, data.email || null, data.phone || null,
         data.source || 'website', data.propertyInterest || null, data.budgetMin || null,
         data.budgetMax || null, data.leadType || 'buyer', 'new', 'awareness',
         data.assignedAgentId || null, 0, data.notes || null, now, now]
      );
      return id;
    } catch (e) {
      console.error('[RE API] createLead failed:', e);
      throw e;
    }
  },

  async getLeads(companyId, filters = {}) {
    try {
      let query = `SELECT * FROM univ_re_leads WHERE company_id = ? AND status != ?`;
      const params = [companyId, 'deleted'];
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.leadType) {
        query += ' AND lead_type = ?';
        params.push(filters.leadType);
      }
      if (filters.assignedAgentId) {
        query += ' AND assigned_agent_id = ?';
        params.push(filters.assignedAgentId);
      }
      
      const res = await powerSync.execute(query + ' ORDER BY lead_score DESC, next_followup ASC', params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getLeads failed:', e);
      throw e;
    }
  },

  async updateLead(companyId, leadId, data, userId) {
    try {
      const updates = [];
      const params = [];
      
      Object.keys(data).forEach(key => {
        if (!['id', 'company_id', 'created_at'].includes(key)) {
          updates.push(`${key} = ?`);
          params.push(data[key]);
        }
      });
      
      params.push(new Date().toISOString());
      params.push(companyId);
      params.push(leadId);
      
      const query = `UPDATE univ_re_leads SET ${updates.join(', ')}, updated_at = ? 
                     WHERE company_id = ? AND id = ?`;
      await powerSync.execute(query, params);
    } catch (e) {
      console.error('[RE API] updateLead failed:', e);
      throw e;
    }
  },

  async createLeadActivity(companyId, leadId, data, userId) {
    try {
      const id = generateUUID();
      
      await powerSync.execute(
        `INSERT INTO univ_re_lead_activities (id, company_id, lead_id, activity_type, subject,
         description, duration_minutes, outcome, next_action, agent_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, companyId, leadId, data.activityType, data.subject || null,
         data.description || null, data.durationMinutes || null, data.outcome || null,
         data.nextAction || null, userId, new Date().toISOString()]
      );
      return id;
    } catch (e) {
      console.error('[RE API] createLeadActivity failed:', e);
      throw e;
    }
  },

  async getLeadActivities(companyId, leadId) {
    try {
      const res = await powerSync.execute(
        `SELECT * FROM univ_re_lead_activities WHERE company_id = ? AND lead_id = ? ORDER BY created_at DESC`,
        [companyId, leadId]
      );
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getLeadActivities failed:', e);
      throw e;
    }
  },

  async getLeadCampaigns(companyId, filters = {}) {
    try {
      let query = `SELECT * FROM univ_re_lead_campaigns WHERE company_id = ?`;
      const params = [companyId];
      
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      
      const res = await powerSync.execute(query + ' ORDER BY created_at DESC', params);
      return res.rows._array || Array.from(res.rows);
    } catch (e) {
      console.error('[RE API] getLeadCampaigns failed:', e);
      throw e;
    }
  },
};

export default RealEstateAPI;
