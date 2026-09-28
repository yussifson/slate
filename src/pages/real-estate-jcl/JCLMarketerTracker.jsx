import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MapPin, Radio, Wifi, WifiOff, Clock, ShieldCheck, RefreshCw, Send,
  Phone, User, ExternalLink, Activity, Search,
  Play, Square, AlertTriangle, Battery, Compass, Check, Users, Map, FileText, ArrowUpRight,
  Sparkles, Layers
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
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-16 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 min-h-screen">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 dark:shadow-emerald-900/40">
              <Compass className="h-7 w-7 animate-pulse" />
            </div>
            {isTracking && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {hasAdminPrivileges && currentMode === 'admin' ? 'Live GPS Operations Dashboard' : 'Marketer GPS Field Portal'}
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-md">
                JCL Real Estate
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {hasAdminPrivileges && currentMode === 'admin'
                ? 'Executive Command Center — Monitor Field Marketers, GPS Routes & Client Check-ins'
                : 'High-Precision Offline GPS Tracking & Field Client Meeting Logs'}
            </p>
          </div>
        </div>

        {/* Sync Status & Role Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {queueStatus.isOnline ? (
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1.5 py-1.5 px-3 font-semibold text-xs">
              <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Online (Auto-Sync)
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1.5 py-1.5 px-3 font-semibold text-xs">
              <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Offline ({queueStatus.totalPending} Queued)
            </Badge>
          )}

          {queueStatus.totalPending > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing || !queueStatus.isOnline}
              className="gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 bg-white dark:bg-slate-900 rounded-xl"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              Sync ({queueStatus.totalPending})
            </Button>
          )}

          {/* ADMIN ONLY TAB SWITCHER */}
          {hasAdminPrivileges && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <TabsTrigger value="marketer" className="gap-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm">
                  <User className="h-3.5 w-3.5" />
                  Marketer View
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin Dashboard
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* MARKETER MODE CONTENT */}
      {currentMode === 'marketer' && (
        <div className="space-y-6">
          {/* TRACKING CONTROL & MEETING ACTION HERO CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GPS Tracker Switch Card */}
            <Card className="lg:col-span-2 border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 rounded-2xl shadow-lg shadow-emerald-500/5 overflow-hidden backdrop-blur-xl">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md",
                      isTracking
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    )}>
                      <Radio className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Live GPS Field Tracking
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enable when moving between clients or property sites</p>
                    </div>
                  </div>

                  <Badge className={cn(
                    "text-xs font-bold px-3 py-1 rounded-lg border",
                    isTracking
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  )}>
                    {isTracking ? 'Active & Tracking' : 'Paused / Off'}
                  </Badge>
                </div>

                {trackingError && (
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3.5 rounded-xl border border-red-200 dark:border-red-900/60">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {/* Live Position Specs */}
                {isTracking && currentLocation && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white/80 dark:bg-slate-900/90 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 backdrop-blur-md shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Precision Address</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {currentLocation.address_label || 'Locating GPS...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coordinates</span>
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                        {currentLocation.latitude?.toFixed(5)}, {currentLocation.longitude?.toFixed(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Signal Accuracy</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">±{currentLocation.accuracy}m</span>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                          <Battery className="h-3.5 w-3.5 text-emerald-500" />
                          {currentLocation.battery_level}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    onClick={handleToggleTracking}
                    className={cn(
                      "flex-1 gap-2 font-bold h-11 rounded-xl transition-all shadow-md",
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
                    className="flex-1 gap-2 font-bold h-11 rounded-xl border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 bg-white dark:bg-slate-900"
                  >
                    <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Log Client Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats & Offline Status Card */}
            <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  My Activity Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Logged Meetings</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{filteredMeetings.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Pending Sync</span>
                    <Badge variant="outline" className={cn(
                      "text-xs font-bold px-2.5 py-0.5",
                      queueStatus.totalPending > 0
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    )}>
                      {queueStatus.totalPending} items
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Signal Quality</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> High Precision
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MY LOGGED CLIENT MEETINGS FEED */}
          <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Field Check-ins</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">History of site visits and client meetings logged from the field</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-48 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search client, property..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                    />
                  </div>

                  <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                    <SelectTrigger className="w-36 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No client meetings logged yet today</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Click "Log Client Meeting" above to record your site visit location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMeetings.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 bg-white dark:bg-slate-900 transition-all space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.client_name}</h4>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{m.property_interest || 'General Property Interest'}</span>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-bold px-2 py-0.5",
                          m.meeting_outcome === 'Successful' || m.meeting_outcome === 'Closed Sale'
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        )}>
                          {m.meeting_outcome}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{m.address_text || 'GPS Captured'}</span>
                        </div>
                        {m.client_phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{m.client_phone}</span>
                          </div>
                        )}
                        {m.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg italic line-clamp-2 mt-2">
                            "{m.notes}"
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {m.created_at ? format(new Date(m.created_at), 'h:mm a, MMM d') : 'Just now'}
                        </span>

                        <div className="flex items-center gap-2">
                          {m.sync_status === 'pending' ? (
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px]">
                              Queued
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
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

      {/* ADMIN DASHBOARD CONTENT (STRICTLY RESTRICTED TO ADMIN PRIVILEGED USERS) */}
      {currentMode === 'admin' && hasAdminPrivileges && (
        <div className="space-y-6">
          {/* KPI COUNTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Active Marketers</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{activeMarketers.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Field Meetings</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{clientMeetings.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Logged Locations</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {clientMeetings.filter((m) => m.latitude && m.longitude).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Offline Pending</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{queueStatus.totalPending}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ACTIVE MARKETERS ROSTER */}
          <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Marketer Live Field Roster</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Real-time GPS tracking positions reported by field staff</p>
                </div>
                <Button size="sm" variant="outline" onClick={refreshData} className="gap-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh Roster
                </Button>
              </div>

              {activeMarketers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                  No active marketers currently broadcasting GPS locations.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMarketers.map((mk) => (
                    <div key={mk.id || mk.user_id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 bg-white dark:bg-slate-900 transition-all space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                            {mk.user_name?.[0] || 'M'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{mk.user_name}</h4>
                            <span className="text-xs text-slate-400">{mk.user_email}</span>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-bold px-2 py-0.5",
                          mk.status === 'Active'
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          {mk.status || 'Active'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{mk.address_label || 'Location pinpointed'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                          <span>GPS: {mk.latitude?.toFixed(4)}, {mk.longitude?.toFixed(4)}</span>
                          <span>Accuracy: ±{mk.accuracy}m</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewRouteTrail(mk)}
                          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-8 text-xs font-bold px-2"
                        >
                          <Map className="h-3.5 w-3.5 mr-1" /> View Route Trail
                        </Button>

                        {mk.latitude && mk.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${mk.latitude},${mk.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 font-semibold flex items-center gap-1"
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
          <Card className="border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Master Field Check-in Feed</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Complete record of client meetings logged across all marketers</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredMeetings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{m.marketer_name}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{m.client_name}</div>
                          <div className="text-slate-400 text-[11px]">{m.client_phone}</div>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">{m.property_interest || 'N/A'}</td>
                        <td className="p-3.5 max-w-xs truncate text-slate-600 dark:text-slate-400">{m.address_text}</td>
                        <td className="p-3.5">
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                            {m.meeting_outcome}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-slate-400 dark:text-slate-500 text-[11px]">
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

      {/* LOG CLIENT MEETING SLIDE-OVER SHEET */}
      <Sheet open={showMeetingSheet} onOpenChange={setShowMeetingSheet}>
        <SheetContent className="sm:max-w-lg overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
          <SheetHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <SheetTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-500" />
              Log Client Meeting Check-in
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500 dark:text-slate-400">
              Record details and auto-capture precise GPS location for your client meeting.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmitMeeting} className="space-y-4 pt-4">
            {/* Captured Location Box */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Auto-Captured GPS Location
                </span>
                {isCapturingLocation && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 animate-pulse">Locating...</span>}
              </div>

              {meetingPositionPreview ? (
                <div className="text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5">
                  <p className="font-semibold line-clamp-1">{meetingPositionPreview.addr}</p>
                  <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    Lat: {meetingPositionPreview.lat?.toFixed(5)}, Lng: {meetingPositionPreview.lng?.toFixed(5)} (±{meetingPositionPreview.acc}m accuracy)
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">Capturing high-accuracy position...</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Client Name *</Label>
              <Input
                placeholder="e.g. Kwame Mensah"
                value={meetingForm.client_name}
                onChange={(e) => setMeetingForm({ ...meetingForm, client_name: e.target.value })}
                required
                className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</Label>
                <Input
                  placeholder="+233 24 000 0000"
                  value={meetingForm.client_phone}
                  onChange={(e) => setMeetingForm({ ...meetingForm, client_phone: e.target.value })}
                  className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</Label>
                <Input
                  type="email"
                  placeholder="client@gmail.com"
                  value={meetingForm.client_email}
                  onChange={(e) => setMeetingForm({ ...meetingForm, client_email: e.target.value })}
                  className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Property / Site of Interest</Label>
              <Input
                placeholder="e.g. East Legon 4-Bedroom Villa / Airport Hills Land"
                value={meetingForm.property_interest}
                onChange={(e) => setMeetingForm({ ...meetingForm, property_interest: e.target.value })}
                className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meeting Purpose</Label>
                <Select
                  value={meetingForm.meeting_purpose}
                  onValueChange={(v) => setMeetingForm({ ...meetingForm, meeting_purpose: v })}
                >
                  <SelectTrigger className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Purpose" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="Initial Discussion">Initial Discussion</SelectItem>
                    <SelectItem value="Site Viewing">Site Viewing</SelectItem>
                    <SelectItem value="Contract Signing">Contract Signing</SelectItem>
                    <SelectItem value="Price Negotiation">Price Negotiation</SelectItem>
                    <SelectItem value="Follow-up">Follow-up Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meeting Outcome</Label>
                <Select
                  value={meetingForm.meeting_outcome}
                  onValueChange={(v) => setMeetingForm({ ...meetingForm, meeting_outcome: v })}
                >
                  <SelectTrigger className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white">
                    <SelectValue placeholder="Outcome" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="Successful">Successful</SelectItem>
                    <SelectItem value="Follow-up Scheduled">Follow-up Scheduled</SelectItem>
                    <SelectItem value="Closed Sale">Closed Sale</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Follow-up Date</Label>
              <Input
                type="date"
                value={meetingForm.follow_up_date}
                onChange={(e) => setMeetingForm({ ...meetingForm, follow_up_date: e.target.value })}
                className="text-xs h-9 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Meeting Notes / Client Feedback</Label>
              <Textarea
                placeholder="Enter client requirements, budget range, preferred location..."
                value={meetingForm.notes}
                onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                className="text-xs rounded-xl min-h-[80px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMeetingSheet(false)}
                className="rounded-xl text-xs border-slate-200 dark:border-slate-800"
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

      {/* ROUTE TRAIL MODAL FOR ADMIN */}
      <Dialog open={Boolean(selectedRouteMarketer)} onOpenChange={() => setSelectedRouteMarketer(null)}>
        <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-emerald-500" />
              Route Trail: {selectedRouteMarketer?.user_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Sequence of GPS location pings recorded for this marketer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {isLoadingRoute ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 flex justify-center items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" /> Loading GPS route history...
              </div>
            ) : routeHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No route location trail pings recorded yet today.
              </div>
            ) : (
              <div className="space-y-2">
                {routeHistory.map((ping, idx) => (
                  <div key={ping.id || idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{ping.address_label || 'Location'}</span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {ping.latitude?.toFixed(5)}, {ping.longitude?.toFixed(5)} (±{ping.accuracy}m)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
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
