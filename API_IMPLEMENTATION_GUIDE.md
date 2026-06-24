# Real Estate Platform API Implementation Guide

## Overview

This document outlines the comprehensive API system built for the Slate Real Estate Platform. The implementation consists of 7 core API modules and a unified notification system, all powered by PowerSync for offline-first synchronization with Supabase.

## API Architecture

### Core API Modules

#### 1. **RealEstateTrustAccounting.js** 
Trust account and financial management operations.

**Key Methods:**
- `createTrustAccount()` - Create new trust accounts
- `recordTrustTransaction()` - Log deposits, withdrawals, fees, interest
- `createEscrowAccount()` - Create escrow holds for transactions
- `releaseEscrow()` - Release escrowed funds
- `createCommissionRule()` - Define commission structures
- `recordCommissionPayout()` - Track commission payouts
- `initializePaystackPayment()` - Process payments via Paystack
- `verifyPaystackPayment()` - Verify payment completion
- `reconcileTrustAccount()` - Reconcile bank statements

**Usage:**
```javascript
import { RealEstateTrustAccounting } from '@/api/RealEstateTrustAccounting';

// Create trust account
const accountId = await RealEstateTrustAccounting.createTrustAccount(
  companyId,
  {
    accountName: 'Main Operating Account',
    accountType: 'operating',
    bankName: 'First Bank',
    accountNumber: '1234567890',
    routingNumber: '987654321',
    accountHolderName: 'Acme Real Estate'
  },
  userId
);

// Record a transaction
await RealEstateTrustAccounting.recordTrustTransaction(
  companyId,
  {
    trustAccountId: accountId,
    transactionType: 'deposit',
    amount: 50000,
    description: 'Earnest money deposit'
  },
  userId
);
```

---

#### 2. **RealEstateOffers.js**
Offer management, counter-offers, and negotiation tracking.

**Key Methods:**
- `updateOfferStatus()` - Update offer status
- `getOfferDetails()` - Retrieve complete offer information
- `createCounterOffer()` - Create counter-offers
- `respondToCounterOffer()` - Accept/reject counter-offers
- `evaluateCommissionRules()` - Calculate applicable commissions
- `applyCommissionAdjustments()` - Apply adjustments to commissions
- `getOfferNegotiationTimeline()` - Track negotiation history
- `getNegotiationStats()` - Get negotiation analytics

**Usage:**
```javascript
import { RealEstateOffers } from '@/api/RealEstateOffers';

// Create counter-offer
const counterId = await RealEstateOffers.createCounterOffer(
  companyId,
  {
    originalOfferId: 'offer-123',
    counterOfferBy: 'seller',
    counterOfferPrice: 425000,
    closingDate: '2024-08-15',
    contingencies: ['inspection', 'appraisal']
  },
  userId
);

// Get negotiation timeline
const timeline = await RealEstateOffers.getOfferNegotiationTimeline(companyId, offerId);
```

---

#### 3. **RealEstateDocuments.js**
Document management, templates, and e-signature workflows.

**Key Methods:**
- `createDocumentTemplate()` - Create reusable document templates
- `getDocumentTemplates()` - Retrieve templates by type
- `generateDocumentFromTemplate()` - Generate document instances
- `getDocuments()` - Query documents with filters
- `requestSignature()` - Request e-signatures
- `getSignatureRequests()` - Get signature status
- `recordSignature()` - Record signed documents
- `createDocumentVersion()` - Create document versions
- `executeDocument()` - Finalize executed documents

**Usage:**
```javascript
import { RealEstateDocuments } from '@/api/RealEstateDocuments';

// Request signature
const sigRequestId = await RealEstateDocuments.requestSignature(
  companyId,
  {
    documentId: 'doc-456',
    signerName: 'John Buyer',
    signerEmail: 'john@example.com',
    expirationDays: 30
  },
  userId
);

// Get signature status
const status = await RealEstateDocuments.getSignatureStatus(companyId, documentId);
```

---

#### 4. **RealEstateContractors.js**
Contractor management, maintenance requests, and reviews.

