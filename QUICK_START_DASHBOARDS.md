# Quick Start: Implementing Remaining 15 Dashboards

## What's Already Done

✓ Design system with animations  
✓ Reusable component library  
✓ Law Firm Dashboard (reference)  
✓ Template and guidelines  

## How to Implement Each Dashboard (10 min per dashboard)

### Step 1: Create/Open Dashboard File
```bash
# Example for Hospital
src/components/dashboard/HospitalDashboard.jsx
```

### Step 2: Import Components
```jsx
import { 
  DashboardMetricCard, 
  DashboardChartCard, 
  DashboardAreaChart,
  DashboardBarChart
} from '@/components/dashboard/DashboardLibrary';
```

### Step 3: Copy Law Firm Structure
Use `LawDashboard.jsx` as template. Update:
- Data queries (use Hospital entities instead of LegalCase)
- Metric calculations
- Chart data
- Zone 3 cards

### Step 4: Update 4 KPI Metrics
Replace with vertical-specific metrics from spec. Example for Hospital:

```jsx
<DashboardMetricCard
  title="Patients Seen Today"
  value={patientsToday.length}
  icon={Users}
  iconBg="bg-blue-50 dark:bg-blue-950/20"
  iconColor="text-blue-600"
  subtitle="24-hour count"
/>
```

### Step 5: Update Main Chart
```jsx
<DashboardChartCard title="Daily Patient Volume">
  <DashboardAreaChart data={chartData} dataKey="volume" color="#3b82f6" />
</DashboardChartCard>
```

### Step 6: Add Zone 3 Cards (2-4 cards)
Copy pattern from Law Firm:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 zone-3">
  {/* Card 1 */}
  {/* Card 2 */}
  {/* Card 3 */}
