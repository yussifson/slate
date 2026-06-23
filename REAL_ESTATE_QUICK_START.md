# Real Estate Vertical - Quick Start Guide

## Installation & Setup

### 1. Initialize on App Startup
```javascript
// In your main App component or initialization routine
import { initializeRealEstateModule } from '@/lib/realEstateModule';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';

function App() {
  const powerSync = usePowerSync();
  const companyId = useCompanyId();

  useEffect(() => {
    const init = async () => {
      try {
        const result = await initializeRealEstateModule(powerSync, companyId);
        console.log('Real Estate module initialized:', result);
      } catch (e) {
        console.error('Initialization failed:', e);
      }
    };
    
    if (companyId) init();
  }, [companyId]);
}
```

---

## Common Usage Patterns

### Create a Property
```javascript
import { RealEstateAPI } from '@/lib/realEstateModule';
import { useAuth } from '@/lib/AuthContext';

const { user } = useAuth();
const companyId = useCompanyId();

const propertyId = await RealEstateAPI.createProperty(companyId, {
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  country: 'USA',
  zipCode: '94105',
  propertyType: 'residential',
  bedrooms: 3,
  bathrooms: 2.5,
  squareFeet: 2000,
  price: 1500000,
  yearBuilt: 2010,
  description: 'Beautiful home with great views',
  features: ['pool', 'garage', 'patio'],
}, user.id);
```

### Get All Properties
```javascript
const properties = await RealEstateAPI.getProperties(companyId, {
  status: 'active',
  propertyType: 'residential',
});
```

### Update a Property
```javascript
await RealEstateAPI.updateProperty(companyId, propertyId, {
  price: 1450000,
  status: 'pending',
}, user.id);
```

### Create a Client
```javascript
const clientId = await RealEstateAPI.createClient(companyId, {
  name: 'John Smith',
  email: 'john@example.com',
  phone: '+1-555-0123',
  type: 'buyer',
  city: 'San Francisco',
  budget: 2000000,
  preferences: ['modern', 'pool', 'garage'],
}, user.id);
```

### Schedule a Viewing
```javascript
const viewingId = await RealEstateAPI.createViewing(companyId, {
  propertyId: 'prop_123',
  propertyAddress: '123 Main St',
  clientId: 'client_456',
  clientName: 'John Smith',
  agentId: 'agent_789',
  agentName: 'Sarah Johnson',
  viewingDate: '2024-07-15',
  viewingTime: '14:00',
  durationMinutes: 30,
}, user.id);

// Send notification
await RealEstateNotifications.notifyViewingScheduled(companyId, viewing, agent, client);
```

### Create a Lease
```javascript
const leaseId = await RealEstateAPI.createLease(companyId, {
  propertyId: 'prop_123',
  propertyAddress: '123 Main St',
  tenantId: 'client_456',
  tenantName: 'Jane Doe',
  landlordId: 'client_789',
  landlordName: 'Property Owner',
  startDate: '2024-08-01',
  endDate: '2025-07-31',
  monthlyRent: 3500,
  securityDeposit: 7000,
}, user.id);

// Setup rent reminders
await RealEstateAutomation.setupRentPaymentReminder(companyId, lease, 5);
await RealEstateAutomation.setupLeaseRenewalReminder(companyId, lease, 30);
```

### Process a Commission Payment
```javascript
import { RealEstatePayments } from '@/lib/realEstateModule';

const { paymentId, amount } = await RealEstatePayments.processCommissionPayment(
  companyId,
  commission,
  agent,
  user.id
);

// Initialize Paystack checkout if needed
const paymentLink = await RealEstatePayments.generateCommissionPaymentLink(commission);
```

---

## Notifications

### Send Viewing Reminder
```javascript
import { RealEstateNotifications } from '@/lib/realEstateModule';

await RealEstateNotifications.notifyViewingScheduled(companyId, viewing, agent, client);
```

### Send Offer Notification
```javascript
await RealEstateNotifications.notifyOfferReceived(companyId, offer, property, agent);
```

### Send Lease Renewal Reminder
```javascript
await RealEstateNotifications.notifyLeaseRenewalReminder(companyId, lease, tenant, landlord);
```

### Send Rent Payment Due
```javascript
await RealEstateNotifications.notifyRentPaymentDue(companyId, lease, tenant, 5);
```

---

## Intelligence & Analytics

### Run Full Intelligence Analysis
```javascript
import { runRealEstateIntelligence } from '@/lib/realEstateModule';

const insights = await runRealEstateIntelligence(companyId);
// Returns array of insights with severity, confidence, and actionable data
```

### Get Property Valuation Insights
```javascript
import { realEstateEngine } from '@/lib/realEstateModule';

const insights = await realEstateEngine.propertyValuationPrediction(companyId);
```

