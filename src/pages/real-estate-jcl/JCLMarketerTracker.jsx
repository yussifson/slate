import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MapPin, Radio, Wifi, WifiOff, Clock, ShieldCheck, RefreshCw, Send,
  Phone, User, Activity, Search,
  Play, Square, AlertTriangle, Battery, Compass, Check, Users, Map, FileText, ArrowUpRight,
  Sparkles, Layers, CheckCircle2, Globe, Navigation
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin as checkIsAdmin } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  startLiveTracking,
  stopLiveTracking,
  isLiveTrackingActive,
  logClientMeeting,
  fetchActiveMarketers,
  fetchClientMeetings,
  fetchMarketerRouteHistory,
  getOfflineQueueStatus,
  syncOfflineQueue,
  reverseGeocode,
} from '@/api/JCLFieldTrackerEngine';

export default function JCLMarketerTracker() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const location = useLocation();

  // Role check: determines if user has admin/supervisor privileges
  const hasAdminPrivileges = useMemo(() => {
    if (!user) return false;
    if (checkIsAdmin(user)) return true;
    const roleLower = String(user?.role || user?.user_metadata?.role || user?.company_role || '').toLowerCase();
    if (['admin', 'company_admin', 'super_admin', 'manager', 'director', 'supervisor', 'admin_staff'].includes(roleLower)) {
      return true;
    }
    if (user?.email && (user.email.toLowerCase().includes('admin') || user.email.toLowerCase().includes('manager'))) {
      return true;
    }
    return false;
  }, [user]);

  // Role Tab: default to 'marketer' for marketers, and 'admin' for admins on /field-tracker
  const [activeTab, setActiveTab] = useState('marketer');

  useEffect(() => {
    if (hasAdminPrivileges) {
      if (location.pathname.includes('/marketer-tracker')) {
        setActiveTab('marketer');
      } else {
        setActiveTab('admin');
      }
    } else {
      setActiveTab('marketer');
    }
  }, [hasAdminPrivileges, location.pathname]);

  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [trackingError, setTrackingError] = useState(null);

  // Sync state
  const [queueStatus, setQueueStatus] = useState(getOfflineQueueStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  // Data states
  const [activeMarketers, setActiveMarketers] = useState([]);
  const [clientMeetings, setClientMeetings] = useState([]);
  const [selectedRouteMarketer, setSelectedRouteMarketer] = useState(null);
  const [routeHistory, setRouteHistory] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // UI Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  // Sheet / Form Modal
  const [showMeetingSheet, setShowMeetingSheet] = useState(false);
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    property_interest: '',
    meeting_purpose: 'Initial Discussion',
    meeting_outcome: 'Successful',
    notes: '',
    follow_up_date: '',
  });

  // Current position capture preview for meeting form
  const [meetingPositionPreview, setMeetingPositionPreview] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // User details object
  const userInfo = useMemo(() => ({
    id: user?.id || 'marketer_1',
    company_id: companyId || 'default',
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Field Marketer',
    email: user?.email || 'marketer@jclrealestate.com',
  }), [user, companyId]);

  // Load initial data and offline status
  useEffect(() => {
    setIsTracking(isLiveTrackingActive());
    refreshData();
    refreshQueueStatus();

    const handleOnlineStatus = () => refreshQueueStatus();
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    const interval = setInterval(() => {
      refreshData();
      refreshQueueStatus();
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      clearInterval(interval);
    };
  }, [companyId]);

  const refreshQueueStatus = () => {
    setQueueStatus(getOfflineQueueStatus());
  };

  const refreshData = async () => {
    const marketers = await fetchActiveMarketers(companyId);
    setActiveMarketers(marketers);

    const meetings = await fetchClientMeetings(companyId);
    setClientMeetings(meetings);
  };

  // Toggle Live Tracking
  const handleToggleTracking = () => {
    if (isTracking) {
      stopLiveTracking(userInfo);
      setIsTracking(false);
      setCurrentLocation(null);
      toast.success('Live GPS tracking stopped.');
      refreshData();
    } else {
      setTrackingError(null);
      const started = startLiveTracking(
        userInfo,
        (ping) => {
          setIsTracking(true);
          setCurrentLocation(ping);
          refreshQueueStatus();
        },
        (err) => {
          setTrackingError(err);
          setIsTracking(false);
          toast.error(err || 'Failed to start GPS tracking.');
        }
      );
      if (started) {
        setIsTracking(true);
        toast.success('High-precision GPS tracking enabled.');
      }
    }
  };

  // Trigger manual sync
  const handleManualSync = async () => {
    if (!navigator.onLine) {
      toast.error('Device is currently offline. Please check internet connection.');
      return;
    }
    setIsSyncing(true);
    const res = await syncOfflineQueue();
    setIsSyncing(false);
    refreshQueueStatus();
    refreshData();
    if (res.success) {
      toast.success(`Synced ${res.syncedLocations} location pings & ${res.syncedMeetings} client meetings!`);
    } else {
      toast.error(res.error || 'Failed to sync offline data.');
    }
  };

  // Open Log Meeting Sheet
  const handleOpenMeetingSheet = () => {
    setMeetingForm({
      client_name: '',
      client_phone: '',
      client_email: '',
      property_interest: '',
      meeting_purpose: 'Initial Discussion',
      meeting_outcome: 'Successful',
      notes: '',
      follow_up_date: format(new Date(Date.now() + 86400000 * 3), 'yyyy-MM-dd'),
    });
    setShowMeetingSheet(true);

    setIsCapturingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          const addr = await reverseGeocode(lat, lng);
          setMeetingPositionPreview({ lat, lng, acc, addr });
          setIsCapturingLocation(false);
        },
        (err) => {
          setIsCapturingLocation(false);
          if (currentLocation) {
            setMeetingPositionPreview({
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
              acc: currentLocation.accuracy,
              addr: currentLocation.address_label,
            });
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setIsCapturingLocation(false);
    }
  };

  // Submit Client Meeting
  const handleSubmitMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.client_name.trim()) {
      toast.error('Please enter client name.');
      return;
    }

    setIsSubmittingMeeting(true);
    const result = await logClientMeeting(userInfo, meetingForm);
    setIsSubmittingMeeting(false);

    if (result.success) {
      setShowMeetingSheet(false);
      refreshQueueStatus();
      refreshData();
      if (result.isOffline) {
        toast.success('Meeting saved locally (Offline Mode). Will auto-sync when online!');
      } else {
        toast.success('Client meeting successfully logged and synced!');
      }
    } else {
      toast.error('Failed to log client meeting.');
    }
  };

  // Open Route History Modal for Admin
  const handleViewRouteTrail = async (marketer) => {
    setSelectedRouteMarketer(marketer);
    setIsLoadingRoute(true);
    const history = await fetchMarketerRouteHistory(companyId, marketer.user_id, 100);
    setRouteHistory(history);
    setIsLoadingRoute(false);
  };

  // Filtered client meetings list
  const filteredMeetings = useMemo(() => {
    return clientMeetings.filter((m) => {
      if (!hasAdminPrivileges && m.marketer_id && m.marketer_id !== userInfo.id) {
        return false;
      }
      const matchSearch =
        m.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.marketer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.property_interest?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.address_text?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchOutcome = outcomeFilter === 'all' || m.meeting_outcome === outcomeFilter;
      return matchSearch && matchOutcome;
    });
  }, [clientMeetings, searchQuery, outcomeFilter, hasAdminPrivileges, userInfo.id]);

  const currentMode = hasAdminPrivileges ? activeTab : 'marketer';

  return (
    <div className="space-y-8 pb-12 font-sans min-h-screen -m-4 lg:-m-8 p-4 lg:p-8 relative bg-background text-foreground">
      
      {/* ── FULL-BLEED EXECUTIVE HERO HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 lg:p-8 text-white shadow-2xl border border-emerald-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <Compass className="h-8 w-8 animate-pulse" />
              </div>
              {isTracking && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {currentMode === 'admin' ? 'Live GPS Operations Command' : 'Field GPS Tracker'}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  JCL Real Estate
                </Badge>
              </div>
              <p className="text-sm text-slate-300 mt-1 font-medium max-w-2xl">
                {currentMode === 'admin'
                  ? 'Real-Time Marketer Location Roster, Route Breadcrumbs & Client Meeting Feed'
                  : 'High-Accuracy Geolocation Tracking & Offline Client Meeting Check-ins'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {queueStatus.isOnline ? (
              <Badge variant="outline" className="bg-emerald-950/60 text-emerald-300 border-emerald-700/60 gap-1.5 py-2 px-3.5 font-bold text-xs rounded-xl backdrop-blur-md">
                <Wifi className="h-4 w-4 text-emerald-400" />
                Online Auto-Sync
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-950/60 text-amber-300 border-amber-700/60 gap-1.5 py-2 px-3.5 font-bold text-xs rounded-xl backdrop-blur-md">
                <WifiOff className="h-4 w-4 text-amber-400" />
                Offline ({queueStatus.totalPending} Queued)
              </Badge>
            )}

            {queueStatus.totalPending > 0 && (
              <Button
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing || !queueStatus.isOnline}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-4 text-xs shadow-lg shadow-emerald-600/30"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
                Sync ({queueStatus.totalPending})
              </Button>
            )}

            {/* Admin Switcher Tab */}
            {hasAdminPrivileges && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-slate-900/90 p-1 rounded-xl border border-slate-700/60 backdrop-blur-md">
                  <TabsTrigger value="marketer" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <User className="h-3.5 w-3.5" />
                    Field GPS
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Live GPS
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border rounded-2xl shadow-sm bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold block">Active Marketers</span>
              <span className="text-2xl font-black text-foreground">{activeMarketers.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-2xl shadow-sm bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold block">Meetings Logged Today</span>
              <span className="text-2xl font-black text-foreground">{clientMeetings.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-2xl shadow-sm bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold block">GPS Locations Pinpointed</span>
              <span className="text-2xl font-black text-foreground">
                {clientMeetings.filter((m) => m.latitude && m.longitude).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border rounded-2xl shadow-sm bg-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-semibold block">Offline Queue</span>
              <span className="text-2xl font-black text-foreground">{queueStatus.totalPending}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── MARKETER / FIELD GPS VIEW ── */}
      {currentMode === 'marketer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GPS Tracker Switch & Precision Radar Card */}
            <Card className="lg:col-span-2 border-emerald-500/20 bg-card rounded-2xl shadow-md overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md",
                      isTracking
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 animate-pulse"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Radio className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        Live GPS Field Tracker
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                      </h2>
                      <p className="text-xs text-muted-foreground font-medium">Broadcast high-accuracy GPS coordinates during site visits</p>
                    </div>
                  </div>

                  <Badge className={cn(
                    "text-xs font-bold px-3 py-1.5 rounded-lg border",
                    isTracking
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  )}>
                    {isTracking ? 'Active & Tracking' : 'Paused'}
                  </Badge>
                </div>

                {trackingError && (
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-4 rounded-xl border border-red-200 dark:border-red-900/60">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {/* Live Position Specs */}
                {isTracking && currentLocation && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl border border-emerald-500/20">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Address Label</span>
                      <span className="text-xs font-bold text-foreground line-clamp-1 flex items-center gap-1.5 mt-1">
                        <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                        {currentLocation.address_label || 'Locating GPS...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Coordinates</span>
                      <span className="text-xs font-mono font-bold text-foreground mt-1 block">
                        {currentLocation.latitude?.toFixed(5)}, {currentLocation.longitude?.toFixed(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Signal Accuracy</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">±{currentLocation.accuracy}m</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Battery className="h-3.5 w-3.5 text-emerald-500" />
                          {currentLocation.battery_level}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Controls */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button
                    onClick={handleToggleTracking}
                    className={cn(
                      "flex-1 gap-2 font-bold h-12 rounded-xl transition-all shadow-md text-sm",
                      isTracking
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20"
                        : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-500/20"
                    )}
                  >
                    {isTracking ? (
                      <>
                        <Square className="h-4 w-4 fill-white" />
                        Pause Field Tracker
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        Enable High-Accuracy Tracker
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleOpenMeetingSheet}
                    variant="outline"
                    className="flex-1 gap-2 font-bold h-12 rounded-xl border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-sm"
                  >
                    <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Log Client Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Summary Card */}
            <Card className="border-border rounded-2xl shadow-sm bg-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Activity & Status Overview
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground font-semibold">Logged Meetings</span>
                    <span className="text-sm font-black text-foreground">{filteredMeetings.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground font-semibold">Pending Sync</span>
                    <Badge variant="outline" className={cn(
                      "text-xs font-bold px-2.5 py-0.5",
                      queueStatus.totalPending > 0
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    )}>
                      {queueStatus.totalPending} items
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl">
                    <span className="text-xs text-muted-foreground font-semibold">GPS Mode</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> High Precision
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MY LOGGED CLIENT MEETINGS FEED */}
          <Card className="border-border rounded-2xl shadow-sm bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-foreground">My Client Field Check-ins</h2>
                  <p className="text-xs text-muted-foreground">History of site visits and client meetings logged from the field</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-48 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search client, property..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl"
                    />
                  </div>

                  <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                    <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Outcomes</SelectItem>
                      <SelectItem value="Successful">Successful</SelectItem>
                      <SelectItem value="Follow-up Scheduled">Follow-up</SelectItem>
                      <SelectItem value="Closed Sale">Closed Sale</SelectItem>
                      <SelectItem value="Not Interested">Not Interested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredMeetings.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">No client meetings logged yet today</p>
                  <p className="text-xs text-muted-foreground/70">Click "Log Client Meeting" above to record your site visit location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMeetings.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl border border-border hover:border-emerald-500/40 bg-card transition-all space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{m.client_name}</h4>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{m.property_interest || 'General Property Interest'}</span>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-bold px-2 py-0.5",
                          m.meeting_outcome === 'Successful' || m.meeting_outcome === 'Closed Sale'
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        )}>
                          {m.meeting_outcome}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{m.address_text || 'GPS Captured'}</span>
                        </div>
                        {m.client_phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{m.client_phone}</span>
                          </div>
                        )}
                        {m.notes && (
                          <p className="text-xs bg-muted/50 p-2.5 rounded-lg italic line-clamp-2 mt-2 text-foreground/90">
                            "{m.notes}"
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {m.created_at ? format(new Date(m.created_at), 'h:mm a, MMM d') : 'Just now'}
                        </span>

                        <div className="flex items-center gap-2">
                          {m.sync_status === 'pending' ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                              Queued
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                              Synced
                            </Badge>
                          )}

                          {m.latitude && m.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
                            >
                              Map <ArrowUpRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ADMIN / LIVE GPS DASHBOARD VIEW ── */}
      {currentMode === 'admin' && hasAdminPrivileges && (
        <div className="space-y-6">
          
          {/* ACTIVE MARKETERS LIVE ROSTER GRID */}
          <Card className="border-border rounded-2xl shadow-sm bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Marketer Live Field Roster</h2>
                  <p className="text-xs text-muted-foreground">Real-time GPS tracking positions reported by field staff</p>
                </div>
                <Button size="sm" variant="outline" onClick={refreshData} className="gap-1.5 text-xs rounded-xl">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh Roster
                </Button>
              </div>

              {activeMarketers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No active marketers currently broadcasting GPS locations.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMarketers.map((mk) => (
                    <div key={mk.id || mk.user_id} className="p-4 rounded-xl border border-border hover:border-emerald-500/40 bg-card transition-all space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                            {mk.user_name?.[0] || 'M'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{mk.user_name}</h4>
                            <span className="text-xs text-muted-foreground">{mk.user_email}</span>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-bold px-2.5 py-0.5",
                          mk.status === 'Active'
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        )}>
                          {mk.status || 'Active'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/60">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{mk.address_label || 'Location pinpointed'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                          <span>GPS: {mk.latitude?.toFixed(4)}, {mk.longitude?.toFixed(4)}</span>
                          <span>Accuracy: ±{mk.accuracy}m</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewRouteTrail(mk)}
                          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs font-bold px-2"
                        >
                          <Map className="h-3.5 w-3.5 mr-1" /> View Route Trail
                        </Button>

                        {mk.latitude && mk.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${mk.latitude},${mk.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:text-emerald-600 font-semibold flex items-center gap-1"
                          >
                            Google Maps <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MASTER CLIENT MEETINGS LOG FEED */}
          <Card className="border-border rounded-2xl shadow-sm bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Master Field Check-in Feed</h2>
                  <p className="text-xs text-muted-foreground">Complete record of client meetings logged across all marketers</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/80 text-muted-foreground font-bold border-b border-border">
                    <tr>
                      <th className="p-3.5">Marketer</th>
                      <th className="p-3.5">Client Details</th>
                      <th className="p-3.5">Property Interest</th>
                      <th className="p-3.5">GPS Location Address</th>
                      <th className="p-3.5">Outcome</th>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {filteredMeetings.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">{m.marketer_name}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">{m.client_name}</div>
                          <div className="text-muted-foreground text-[11px]">{m.client_phone}</div>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">{m.property_interest || 'N/A'}</td>
                        <td className="p-3.5 max-w-xs truncate text-muted-foreground">{m.address_text}</td>
                        <td className="p-3.5">
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                            {m.meeting_outcome}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-muted-foreground text-[11px]">
                          {m.created_at ? format(new Date(m.created_at), 'MMM d, h:mm a') : 'N/A'}
                        </td>
                        <td className="p-3.5 text-right">
                          {m.latitude && m.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                            >
                              Location <ArrowUpRight className="h-3 w-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── LOG CLIENT MEETING SLIDE-OVER SHEET ── */}
      <Sheet open={showMeetingSheet} onOpenChange={setShowMeetingSheet}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-500" />
              Log Client Meeting Check-in
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Record details and auto-capture precise GPS location for your client meeting.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmitMeeting} className="space-y-4 pt-4">
            {/* Captured Location Box */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Auto-Captured GPS Location
                </span>
                {isCapturingLocation && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse">Locating...</span>}
              </div>

              {meetingPositionPreview ? (
                <div className="text-xs text-foreground space-y-0.5">
                  <p className="font-semibold line-clamp-1">{meetingPositionPreview.addr}</p>
                  <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    Lat: {meetingPositionPreview.lat?.toFixed(5)}, Lng: {meetingPositionPreview.lng?.toFixed(5)} (±{meetingPositionPreview.acc}m accuracy)
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Capturing high-accuracy position...</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Client Name *</Label>
              <Input
                placeholder="e.g. Kwame Mensah"
                value={meetingForm.client_name}
                onChange={(e) => setMeetingForm({ ...meetingForm, client_name: e.target.value })}
                required
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Phone Number</Label>
                <Input
                  placeholder="+233 24 000 0000"
                  value={meetingForm.client_phone}
                  onChange={(e) => setMeetingForm({ ...meetingForm, client_phone: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Email Address</Label>
                <Input
                  type="email"
                  placeholder="client@gmail.com"
                  value={meetingForm.client_email}
                  onChange={(e) => setMeetingForm({ ...meetingForm, client_email: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Property / Site of Interest</Label>
              <Input
                placeholder="e.g. East Legon 4-Bedroom Villa / Airport Hills Land"
                value={meetingForm.property_interest}
                onChange={(e) => setMeetingForm({ ...meetingForm, property_interest: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Meeting Purpose</Label>
                <Select
                  value={meetingForm.meeting_purpose}
                  onValueChange={(v) => setMeetingForm({ ...meetingForm, meeting_purpose: v })}
                >
                  <SelectTrigger className="text-xs h-9 rounded-xl">
                    <SelectValue placeholder="Purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Initial Discussion">Initial Discussion</SelectItem>
                    <SelectItem value="Site Viewing">Site Viewing</SelectItem>
                    <SelectItem value="Contract Signing">Contract Signing</SelectItem>
                    <SelectItem value="Price Negotiation">Price Negotiation</SelectItem>
                    <SelectItem value="Follow-up">Follow-up Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Meeting Outcome</Label>
                <Select
                  value={meetingForm.meeting_outcome}
                  onValueChange={(v) => setMeetingForm({ ...meetingForm, meeting_outcome: v })}
                >
                  <SelectTrigger className="text-xs h-9 rounded-xl">
                    <SelectValue placeholder="Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Successful">Successful</SelectItem>
                    <SelectItem value="Follow-up Scheduled">Follow-up Scheduled</SelectItem>
                    <SelectItem value="Closed Sale">Closed Sale</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Follow-up Date</Label>
              <Input
                type="date"
                value={meetingForm.follow_up_date}
                onChange={(e) => setMeetingForm({ ...meetingForm, follow_up_date: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Meeting Notes / Client Feedback</Label>
              <Textarea
                placeholder="Enter client requirements, budget range, preferred location..."
                value={meetingForm.notes}
                onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                className="text-xs rounded-xl min-h-[80px]"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMeetingSheet(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingMeeting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 font-bold px-5 shadow-md shadow-emerald-500/20"
              >
                {isSubmittingMeeting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Submit Meeting Log
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── ROUTE TRAIL MODAL FOR ADMIN ── */}
      <Dialog open={Boolean(selectedRouteMarketer)} onOpenChange={() => setSelectedRouteMarketer(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Map className="h-5 w-5 text-emerald-500" />
              Route Trail: {selectedRouteMarketer?.user_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sequence of GPS location pings recorded for this marketer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {isLoadingRoute ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex justify-center items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" /> Loading GPS route history...
              </div>
            ) : routeHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No route location trail pings recorded yet today.
              </div>
            ) : (
              <div className="space-y-2">
                {routeHistory.map((ping, idx) => (
                  <div key={ping.id || idx} className="p-3.5 rounded-xl border border-border bg-muted/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-foreground block">{ping.address_label || 'Location'}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {ping.latitude?.toFixed(5)}, {ping.longitude?.toFixed(5)} (±{ping.accuracy}m)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {ping.tracked_at ? format(new Date(ping.tracked_at), 'h:mm:ss a') : 'N/A'}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${ping.latitude},${ping.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                      >
                        Google Map
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