**Key Methods:**
- `createContractor()` - Add contractors to database
- `getContractors()` - Query contractors with filters
- `updateContractor()` - Update contractor info
- `verifyContractor()` - Verify contractor credentials
- `submitContractorReview()` - Create reviews and ratings
- `getContractorReviews()` - Retrieve reviews
- `createMaintenanceRequest()` - Create maintenance requests
- `assignMaintenanceToContractor()` - Assign work
- `updateMaintenanceStatus()` - Track completion
- `getContractorPerformance()` - Get performance metrics

**Usage:**
```javascript
import { RealEstateContractors } from '@/api/RealEstateContractors';

// Create maintenance request
const maintenanceId = await RealEstateContractors.createMaintenanceRequest(
  companyId,
  {
    propertyId: 'prop-789',
    serviceCategory: 'plumbing',
    description: 'Leak in kitchen sink',
    priorityLevel: 'high'
  },
  userId
);

// Submit review after completion
await RealEstateContractors.submitContractorReview(
  companyId,
  {
    contractorId: 'cont-123',
    rating: 5,
    reviewText: 'Excellent work, very professional'
  },
  userId
);
```

---

#### 5. **RealEstateLeaseAutomation.js**
Lease management, rent payment scheduling, and renewal tracking.

**Key Methods:**
- `createRentPaymentSchedule()` - Set up recurring payments
- `getRentPaymentSchedules()` - Get payment schedules
- `createRentPaymentEntry()` - Track individual payments
- `getRentPaymentHistory()` - Get payment history
- `updateRentPaymentStatus()` - Update payment status
- `createLeaseRenewalOffer()` - Create renewal offers
- `respondToRenewalOffer()` - Accept/decline renewals
- `getUpcomingLeaseRenewals()` - Get expiring leases
- `getRentPaymentAnalytics()` - Analyze payment patterns
- `getPaymentsRequiringReminders()` - Get overdue payments

**Usage:**
```javascript
import { RealEstateLeaseAutomation } from '@/api/RealEstateLeaseAutomation';

// Create payment schedule
const scheduleId = await RealEstateLeaseAutomation.createRentPaymentSchedule(
  companyId,
  {
    leaseId: 'lease-999',
    paymentAmount: 2500,
    paymentDueDate: 1,
    lateFeePercentage: 5,
    gracePeriodDays: 5
  },
  userId
);

// Record payment
await RealEstateLeaseAutomation.createRentPaymentEntry(
  companyId,
  {
    leaseId: 'lease-999',
    amountDue: 2500,
    amountPaid: 2500,
    paymentMethod: 'bank_transfer'
  },
  userId
);
```

---

#### 6. **RealEstateIntelligence.js**
Market data, comparable properties analysis, and AI-powered recommendations.

**Key Methods:**
- `recordMarketData()` - Log market statistics
- `getMarketData()` - Query market information
- `getMarketTrends()` - Analyze market trends
- `createComparableAnalysis()` - Create comps for valuations
- `getComparableProperties()` - Get similar properties
- `generateValuationReport()` - Create CMA reports
- `recordAgentMetrics()` - Track agent performance
- `getAgentPerformance()` - Get agent stats
- `scoreClient()` - Calculate client lead scores
- `getHighValueClients()` - Identify hot prospects
- `createAgentRecommendation()` - AI recommendations

**Usage:**
```javascript
import { RealEstateIntelligence } from '@/api/RealEstateIntelligence';

// Record market data
await RealEstateIntelligence.recordMarketData(
  companyId,
  {
    marketRegion: 'Downtown District',
    averagePrice: 450000,
    medianPrice: 425000,
    pricePerSqft: 250,
    daysOnMarketAverage: 28
  },
  userId
);

// Generate valuation report
const report = await RealEstateIntelligence.generateValuationReport(companyId, propertyId);

// Score high-value clients
const hotLeads = await RealEstateIntelligence.getHighValueClients(companyId, 20);
```

---

#### 7. **RealEstateAnalytics.js**
Comprehensive analytics, reporting, and KPI tracking.

**Key Methods:**
- `logAuditEvent()` - Log system actions
- `getAuditLog()` - Query audit trails
- `getPortfolioAnalytics()` - Analyze portfolio
- `getTransactionAnalytics()` - Get transaction stats
- `getRevenueAnalytics()` - Track revenue
- `recordKPI()` - Log KPI metrics
- `getKPIMetrics()` - Retrieve KPIs
- `calculateCompanyKPIs()` - Compute key metrics
- `generateCompanyReport()` - Create reports
- `trackUserActivity()` - Log user actions
- `recordSystemMetric()` - Monitor system health

