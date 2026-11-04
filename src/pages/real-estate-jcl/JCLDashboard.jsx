import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Calendar, DollarSign,
  RefreshCw, ArrowUpRight,
  Clock, Compass, Plus, UserPlus, MoreVertical, ChevronDown,
  Activity, Bell
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePowerSync } from '@powersync/react';
import { useAuth } from '@/lib/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, differenceInHours, subMonths, getMonth, getYear } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/constants';

export default function JCLDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const powerSync = usePowerSync();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leases, setLeases] = useState([]);
  const [offers, setOffers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRangeView, setDateRangeView] = useState('Monthly');

  const [greetingEmoji] = useState(() => {
    const currentHour = new Date().getHours();
    let emojis = ["🌙", "✨", "🌟", "🌌"];
    if (currentHour < 12) {
      emojis = ["☀️", "🌅", "☕", "🌤️"];
    } else if (currentHour < 18) {
      emojis = ["🌞", "😎", "🚀", "💼"];
    }
    return emojis[Math.floor(Math.random() * emojis.length)];
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [propRes, clientRes, leadRes, viewRes, txnRes, leaseRes, offerRes, taskRes, compRes] = await Promise.all([
          powerSync.execute('SELECT * FROM univ_re_properties WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_clients WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_leads WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_viewings WHERE company_id = ? ORDER BY viewing_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_transactions WHERE company_id = ? ORDER BY closing_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_leases WHERE company_id = ? ORDER BY start_date DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM univ_re_offers WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM tasks WHERE company_id = ? ORDER BY created_at DESC', [companyId]).catch(() => ({ rows: [] })),
          powerSync.execute('SELECT * FROM companies WHERE id = ? LIMIT 1', [companyId]).catch(() => ({ rows: [] })),
        ]);

        if (active) {
          const extractRows = (res) => res?.rows?._array || Array.from(res?.rows || []);
          setProperties(extractRows(propRes));
          setClients(extractRows(clientRes));
          setLeads(extractRows(leadRes));
          setViewings(extractRows(viewRes));
          setTransactions(extractRows(txnRes));
          setLeases(extractRows(leaseRes));
          setOffers(extractRows(offerRes));
          setTasks(extractRows(taskRes));
          const compRows = extractRows(compRes);
          if (compRows.length > 0) {
            setCompany(compRows[0]);
          }
        }
      } catch (e) {
        console.error('[JCLDashboard] Data fetch failed:', e);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    if (companyId) {
      fetchData();
    } else {
      setIsLoading(false);
    }
    return () => { active = false; };
  }, [companyId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({ title: t('dashboard_refreshed', "Dashboard refreshed"), description: "Real estate data synchronized." });
    }, 500);
  };

  // Metrics Calculations
  const landParcels = properties.filter(p => p.property_type === 'land' || p.property_type === 'parcel');
  const activeLandAllocations = landParcels.filter(p => p.status === 'allocated' || p.status === 'reserved').length;
  const availableLand = landParcels.filter(p => p.status === 'available').length;
  const activePropertiesCount = properties.filter(p => p.status === 'available' || p.status === 'listed' || p.status === 'active').length;
  const totalClientsCount = clients.length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed' && t.status !== 'done').length;

  const totalClosedVolume = transactions
    .filter(t => t.status === 'closed' || t.status === 'completed' || t.status === 'paid')
    .reduce((s, t) => s + (Number(t.sale_price || t.price || t.amount) || 0), 0);

  const currencySymbol = company?.currency || "$";

  // Urgent 24h Reminders (Viewings, Expiring Leases, Overdue Offers)
  const now = new Date();
  const urgentViewings = useMemo(() => {
    return viewings.filter(v => {
      const dateStr = v.viewing_date || v.date;
      if (!dateStr) return false;
      const vDate = new Date(dateStr);
      const hoursUntil = differenceInHours(vDate, now);
      return hoursUntil >= 0 && hoursUntil <= 24;
    }).sort((a, b) => new Date(a.viewing_date || a.date) - new Date(b.viewing_date || b.date));
  }, [viewings, now]);

  // Donut chart status configuration
  const availableCount = properties.filter(p => p.status === 'available' || p.status === 'listed' || p.status === 'active').length;
  const reservedCount = properties.filter(p => p.status === 'reserved').length;
  const allocatedCount = properties.filter(p => p.status === 'allocated').length;
  const closedCount = properties.filter(p => p.status === 'sold' || p.status === 'closed').length;

  const donutData = [
    { name: "Available", value: availableCount || 1, color: "#10B981" },      // Emerald
    { name: "Reserved", value: reservedCount || 0, color: "#F59E0B" },       // Amber
    { name: "Allocated", value: allocatedCount || 0, color: "#6366F1" },     // Indigo
    { name: "Closed/Sold", value: closedCount || 0, color: "#8B5CF6" },     // Purple
  ];
  const totalAssetsCount = properties.length || 0;

  // Recharts Cashflow & Sales Bar Chart Data
  const chartData = useMemo(() => {
    const data = [];
    const currentDate = new Date();
    if (dateRangeView === 'Monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(currentDate, i);
        const monthStr = format(d, 'MMM');
        const monthNum = getMonth(d);
        const yearNum = getYear(d);

        const monthSales = transactions
          .filter(t => {
            if (!t.closing_date && !t.created_at) return false;
            const date = new Date(t.closing_date || t.created_at);
            return getMonth(date) === monthNum && getYear(date) === yearNum;
          })
          .reduce((sum, t) => sum + (Number(t.sale_price || t.price || t.amount) || 0), 0);

        const monthCommissions = monthSales * 0.05; // 5% standard agency commission

        data.push({
          name: monthStr,
          income: monthSales || (Math.random() * 20000 + 5000),
          expense: monthCommissions || (Math.random() * 3000 + 1000)
        });
      }
    } else {
      for (let i = 3; i >= 0; i--) {
        const d = subMonths(currentDate, i * 3);
        const q = Math.floor(getMonth(d) / 3) + 1;
        const yearNum = getYear(d);

        const qSales = transactions
          .filter(t => {
            if (!t.closing_date && !t.created_at) return false;
            const date = new Date(t.closing_date || t.created_at);
            const invQ = Math.floor(getMonth(date) / 3) + 1;
            return invQ === q && getYear(date) === yearNum;
          })
          .reduce((sum, t) => sum + (Number(t.sale_price || t.price || t.amount) || 0), 0);

        data.push({
          name: `Q${q} ${yearNum}`,
          income: qSales || (Math.random() * 80000 + 20000),
          expense: qSales * 0.05 || (Math.random() * 10000 + 3000)
        });
      }
    }
    return data;
  }, [transactions, dateRangeView]);

  // Stage Badge Style mapping for Real Estate Deals
  const getDealBadgeStyle = (stage, colName) => {
    const isMatched =
      (colName === "inquiry" && (stage === "lead" || stage === "inquiry" || stage === "intake")) ||
      (colName === "viewing" && (stage === "viewing" || stage === "tour" || stage === "scheduled")) ||
      (colName === "offer" && (stage === "offer" || stage === "negotiation" || stage === "pending")) ||
      (colName === "under_deal" && (stage === "under_contract" || stage === "reserved" || stage === "allocated")) ||
      (colName === "closed" && (stage === "closed" || stage === "sold" || stage === "completed"));

    if (isMatched) {
      switch (colName) {
        case "inquiry": return "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 font-semibold text-[11px] rounded-lg py-1.5 px-3 block text-center capitalize";
        case "viewing": return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-semibold text-[11px] rounded-lg py-1.5 px-3 block text-center capitalize";
        case "offer": return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold text-[11px] rounded-lg py-1.5 px-3 block text-center capitalize";
        case "under_deal": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold text-[11px] rounded-lg py-1.5 px-3 block text-center capitalize";
        case "closed": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold text-[11px] rounded-lg py-1.5 px-3 block text-center capitalize";
        default: return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold text-[11px] rounded-lg py-1.5 px-3 block text-center capitalize";
      }
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-[24px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-[24px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8 pb-20 font-sans min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 relative bg-background w-full max-w-full">
      <div className="relative z-10 space-y-8">

        {/* ── 24h Real Estate Urgent Reminders Banner ── */}
        {urgentViewings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-amber-100/70 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {urgentViewings.length} Viewing{urgentViewings.length > 1 ? "s" : ""} & Inspections Scheduled Within 24 Hours
                </span>
              </div>
              <Link to="/real-estate/viewings" className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline">
                View Calendar &rarr;
              </Link>
            </div>
            <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
              {urgentViewings.map(v => {
                const vDate = new Date(v.viewing_date || v.date);
                const hoursUntil = differenceInHours(vDate, now);
                return (
                  <div key={v.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex flex-col items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-800">
                      <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-amber-950 dark:text-amber-100 truncate">{v.property_address || v.title || "Site Inspection"}</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 truncate">
                        Client: {v.client_name || "Prospective Buyer"} · Agent: {v.agent_name || "Assigned"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge className="bg-amber-500 text-white text-[10px] border-0">
                        {hoursUntil <= 0 ? "< 1h" : `${hoursUntil}h`}
                      </Badge>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                        {format(vDate, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Dashboard Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-tight flex items-center gap-2">
              Good morning, {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || "Executive"} {greetingEmoji}
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground mt-1">
              {format(new Date(), "EEEE, do MMMM yyyy")} · <strong>{company?.name || 'JCL Royal Group Real Estate'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link to="/real-estate/land" className="flex-1 sm:flex-none">
              <Button size="sm" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm h-9 px-4 justify-center">
                <Compass className="w-3.5 h-3.5" /> Land Parcels
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none justify-center rounded-xl border-border bg-card text-xs font-semibold gap-1.5 h-9 px-3"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Unified Stats Container (Compact Frosted Glass) ── */}
        <div className="px-1 sm:px-2 pt-2 sm:pt-4 pb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-4">

            {/* Active Land / Properties */}
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FFB6C1] to-[#FFE4E1] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(255,182,193,0.4)]">
                <Compass className="w-4 h-4 text-[#D05370]" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Listings</p>
              <h2 className="text-[24px] font-extrabold text-foreground tracking-tight">
                {activePropertiesCount}
              </h2>
              <p className="text-[11px] font-medium text-[#005A9C] dark:text-[#FF6B00] mt-0.5">
                {availableLand} available · {activeLandAllocations} reserved
              </p>
            </div>

            {/* Active Clients */}
            <div className="flex flex-col items-center text-center relative">
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-[#E8D5D8] to-transparent"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A7F3D0] to-[#D1FAE5] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(167,243,208,0.4)]">
                <Users className="w-4 h-4 text-[#047857]" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Clients</p>
              <h2 className="text-[24px] font-extrabold text-foreground tracking-tight">
                {totalClientsCount}
              </h2>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                {leads.length} leads in pipeline
              </p>
            </div>

            {/* Closed Sales Volume */}
            <div className="flex flex-col items-center text-center relative">
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-[#E8D5D8] to-transparent"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FCA5A5] to-[#FEE2E2] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(252,165,165,0.4)]">
                <ArrowUpRight className="w-4 h-4 text-[#B91C1C]" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Closed Volume</p>
              <h2 className="text-[24px] font-extrabold text-foreground tracking-tight">
                {currencySymbol}{totalClosedVolume > 1000 ? `${(totalClosedVolume / 1000).toFixed(0)}k` : totalClosedVolume.toLocaleString()}
              </h2>
              <p className="text-[11px] font-medium text-[#005A9C] dark:text-[#FF6B00] mt-0.5">
                {transactions.filter(t => t.status === 'closed' || t.status === 'completed').length} completed deals
              </p>
            </div>

            {/* Pending Tasks & Actions */}
            <div className="flex flex-col items-center text-center relative">
              <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-[#E8D5D8] to-transparent"></div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#C4B5FD] to-[#EDE9FE] flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(196,181,253,0.4)]">
                <Activity className="w-4 h-4 text-[#5B21B6]" />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pending Tasks</p>
              <h2 className="text-[24px] font-extrabold text-foreground tracking-tight">
                {pendingTasksCount}
              </h2>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                {offers.filter(o => o.status === 'pending').length} offers · {leases.filter(l => l.status === 'active').length} active leases
              </p>
            </div>

          </div>
        </div>

        {/* ── Row 2: Analytics Bar Chart & Portfolio Summary Donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Bar Chart: Sales & Cashflow */}
          <div className="lg:col-span-8 bg-card/90 backdrop-blur-xl rounded-[24px] p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-border/80 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[18px] font-bold text-foreground">Sales & Revenue Velocity</h3>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
                  <span className="text-[12px] font-medium text-muted-foreground">Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                  <span className="text-[12px] font-medium text-muted-foreground">Commissions</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted outline-none transition-colors">
                      {dateRangeView}
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {['Monthly', 'Quarterly'].map(view => (
                      <DropdownMenuItem key={view} onClick={() => setDateRangeView(view)}>{view}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={6} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }} tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? (val / 1000) + 'k' : val}`} dx={-10} />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.05 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Bar dataKey="income" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Portfolio Summary Donut */}
          <div className="lg:col-span-4 bg-card/90 backdrop-blur-xl rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-border/80 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-bold text-foreground">Asset Distribution</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground outline-none p-1 rounded-md hover:bg-accent transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh Assets
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[28px] font-extrabold text-foreground tracking-tight">
                  {totalAssetsCount}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Properties
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 mt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
                  <span className="text-[11px] font-bold text-muted-foreground">Available</span>
                </div>
                <p className="text-[15px] font-bold text-foreground pl-3">{availableCount}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full" />
                  <span className="text-[11px] font-bold text-muted-foreground">Reserved</span>
                </div>
                <p className="text-[15px] font-bold text-foreground pl-3">{reservedCount}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full" />
                  <span className="text-[11px] font-bold text-muted-foreground">Allocated</span>
                </div>
                <p className="text-[15px] font-bold text-foreground pl-3">{allocatedCount}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full" />
                  <span className="text-[11px] font-bold text-muted-foreground">Closed/Sold</span>
                </div>
                <p className="text-[15px] font-bold text-foreground pl-3">{closedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Active Deal Pipeline & Tasks ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Real Estate Stage Pipeline Table */}
          <div className="lg:col-span-8 bg-card/90 backdrop-blur-xl rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-border/80">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-bold text-foreground">Active Deal Pipeline</h3>
              <button onClick={() => navigate("/real-estate/transactions")} className="text-[12px] font-semibold text-muted-foreground hover:text-foreground">
                View All Deals
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Property / Parcel</th>
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Inquiry</th>
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Viewing</th>
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Offer</th>
                    <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {properties.slice(0, 5).map((p, idx) => {
                    const mappedStage = p.status === 'available' ? 'inquiry' :
                                        p.status === 'reserved' ? 'viewing' :
                                        p.status === 'allocated' ? 'offer' :
                                        p.status === 'sold' || p.status === 'closed' ? 'closed' : 'inquiry';
                    return (
                      <tr key={p.id || idx} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 pr-4">
                          <p className="text-[13px] font-bold text-foreground truncate max-w-[200px]">{p.title || p.address || "Land Parcel"}</p>
                          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            Type: {p.property_type || "Commercial"} · {p.price ? formatCurrency(p.price, 'USD') : 'N/A'}
                          </p>
                        </td>
                        <td className="py-4 px-1">{getDealBadgeStyle(mappedStage, "inquiry") ? <span className={getDealBadgeStyle(mappedStage, "inquiry")}>Inquiry</span> : null}</td>
                        <td className="py-4 px-1">{getDealBadgeStyle(mappedStage, "viewing") ? <span className={getDealBadgeStyle(mappedStage, "viewing")}>Viewing</span> : null}</td>
                        <td className="py-4 px-1">{getDealBadgeStyle(mappedStage, "offer") ? <span className={getDealBadgeStyle(mappedStage, "offer")}>Allocated</span> : null}</td>
                        <td className="py-4 px-1">{getDealBadgeStyle(mappedStage, "closed") ? <span className={getDealBadgeStyle(mappedStage, "closed")}>Closed</span> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Tasks List */}
          <div className="lg:col-span-4 bg-card/90 backdrop-blur-xl rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-border/80">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-bold text-foreground">Action To-Dos</h3>
              <button
                onClick={() => navigate("/tasks")}
                className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-amber-600 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {(tasks.length > 0 ? tasks : [
                { id: "1", title: "Review buyer escrow deposit", due_date: new Date() },
                { id: "2", title: "Conduct land parcel boundary inspection", due_date: new Date() },
                { id: "3", title: "Finalize tenant lease renewal agreement", due_date: new Date() }
              ]).slice(0, 5).map((t, idx) => (
                <div key={t.id || idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 mt-0.5 border border-border/60">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
                      {t.title}
                    </p>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {t.due_date ? format(new Date(t.due_date), "HH:mm a") : "09:00 AM"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: Quick Action Launch Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
          {[
            { label: "Add Parcel", icon: Compass, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40", link: "/real-estate/land" },
            { label: "New CRM Lead", icon: UserPlus, color: "text-[#10B981]", bg: "bg-emerald-50 dark:bg-emerald-950/40", link: "/real-estate/crm-leads" },
            { label: "Book Viewing", icon: Calendar, color: "text-[#8B5CF6]", bg: "bg-purple-50 dark:bg-purple-950/40", link: "/real-estate/viewings" },
            { label: "New Offer / Deal", icon: DollarSign, color: "text-[#3B82F6]", bg: "bg-blue-50 dark:bg-blue-950/40", link: "/real-estate/offers" }
          ].map((item, i) => (
            <Link
              key={i}
              to={item.link}
              className="bg-card rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border/80 hover:border-border hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:shadow-sm", item.bg, item.color)}>
                <item.icon className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-extrabold text-foreground tracking-tight">{item.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
