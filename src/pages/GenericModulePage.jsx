import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, Network, AlertTriangle, Gift, Map, 
  Clock, Award, ShoppingCart, Truck, Package, MapPin,
  Search, Plus, CheckCircle, XCircle, User, Loader2, ArrowRight
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function GenericModulePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { toast } = useToast();
  const path = location.pathname;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({});
  const [dataList, setDataList] = useState([]);

  // Dynamic config based on the pathname
  const getConfig = () => {
    switch (path) {
      case '/training':
        return {
          title: "Training & Certifications",
          subtitle: "Coordinate staff training programs, course registrations, and professional certifications.",
          icon: GraduationCap,
          color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400",
          stats: [
            { label: "Active Courses", value: "8" },
            { label: "Completion Rate", value: "94.2%" },
            { label: "Enrolled Employees", value: "32" }
          ],
          headers: ["Course Name", "Instructor", "Start Date", "Status"],
          defaultData: [
            { id: 1, name: "Advanced Leadership Development", instructor: "Sarah Jenkins", date: "June 12, 2026", status: "In Progress" },
            { id: 2, name: "Compliance & Ethics Training", instructor: "Michael Vance", date: "May 20, 2026", status: "Completed" },
            { id: 3, name: "Data Security Best Practices", instructor: "System Security Team", date: "July 01, 2026", status: "Scheduled" }
          ],
          fields: [
            { name: "name", label: "Course Name", placeholder: "e.g. Health & Safety Induction" },
            { name: "instructor", label: "Instructor", placeholder: "e.g. Jane Doe" },
            { name: "date", label: "Start Date", type: "date" }
          ]
        };

      case '/org-chart':
        return {
          title: "Organization Chart",
          subtitle: "Visual directory of departments, reporting structures, and internal hierarchy.",
          icon: Network,
          color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400",
          stats: [
            { label: "Total Departments", value: "6" },
            { label: "Direct Reports", value: "100%" },
            { label: "FTE Count", value: "48" }
          ]
        };

      case '/disciplinary':
        return {
          title: "Disciplinary Register",
          subtitle: "Track professional grievances, code of conduct audits, and formal warning logs.",
          icon: AlertTriangle,
          color: "text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400",
          stats: [
            { label: "Open Investigations", value: "1" },
            { label: "Resolved Grievances", value: "14" },
            { label: "Escalation Rate", value: "0.0%" }
          ],
          headers: ["Employee", "Incident Description", "Action Logged", "Status"],
          defaultData: [
            { id: 1, name: "Richard Brooks", instructor: "Unexcused Absence (Repeated)", date: "Verbal Warning Issued", status: "Closed" },
            { id: 2, name: "David Vance", instructor: "Client Policy Violation", date: "Under Review by HR Committee", status: "Active" }
          ],
          fields: [
            { name: "name", label: "Employee Name", placeholder: "e.g. Richard Brooks" },
            { name: "instructor", label: "Incident Details", placeholder: "e.g. Breach of policy" },
            { name: "date", label: "Action Logged", placeholder: "e.g. Warning letter issued" }
          ]
        };

      case '/benefits':
        return {
          title: "Benefits & Allocations",
          subtitle: "Manage corporate allowances, healthcare insurance plans, and retirement matching schemes.",
          icon: Gift,
          color: "text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400",
          stats: [
            { label: "Fringe Benefits", value: "12" },
            { label: "Enrollment Rate", value: "88.6%" },
            { label: "Average Claims", value: "$450 / mo" },
          ],
          headers: ["Benefit Description", "Provider", "Coverage Type", "Enrollment"],
          defaultData: [
            { id: 1, name: "Comprehensive Medical Coverage", instructor: "Premium Health Mutual", date: "Platinum Tier", status: "Active" },
            { id: 2, name: "401(k) Retirement Matching", instructor: "Vanguard Trust", date: "Up to 5% Employer Match", status: "Active" },
            { id: 3, name: "Wellness Allowance Plan", instructor: "Gym & Mental Health Subsidy", date: "$50 monthly stipends", status: "Active" }
          ],
          fields: [
            { name: "name", label: "Benefit Description", placeholder: "e.g. Dental Care Plan" },
            { name: "instructor", label: "Provider", placeholder: "e.g. MetLife Solutions" },
            { name: "date", label: "Coverage Details", placeholder: "e.g. Complete family dental coverage" }
          ]
        };

      case '/dispatch':
        return {
          title: "Dispatch Board",
          subtitle: "Real-time fleet coordinating board, driver dispatch panels, and tracking sheets.",
          icon: Clock,
          color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400",
          stats: [
            { label: "On Route", value: "14 Fleet Vehicles" },
            { label: "Successful Deliveries", value: "98.9%" },
            { label: "Average Route Time", value: "42 min" }
          ],
          headers: ["Shipment ID", "Assigned Driver", "Destination", "Status"],
          defaultData: [
            { id: 1, name: "TRK-29402", instructor: "Robert Miller (Freight #4)", date: "San Jose Distribution Hub", status: "Dispatched" },
            { id: 2, name: "TRK-49301", instructor: "Michael Davis (Transit Van)", date: "Downtown Retail Store #12", status: "Completed" }
          ],
          fields: [
            { name: "name", label: "Shipment ID", placeholder: "e.g. TRK-55102" },
            { name: "instructor", label: "Assigned Driver", placeholder: "e.g. Frank Sinatra" },
            { name: "date", label: "Destination", placeholder: "e.g. North Warehouse" }
          ]
        };

      case '/routes':
        return {
          title: "Fleet Routing",
          subtitle: "Optimize regional shipping lanes, coordinate GPS corridors, and calculate delivery times.",
          icon: Map,
          color: "text-teal-600 bg-teal-50 dark:bg-teal-950/20 dark:text-teal-400",
          stats: [
            { label: "Optimized Lanes", value: "28 Corridor Routes" },
            { label: "Fuel Efficiency Index", value: "92.3" },
            { label: "Average Dispatch Lag", value: "8.4 min" }
          ],
          headers: ["Route Code", "Origin Corridor", "Target Hub Corridor", "Optimal Distance"],
          defaultData: [
            { id: 1, name: "LN-WEST-01", instructor: "Seattle Warehouse", date: "Los Angeles Port terminal", status: "Active" },
            { id: 2, name: "LN-EAST-12", instructor: "Chicago Central Depot", date: "New York Distribution Terminal", status: "Active" }
          ],
          fields: [
            { name: "name", label: "Route Code", placeholder: "e.g. LN-SOUTH-04" },
            { name: "instructor", label: "Origin", placeholder: "e.g. Austin Hub" },
            { name: "date", label: "Destination Terminal", placeholder: "e.g. Houston Port" }
          ]
        };

      case '/shifts':
        return {
          title: "Shift Rotations & Rosters",
          subtitle: "Roster staff hours, manage retail checkout shifts, and coordinate weekly scheduling.",
          icon: Clock,
          color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400",
          stats: [
            { label: "Active Cashiers", value: "6 Rostered" },
            { label: "Roster Coverage", value: "100%" },
            { label: "Average Shift Length", value: "8.0 hrs" }
          ],
          headers: ["Staff Member", "Shift Period", "Rostered Role", "Status"],
          defaultData: [
            { id: 1, name: "Emily Watson", instructor: "Morning Shift (08:00 - 16:00)", date: "Cashier Lead", status: "On Shift" },
            { id: 2, name: "James Anderson", instructor: "Evening Shift (16:00 - 00:00)", date: "Inventory Support", status: "Scheduled" }
          ],
          fields: [
            { name: "name", label: "Staff Member", placeholder: "e.g. Jane Doe" },
            { name: "instructor", label: "Shift Period", placeholder: "e.g. Night Shift (00:00 - 08:00)" },
            { name: "date", label: "Rostered Role", placeholder: "e.g. Cashier" }
          ]
        };

      case '/products':
        return {
          title: "Product Inventory",
          subtitle: "Catalog retail items, manage vendor SKUs, and monitor stock depletion levels.",
          icon: Package,
          color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400",
          stats: [
            { label: "Total SKUs", value: "1,208 Active" },
            { label: "Low Stock Items", value: "4 Alerts" },
            { label: "In Stock Value", value: "$42,900.00" }
          ],
          headers: ["SKU Code", "Product Name", "Available Stock", "Unit Pricing"],
          defaultData: [
            { id: 1, name: "SKU-99201", instructor: "Wireless Noise-Cancelling Headphones", date: "42 Units", status: "$149.00" },
            { id: 2, name: "SKU-49201", instructor: "USB-C Ergonomic Keyboard Hub", date: "3 Units (Critical)", status: "$89.50" },
            { id: 3, name: "SKU-10204", instructor: "Ultra-HD 4K Portable Webcam", date: "104 Units", status: "$120.00" }
          ],
          fields: [
            { name: "name", label: "SKU Code", placeholder: "e.g. SKU-11204" },
            { name: "instructor", label: "Product Name", placeholder: "e.g. Gaming Mouse" },
            { name: "date", label: "Available Stock", placeholder: "e.g. 50 Units" },
            { name: "status", label: "Unit Pricing", placeholder: "e.g. $49.99" }
          ]
        };

      default:
        return {
          title: "Platform Module",
          subtitle: "Coordinate platform parameters, manage dynamic entities, and verify system status.",
          icon: Award,
          color: "text-slate-600 bg-slate-50 dark:bg-slate-950/20 dark:text-slate-400",
          stats: [
            { label: "System Status", value: "Healthy" },
            { label: "Active Connections", value: "Synchronized" }
          ],
          headers: ["Parameter Name", "Value Details", "Last Verified"],
          defaultData: [
            { id: 1, name: "Database replication", instructor: "Regional Clusters sync", date: "Just now", status: "Healthy" }
          ],
          fields: [
            { name: "name", label: "Parameter Name" },
            { name: "instructor", label: "Value Details" }
          ]
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  useEffect(() => {
    // Populate with default config data when the path changes
    setDataList(config.defaultData || []);
  }, [path]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newItemId = dataList.length + 1;
    const addedItem = {
      id: newItemId,
      name: newItem.name || "Custom Entry",
      instructor: newItem.instructor || "Standard Roster",
      date: newItem.date || "Just now",
      status: newItem.status || "Active"
    };

    setDataList(prev => [addedItem, ...prev]);
    toast({
      title: "Successfully Added",
      description: "A new record has been created successfully in real-time."
    });
    setNewItem({});
    setShowAddForm(false);
  };

  const filteredData = dataList.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.instructor?.toLowerCase().includes(query) ||
      item.date?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader 
          title={config.title}
          subtitle={config.subtitle}
        />
        {config.fields && (
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Entry
          </Button>
        )}
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {config.stats.map((stat, idx) => (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color} shrink-0`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Organizational Chart Mode */}
      {path === '/org-chart' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8">Corporate Reporting Chain</h3>
          
          <div className="w-full flex flex-col items-center space-y-8">
            {/* Tier 1: CEO */}
            <div className="flex flex-col items-center">
              <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-lg flex flex-col items-center w-52 ring-2 ring-blue-500/20">
                <User className="w-8 h-8 mb-1.5 opacity-80" />
                <span className="text-sm font-extrabold">Alexander King</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 mt-0.5">HR Director / CEO</span>
              </div>
            </div>

            <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />

            {/* Tier 2: Managers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl relative">
              {[
                { name: "Robert Miller", title: "Recruitment Lead" },
                { name: "Jane Smith", title: "Operations Manager" },
                { name: "Sarah Jenkins", title: "Training Specialist" }
              ].map((mgr, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow transition-shadow flex flex-col items-center w-48 text-center">
                    <User className="w-6 h-6 text-slate-400 dark:text-slate-500 mb-1.5" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{mgr.name}</span>
                    <span className="text-[9px] uppercase font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">{mgr.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Regular List / Table Mode */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Logs & Registers</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Filter results..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            {filteredData.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <IconComponent className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-pulse" />
                <p className="text-sm font-bold">No active records match the criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-xs">
                      {config.headers?.map((hdr, idx) => (
                        <th key={idx} className="px-6 py-4">{hdr}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.instructor}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-500">{row.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex py-0.5 px-2.5 rounded-full text-[10px] font-extrabold uppercase ${
                            row.status?.toLowerCase().includes('progress') || row.status?.toLowerCase().includes('dispatched') || row.status?.toLowerCase().includes('shift')
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                              : row.status?.toLowerCase().includes('completed') || row.status?.toLowerCase().includes('closed') || row.status?.toLowerCase().includes('active')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                              : row.status?.toLowerCase().includes('scheduled')
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                              : 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Entry Modal Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-950 dark:text-white">
              Create New Register Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4 text-slate-950 dark:text-white">
            {config.fields?.map((fld) => (
              <div key={fld.name} className="space-y-1.5">
                <Label>{fld.label}</Label>
                <Input 
                  type={fld.type || "text"}
                  placeholder={fld.placeholder || ""}
                  value={newItem[fld.name] || ""}
                  required
                  onChange={e => setNewItem(prev => ({ ...prev, [fld.name]: e.target.value }))}
                  className="h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2.5 mt-6">
              <Button variant="ghost" type="button" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5">
                Save Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
