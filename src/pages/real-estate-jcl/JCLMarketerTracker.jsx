import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MapPin, Radio, Wifi, WifiOff, Clock, ShieldCheck, RefreshCw, Send,
  Phone, User, Activity, Search, Mail, Copy, Check, ChevronRight,
  Play, Pause, Square, AlertTriangle, Battery, Compass, Users, Map, FileText, ArrowUpRight,
  Sparkles, Layers, Navigation, Home, Heart, PhoneCall, MessageSquare, FastForward, Navigation2
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

// Known JCL Key Development Property Sites for Proximity Detection
const JCL_PROPERTY_SITES = [
  { id: 'site_1', name: 'East Legon Hills Phase 2', lat: 5.6812, lng: -0.1245, radiusMeters: 800 },
  { id: 'site_2', name: 'Airport Hills Executive Villas', lat: 5.6120, lng: -0.1510, radiusMeters: 600 },
  { id: 'site_3', name: 'Cantonments Luxury Suites', lat: 5.5785, lng: -0.1762, radiusMeters: 500 },
  { id: 'site_4', name: 'Tema Community 25 Land Park', lat: 5.7015, lng: -0.0120, radiusMeters: 1000 },
  { id: 'site_5', name: 'Aburi Mountain Ridge Estates', lat: 5.8540, lng: -0.1720, radiusMeters: 1200 },
];

