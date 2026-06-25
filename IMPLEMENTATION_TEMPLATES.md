# Hotel & Logistics Page Redesign - Implementation Templates

This document provides complete implementation patterns for all remaining pages. Each pattern shows the exact code structure to use when updating pages.

---

## HOTEL VERTICAL - Page Implementation Patterns

### 1. RESERVATIONS PAGE - Pattern
```jsx
import { motion } from 'framer-motion';
import { Calendar, Plus, Search, Filter, TrendingUp, BookOpen } from 'lucide-react';
import { HotelPageWrapper } from '@/components/hotel/HotelPageWrapper';
import { HotelKPICard } from '@/components/hotel/HotelKPICard';
import { BentoGrid, BentoGridItem, BentoCard } from '@/components/shared/BentoGrid';
import { DashboardSectionHeader } from '@/components/shared/DashboardSectionHeader';
import { Button } from '@/components/ui/button';

// Structure:
// 1. Header with title "Reservation Management"
// 2. KPI Cards: Total Reservations, Confirmed, Pending, Cancelled
// 3. Active Filters/Search bar
// 4. Bento layout with:
//    - Advanced calendar visualization
//    - Reservation list with status badges
//    - Group booking panel
//    - Channel manager integration
// 5. Modals for new/edit reservations

// KEY COMPONENTS TO USE:
<HotelPageWrapper
  title="Reservations"
  subtitle="Manage bookings and group events"
  icon={Calendar}
  actions={<Button className="gap-2 bg-red-600"><Plus /> New Booking</Button>}
>
  {/* KPI Grid */}
  <BentoGrid columns={{sm:1, md:2, lg:4}} gap={4}>
    <BentoGridItem delay={0}>
      <HotelKPICard
        title="Total Reservations"
        value={totalReservations}
        color="hotel"
        trend="up"
        icon={BookOpen}
      />
    </BentoGridItem>
    {/* More KPI cards */}
  </BentoGrid>

  {/* Main Content */}
  <BentoCard className="mt-8">
    <DashboardSectionHeader title="Upcoming Reservations" />
    {/* Reservation list table with premium styling */}
  </BentoCard>
</HotelPageWrapper>
```

### 2. ROOMS PAGE - Pattern
```jsx
// Title: "Room Inventory & Status"
// KPI Cards: Total Rooms, Available, Occupied, Maintenance
// Main Section: Room grid or table with:
//   - Room number badge
//   - Type and amenities
//   - Current status (use RoomStatusBadge component)
//   - Rate
//   - Quick actions (edit, assign, view)

// PREMIUM STYLING:
// - Use grid layout for room cards (responsive)
// - Color code rooms by status (available=green, occupied=red, cleaning=purple, etc)
// - Add hover effects showing room details
// - Floor filter tabs at top
// - Batch operations for maintenance/updates

<HotelPageWrapper
  title="Room Inventory"
  subtitle="Manage rooms, types, and amenities"
  icon={BedDouble}
>
  <BentoGrid columns={{sm:1, md:2, lg:3}} gap={4}>
    {/* Room cards with status badges */}
    {rooms.map((room, idx) => (
      <BentoGridItem key={room.id} delay={idx * 0.05}>
        <BentoCard interactive>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-bold text-2xl">Room {room.roomNumber}</p>
              <p className="text-sm text-muted-foreground">{room.type}</p>
            </div>
            <RoomStatusBadge status={room.status} />
          </div>
          <p className="text-sm mb-3">₹{room.rate}/night</p>
          <p className="text-xs text-muted-foreground">{room.amenities.join(', ')}</p>
        </BentoCard>
      </BentoGridItem>
    ))}
  </BentoGrid>
</HotelPageWrapper>
```