</div>
```

### Step 7: Test Responsive
- Desktop: 1280px
- Tablet: 768px
- Mobile: 375px

### Step 8: Commit
```bash
git add src/components/dashboard/[DashboardName].jsx
git commit -m "feat: Enhance [Vertical] Dashboard with design system"
```

## Dashboard Specifications Quick Reference

### HOSPITAL
- KPIs: Patients seen today, Appointments scheduled tomorrow, Bed occupancy %, Revenue collected month
- Chart: Daily patient volume (line chart)
- Zone 3: Ward occupancy grid, appointment schedule, pharmacy alerts, insurance claims

### SCHOOL
- KPIs: Total students, Attendance today %, Outstanding fees value, Exams this week
- Chart: Weekly attendance rate (line chart)
- Zone 3: At-risk students, fee collection gauge, class schedule, events

### HIGH SCHOOL
- KPIs: Total students, Attendance week %, Outstanding fees, Exam results pending
- Chart: Attendance per class (bar chart)
- Zone 3: Exam results summary, fee by class, boarding status, admissions pipeline

### UNIVERSITY
- KPIs: Total students, New admissions semester, Research grants value, Revenue month
- Chart: Enrollment by faculty (bar chart)
- Zone 3: Faculty utilization, active grants, student wellbeing flags, career placement

### ONLINE LEARNING
- KPIs: Active learners, Course completions, Revenue, Completion rate
- Chart: Daily new enrollments (area chart)
- Zone 3: Top courses, dropout risk, affiliate performance, reviews

### VOCATIONAL
- KPIs: Active trainees, Programme completion %, Employment placement %, Certifications
- Chart: Trainee enrollment by program (bar chart)
- Zone 3: Competency assessment, equipment status, internship placements, partner metrics

### HOTEL
- KPIs: Current occupancy %, Revenue per room, Arrivals today, Departures today
- Chart: Daily occupancy with 30-day forecast (area/line combo)
- Zone 3: Room status grid, arrival list, housekeeping progress, guest satisfaction

### RELIGION
- KPIs: Active members, Attendance last service, Giving this month, Events this week
- Chart: Weekly giving trend (line chart)
- Zone 3: Member engagement health, upcoming events, volunteer coverage, prayer requests

### INSURANCE
- KPIs: Active policies value, Expiring this month, Claims under review, Premium collected
- Chart: Monthly premium collection (bar chart)
- Zone 3: Policy expiry timeline, claims by status, agent performance, high-risk flags

### REAL ESTATE
- KPIs: Active listings, Viewings this week, Transactions value, Rent collected
- Chart: Monthly transaction volume and value (bar chart)
- Zone 3: Transaction pipeline, no-viewing properties, lease renewals, agent leaderboard

### RETAIL
- KPIs: Revenue today, Transactions, Average transaction value, Low stock alerts
- Chart: Hourly sales vs yesterday (bar comparison)
- Zone 3: Top products by qty/revenue, stock alerts, customer visits/return, live transactions

### LOGISTICS
- KPIs: Active shipments, Deliveries today, On-time rate week, Fleet vehicles active
- Chart: Daily delivery volume (bar chart)
- Zone 3: Shipment status breakdown, delayed shipments, fleet status, driver leaderboard

### HR
- KPIs: Active employees, Open positions, Leave requests pending, Payroll this month
- Chart: Headcount growth (area chart)
- Zone 3: Turnover risk alerts, pending approvals, probation reviews, training completion

### PHARMACY
- KPIs: Prescriptions filled today, Revenue, Drugs below reorder, Batches expiring
- Chart: Daily prescriptions + OTC sales (stacked bar chart)
- Zone 3: Drug expiry alerts, insurance claims, top 10 drugs, controlled substance count

### MARKETING AGENCY
- KPIs: Active campaigns, Leads generated, Revenue, Average campaign ROI
- Chart: Daily lead generation (bar chart)
- Zone 3: Campaign performance table, client pipeline, deadlines, top channels

## Color Assignments

Use these icon colors for consistency:

| Vertical | Primary | Secondary | Alert |
|----------|---------|-----------|-------|
| Hospital | blue-600 | red-600 | amber-600 |
| School | purple-600 | emerald-600 | amber-600 |
| Hotel | blue-600 | emerald-600 | orange-600 |
| Insurance | purple-600 | red-600 | orange-600 |
| Retail | orange-600 | red-600 | amber-600 |
| Logistics | orange-600 | blue-600 | red-600 |
| HR | green-600 | red-600 | amber-600 |
| Real Estate | blue-600 | emerald-600 | amber-600 |
| Pharmacy | green-600 | red-600 | amber-600 |
| Marketing | pink-600 | blue-600 | red-600 |

## Component Imports Always Include

```jsx
import { format, differenceInDays, isAfter } from 'date-fns';
import { DollarSign, Users, BarChart2, AlertCircle, TrendingUp } from 'lucide-react';
import { 
  DashboardMetricCard, 
  DashboardChartCard, 
  DashboardAreaChart, 
  DashboardBarChart,
  InsightAlertCard
} from '@/components/dashboard/DashboardLibrary';
```

## Common Patterns

### Number Counter Animation
Metric values automatically animate from 0 to value using CSS count-up animation (1000ms).

### Card Stagger
Zone 1 metrics: 0ms, 60ms, 120ms, 180ms  
Zone 3 cards: start after Zone 2 chart (300ms+)

### Responsive Grids
```jsx
// Automatically responsive
grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

### Period Selector
Automatically available in DashboardChartCard:
```jsx
<DashboardChartCard 
  title="Chart Title"
  periods={['7D', '30D', '90D', '1Y']}
  onPeriodChange={(period) => refetchData(period)}
>
```

## Testing Checklist

- [ ] Metrics display correct numbers
- [ ] Chart renders with data
- [ ] Mobile view: 375px stacks to single column
- [ ] Tablet view: 768px shows 2 columns
- [ ] Desktop view: 1280px shows 4 columns
- [ ] Animations trigger on page load
- [ ] Intelligence Dashboard loads for vertical
- [ ] Build passes without errors
- [ ] No console errors

## Files to Reference

- `LawDashboard.jsx` - Full reference implementation
- `DashboardLibrary.jsx` - Component API
- `DASHBOARD_TEMPLATE.md` - Implementation guide
- `index.css` - Animation definitions
- `tailwind.config.js` - Responsive breakpoints

---

That's it! Follow this pattern for each of the 15 remaining dashboards. Each takes ~10 minutes with the template as reference.
