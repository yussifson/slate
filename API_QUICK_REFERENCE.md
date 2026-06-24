# Real Estate API - Quick Reference Guide

## Import Statements

```javascript
// Individual imports
import { RealEstateTrustAccounting } from '@/api/RealEstateTrustAccounting';
import { RealEstateOffers } from '@/api/RealEstateOffers';
import { RealEstateDocuments } from '@/api/RealEstateDocuments';
import { RealEstateContractors } from '@/api/RealEstateContractors';
import { RealEstateLeaseAutomation } from '@/api/RealEstateLeaseAutomation';
import { RealEstateIntelligence } from '@/api/RealEstateIntelligence';
import { RealEstateAnalytics } from '@/api/RealEstateAnalytics';
import NotificationService from '@/api/NotificationService';

// Or unified import
import { RealEstateAPI } from '@/api';

// PowerSync connection
import { powerSync } from '@/api/PowerSyncConnector';
```

---

## Common Operations

### 1. Create Trust Account
```javascript
const accountId = await RealEstateTrustAccounting.createTrustAccount(
  companyId,
  {
    accountName: 'Operating Account',
    accountType: 'operating',
    bankName: 'First National Bank',
    accountNumber: '123456789',
    routingNumber: '987654321',
    accountHolderName: 'Real Estate Co'
  },
  userId
);
```

### 2. Record Transaction
```javascript
await RealEstateTrustAccounting.recordTrustTransaction(
  companyId,
  {
    trustAccountId: accountId,
    transactionType: 'deposit', // or 'withdrawal', 'fee', 'interest'
    amount: 50000,
    description: 'Earnest money from buyer'
  },
  userId
);
```

### 3. Create Counter-Offer
```javascript
const counterId = await RealEstateOffers.createCounterOffer(
  companyId,
  {
    originalOfferId: 'offer-123',
    counterOfferBy: 'seller',
    counterOfferPrice: 425000,
    closingDate: '2024-08-15',
    contingencies: ['inspection', 'appraisal'],
    earnestMoneyChange: 5000
  },
  userId
);
```

### 4. Request Signature
```javascript
const sigRequestId = await RealEstateDocuments.requestSignature(
  companyId,
  {
    documentId: 'doc-123',
    signerName: 'John Buyer',
    signerEmail: 'john@example.com',
    signerPhone: '555-1234',
    expirationDays: 30
  },
  userId
);
```

### 5. Create Maintenance Request
```javascript
const maintenanceId = await RealEstateContractors.createMaintenanceRequest(
  companyId,
  {
    propertyId: 'prop-123',
    requestType: 'repair',
    serviceCategory: 'plumbing',
    description: 'Leaky faucet in bathroom',
    priorityLevel: 'high' // or 'normal', 'low'
  },
  userId
);
```

### 6. Create Payment Schedule
```javascript
const scheduleId = await RealEstateLeaseAutomation.createRentPaymentSchedule(
  companyId,
  {
    leaseId: 'lease-123',
    paymentDueDate: 1, // Day of month
    paymentAmount: 2500,
    lateFeeAmount: 100,
    lateFeePercentage: 5,
    gracePeriodDays: 5,
    isRecurring: true,
    paymentMethod: 'bank_transfer'
  },
  userId
);
```

### 7. Record Market Data
```javascript
await RealEstateIntelligence.recordMarketData(
  companyId,
  {
    marketRegion: 'Downtown District',
    marketLevel: 'neighborhood',
    averagePrice: 450000,
    medianPrice: 425000,
    pricePerSqft: 250,
    daysOnMarketAverage: 28,
    soldListingsCount: 45,
    activeListingsCount: 32,
    marketTrend: 'appreciation'
  },
  userId
);
```

### 8. Generate Report
```javascript
const report = await RealEstateAnalytics.generateCompanyReport(
  companyId,
  'monthly',
  {
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }
);
```

### 9. Send Notification
```javascript
await NotificationService.notifyOfferCreated(
  companyId,
  {
    propertyAddress: '123 Main St',
    offerAmount: 450000,
    buyerName: 'John Doe'
  },
  'agent@example.com'
);
```

### 10. Log Audit Event
```javascript
await RealEstateAnalytics.logAuditEvent(
  companyId,
  {
    action: 'offer_accepted',
    resourceType: 'offer',
    resourceId: 'offer-123',
    changes: {
      status: 'accepted',
      acceptedDate: new Date().toISOString()
    }
  },
  userId
);
```

---

## Error Handling Pattern