### 3. HOUSEKEEPING PAGE - Pattern
```jsx
// Title: "Housekeeping & Maintenance"
// KPI Cards: Rooms to Clean, In Progress, Inspecting, Complete
// Sections:
//   - Room assignment board (drag-drop or select)
//   - Staff shift tracking
//   - Maintenance requests (priority queue)
//   - Lost & found items log
//   - AI analysis for optimization

// LAYOUT:
// - Top: Staff assignments (chips with room counts)
// - Middle: Room board (Kanban-style with status columns)
// - Bottom: Maintenance & Lost & Found in accordion
```

### 4. GUESTS PAGE - Pattern
```jsx
// Title: "Guest Profiles & Loyalty"
// KPI Cards: Total Guests, VIP, Loyalty Members, Repeat Guests
// Split Layout:
//   - Left: Guest directory with search
//   - Right: Guest detail panel (when selected)
// Guest card shows:
//   - Name, Email, Phone
//   - Total spent, Nights stayed
//   - Loyalty tier and points
//   - Recent stays (dates)
//   - Special preferences/notes
```

### 5. GUEST REQUESTS PAGE - Pattern
```jsx
// Title: "Guest Services & Requests"
// KPI Cards: Open Requests, In Progress, Resolved Today, Average Response Time
// Main Table with columns:
//   - Request ID
//   - Guest Name
//   - Room Number
//   - Request Type (icon + text)
//   - Status (use badge)
//   - Priority
//   - Assigned to
//   - Created time
//   - Actions
```

### 6. RESTAURANT PAGE - Pattern
```jsx
// Title: "F&B Operations & Dining"
// KPI Cards: Today's Orders, Revenue, Tables Occupied, Average Order Value
// Layout:
//   - Menu management (categorized items)
//   - Orders board (real-time status)
//   - Waiter assignments
//   - Room service tracking
//   - Chef station queue
```

### 7. REVENUE MANAGEMENT PAGE - Pattern
```jsx
// Title: "Revenue & Pricing Analytics"
// KPI Cards: Revenue Today, Avg Rate, Occupancy %, RevPAR
// Charts:
//   - Revenue trend (7/30 day)
//   - Rate strategy by room type
//   - Occupancy forecast
// Strategy Section:
//   - Dynamic pricing rules
//   - Competitor rate analysis
//   - Promotion management
```

### 8. LOYALTY PAGE - Pattern
```jsx
// Title: "Guest Loyalty Program"
// KPI Cards: Active Members, Redemptions, Points Earned, Member Value
// Sections:
//   - Member tier breakdown
//   - Points summary
//   - Rewards catalog
//   - Promotional campaigns
//   - Member engagement metrics
```

### 9. GUEST PORTAL PAGE - Pattern
```jsx
// Title: "Guest Portal & Pre-Arrival"
// KPI Cards: Active Check-ins, Pre-arrivals, Digital Keys Issued
// Sections:
//   - Real-time reservation status
//   - Room photos & amenities
//   - Service requests
//   - Digital keycard QR
//   - Guest announcements
```

---

## LOGISTICS VERTICAL - Page Implementation Patterns

### 1. DASHBOARD (Main) - Pattern
```jsx
import { LogisticsKPICard } from '@/components/logistics/LogisticsKPICard';
import { motion } from 'framer-motion';
import { BarChart, MapPin, Truck, AlertTriangle } from 'lucide-react';

// Title: "Logistics Command Center"
// KPI Cards (Top Row):
//   - Active Shipments
//   - Fleet Utilization
//   - On-Time Delivery %
//   - Average Delivery Time
//   - System Status (optimal/warning/critical)

// Main Sections:
//   - Real-time map widget with active routes
//   - Active shipments table
//   - Driver performance
//   - Alerts & issues panel
//   - Fleet status overview
```

### 2. SHIPMENTS PAGE - Pattern
```jsx
// Title: "Shipment Tracking & Management"
// KPI Cards: In Transit, Delivered, Delayed, At Risk
// Filter bars: Date range, Status, Origin, Destination
// Main Table: Shipment ID, Origin, Destination, Status, Driver, ETA, Weight
// Detail Panel: Full shipment info, tracking history, proof of delivery
```

