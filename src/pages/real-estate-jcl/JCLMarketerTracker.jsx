import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MapPin, Navigation, Radio, Wifi, WifiOff, Clock, ShieldCheck, RefreshCw, Send,
  CheckCircle2, Phone, Mail, User, Calendar, ExternalLink, Activity, Search, Filter,
  Play, Square, AlertTriangle, Battery, Compass, Check, Users, Map, FileText, ArrowUpRight
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

    // Check offline status changes
    const handleOnlineStatus = () => refreshQueueStatus();
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Periodic refresh every 20s
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

    // Auto-capture GPS location preview
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
      // Marketers only see their own logged meetings, while admins see all
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

  // Determine current active mode (enforce 'marketer' for non-admins)
  const currentMode = hasAdminPrivileges ? activeTab : 'marketer';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {hasAdminPrivileges && currentMode === 'admin' ? 'JCL Marketers Live GPS Operations' : 'JCL Marketer Field Portal'}
              </h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                JCL Real Estate
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {hasAdminPrivileges && currentMode === 'admin'
                ? 'Admin Dashboard — Monitor Field Marketers, Route Trails & Client Check-ins'
                : 'Marketer Portal — High-Precision GPS Tracking & Client Meeting Logs'}
            </p>
          </div>
        </div>

        {/* Sync Status & Role Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {queueStatus.isOnline ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1.5 px-3">
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              Online (Auto-Sync)
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 py-1.5 px-3">
              <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              Offline ({queueStatus.totalPending} Pending)
            </Badge>
          )}

          {queueStatus.totalPending > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing || !queueStatus.isOnline}
              className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              Sync ({queueStatus.totalPending})
            </Button>
          )}

          {/* ADMIN ONLY TAB SWITCHER */}
          {hasAdminPrivileges && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="marketer" className="gap-1.5 text-xs font-medium rounded-lg">
                  <User className="h-3.5 w-3.5" />
                  Marketer View
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-1.5 text-xs font-medium rounded-lg">
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
            <Card className="lg:col-span-2 border-emerald-100 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                      isTracking ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 animate-pulse" : "bg-gray-100 text-gray-500"
                    )}>
                      <Radio className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Live GPS Field Tracking</h2>
                      <p className="text-xs text-gray-500">Enable when visiting clients or property sites</p>
                    </div>
                  </div>

                  <Badge className={cn(
                    "text-xs font-medium px-3 py-1",
                    isTracking ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 border-gray-200"
                  )}>
                    {isTracking ? 'Active & Tracking' : 'Paused / Off'}
                  </Badge>
                </div>

                {trackingError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {/* Live Position Specs */}
                {isTracking && currentLocation && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white/80 rounded-xl border border-emerald-100/60 backdrop-blur-sm">
                    <div>
                      <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-medium">Precision Address</span>
                      <span className="text-xs font-semibold text-gray-800 line-clamp-1 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        {currentLocation.address_label || 'Locating...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-medium">GPS Coordinates</span>
                      <span className="text-xs font-mono font-medium text-gray-700 mt-0.5 block">
                        {currentLocation.latitude?.toFixed(5)}, {currentLocation.longitude?.toFixed(5)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 uppercase tracking-wider block font-medium">Accuracy & Battery</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-emerald-700">±{currentLocation.accuracy}m</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs text-gray-600 flex items-center gap-0.5">
                          <Battery className="h-3 w-3 text-gray-500" />
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
                      "flex-1 gap-2 font-semibold h-11 rounded-xl transition-all shadow-sm",
                      isTracking
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                    )}
                  >
                    {isTracking ? (
                      <>
                        <Square className="h-4 w-4 fill-white" />
                        Pause Field Tracking
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
                    className="flex-1 gap-2 font-semibold h-11 rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-white"
                  >
                    <Send className="h-4 w-4 text-emerald-600" />
                    Log Client Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats & Offline Status Card */}
            <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  My Field Activity Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-600 font-medium">Logged Client Meetings</span>
                    <span className="text-sm font-bold text-gray-900">{filteredMeetings.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-600 font-medium">Pending Offline Sync</span>
                    <Badge variant="outline" className={cn(
                      "text-xs font-bold",
                      queueStatus.totalPending > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {queueStatus.totalPending} items
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs text-gray-600 font-medium">Location Signal Quality</span>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> High Precision
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MY LOGGED CLIENT MEETINGS FEED */}
          <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">My Client Meeting Check-ins</h2>
                  <p className="text-xs text-gray-500">History of site visits and client meetings logged from the field</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-48 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No client meetings logged yet today</p>
                  <p className="text-xs text-gray-400">Click "Log Client Meeting" above to record your site visit location.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMeetings.map((m) => (
                    <div key={m.id} className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 bg-white transition-all space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{m.client_name}</h4>
                          <span className="text-xs text-emerald-700 font-medium">{m.property_interest || 'General Property Interest'}</span>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-semibold px-2 py-0.5",
                          m.meeting_outcome === 'Successful' || m.meeting_outcome === 'Closed Sale'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {m.meeting_outcome}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{m.address_text || 'GPS Captured'}</span>
                        </div>
                        {m.client_phone && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>{m.client_phone}</span>
                          </div>
                        )}
                        {m.notes && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg italic line-clamp-2 mt-2">
                            "{m.notes}"
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {m.created_at ? format(new Date(m.created_at), 'h:mm a, MMM d') : 'Just now'}
                        </span>

                        <div className="flex items-center gap-2">
                          {m.sync_status === 'pending' ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">
                              Offline Queued
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">
                              Synced
                            </Badge>
                          )}

                          {m.latitude && m.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5"
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
            <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Active Marketers</span>
                  <span className="text-2xl font-bold text-gray-900">{activeMarketers.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Total Field Meetings</span>
                  <span className="text-2xl font-bold text-gray-900">{clientMeetings.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Logged Locations</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {clientMeetings.filter((m) => m.latitude && m.longitude).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Offline Pending</span>
                  <span className="text-2xl font-bold text-gray-900">{queueStatus.totalPending}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ACTIVE MARKETERS ROSTER */}
          <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Marketer Live Field Roster</h2>
                  <p className="text-xs text-gray-500">Real-time GPS tracking positions reported by field staff</p>
                </div>
                <Button size="sm" variant="outline" onClick={refreshData} className="gap-1.5 text-xs rounded-xl">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh Roster
                </Button>
              </div>

              {activeMarketers.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No active marketers currently broadcasting GPS locations.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMarketers.map((mk) => (
                    <div key={mk.id || mk.user_id} className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 bg-white transition-all space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                            {mk.user_name?.[0] || 'M'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{mk.user_name}</h4>
                            <span className="text-xs text-gray-400">{mk.user_email}</span>
                          </div>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-semibold px-2 py-0.5",
                          mk.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600"
                        )}>
                          {mk.status || 'Active'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{mk.address_label || 'Location pinpointed'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                          <span>GPS: {mk.latitude?.toFixed(4)}, {mk.longitude?.toFixed(4)}</span>
                          <span>Accuracy: ±{mk.accuracy}m</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewRouteTrail(mk)}
                          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8 text-xs font-semibold px-2"
                        >
                          <Map className="h-3.5 w-3.5 mr-1" /> View Route Trail
                        </Button>

                        {mk.latitude && mk.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${mk.latitude},${mk.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gray-600 hover:text-emerald-600 font-medium flex items-center gap-1"
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
          <Card className="border-gray-100 rounded-2xl shadow-sm bg-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Master Field Check-in Feed</h2>
                  <p className="text-xs text-gray-500">Complete record of client meetings logged across all marketers</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="p-3">Marketer</th>
                      <th className="p-3">Client Details</th>
                      <th className="p-3">Property Interest</th>
                      <th className="p-3">GPS Location Address</th>
                      <th className="p-3">Outcome</th>
                      <th className="p-3">Time</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredMeetings.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-gray-900">{m.marketer_name}</td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{m.client_name}</div>
                          <div className="text-gray-400 text-[11px]">{m.client_phone}</div>
                        </td>
                        <td className="p-3 font-medium text-emerald-700">{m.property_interest || 'N/A'}</td>
                        <td className="p-3 max-w-xs truncate text-gray-600">{m.address_text}</td>
                        <td className="p-3">
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            {m.meeting_outcome}
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-400 text-[11px]">
                          {m.created_at ? format(new Date(m.created_at), 'MMM d, h:mm a') : 'N/A'}
                        </td>
                        <td className="p-3 text-right">
                          {m.latitude && m.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
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
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              Log Client Meeting Check-in
            </SheetTitle>
            <SheetDescription className="text-xs text-gray-500">
              Record details and auto-capture precise GPS location for your client meeting.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmitMeeting} className="space-y-4 pt-4">
            {/* Captured Location Box */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Auto-Captured GPS Location
                </span>
                {isCapturingLocation && <span className="text-[10px] text-emerald-600 animate-pulse">Locating...</span>}
              </div>

              {meetingPositionPreview ? (
                <div className="text-xs text-emerald-800 space-y-0.5">
                  <p className="font-medium line-clamp-1">{meetingPositionPreview.addr}</p>
                  <p className="text-[10px] font-mono text-emerald-600">
                    Lat: {meetingPositionPreview.lat?.toFixed(5)}, Lng: {meetingPositionPreview.lng?.toFixed(5)} (±{meetingPositionPreview.acc}m accuracy)
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Capturing high-accuracy position...</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Client Name *</Label>
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
                <Label className="text-xs font-semibold text-gray-700">Phone Number</Label>
                <Input
                  placeholder="+233 24 000 0000"
                  value={meetingForm.client_phone}
                  onChange={(e) => setMeetingForm({ ...meetingForm, client_phone: e.target.value })}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
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
              <Label className="text-xs font-semibold text-gray-700">Property / Site of Interest</Label>
              <Input
                placeholder="e.g. East Legon 4-Bedroom Villa / Airport Hills Land"
                value={meetingForm.property_interest}
                onChange={(e) => setMeetingForm({ ...meetingForm, property_interest: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Meeting Purpose</Label>
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
                <Label className="text-xs font-semibold text-gray-700">Meeting Outcome</Label>
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
              <Label className="text-xs font-semibold text-gray-700">Follow-up Date</Label>
              <Input
                type="date"
                value={meetingForm.follow_up_date}
                onChange={(e) => setMeetingForm({ ...meetingForm, follow_up_date: e.target.value })}
                className="text-xs h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Meeting Notes / Client Feedback</Label>
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 font-semibold px-5"
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Map className="h-5 w-5 text-emerald-600" />
              Route Trail: {selectedRouteMarketer?.user_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Sequence of GPS location pings recorded for this marketer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {isLoadingRoute ? (
              <div className="py-8 text-center text-xs text-gray-500 flex justify-center items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" /> Loading GPS route history...
              </div>
            ) : routeHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No route location trail pings recorded yet today.
              </div>
            ) : (
              <div className="space-y-2">
                {routeHistory.map((ping, idx) => (
                  <div key={ping.id || idx} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-gray-900 block">{ping.address_label || 'Location'}</span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {ping.latitude?.toFixed(5)}, {ping.longitude?.toFixed(5)} (±{ping.accuracy}m)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-gray-500 block">
                        {ping.tracked_at ? format(new Date(ping.tracked_at), 'h:mm:ss a') : 'N/A'}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${ping.latitude},${ping.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-600 hover:underline font-medium"
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