```javascript
try {
  const result = await RealEstateOffers.createCounterOffer(
    companyId,
    counterOfferData,
    userId
  );
  console.log('Counter-offer created:', result);
} catch (error) {
  console.error('Error creating counter-offer:', error);
  // Handle error - show user message, log to analytics, etc.
  await RealEstateAnalytics.logAuditEvent(
    companyId,
    {
      action: 'error_occurred',
      resourceType: 'counter_offer',
      changes: { error: error.message }
    },
    userId
  );
}
```

---

## Query Patterns

### Get Trust Accounts
```javascript
const accounts = await RealEstateTrustAccounting.getTrustAccounts(
  companyId,
  {
    accountType: 'operating',
    isActive: true
  }
);
```

### Get Active Contractors
```javascript
const contractors = await RealEstateContractors.getContractors(
  companyId,
  {
    contractorType: 'plumber',
    isVerified: true,
    minRating: 4.5
  }
);
```

### Get Overdue Payments
```javascript
const overdue = await RealEstateLeaseAutomation.getOverduePayments(companyId);
```

### Get High-Value Clients
```javascript
const hotLeads = await RealEstateIntelligence.getHighValueClients(companyId, 20);
```

### Get Audit Log
```javascript
const auditTrail = await RealEstateAnalytics.getAuditLog(
  companyId,
  {
    userId: 'user-456',
    resourceType: 'offer',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }
);
```

---

## Workflow Examples

### Complete Sale Transaction
```javascript
// 1. Create initial offer
const offerId = await RealEstateOffers.createOffer(...);

// 2. Handle counter-offers until accepted
const counterId = await RealEstateOffers.createCounterOffer(...);
await RealEstateOffers.respondToCounterOffer(companyId, counterId, 'accepted', userId);

// 3. Calculate commissions
const commissionId = await RealEstateTrustAccounting.recordCommissionPayout(...);

// 4. Prepare documents
const docId = await RealEstateDocuments.generateDocumentFromTemplate(...);

// 5. Request signatures
const sigId = await RealEstateDocuments.requestSignature(...);

// 6. Process payment
const paymentRef = await RealEstateTrustAccounting.initializePaystackPayment(...);
const verification = await RealEstateTrustAccounting.verifyPaystackPayment(paymentRef);

// 7. Log everything
await RealEstateAnalytics.logAuditEvent(...);

// 8. Send notifications
await NotificationService.notifyCommissionPayout(...);
```

### Maintenance Request Workflow
```javascript
// 1. Create request
const maintenanceId = await RealEstateContractors.createMaintenanceRequest(...);

// 2. Get qualified contractors
const contractors = await RealEstateContractors.getContractors(
  companyId,
  { contractorType: 'plumber', minRating: 4 }
);

// 3. Assign to best contractor
await RealEstateContractors.assignMaintenanceToContractor(
  companyId,
  maintenanceId,
  contractors[0].id,
  userId
);

// 4. Update status when completed
await RealEstateContractors.updateMaintenanceStatus(
  companyId,
  maintenanceId,
  'completed',
  { completionNotes: 'Fixed leak, all working fine' }
);

// 5. Submit review
await RealEstateContractors.submitContractorReview(companyId, {
  contractorId: contractors[0].id,
  rating: 5,
  reviewText: 'Excellent work'
});

// 6. Notify about completion
await NotificationService.notifyMaintenanceCompleted(...);
```

### Month-End Rent Collection
```javascript
// 1. Get payments due
const duePayments = await RealEstateLeaseAutomation.getPaymentsRequiringReminders(companyId);

// 2. Send reminders
for (const payment of duePayments) {
  await NotificationService.notifyRentDueReminder(companyId, payment, payment.tenant_email);
}

// 3. Track overdue
const overduePayments = await RealEstateLeaseAutomation.getOverduePayments(companyId);

// 4. Send overdue notices
for (const payment of overduePayments) {
  await NotificationService.notifyRentOverdue(companyId, payment, managerEmail);
}

// 5. Generate analytics
const stats = await RealEstateLeaseAutomation.getCompanyRentPaymentStats(
  companyId,
  { startDate: '2024-01-01', endDate: '2024-01-31' }
);

// 6. Report
const report = await RealEstateAnalytics.generateCompanyReport(companyId, 'monthly');
```

---

## Data Types & Constants

### Transaction Types
```
'deposit', 'withdrawal', 'fee', 'interest'
```

### Offer Status
```
'pending', 'counter_offered', 'accepted', 'rejected', 'expired'
```

### Document Status
```
'draft', 'pending_signature', 'signed', 'executed', 'archived'
```

### Signature Status
```
'pending', 'signed', 'expired', 'rejected'
```