// Calculate distance in meters between two lat/lng pairs using Haversine formula
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Dynamically load Leaflet script & CSS for smooth map rendering
const loadLeaflet = () => {
  return new Promise((resolve) => {
    if (window.L) return resolve(window.L);

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
};

// Interactive Leaflet Map Component matching design mockups
const JCLTrackerMap = ({
  activeMarketers,
  selectedMarketer,
  routeHistory,
  currentLocation,
  onSelectMarketer,
  replayStepIndex
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routePolylineRef = useRef(null);
  const replayMarkerRef = useRef(null);

  useEffect(() => {
    let map = null;
    loadLeaflet().then((L) => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const centerLat = selectedMarketer?.latitude || currentLocation?.latitude || 5.6037;
      const centerLng = selectedMarketer?.longitude || currentLocation?.longitude || -0.1870;

      map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: false,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap free tile server (No API key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const bounds = [];

      // Render JCL Key Property Sites as circles
      JCL_PROPERTY_SITES.forEach((site) => {
        L.circle([site.lat, site.lng], {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          radius: site.radiusMeters,
        })
          .addTo(map)
          .bindTooltip(`<b>${site.name}</b><br/>JCL Property Site`, { permanent: false });
      });

      // Render markers for active marketers
      activeMarketers.forEach((mk) => {
        if (mk.latitude && mk.longitude) {
          const latLng = [mk.latitude, mk.longitude];
          bounds.push(latLng);
          const isSelected = selectedMarketer?.user_id === mk.user_id;
          const bg = mk.status === 'Active' ? '#10b981' : '#f59e0b';

          const icon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="background-color: ${bg}; width: 38px; height: 38px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
                  ${mk.user_name?.[0] || 'M'}
                </div>
                ${isSelected ? `<div style="position: absolute; width: 52px; height: 52px; border-radius: 50%; border: 3px solid ${bg}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
              </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });

          const marker = L.marker(latLng, { icon }).addTo(map);
          marker.on('click', () => {
            if (onSelectMarketer) onSelectMarketer(mk);
          });
        }
      });

      // Render route trail polyline if available
      if (routeHistory && routeHistory.length > 1) {
        const polylineCoords = routeHistory
          .filter((p) => p.latitude && p.longitude)
          .map((p) => [p.latitude, p.longitude]);

        if (polylineCoords.length > 1) {
          L.polyline(polylineCoords, {
            color: '#2563eb',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8',
          }).addTo(map);
        }
      }

      if (bounds.length > 0 && !selectedMarketer) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeMarketers, selectedMarketer, routeHistory, currentLocation]);

  // Handle Route Replay Marker Update
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !routeHistory || routeHistory.length === 0) return;
    const L = window.L;

    if (replayStepIndex !== null && replayStepIndex >= 0 && replayStepIndex < routeHistory.length) {
      const activePing = routeHistory[replayStepIndex];
      if (activePing && activePing.latitude && activePing.longitude) {
        const latLng = [activePing.latitude, activePing.longitude];

        if (!replayMarkerRef.current) {
          const replayIcon = L.divIcon({
            className: 'replay-pin',
            html: `
              <div style="background-color: #2563eb; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                ▶
              </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          });

          replayMarkerRef.current = L.marker(latLng, { icon: replayIcon }).addTo(mapInstanceRef.current);
        } else {
          replayMarkerRef.current.setLatLng(latLng);
        }

        mapInstanceRef.current.panTo(latLng, { animate: true });
      }
    }
  }, [replayStepIndex, routeHistory]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[380px] lg:min-h-[580px] rounded-3xl z-0 overflow-hidden" />;
};

export default function JCLMarketerTracker() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const location = useLocation();

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

  // Route Replay State
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);

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

  const [meetingPositionPreview, setMeetingPositionPreview] = useState(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const userInfo = useMemo(() => ({
    id: user?.id || 'marketer_1',
    company_id: companyId || 'default',
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Field Marketer',
    email: user?.email || 'marketer@jclrealestate.com',
  }), [user, companyId]);

  // Proximity Alert Detection
  const proximityAlert = useMemo(() => {
    const activeLat = currentLocation?.latitude || selectedRouteMarketer?.latitude;
    const activeLng = currentLocation?.longitude || selectedRouteMarketer?.longitude;

    if (!activeLat || !activeLng) return null;

    for (const site of JCL_PROPERTY_SITES) {
      const dist = calculateDistanceMeters(activeLat, activeLng, site.lat, site.lng);
      if (dist <= site.radiusMeters) {
        return { site, distance: Math.round(dist) };
      }
    }
    return null;
  }, [currentLocation, selectedRouteMarketer]);

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

  // Handle Route Replay Interval
  useEffect(() => {
    let timer = null;
    if (isReplaying && routeHistory.length > 0) {
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev + 1 >= routeHistory.length) {
            setIsReplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / replaySpeed);
    }
    return () => clearInterval(timer);
  }, [isReplaying, routeHistory, replaySpeed]);

  const refreshQueueStatus = () => {
    setQueueStatus(getOfflineQueueStatus());
  };

  const refreshData = async () => {
    const marketers = await fetchActiveMarketers(companyId);
    setActiveMarketers(marketers);
    if (marketers.length > 0 && !selectedRouteMarketer) {
      setSelectedRouteMarketer(marketers[0]);
    }

    const meetings = await fetchClientMeetings(companyId);
    setClientMeetings(meetings);
  };

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

  const handleOpenMeetingSheet = (defaultSiteName = '') => {
    setMeetingForm({
      client_name: '',
      client_phone: '',
      client_email: '',
      property_interest: defaultSiteName || (proximityAlert ? proximityAlert.site.name : ''),
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

  const handleViewRouteTrail = async (marketer) => {
    setSelectedRouteMarketer(marketer);
    setIsLoadingRoute(true);
    setReplayIndex(0);
    setIsReplaying(false);
    const history = await fetchMarketerRouteHistory(companyId, marketer.user_id, 100);
    setRouteHistory(history);
    setIsLoadingRoute(false);
  };

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
    <div className="space-y-6 pb-20 font-sans min-h-screen text-foreground p-4 md:p-6 lg:p-8 bg-background">
      
      {/* ── TOP EXECUTIVE BANNER (DESKTOP & MOBILE HEADER WITH FULL THEME HARMONY) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-card text-card-foreground p-6 shadow-md border border-border">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 shrink-0">
              <Compass className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-black text-foreground">
                  {currentMode === 'admin' ? 'Live GPS Command Dashboard' : 'Field GPS Tracker'}
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  JCL Real Estate
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {currentMode === 'admin' ? 'Interactive Field Marketer Tracking, Site Geofencing & Route Breadcrumbs' : 'High-Precision GPS Location Watch & Property Site Meeting Check-ins'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {queueStatus.isOnline ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1.5 px-3 text-xs font-semibold">
                <Wifi className="h-3.5 w-3.5" /> Online
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 py-1.5 px-3 text-xs font-semibold">
                <WifiOff className="h-3.5 w-3.5" /> Offline ({queueStatus.totalPending})
              </Badge>
            )}

            {queueStatus.totalPending > 0 && (
              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                size="sm"
                className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1 shadow-sm"
              >
                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                Sync ({queueStatus.totalPending})
              </Button>
            )}

            {hasAdminPrivileges && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-muted p-1 rounded-xl border border-border">
                  <TabsTrigger value="marketer" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <User className="h-3.5 w-3.5" /> Field GPS
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <ShieldCheck className="h-3.5 w-3.5" /> Live GPS
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* ── PROPERTY SITE PROXIMITY ALERT BANNER ── */}
      {proximityAlert && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 animate-bounce">
              <Navigation2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Site Proximity Alert</span>
                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">Within {proximityAlert.distance}m</Badge>
              </div>
              <p className="text-xs font-semibold text-foreground">
                Currently near <span className="font-bold underline">{proximityAlert.site.name}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenMeetingSheet(proximityAlert.site.name)}
            size="sm"
            className="h-8 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20"
          >
            Check-in at Site
          </Button>
        </div>
      )}

      {/* ── DESKTOP SPLIT VIEW MATCHING MOCKUP DESIGN ── */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT ROSTER & FIELD CONTROL PANEL (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card rounded-3xl p-5 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-500" />
                {currentMode === 'admin' ? 'Active Marketers Roster' : 'Field Tracker Control'}
              </h3>
              <Badge variant="outline" className="text-xs font-semibold border-border">
                {activeMarketers.length} Active
              </Badge>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search marketer name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl bg-muted/50 border-border"
              />
            </div>

            {/* Marketer Control Card for Field Marketer */}
            {currentMode === 'marketer' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-colors", isTracking ? "bg-emerald-600 animate-pulse" : "bg-muted-foreground")}>
                      <Radio className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">GPS High-Precision Signal</h4>
                      <span className="text-xs text-muted-foreground">{isTracking ? 'Broadcasting live coordinates' : 'Tracking paused'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleToggleTracking}
                    className={cn("flex-1 text-xs font-bold h-10 rounded-xl shadow-md", isTracking ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white")}
                  >
                    {isTracking ? 'Pause Tracking' : 'Enable Live GPS'}
                  </Button>
                  <Button
                    onClick={() => handleOpenMeetingSheet()}
                    variant="outline"
                    className="flex-1 text-xs font-bold h-10 rounded-xl border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    Log Meeting
                  </Button>
                </div>
              </div>
            )}

            {/* Marketer List matching Image 1 Design */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {activeMarketers.map((mk) => {
                const isSel = selectedRouteMarketer?.user_id === mk.user_id;
                return (
                  <div
                    key={mk.id || mk.user_id}
                    onClick={() => {
                      setSelectedRouteMarketer(mk);
                      handleViewRouteTrail(mk);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer space-y-3 bg-card",
                      isSel
                        ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                        : "border-border hover:border-emerald-500/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground">#{mk.user_id?.substring(0, 7) || 'M-101'}</span>
                        <Badge className={cn("text-[10px] font-bold px-2 py-0.5", mk.status === 'Active' ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600")}>
                          {mk.status || 'Active'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">±{mk.accuracy || 10}m acc</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{mk.address_label || 'GPS Pinpointed'}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono pl-6">
                        {mk.latitude?.toFixed(4)}, {mk.longitude?.toFixed(4)}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                          {mk.user_name?.[0] || 'M'}
                        </div>
                        <span className="font-bold text-foreground truncate">{mk.user_name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {mk.user_phone && (
                          <a href={`tel:${mk.user_phone}`} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10">
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <a href={`mailto:${mk.user_email}`} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10">
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT INTERACTIVE LEAFLET MAP PANEL WITH FLOATING OVERLAY & ROUTE REPLAY (7 COLS) */}
        <div className="lg:col-span-7 relative space-y-3">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
            <JCLTrackerMap
              activeMarketers={activeMarketers}
              selectedMarketer={selectedRouteMarketer}
              routeHistory={routeHistory}
              currentLocation={currentLocation}
              onSelectMarketer={(mk) => {
                setSelectedRouteMarketer(mk);
                handleViewRouteTrail(mk);
              }}
              replayStepIndex={isReplaying ? replayIndex : null}
            />

            {/* FLOATING MARKETER INSPECT CARD MATCHING DESIGN */}
            {selectedRouteMarketer && (
              <div className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur-md p-5 rounded-2xl border border-border shadow-2xl z-10 space-y-4 text-card-foreground">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {selectedRouteMarketer.user_name?.[0] || 'M'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{selectedRouteMarketer.user_name}</h4>
                      <span className="text-xs text-muted-foreground font-medium block">{selectedRouteMarketer.user_email}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRouteMarketer(null)} className="text-muted-foreground hover:text-foreground font-bold text-lg leading-none">×</button>
                </div>

                {/* Contact buttons */}
                <div className="flex gap-2">
                  <a
                    href={`tel:${selectedRouteMarketer.user_phone || '+2330000000'}`}
                    className="flex-1 py-2 px-3 bg-muted rounded-xl text-xs font-bold text-foreground flex items-center justify-center gap-1.5 hover:bg-emerald-500/10 hover:text-emerald-600"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> Call Marketer
                  </a>
                  <a
                    href={`mailto:${selectedRouteMarketer.user_email}`}
                    className="py-2 px-3 bg-muted rounded-xl text-xs font-bold text-foreground flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-600"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Activity Breadcrumbs timeline */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-xs font-bold text-foreground block">Recent Route Breadcrumbs</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {routeHistory.length > 0 ? (
                      routeHistory.slice(0, 4).map((ping, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{ping.address_label || 'Check-in point'}</p>
                            <span className="text-[10px] text-muted-foreground block">{ping.tracked_at ? format(new Date(ping.tracked_at), 'MMM d, h:mm a') : 'Just now'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic">No route breadcrumbs logged yet today.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── INTERACTIVE ROUTE REPLAY TIMELINE CONTROLLER FOR ADMINS ── */}
          {selectedRouteMarketer && routeHistory.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-xs font-bold text-foreground">Interactive Route Replay Timeline</h4>
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    Point {replayIndex + 1} of {routeHistory.length}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsReplaying(!isReplaying)}
                    size="sm"
                    className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 shadow-sm"
                  >
                    {isReplaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isReplaying ? 'Pause Replay' : 'Play Route'}
                  </Button>

                  <Select value={String(replaySpeed)} onValueChange={(v) => setReplaySpeed(Number(v))}>
                    <SelectTrigger className="h-8 w-20 text-xs rounded-xl border-border">
                      <SelectValue placeholder="Speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x Speed</SelectItem>
                      <SelectItem value="2">2x Speed</SelectItem>
                      <SelectItem value="5">5x Speed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Range Slider for Route Timeline */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground">00:00</span>
                <input
                  type="range"
                  min="0"
                  max={routeHistory.length - 1}
                  value={replayIndex}
                  onChange={(e) => {
                    setReplayIndex(Number(e.target.value));
                    setIsReplaying(false);
                  }}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <span className="text-[10px] font-mono text-muted-foreground">End</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE FULL-SCREEN MAP TRACKING INTERFACE MATCHING MOCKUP ── */}
      <div className="block md:hidden space-y-4">
        
        {/* TOP FLOATING SEARCH BAR MATCHING MOCKUP */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search marketer, site location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl bg-card border-border shadow-md text-xs"
          />
        </div>

        {/* FULL MOBILE INTERACTIVE MAP CANVAS */}
        <div className="relative rounded-3xl overflow-hidden border border-border shadow-xl h-[480px]">
          <JCLTrackerMap
            activeMarketers={activeMarketers}
            selectedMarketer={selectedRouteMarketer}
            routeHistory={routeHistory}
            currentLocation={currentLocation}
            onSelectMarketer={(mk) => setSelectedRouteMarketer(mk)}
            replayStepIndex={isReplaying ? replayIndex : null}
          />

          {/* FLOATING OVERLAY WIDGET CARD AT BOTTOM MATCHING MOCKUP */}
          <div className="absolute bottom-4 left-4 right-4 bg-card/95 text-card-foreground p-5 rounded-3xl backdrop-blur-xl border border-border shadow-2xl space-y-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-md">
                  {selectedRouteMarketer?.user_name?.[0] || 'M'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{selectedRouteMarketer?.user_name || userInfo.name}</h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono block">GPS: {selectedRouteMarketer?.latitude?.toFixed(4) || currentLocation?.latitude?.toFixed(4) || '5.6037'}, {selectedRouteMarketer?.longitude?.toFixed(4) || currentLocation?.longitude?.toFixed(4) || '-0.1870'}</span>
                </div>
              </div>

              <Badge className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1">
                {isTracking ? 'Active Tracking' : 'Paused'}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 truncate bg-muted/80 p-2.5 rounded-xl">
              <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{selectedRouteMarketer?.address_label || currentLocation?.address_label || 'Locating position...'}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleToggleTracking}
                className={cn("flex-1 text-xs font-bold h-11 rounded-xl shadow-md", isTracking ? "bg-red-600 text-white" : "bg-emerald-600 text-white")}
              >
                {isTracking ? 'Pause Tracking' : 'Enable Live GPS'}
              </Button>
              <Button
                onClick={() => handleOpenMeetingSheet()}
                className="flex-1 text-xs font-bold h-11 rounded-xl bg-card border border-border text-foreground hover:bg-muted"
              >
                Log Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* FLOATING MOBILE BOTTOM DOCK BAR MATCHING MOCKUP */}
        <div className="fixed bottom-4 left-4 right-4 bg-card/95 text-card-foreground border border-border backdrop-blur-xl rounded-full px-6 py-3 shadow-2xl flex items-center justify-around z-50">
          <button onClick={handleToggleTracking} className={cn("flex flex-col items-center gap-1 text-[10px] font-bold", isTracking ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            <Radio className="h-5 w-5" />
            <span>Tracker</span>
          </button>

          <button onClick={() => handleOpenMeetingSheet()} className="flex flex-col items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground">
            <Send className="h-5 w-5" />
            <span>Check-in</span>
          </button>

          <button onClick={refreshData} className="flex flex-col items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── MASTER CLIENT MEETINGS FEED TABLE ── */}
      <Card className="border-border rounded-3xl shadow-sm bg-card mt-6">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground">Master Field Check-in Feed</h2>
              <p className="text-xs text-muted-foreground">Complete record of client meetings logged across field marketers</p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger className="w-36 h-9 text-xs rounded-xl border-border">
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

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground font-bold border-b border-border">
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
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
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

      {/* ── LOG CLIENT MEETING SLIDE-OVER SHEET ── */}
      <Sheet open={showMeetingSheet} onOpenChange={setShowMeetingSheet}>
        <SheetContent className="sm:max-w-lg overflow-y-auto bg-card text-card-foreground border-border">
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
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
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
                className="text-xs h-9 rounded-xl border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Phone Number</Label>
                <Input
                  placeholder="+233 24 000 0000"
                  value={meetingForm.client_phone}
                  onChange={(e) => setMeetingForm({ ...meetingForm, client_phone: e.target.value })}
                  className="text-xs h-9 rounded-xl border-border bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Email Address</Label>
                <Input
                  type="email"
                  placeholder="client@gmail.com"
                  value={meetingForm.client_email}
                  onChange={(e) => setMeetingForm({ ...meetingForm, client_email: e.target.value })}
                  className="text-xs h-9 rounded-xl border-border bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Property / Site of Interest</Label>
              <Input
                placeholder="e.g. East Legon 4-Bedroom Villa / Airport Hills Land"
                value={meetingForm.property_interest}
                onChange={(e) => setMeetingForm({ ...meetingForm, property_interest: e.target.value })}
                className="text-xs h-9 rounded-xl border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Meeting Purpose</Label>
                <Select
                  value={meetingForm.meeting_purpose}
                  onValueChange={(v) => setMeetingForm({ ...meetingForm, meeting_purpose: v })}
                >
                  <SelectTrigger className="text-xs h-9 rounded-xl border-border bg-background">
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
                  <SelectTrigger className="text-xs h-9 rounded-xl border-border bg-background">
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
                className="text-xs h-9 rounded-xl border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Meeting Notes / Client Feedback</Label>
              <Textarea
                placeholder="Enter client requirements, budget range, preferred location..."
                value={meetingForm.notes}
                onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                className="text-xs rounded-xl min-h-[80px] border-border bg-background"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMeetingSheet(false)}
                className="rounded-xl text-xs border-border"
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
        <DialogContent className="sm:max-w-xl bg-card text-card-foreground border-border">
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

