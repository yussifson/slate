# Dashboard Enhancement Template

This template shows how to enhance each vertical-specific dashboard following the world-class design specifications.

## Implementation Steps

### 1. Import the Dashboard Library Components
```jsx
import { 
  DashboardMetricCard, 
  DashboardChartCard, 
  DashboardAreaChart, 
  DashboardBarChart,
  InsightAlertCard,
  MetricGrid,
  DataTableCard
} from '@/components/dashboard/DashboardLibrary';
```

### 2. Structure: Zone 1 (KPIs) → Zone 2 (Main Chart) → Zone 3 (Supporting Cards)

```jsx
return (
  <div className="page-enter space-y-6 pb-8">
    {/* Header */}
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Title</h1>
      <p className="text-muted-foreground">Dashboard description</p>
    </div>

    {/* Zone 1: Primary KPI Metrics (4 cards) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 zone-1">
      <DashboardMetricCard
        title="KPI 1"
        value={value}
        icon={Icon}
        iconBg="bg-blue-50 dark:bg-blue-950/20"
        iconColor="text-blue-600"
        subtitle="Subtitle"
      />
      {/* ... 3 more metric cards ... */}
    </div>

    {/* Intelligence Dashboard */}
    <IntelligenceDashboard vertical="vertical-key" compact={true} maxItems={3} />

    {/* Zone 2: Main Chart */}
    <DashboardChartCard
      title="Chart Title"
      onPeriodChange={(period) => handlePeriodChange(period)}
    >
      <DashboardAreaChart data={chartData} dataKey="value" color="#10b981" />
    </DashboardChartCard>

    {/* Zone 3: Supporting Cards (2-4 cards) */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 zone-3">
      {/* Card 1 */}
      {/* Card 2 */}
      {/* Card 3 */}
      {/* Card 4 */}
    </div>
  </div>
);
```

## Color Scheme for Each Vertical

- **Law**: Blue (primary), Emerald (success)
- **Hospital**: Red (urgent), Green (available), Blue (occupied)
- **School**: Purple (primary), Amber (warning)
- **High School**: Indigo (primary), Emerald (success)
- **University**: Blue (primary), Purple (research)
- **Online Learning**: Orange (primary), Green (success)
- **Vocational**: Red (primary), Amber (warning)
- **Hotel**: Blue (primary), Green (available), Orange (maintenance)
- **Religion**: Purple (primary), Blue (secondary)
- **Insurance**: Purple (primary), Red (danger)
- **Retail**: Orange (primary), Red (alert)
- **Logistics**: Orange (primary), Blue (info)
- **HR**: Green (primary), Red (alert)
- **Real Estate**: Blue (primary), Emerald (success)
- **Pharmacy**: Green (primary), Red (alert)
- **Marketing**: Pink (primary), Blue (secondary)

## Animations Applied Automatically

- **Page load**: `page-enter` - fade in + translateY(12px)
- **Metric cards**: Staggered at 60ms intervals
- **Charts**: `card-enter` - fade in
- **List items**: `list-item-enter` - fade in + translateX(-8px)
- **Zone 3 cards**: Staggered at 60ms intervals after main chart

## Responsive Behavior

- **Desktop**: Full width with proper grid layouts
- **Tablet**: Zone 1 stays 2 cols, Zone 3 becomes 2 cols
- **Mobile**: All zones stack to 1-2 columns, charts reduced height

## Completed Dashboards

- ✓ Law Firm Dashboard

## Dashboards Requiring Enhancement

1. Hospital Dashboard
2. School Dashboard
3. High School Dashboard
4. University Dashboard
5. Online Learning Dashboard
6. Vocational Dashboard
7. Hotel Dashboard
8. Religion Dashboard
9. Insurance Dashboard
10. Retail Dashboard
11. Logistics Dashboard
12. HR Dashboard
13. Real Estate Dashboard
14. Pharmacy Dashboard
15. Marketing Agency Dashboard