**Usage:**
```javascript
import { RealEstateAnalytics } from '@/api/RealEstateAnalytics';

// Get portfolio analytics
const portfolio = await RealEstateAnalytics.getPortfolioAnalytics(companyId);

// Generate monthly report
const report = await RealEstateAnalytics.generateCompanyReport(
  companyId,
  'monthly',
  {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }
);

// Log audit event
await RealEstateAnalytics.logAuditEvent(
  companyId,
  {
    action: 'property_updated',
    resourceType: 'property',
    resourceId: 'prop-123',
    changes: { price: 450000 }
  },
  userId
);
```

---

### Notification System

#### **NotificationService.js**
Unified notification system powered by Novu for all real estate operations.

**Key Methods:**

**Trust Accounting Alerts:**
- `notifyTrustAccountCreated()` - New account notifications
- `notifyEscrowReleased()` - Escrow release notifications
- `notifyCommissionPayout()` - Commission payout alerts

**Offer & Negotiation:**
- `notifyOfferCreated()` - New offer alerts
- `notifyCounterOfferReceived()` - Counter-offer notifications
- `notifyCounterOfferExpiring()` - Expiration reminders

**Document Management:**
- `notifySignatureRequested()` - E-signature requests
- `notifyDocumentSigned()` - Signature completion

**Contractor Management:**
- `notifyMaintenanceRequestCreated()` - New work orders
- `notifyMaintenanceCompleted()` - Completion notifications

**Lease & Rent:**
- `notifyLeaseRenewalDue()` - Renewal reminders
- `notifyRentDueReminder()` - Payment due reminders
- `notifyRentOverdue()` - Overdue alerts

**Market Intelligence:**
- `notifyMarketTrendAlert()` - Market analysis alerts
- `notifyHighValueLeadIdentified()` - Lead identification

**System:**
- `notifyPaymentFailure()` - Payment error alerts
- `notifyReconciliationDiscrepancy()` - Account discrepancies

**Bulk Operations:**
- `sendBulkRentReminders()` - Send to multiple tenants
- `sendBulkLeaseRenewalNotices()` - Send to multiple managers
- `sendBulkMarketAlerts()` - Send to multiple agents

**Usage:**
```javascript
import NotificationService from '@/api/NotificationService';

// Notify about new offer
await NotificationService.notifyOfferCreated(
  companyId,
  {
    propertyAddress: '123 Main St',
    offerAmount: 450000,
    buyerName: 'John Doe'
  },
  'agent@example.com'
);

// Send bulk rent reminders
await NotificationService.sendBulkRentReminders(
  companyId,
  [
    { tenantEmail: 'tenant1@example.com' },
    { tenantEmail: 'tenant2@example.com' }
  ],
  {
    propertyAddress: '456 Oak Ave',
    rentAmount: 2500,
    dueDate: '2024-02-01'
  }
);
```

---

## API Index Export

The `index.js` file provides unified access to all APIs:

```javascript
import { 
  RealEstateTrustAccounting,
  RealEstateOffers,
  RealEstateDocuments,
  RealEstateContractors,
  RealEstateLeaseAutomation,
  RealEstateIntelligence,
  RealEstateAnalytics,
  RealEstateAPI
} from '@/api';

// Direct imports
const accountId = await RealEstateTrustAccounting.createTrustAccount(...);

// Or use unified API
const accountId = await RealEstateAPI.trust('createTrustAccount', ...);
```

---

## Database Tables

All APIs interact with PowerSync, which syncs with these Supabase tables:

### Trust Accounting
- `univ_re_trust_accounts` - Trust account records
- `univ_re_trust_ledger` - Transaction ledger
- `univ_re_escrow_accounts` - Escrow holdings
- `univ_re_commission_details` - Commission payouts
- `univ_re_commission_rules` - Commission structures

### Offers & Documents
- `univ_re_offers` - Offers and counteroffers
- `univ_re_counter_offers` - Counter-offer records
- `univ_re_documents` - Document storage
- `univ_re_document_templates` - Document templates
- `univ_re_e_signatures` - E-signature requests

### Contractors & Maintenance
- `univ_re_contractors` - Contractor records
- `univ_re_contractor_reviews` - Contractor ratings
- `univ_re_maintenance_requests` - Maintenance work orders