### 3. DRIVERS PAGE - Pattern
```jsx
// Title: "Driver Management & Performance"
// KPI Cards: Active Drivers, On Shift, Ratings, Safety Score
// Driver List with columns:
//   - Driver Name
//   - Vehicle ID
//   - Status (Active/Break/Offline)
//   - Rating
//   - Today's Deliveries
//   - Performance metrics
// Performance chart (deliveries, ratings, etc)
```

### 4. FLEET PAGE - Pattern
```jsx
// Title: "Fleet Management & Maintenance"
// KPI Cards: Total Vehicles, Active, Under Maintenance, Utilization %
// Vehicle grid/table with:
//   - Vehicle ID
//   - Type (truck/van/bike)
//   - Status
//   - Mileage
//   - Last maintenance
//   - Next scheduled maintenance
//   - Driver assigned
```

### 5. LOAD BOARD PAGE - Pattern
```jsx
// Title: "Load Management & Assignment"
// KPI Cards: Available Loads, Assigned, In Progress, Completed
// Load queue table with:
//   - Load ID
//   - Pickup/Delivery locations
//   - Weight/Volume
//   - Route
//   - Assigned driver
//   - Status
//   - Quick assign button
```

### 6. ROUTE OPTIMIZATION - Pattern
```jsx
// Title: "Route Planning & Optimization"
// KPI Cards: Active Routes, Optimized, Distance Saved, Time Saved
// Map widget showing:
//   - Current routes
//   - Planned stops
//   - Traffic conditions
// Route details panel showing optimization metrics
```

### 7. DISPATCH BOARD - Pattern
```jsx
// Title: "Real-Time Dispatch Center"
// Live map with:
//   - All active vehicles
//   - Current locations
//   - Route paths
// Left sidebar: Pending assignments queue
// Right sidebar: Driver status & communication
// Bottom: Alert center & notifications
```

### 8. PROOF OF DELIVERY - Pattern
```jsx
// Title: "Delivery Verification & POD"
// KPI Cards: Delivered, Pending Signature, Issues, Success Rate
// List of deliveries with:
//   - Recipient name
//   - Signature status
//   - Photo proof
//   - Delivery time
//   - Notes/issues
```

### 9. WAREHOUSE PAGE - Pattern
```jsx
// Title: "Warehouse Operations"
// KPI Cards: Inbound, Outbound, Inventory Level, Processing Time
// Sections:
//   - Receiving queue
//   - Picking operations
//   - Packing stations
//   - Shipping queue
//   - Inventory overview
```

### 10. ANALYTICS PAGE - Pattern
```jsx
// Title: "Advanced Logistics Analytics"
// KPI Cards: On-time %, Cost per Shipment, Utilization, Customer Satisfaction
// Charts:
//   - Delivery performance trend
//   - Route efficiency
//   - Cost analysis
//   - Driver performance
//   - Customer satisfaction
```

### 11. TRACKING PORTAL - Pattern
```jsx
// Title: "Customer Tracking Portal"
// KPI Cards: Active Tracking Sessions, Avg Resolution Time
// Live tracking interface:
//   - Map with shipment location
//   - Status timeline
//   - Estimated delivery
//   - Driver info & contact
```

### 12. GEOFENCE ALERTS - Pattern
```jsx
// Title: "Location Alerts & Geofencing"
// KPI Cards: Active Geofences, Alerts Today, Routes Affected
// Alert log with:
//   - Alert type
//   - Vehicle/Driver
//   - Location
//   - Time
//   - Status
```

### 13. INCIDENT MANAGEMENT - Pattern
```jsx
// Title: "Incident & Issue Tracking"
// KPI Cards: Open Issues, Critical, In Progress, Resolved
// Issue list with columns:
//   - Issue ID
//   - Type
//   - Severity
//   - Vehicle/Driver
//   - Description
//   - Status
//   - Assigned to
```