### Maintenance Priority
```
'low', 'normal', 'high', 'emergency'
```

### Maintenance Status
```
'open', 'assigned', 'in_progress', 'completed', 'closed'
```

### Payment Status
```
'pending', 'partial', 'paid', 'overdue', 'failed'
```

### Lead Category (Scoring)
```
'hot' (80+), 'warm' (50-79), 'cold' (20-49), 'inactive' (<20)
```

### Report Types
```
'monthly', 'quarterly', 'annual', 'custom'
```

---

## Best Practices

### 1. Always Include Error Handling
```javascript
try {
  // API call
} catch (error) {
  // Log error
  // Show user-friendly message
  // Track in analytics
}
```

### 2. Use Consistent UserId
```javascript
const userId = getCurrentUserId(); // From auth system
// Pass same userId to all API calls for tracking
```

### 3. Batch Operations for Performance
```javascript
// Send bulk notifications instead of individual
await NotificationService.sendBulkRentReminders(
  companyId,
  recipientList,
  reminderData
);
```

### 4. Log Audit Events for Compliance
```javascript
// Log all significant actions
await RealEstateAnalytics.logAuditEvent(
  companyId,
  { action, resourceType, resourceId, changes },
  userId
);
```

### 5. Validate Input Data
```javascript
if (!companyId || !userId || !data.amount) {
  throw new Error('Missing required fields');
}
```

### 6. Handle Offline Scenarios
```javascript
// PowerSync handles offline caching automatically
// Data syncs when connectivity returns
try {
  // API calls work offline too
} catch (error) {
  // Check if offline error
}
```

### 7. Use Notification Service for Communications
```javascript
// Always use NotificationService, not direct emails
await NotificationService.notifyOfferCreated(
  companyId,
  offerData,
  agentEmail
);
```

### 8. Generate Reports Periodically
```javascript
// Auto-generate monthly reports
const report = await RealEstateAnalytics.generateCompanyReport(
  companyId,
  'monthly'
);
```

---

## Performance Tips

### 1. Use Filters for Large Datasets
```javascript
// Good - filtered query
const contractors = await RealEstateContractors.getContractors(
  companyId,
  { contractorType: 'plumber', minRating: 4 }
);

// Avoid - fetching all then filtering in code
const allContractors = await RealEstateContractors.getContractors(companyId);
```

### 2. Limit Notification Volume
```javascript
// Send in bulk
await NotificationService.sendBulkRentReminders(...);
// Not in loop
```

### 3. Cache Market Data
```javascript
// Market data changes infrequently - cache results
const trends = await RealEstateIntelligence.getMarketTrends(companyId, region);
// Reuse cached trends
```

### 4. Use Pagination for Large Results
```javascript
// Get reports with limit
const reports = await RealEstateAnalytics.getCompanyReports(companyId, 20);
```

---

## Environment Setup Checklist

```
✓ VITE_POWERSYNC_URL configured
✓ VITE_SUPABASE_URL configured
✓ VITE_SUPABASE_ANON_KEY configured
✓ PAYSTACK_SECRET_KEY configured
✓ NOVU_API_KEY configured
✓ Database tables created
✓ PowerSync sync rules configured
✓ Novu templates created
✓ Paystack webhooks configured
✓ API tested with sample data
```

---

## Troubleshooting

### API Call Fails
1. Check userId and companyId are valid
2. Verify PowerSync connection
3. Check Supabase database
4. Review error message in logs

### Notifications Not Sent
1. Verify Novu API key
2. Check recipient email is valid
3. Review Novu dashboard for failed sends
4. Check notification templates exist

### Payment Processing Fails
1. Verify Paystack API keys
2. Check payment amount format (in cents)
3. Review Paystack dashboard
4. Check webhook configuration

### Offline Sync Issues
1. Check PowerSync sync rules
2. Verify connectivity when online
3. Review PowerSync dashboard
4. Check database schema matches

---

## Support Resources

- API Implementation Guide: `API_IMPLEMENTATION_GUIDE.md`
- Module Summary: `API_MODULES_SUMMARY.md`
- PowerSync Docs: PowerSync documentation
- Supabase Docs: Supabase documentation
- Novu Docs: Novu documentation
- Paystack Docs: Paystack documentation

---

## Quick Links

| Resource | Purpose |
|----------|---------|
| `src/api/index.js` | Main API export |
| `src/api/PowerSyncConnector.js` | Database sync |
| `API_IMPLEMENTATION_GUIDE.md` | Detailed documentation |
| `API_MODULES_SUMMARY.md` | Architecture overview |