### Leases & Rent
- `univ_re_leases` - Lease agreements
- `univ_re_lease_renewals` - Renewal offers
- `univ_re_rent_payment_schedules` - Payment schedules
- `univ_re_rent_payment_history` - Payment records

### Market Intelligence
- `univ_re_market_data` - Market statistics
- `univ_re_comparable_properties` - Comparable sales
- `univ_re_agent_metrics` - Agent performance
- `univ_re_client_scoring` - Lead scoring
- `univ_re_agent_recommendations` - AI recommendations

### Analytics & Monitoring
- `univ_re_kpi_tracking` - KPI records
- `univ_re_reports` - Generated reports
- `univ_re_user_activity` - User action logs
- `univ_re_audit_log` - Audit trail
- `univ_re_system_metrics` - System monitoring
- `univ_re_notifications_log` - Notification history

---

## Environment Variables

Required environment variables for the APIs:

```env
# PowerSync Configuration
VITE_POWERSYNC_URL=https://your-powersync-url
VITE_POWERSYNC_API_KEY=your-powersync-api-key

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Paystack Integration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# Novu Notification Service
NOVU_API_KEY=your-novu-api-key

# Database URLs (if using direct connections)
DATABASE_URL=postgresql://...
```

---

## Error Handling

All API methods include comprehensive error handling:

```javascript
try {
  const result = await RealEstateOffers.createCounterOffer(...);
} catch (e) {
  console.error('Error creating counter offer:', e);
  // Error handling logic
}
```

---

## Performance Optimization

### PowerSync Caching
- Automatic offline-first caching
- Background sync when connectivity returns
- Optimistic updates for better UX

### Database Indexing
- All APIs use indexed queries
- Parameterized queries prevent SQL injection
- Efficient filtering and sorting

### Batch Operations
- Bulk notification methods for high-volume sends
- Transaction support for financial operations
- Audit logging for compliance

---

## Security Best Practices

1. **Authentication**: All methods require valid userId and companyId
2. **Parameterized Queries**: SQL injection prevention via prepared statements
3. **Audit Logging**: All financial operations logged for compliance
4. **Data Validation**: Input validation on all entry points
5. **Role-Based Access**: Integrate with authentication system
6. **Encryption**: Sensitive data encrypted at rest

---

## Integration Examples

### Complete Offer & Commission Workflow
```javascript
import { 
  RealEstateOffers, 
  RealEstateTrustAccounting, 
  NotificationService 
} from '@/api';

// 1. Create counter-offer
const counterId = await RealEstateOffers.createCounterOffer(
  companyId,
  counterOfferData,
  userId
);

// 2. Accept counter-offer
await RealEstateOffers.respondToCounterOffer(
  companyId,
  counterId,
  'accepted',
  userId
);

// 3. Calculate and record commission
const commissionId = await RealEstateTrustAccounting.recordCommissionPayout(
  companyId,
  {
    transactionId: offerId,
    buyerAgentId: agentId,
    sellerAgentId: agentId2
  },
  userId
);

// 4. Notify agents
await NotificationService.notifyCommissionPayout(
  companyId,
  { totalCommission: 13500 },
  agentEmail
);
```

---

## Testing

Each API module includes proper error handling and validation:

```javascript
// Test transaction recording
async function testTrustAccounting() {
  try {
    const accountId = await RealEstateTrustAccounting.createTrustAccount(
      'company-1',
      {
        accountName: 'Test Account',
        accountType: 'operating',
        bankName: 'Test Bank',
        accountNumber: '1234567890',
        routingNumber: '987654321',
        accountHolderName: 'Test Corp'
      },
      'user-1'
    );
    console.log('Account created:', accountId);
  } catch (e) {
    console.error('Test failed:', e);
  }
}
```

---

## Next Steps

1. **Deploy to Production**: Use CI/CD pipeline to deploy APIs
2. **Configure Novu**: Set up email/SMS templates in Novu dashboard
3. **Enable Webhooks**: Configure payment webhooks for Paystack
4. **Set Up Monitoring**: Configure system metrics logging
5. **User Testing**: Test workflows with beta users
6. **Documentation**: Generate API documentation from JSDoc comments

---

## Support

For issues or questions:
1. Check API error messages and logs
2. Review audit trail for transaction history
3. Contact development team with detailed error context