### 14. SMART DOCS - Pattern
```jsx
// Title: "Smart Documentation"
// KPI Cards: Generated Docs, Templates, Processing
// Document management:
//   - DOC templates
//   - Generated documents
//   - Signatures
//   - Archive
```

### 15. DRIVER MOBILE APP - Pattern
```jsx
// Title: "Driver Mobile Interface"
// Compact layout for mobile focus:
//   - Active delivery
//   - Next stops
//   - Navigation
//   - Proof of delivery camera
//   - Performance metrics
//   - Communication center
```

---

## Common Implementation Pattern Template

Every page follows this structure:

```jsx
import { motion } from 'framer-motion';
import { HotelPageWrapper } from '@/components/hotel/HotelPageWrapper';
import { HotelKPICard } from '@/components/hotel/HotelKPICard';
import { BentoGrid, BentoGridItem, BentoCard } from '@/components/shared/BentoGrid';
import { DashboardSectionHeader } from '@/components/shared/DashboardSectionHeader';

export default function PageName() {
  return (
    <HotelPageWrapper
      title="Page Title"
      subtitle="Brief description"
      icon={IconComponent}
      actions={<ActionButtons />}
    >
      {/* 1. KPI Cards Grid */}
      <BentoGrid columns={{sm:1, md:2, lg:4}} gap={4}>
        <BentoGridItem delay={0}>
          <HotelKPICard title="Metric 1" value={value1} color="hotel" />
        </BentoGridItem>
        {/* More KPI cards */}
      </BentoGrid>

      {/* 2. Main Content Area */}
      <motion.div
        initial={{opacity:0, y:16}}
        animate={{opacity:1, y:0}}
        transition={{delay:0.4}}
        className="mt-8"
      >
        <BentoCard>
          <DashboardSectionHeader title="Section Title" />
          {/* Content here */}
        </BentoCard>
      </motion.div>

      {/* 3. Optional Secondary Sections */}
      <BentoGrid columns={{sm:1, md:2}} gap={4} className="mt-8">
        {/* Additional content */}
      </BentoGrid>
    </HotelPageWrapper>
  );
}
```

---

## Key Implementation Rules

1. **Always use components**: HotelPageWrapper, HotelKPICard, BentoGrid, BentoCard, DashboardSectionHeader
2. **Always add animations**: Framer Motion for entrance, hover, and interactive states
3. **Always use color tokens**: Use vertical-specific color variables (--hotel-primary, --logistics-primary, etc.)
4. **Always responsive**: 1-2-4 column layouts (mobile-tablet-desktop)
5. **Always accessible**: Semantic HTML, ARIA labels, focus states
6. **Always dark mode ready**: All styling via CSS variables (automatic in dark mode)
7. **Always delay stagger**: Use `delay={idx * 0.05}` on repeated BentoGridItems for animation stagger

---

## Import Examples

### Hotel Imports
```jsx
import { HotelPageWrapper } from '@/components/hotel/HotelPageWrapper';
import { HotelKPICard } from '@/components/hotel/HotelKPICard';
import { RoomStatusBadge } from '@/components/hotel/RoomStatusBadge';
```

### Logistics Imports
```jsx
import { HotelPageWrapper } from '@/components/hotel/HotelPageWrapper'; // Reuse!
import { LogisticsKPICard } from '@/components/logistics/LogisticsKPICard';
```

### Shared Imports
```jsx
import { BentoGrid, BentoGridItem, BentoCard } from '@/components/shared/BentoGrid';
import { DashboardSectionHeader } from '@/components/shared/DashboardSectionHeader';
import { motion } from 'framer-motion';
```

---

## Testing Each Page

After implementation:
- [ ] Page loads without errors
- [ ] KPI cards animate on entry
- [ ] All data displays correctly
- [ ] Responsive on mobile (1 col)
- [ ] Responsive on tablet (2 col)
- [ ] Responsive on desktop (3-4 col)
- [ ] Dark mode works
- [ ] Hover effects visible
- [ ] All buttons functional
- [ ] Tables/lists scroll smoothly