### Get Buyer Readiness Scores
```javascript
const insights = await realEstateEngine.buyerReadinessScoring(companyId);
// Identifies high-intent buyers for follow-up
```

### Get Agent Performance
```javascript
const insights = await realEstateEngine.agentPerformanceAnalytics(companyId);
// Shows top performers and underperformers
```

### Get Lease Renewal Risk
```javascript
const insights = await realEstateEngine.leaseRenewalRisk(companyId);
// Alerts for leases expiring in next 30 days
```

---

## Offline Sync

### Check Offline Availability
```javascript
import { isTableOfflineAvailable, getTableOfflineInfo } from '@/lib/realEstateModule';

const available = isTableOfflineAvailable('univ_re_properties'); // true
const info = getTableOfflineInfo('univ_re_properties');
// { available: true, description: '...', isCritical: true }
```

### Get Sync Status
```javascript
import { getRealEstateSyncStatus, getRealEstateSyncDashboard } from '@/lib/realEstateModule';

const status = await getRealEstateSyncStatus(powerSync, 'univ_re_properties', companyId);
// { tableName: 'univ_re_properties', status: 'synced', localCount: 15, pendingSync: 0 }

const dashboard = await getRealEstateSyncDashboard(powerSync, companyId);
// Complete sync overview for all RE tables
```

### Resolve Sync Conflicts
```javascript
import { resolveRealEstateSyncConflicts } from '@/lib/realEstateModule';

const result = await resolveRealEstateSyncConflicts(powerSync, companyId);
// Automatically resolves pending changes when coming back online
```

---

## Workflows (Batch Operations)

### Create Property with Initial Viewings
```javascript
import { RealEstateWorkflows } from '@/lib/realEstateModule';

const { propertyId, viewingIds } = await RealEstateWorkflows.createPropertyListing(
  companyId,
  {
    address: '123 Main St',
    city: 'San Francisco',
    // ... other property data
  },
  [
    {
      clientId: 'client_456',
      viewingDate: '2024-07-15',
      viewingTime: '14:00',
    },
    {
      clientId: 'client_789',
      viewingDate: '2024-07-16',
      viewingTime: '15:00',
    },
  ]
);
```

### Create Lease with Reminders
```javascript
const { leaseId } = await RealEstateWorkflows.createLeaseWithReminders(
  companyId,
  {
    propertyId: 'prop_123',
    tenantId: 'client_456',
    // ... other lease data
  },
  {
    daysBeforeRenewal: 30,
    daysBeforeRent: 5,
  }
);
```

---

## Error Handling

```javascript
import { RealEstateAPI } from '@/lib/realEstateModule';
import { toast } from 'react-hot-toast';

try {
  const propertyId = await RealEstateAPI.createProperty(companyId, data, user.id);
  toast.success('Property created successfully');
} catch (error) {
  console.error('Failed to create property:', error);
  toast.error('Failed to create property');
}
```

---

## Component Integration

### Using in React Components
```javascript
import { RealEstateAPI } from '@/lib/realEstateModule';
import { usePowerSync } from '@powersync/react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';

export function MyComponent() {
  const powerSync = usePowerSync();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    async function loadProperties() {
      const data = await RealEstateAPI.getProperties(companyId);
      setProperties(data);
    }
    loadProperties();
  }, [companyId]);

  return (
    // render properties
  );
}
```

---

## Module Configuration

Access the configuration object for feature detection:

```javascript
import { REALESTATECONFIG } from '@/lib/realEstateModule';

console.log(REALESTATECONFIG.features); // { properties: true, clients: true, ... }
console.log(REALESTATECONFIG.integrations); // { novu: true, paystack: true, ... }
console.log(REALESTATECONFIG.intelligence.engines); // ['propertyValuation', 'buyerReadiness', ...]
```

---

## Troubleshooting

### Offline Data Not Syncing
1. Check sync status: `getRealEstateSyncStatus(powerSync, 'univ_re_properties', companyId)`
2. Look for pending items: `getRealEstateSyncDashboard(powerSync, companyId)`
3. Manually resolve: `resolveRealEstateSyncConflicts(powerSync, companyId)`

### Notifications Not Sending
1. Verify Novu credentials in environment variables
2. Check automation_logs table for queued notifications
3. Review browser console for connection errors

### Payment Processing Issues
1. Verify Paystack public/secret keys
2. Check internet connectivity
3. Review payment logs in automation_logs table

---

## Resources

- Implementation Details: `REAL_ESTATE_IMPLEMENTATION.md`
- API Reference: `src/api/RealEstateAPI.js`
- Intelligence Engine: `src/lib/intelligence/engines/real-estate.js`
- UI Components: `src/pages/real-estate/`
- Integrations: `src/api/RealEstateIntegrations.js`
- Offline Sync: `src/api/RealEstateOfflineSync.js`
