import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MapPin, Radio, Wifi, WifiOff, Clock, ShieldCheck, RefreshCw, Send,
  Phone, User, Activity, Search, Mail, Copy, Check, ChevronRight,
  Play, Pause, Square, AlertTriangle, Battery, Compass, Users, Map, FileText, ArrowUpRight,
  Sparkles, Layers, Navigation, Home, Heart, PhoneCall, MessageSquare, FastForward, Navigation2, CheckCircle2
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
  checkGeolocationPermission,
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

// Use Google Maps only when explicitly enabled and verified; otherwise use zero-friction Esri World Street Map
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_ENABLE_GOOGLE_MAPS === 'true' ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY : '';

// Dynamically load Google Maps JavaScript API
let googleMapsPromise = null;
const loadGoogleMaps = () => {
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('No Google Maps API Key'));

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
  return googleMapsPromise;
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

// High-Performance Map Component (Esri World Street Map / Leaflet)
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
  const isGoogleRef = useRef(false);
  const googleMarkersRef = useRef([]);
  const googlePolylineRef = useRef(null);
  const googleReplayMarkerRef = useRef(null);
  const leafletReplayMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const centerLat = selectedMarketer?.latitude || currentLocation?.latitude || 5.6037;
    const centerLng = selectedMarketer?.longitude || currentLocation?.longitude || -0.1870;

    // 1. Try Loading Google Maps if explicitly enabled
    if (GOOGLE_MAPS_API_KEY) {
      window.gm_authFailure = () => {
        console.warn('[JCLTracker] Google Maps billing pending. Falling back to Esri Map.');
        initLeafletMap();
      };

      loadGoogleMaps()
        .then((googleMaps) => {
          if (!mapContainerRef.current) return;
          isGoogleRef.current = true;

          const map = new googleMaps.Map(mapContainerRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: 14,
            mapTypeId: 'roadmap',
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: googleMaps.MapTypeControlStyle.DROPDOWN_MENU,
              position: googleMaps.ControlPosition.TOP_RIGHT,
            },
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'on' }] }
            ],
          });

          mapInstanceRef.current = map;

          // Render JCL Property Sites as Circles on Google Maps
          JCL_PROPERTY_SITES.forEach((site) => {
            new googleMaps.Circle({
              strokeColor: '#10b981',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#10b981',
              fillOpacity: 0.15,
              map,
              center: { lat: site.lat, lng: site.lng },
              radius: site.radiusMeters,
            });
          });

          // Render Markers for Active Personnel
          const bounds = new googleMaps.LatLngBounds();
          googleMarkersRef.current = [];

          activeMarketers.forEach((mk) => {
            if (mk.latitude && mk.longitude) {
              const pos = { lat: mk.latitude, lng: mk.longitude };
              bounds.extend(pos);
              const isSelected = selectedMarketer?.user_id === mk.user_id;

              const marker = new googleMaps.Marker({
                position: pos,
                map,
                title: mk.user_name || 'Agent',
                icon: {
                  path: googleMaps.SymbolPath.CIRCLE,
                  scale: isSelected ? 12 : 9,
                  fillColor: mk.status === 'Active' ? '#10b981' : '#f59e0b',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
              });

              marker.addListener('click', () => {
                if (onSelectMarketer) onSelectMarketer(mk);
              });

              googleMarkersRef.current.push(marker);
            }
          });

          // Draw Route Polyline
          if (routeHistory && routeHistory.length > 1) {
            const pathCoords = routeHistory
              .filter((p) => p.latitude && p.longitude)
              .map((p) => ({ lat: p.latitude, lng: p.longitude }));

            if (pathCoords.length > 1) {
              googlePolylineRef.current = new googleMaps.Polyline({
                path: pathCoords,
                geodesic: true,
                strokeColor: '#2563eb',
                strokeOpacity: 0.9,
                strokeWeight: 4,
                map,
              });
            }
          }

          if (activeMarketers.length > 1 && !selectedMarketer) {
            map.fitBounds(bounds);
          }
        })
        .catch(() => {
          // Fall back to Leaflet if Google Maps fails
          initLeafletMap();
        });
    } else {
      initLeafletMap();
    }

    function initLeafletMap() {
      isGoogleRef.current = false;
      loadLeaflet().then((L) => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current && mapInstanceRef.current.remove) {
          mapInstanceRef.current.remove();
        }

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 14,
          zoomControl: false,
        });

        mapInstanceRef.current = map;

        // High-resolution Esri World Street Map (Zero API Key, Zero Watermark, 100% Free)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
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

        // Render markers for active personnel
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
    }

    return () => {
      if (mapInstanceRef.current && mapInstanceRef.current.remove) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeMarketers, selectedMarketer, routeHistory, currentLocation]);

  // Handle Route Replay Step Update (Google Maps & Leaflet)
  useEffect(() => {
    if (!routeHistory || routeHistory.length === 0 || replayStepIndex === null) return;
    const activePing = routeHistory[replayStepIndex];
    if (!activePing || !activePing.latitude || !activePing.longitude) return;

    if (isGoogleRef.current && window.google?.maps && mapInstanceRef.current) {
      const pos = { lat: activePing.latitude, lng: activePing.longitude };
      mapInstanceRef.current.panTo(pos);

      if (!googleReplayMarkerRef.current) {
        googleReplayMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: activePing.heading || 0,
          },
        });
      } else {
        googleReplayMarkerRef.current.setPosition(pos);
      }
    } else if (window.L && mapInstanceRef.current) {
      const latLng = [activePing.latitude, activePing.longitude];
      if (!leafletReplayMarkerRef.current) {
        const replayIcon = window.L.divIcon({
          className: 'replay-pin',
          html: `
            <div style="background-color: #2563eb; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(37,99,235,0.5); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
              ▶
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        leafletReplayMarkerRef.current = window.L.marker(latLng, { icon: replayIcon }).addTo(mapInstanceRef.current);
      } else {
        leafletReplayMarkerRef.current.setLatLng(latLng);
      }
      mapInstanceRef.current.panTo(latLng, { animate: true });
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
  const [geoPermission, setGeoPermission] = useState(null); // null | 'checking' | 'granted' | 'denied' | 'blocked_policy' | 'unavailable'
  const [showGeoErrorDialog, setShowGeoErrorDialog] = useState(false);

  // Sync state
  const [queueStatus, setQueueStatus] = useState(getOfflineQueueStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  // Data states
  const [activeMarketers, setActiveMarketers] = useState([]);
  const [clientMeetings, setClientMeetings] = useState([]);
  const [selectedRouteMarketer, setSelectedRouteMarketer] = useState(null);
  const [selectedMeetingDetails, setSelectedMeetingDetails] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Route Replay State
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1);

  // UI Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  // Meeting sheet state
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
  // Manual lat/lng for when GPS is blocked
  const [manualGpsInput, setManualGpsInput] = useState({ lat: '', lng: '' });
  const [useManualGps, setUseManualGps] = useState(false);

  const userInfo = useMemo(() => ({
    id: user?.id || 'marketer_1',
    company_id: companyId || 'default',
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Field Marketer',
    email: user?.email || 'marketer@jclrealestate.com',
    phone: user?.user_metadata?.phone || user?.phone || '',
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
    // Only auto-select first if nothing is selected yet
    if (marketers.length > 0 && !selectedRouteMarketer) {
      const first = marketers[0];
      setSelectedRouteMarketer(first);
      // Auto-load route history for first marketer
      if (first.user_id) {
        const hist = await fetchMarketerRouteHistory(companyId, first.user_id, 100);
        setRouteHistory(hist);
      }
    }

    const meetings = await fetchClientMeetings(companyId);
    setClientMeetings(meetings);
  };

  // Start/Stop live GPS tracking directly
  const handleToggleTracking = () => {
    if (isTracking) {
      stopLiveTracking(userInfo);
      setIsTracking(false);
      setCurrentLocation(null);
      setGeoPermission(null);
      toast.success('Live GPS tracking stopped.');
      refreshData();
      return;
    }

    setTrackingError(null);
    setGeoPermission('checking');

    const started = startLiveTracking(
      userInfo,
      (ping) => {
        setIsTracking(true);
        setGeoPermission('granted');
        setCurrentLocation(ping);
        setShowGeoErrorDialog(false);
        refreshQueueStatus();
        // Update this marketer in the roster live
        setActiveMarketers((prev) => {
          const idx = prev.findIndex((m) => m.user_id === ping.user_id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...ping };
            return updated;
          }
          return [ping, ...prev];
        });
      },
      (errCode) => {
        setTrackingError(errCode);
        setGeoPermission(errCode);
        if (errCode === 'denied' || errCode === 'blocked_policy') {
          setShowGeoErrorDialog(true);
        }
      }
    );

    if (started) {
      setIsTracking(true);
      toast.success('High-precision GPS tracking enabled.');
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
    setManualGpsInput({ lat: '', lng: '' });
    setUseManualGps(false);
    setMeetingPositionPreview(null);
    setShowMeetingSheet(true);

    // Use current tracked location if available
    if (currentLocation?.latitude && currentLocation?.longitude) {
      setMeetingPositionPreview({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        acc: currentLocation.accuracy,
        addr: currentLocation.address_label,
      });
      return;
    }

    // Try to get fresh location – handle policy blocks gracefully
    setIsCapturingLocation(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
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
          // If GPS is blocked/denied, switch to manual entry mode
          const isBlocked = err.message?.toLowerCase().includes('permissions policy') || err.code === 1;
          if (isBlocked) {
            setUseManualGps(true);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      setIsCapturingLocation(false);
      setUseManualGps(true);
    }
  };

  const handleManualGpsCapture = async () => {
    const lat = parseFloat(manualGpsInput.lat);
    const lng = parseFloat(manualGpsInput.lng);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid latitude and longitude values.');
      return;
    }
    setIsCapturingLocation(true);
    const addr = await reverseGeocode(lat, lng);
    setMeetingPositionPreview({ lat, lng, acc: 0, addr });
    setIsCapturingLocation(false);
  };

  const handleSubmitMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.client_name.trim()) {
      toast.error('Please enter client name.');
      return;
    }

    setIsSubmittingMeeting(true);
    // Pass manual coords if user entered them manually
    const manualLatLng = (useManualGps && meetingPositionPreview?.lat)
      ? { lat: meetingPositionPreview.lat, lng: meetingPositionPreview.lng, acc: 0 }
      : null;

    const result = await logClientMeeting(userInfo, meetingForm, manualLatLng);
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

  const handleViewRouteTrail = async (marketer, openModal = false) => {
    if (!marketer) return;
    setSelectedRouteMarketer(marketer);
    setIsLoadingRoute(true);
    setReplayIndex(0);
    setIsReplaying(false);
    if (openModal) {
      setShowRouteModal(true);
    }
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

  const myMeetings = useMemo(() => {
    return clientMeetings.filter((m) => {
      if (!m.marketer_id) return true;
      return m.marketer_id === userInfo.id || m.marketer_id === userInfo.user_id || m.marketer_name === userInfo.name;
    });
  }, [clientMeetings, userInfo.id, userInfo.user_id, userInfo.name]);

  const currentMode = hasAdminPrivileges ? activeTab : 'marketer';

  return (
    <div className="space-y-6 pb-20 font-sans min-h-screen text-foreground p-4 md:p-6 lg:p-8 bg-background">

      {/* ── GPS PERMISSION ERROR DIALOG ── */}
      <Dialog open={showGeoErrorDialog} onOpenChange={setShowGeoErrorDialog}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {geoPermission === 'blocked_policy' ? 'GPS Access Blocked by Browser' : 'Location Access Required'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {geoPermission === 'blocked_policy'
                ? 'The browser is blocking GPS access due to a permissions policy. This can happen when the app is embedded in a frame or when the browser has GPS disabled at the system level.'
                : geoPermission === 'denied'
                  ? 'You denied location access. GPS tracking requires your precise location to work correctly.'
                  : 'Your GPS signal is currently unavailable. Please check your device settings.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3 text-xs font-medium text-foreground">
              <p className="font-bold text-sm text-foreground">How to fix this:</p>
              {geoPermission === 'blocked_policy' ? (
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Open the site directly (not inside an embedded frame).</li>
                  <li>Click the <strong>🔒 lock icon</strong> in your browser's address bar.</li>
                  <li>Set <strong>Location</strong> to <strong>Allow</strong>.</li>
                  <li>Reload the page and try again.</li>
                </ol>
              ) : geoPermission === 'denied' ? (
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Click the <strong>🔒 lock icon</strong> in your browser's address bar.</li>
                  <li>Find <strong>Location</strong> and set it to <strong>Allow</strong>.</li>
                  <li>Or go to your device <strong>Settings → Apps → Browser → Permissions → Location</strong>.</li>
                  <li>Reload the page and tap <em>Enable Live GPS</em> again.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Enable <strong>Location Services</strong> on your device settings.</li>
                  <li>Move to an open area with clear sky for better GPS signal.</li>
                  <li>Reload the page and try again.</li>
                </ol>
              )}
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowGeoErrorDialog(false)} className="rounded-xl text-xs border-border">
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowGeoErrorDialog(false);
                  // On iOS/Chrome, re-requesting triggers the permission prompt if 'prompt' state
                  handleToggleTracking();
                }}
                className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs font-bold px-4 shadow-sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── TOP EXECUTIVE BANNER (DESKTOP & MOBILE HEADER WITH FULL THEME HARMONY) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-card text-card-foreground p-6 shadow-md border border-border">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#005A9C] text-white flex items-center justify-center font-bold shadow-md shadow-[#005A9C]/20 shrink-0">
              <Compass className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-black text-foreground">
                  {currentMode === 'admin' ? 'Live GPS Command Dashboard' : 'Field GPS Tracker'}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                {currentMode === 'admin' ? 'Interactive Field Marketer Tracking, Site Geofencing & Route Breadcrumbs' : 'High-Precision GPS Location Watch & Property Site Meeting Check-ins'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {queueStatus.isOnline ? (
              <Badge variant="outline" className="bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] border-[#005A9C]/30 gap-1.5 py-1.5 px-3 text-xs font-semibold">
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
                  <TabsTrigger value="marketer" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-[#005A9C] data-[state=active]:text-white">
                    <User className="h-3.5 w-3.5" /> Field GPS
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-1.5 text-xs font-bold rounded-lg data-[state=active]:bg-[#005A9C] data-[state=active]:text-white">
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
        <div className="bg-[#005A9C]/10 border border-[#005A9C]/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#005A9C] text-white flex items-center justify-center font-bold shrink-0 animate-bounce">
              <Navigation2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Site Proximity Alert</span>
                <Badge className="bg-[#005A9C] text-white text-[10px] px-1.5 py-0">Within {proximityAlert.distance}m</Badge>
              </div>
              <p className="text-xs font-semibold text-foreground">
                Currently near <span className="font-bold underline">{proximityAlert.site.name}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenMeetingSheet(proximityAlert.site.name)}
            size="sm"
            className="h-8 px-4 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl shadow-md shadow-[#005A9C]/20"
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
                {currentMode === 'admin' ? 'Active Personnel' : 'Field GPS Status'}
              </h3>
              <Badge variant="outline" className="text-xs font-semibold border-border">
                {currentMode === 'admin' ? `${activeMarketers.length} Active` : (isTracking ? 'Broadcasting' : 'Standby')}
              </Badge>
            </div>

            {/* Field GPS Mode: Clean Control Panel */}
            {currentMode === 'marketer' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#005A9C]/10 border border-[#005A9C]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-colors",
                        isTracking ? "bg-[#005A9C] animate-pulse" :
                        geoPermission === 'checking' ? "bg-blue-500 animate-pulse" :
                        (geoPermission === 'denied' || geoPermission === 'blocked_policy') ? "bg-red-500" :
                        "bg-muted-foreground"
                      )}>
                        {geoPermission === 'checking' ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Radio className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">GPS Location Signal</h4>
                        <span className="text-xs text-muted-foreground">
                          {isTracking ? 'Live tracking active on device' :
                           geoPermission === 'checking' ? 'Requesting GPS permission...' :
                           geoPermission === 'denied' ? 'Permission denied — tap button to resolve' :
                           geoPermission === 'blocked_policy' ? 'GPS blocked — tap to see fix' :
                           'Tracking paused'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleToggleTracking}
                      disabled={geoPermission === 'checking'}
                      className={cn("flex-1 text-xs font-bold h-10 rounded-xl shadow-md",
                        isTracking ? "bg-red-600 hover:bg-red-700 text-white" :
                        (geoPermission === 'denied' || geoPermission === 'blocked_policy') ? "bg-amber-600 hover:bg-amber-700 text-white" :
                        "bg-[#005A9C] hover:bg-[#00477D] text-white"
                      )}
                    >
                      {geoPermission === 'checking' ? 'Checking Permission...' :
                       isTracking ? 'Pause Tracking' :
                       (geoPermission === 'denied' || geoPermission === 'blocked_policy') ? 'Fix GPS & Retry' :
                       'Enable Live GPS'}
                    </Button>
                    <Button
                      onClick={() => handleOpenMeetingSheet()}
                      variant="outline"
                      className="flex-1 text-xs font-bold h-10 rounded-xl border-emerald-500 text-[#005A9C] dark:text-[#FF6B00] hover:bg-[#005A9C]/10"
                    >
                      Log Meeting
                    </Button>
                  </div>
                </div>

                {/* Quick Field Summary Card */}
                <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Logged Check-ins Today</span>
                    <Badge variant="outline" className="text-xs font-bold border-emerald-500/40 text-[#005A9C] dark:text-[#FF6B00]">
                      {myMeetings.length}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Client meetings logged from the field sync directly to company records.
                  </p>
                </div>
              </div>
            ) : (
              /* Admin Mode: Active Marketer Roster */
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {activeMarketers.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-border bg-muted/30">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-muted-foreground">No active personnel yet</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">Personnel will appear here once they enable GPS tracking on their devices.</p>
                    <Button onClick={refreshData} size="sm" variant="outline" className="mt-3 h-7 text-[10px] rounded-lg border-border gap-1">
                      <RefreshCw className="h-3 w-3" /> Refresh Roster
                    </Button>
                  </div>
                ) : activeMarketers.map((mk) => {
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
                          <Badge className={cn("text-[10px] font-bold px-2 py-0.5", mk.status === 'Active' ? "bg-emerald-500/15 text-[#005A9C] dark:text-[#FF6B00]" : "bg-amber-500/15 text-amber-600")}>
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
                          <div className="h-7 w-7 rounded-full bg-[#005A9C]/20 text-[#005A9C] dark:text-[#FF6B00] font-bold flex items-center justify-center text-xs">
                            {mk.user_name?.[0] || 'M'}
                          </div>
                          <span className="font-bold text-foreground truncate">{mk.user_name}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {mk.user_phone && (
                            <a href={`tel:${mk.user_phone}`} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-[#005A9C]/10">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <a href={`mailto:${mk.user_email}`} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-[#005A9C]/10">
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT INTERACTIVE LEAFLET MAP PANEL WITH FLOATING OVERLAY & ROUTE REPLAY (7 COLS) */}
        <div className="lg:col-span-7 relative space-y-3">
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
            <JCLTrackerMap
              activeMarketers={currentMode === 'admin' ? activeMarketers : []}
              selectedMarketer={currentMode === 'admin' ? selectedRouteMarketer : null}
              routeHistory={currentMode === 'admin' ? routeHistory : []}
              currentLocation={currentLocation}
              onSelectMarketer={currentMode === 'admin' ? (mk) => {
                setSelectedRouteMarketer(mk);
                handleViewRouteTrail(mk);
              } : undefined}
              replayStepIndex={currentMode === 'admin' && isReplaying ? replayIndex : null}
            />

            {/* FLOATING MARKETER INSPECT CARD ONLY FOR ADMINS */}
            {currentMode === 'admin' && selectedRouteMarketer && (
              <div className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur-md p-5 rounded-2xl border border-border shadow-2xl z-10 space-y-4 text-card-foreground">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#005A9C] text-white font-bold flex items-center justify-center text-sm shadow-md">
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
                    className="flex-1 py-2 px-3 bg-muted rounded-xl text-xs font-bold text-foreground flex items-center justify-center gap-1.5 hover:bg-[#005A9C]/10 hover:text-emerald-600"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> Call Marketer
                  </a>
                  <a
                    href={`mailto:${selectedRouteMarketer.user_email}`}
                    className="py-2 px-3 bg-muted rounded-xl text-xs font-bold text-foreground flex items-center justify-center hover:bg-[#005A9C]/10 hover:text-emerald-600"
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
                  {routeHistory.length > 0 && (
                    <Button
                      onClick={() => setShowRouteModal(true)}
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-[11px] text-[#005A9C] dark:text-[#FF6B00] font-bold hover:bg-[#005A9C]/10 rounded-lg mt-1"
                    >
                      View Full Ping History ({routeHistory.length}) →
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── INTERACTIVE ROUTE REPLAY TIMELINE CONTROLLER FOR ADMINS ── */}
          {currentMode === 'admin' && selectedRouteMarketer && routeHistory.length > 1 && (
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
                    className="h-8 px-3 text-xs font-bold bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl gap-1 shadow-sm"
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

      {/* ── MOBILE INTERACTIVE GPS TRACKING INTERFACE ── */}
      <div className="block md:hidden space-y-3">
        
        {/* Admin Horizontal Personnel Quick-Select Chips (Mobile) */}
        {currentMode === 'admin' && activeMarketers.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {activeMarketers.map((mk) => {
              const isSel = selectedRouteMarketer?.user_id === mk.user_id;
              return (
                <button
                  key={mk.id || mk.user_id}
                  onClick={() => {
                    setSelectedRouteMarketer(mk);
                    handleViewRouteTrail(mk);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                    isSel
                      ? "bg-[#005A9C] text-white border-emerald-600 shadow-md shadow-[#005A9C]/20"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", mk.status === 'Active' ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                  <span>{mk.user_name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* FULL MOBILE INTERACTIVE MAP CANVAS */}
        <div className="relative rounded-3xl overflow-hidden border border-border shadow-xl h-[460px]">
          <JCLTrackerMap
            activeMarketers={currentMode === 'admin' ? activeMarketers : []}
            selectedMarketer={currentMode === 'admin' ? selectedRouteMarketer : null}
            routeHistory={currentMode === 'admin' ? routeHistory : []}
            currentLocation={currentLocation}
            onSelectMarketer={currentMode === 'admin' ? (mk) => {
              setSelectedRouteMarketer(mk);
              handleViewRouteTrail(mk);
            } : undefined}
            replayStepIndex={currentMode === 'admin' && isReplaying ? replayIndex : null}
          />

          {/* FLOATING OVERLAY WIDGET CARD AT BOTTOM */}
          <div className="absolute bottom-3 left-3 right-3 bg-card/95 text-card-foreground p-4 rounded-2xl backdrop-blur-xl border border-border shadow-xl space-y-2.5 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-full bg-[#005A9C] text-white font-bold flex items-center justify-center shadow-md shrink-0 text-xs">
                  {currentMode === 'admin' ? (selectedRouteMarketer?.user_name?.[0] || 'M') : (userInfo.name?.[0] || 'M')}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">
                    {currentMode === 'admin' ? (selectedRouteMarketer?.user_name || 'Select Personnel') : userInfo.name}
                  </h4>
                  <span className="text-[10px] text-[#005A9C] dark:text-[#FF6B00] font-semibold block truncate">
                    {currentMode === 'admin'
                      ? (selectedRouteMarketer?.address_label || 'GPS Location on Map')
                      : (isTracking ? 'GPS Broadcasting' : 'GPS Standby')}
                  </span>
                </div>
              </div>

              <Badge className={cn(
                "text-[10px] font-bold px-2 py-0.5 shrink-0",
                (currentMode === 'admin' ? selectedRouteMarketer?.status : (isTracking ? 'Active' : 'Paused')) === 'Active'
                  ? "bg-emerald-500/15 text-[#005A9C] dark:text-[#FF6B00] border border-[#005A9C]/30"
                  : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
              )}>
                {currentMode === 'admin' ? (selectedRouteMarketer?.status || 'Active') : (isTracking ? 'Tracking Live' : 'Paused')}
              </Badge>
            </div>

            {/* Field Marketer Controls: ONLY for Field GPS Mode */}
            {currentMode === 'marketer' && (
              <div className="flex gap-2 pt-0.5">
                <Button
                  onClick={handleToggleTracking}
                  className={cn(
                    "flex-1 text-xs font-bold h-9 rounded-xl shadow-md",
                    isTracking ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#005A9C] hover:bg-[#00477D] text-white"
                  )}
                >
                  {isTracking ? 'Pause Tracking' : 'Enable Live GPS'}
                </Button>
                <Button
                  onClick={() => handleOpenMeetingSheet()}
                  variant="outline"
                  className="flex-1 text-xs font-bold h-9 rounded-xl border-emerald-500 text-[#005A9C] dark:text-[#FF6B00] hover:bg-[#005A9C]/10"
                >
                  Log Meeting
                </Button>
              </div>
            )}

            {/* Admin Controls: Contact & Route for Admin Mode */}
            {currentMode === 'admin' && selectedRouteMarketer && (
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <div className="flex items-center gap-2">
                  {selectedRouteMarketer.user_phone && (
                    <a
                      href={`tel:${selectedRouteMarketer.user_phone}`}
                      className="h-7 px-2.5 rounded-lg bg-muted flex items-center gap-1.5 text-xs text-foreground font-semibold hover:bg-[#005A9C]/10 hover:text-emerald-600"
                    >
                      <Phone className="h-3 w-3 text-emerald-600" /> Call
                    </a>
                  )}
                  {selectedRouteMarketer.user_email && (
                    <a
                      href={`mailto:${selectedRouteMarketer.user_email}`}
                      className="h-7 px-2.5 rounded-lg bg-muted flex items-center gap-1.5 text-xs text-foreground font-semibold hover:bg-[#005A9C]/10 hover:text-emerald-600"
                    >
                      <Mail className="h-3 w-3 text-emerald-600" /> Email
                    </a>
                  )}
                </div>
                <Button
                  onClick={() => handleViewRouteTrail(selectedRouteMarketer)}
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] rounded-lg border-border font-bold gap-1"
                >
                  <Navigation className="h-3 w-3 text-emerald-600" /> Route Trail
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONDITIONAL FEED: ADMIN MASTER FEED VS. FIELD MARKETER PERSONAL SUMMARY ── */}
      {currentMode === 'admin' ? (
        <Card className="border-border rounded-3xl shadow-sm bg-card mt-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">Master Field Check-in Feed</h2>
                <p className="text-xs text-muted-foreground">Complete record of verified client meetings logged by field personnel</p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger className="w-40 h-9 text-xs rounded-xl border-border bg-background">
                    <SelectValue placeholder="Filter Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="Successful">Successful</SelectItem>
                    <SelectItem value="Follow-up Scheduled">Follow-up Scheduled</SelectItem>
                    <SelectItem value="Closed Sale">Closed Sale</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/80 text-muted-foreground font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">Field Personnel</th>
                    <th className="p-3.5">Client Information</th>
                    <th className="p-3.5">Purpose & Property</th>
                    <th className="p-3.5">Verified GPS Location</th>
                    <th className="p-3.5">Outcome & Follow-up</th>
                    <th className="p-3.5">Check-in Time</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {filteredMeetings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                        <p className="font-bold text-xs">No client check-ins found</p>
                        <p className="text-[11px] mt-0.5">Logged client meetings will appear here with verified GPS check-in data.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMeetings.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                        {/* Marketer */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[#005A9C]/20 text-[#005A9C] dark:text-[#FF6B00] font-bold flex items-center justify-center text-xs shrink-0">
                              {m.marketer_name?.[0] || 'M'}
                            </div>
                            <span className="font-bold text-foreground truncate max-w-[120px]">{m.marketer_name}</span>
                          </div>
                        </td>

                        {/* Client Details with Quick Call & WA */}
                        <td className="p-3.5">
                          <div className="font-bold text-foreground text-xs">{m.client_name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {m.client_phone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <span>{m.client_phone}</span>
                                <a
                                  href={`tel:${m.client_phone}`}
                                  title="Call Client"
                                  className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-[#005A9C]/10"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${m.client_phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="WhatsApp Client"
                                  className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-[#005A9C]/10"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                          {m.client_email && (
                            <div className="text-muted-foreground text-[10px] truncate max-w-[140px]">{m.client_email}</div>
                          )}
                        </td>

                        {/* Purpose & Property */}
                        <td className="p-3.5">
                          <div className="font-bold text-[#005A9C] dark:text-[#FF6B00]">{m.property_interest || 'General Property Inquiry'}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                            <span>{m.meeting_purpose || 'Client Discussion'}</span>
                          </div>
                        </td>

                        {/* GPS Location Address */}
                        <td className="p-3.5 max-w-xs">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-foreground font-medium line-clamp-2">{m.address_text || 'GPS Pinpointed'}</p>
                              {m.latitude && m.longitude && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Outcome & Follow-up */}
                        <td className="p-3.5">
                          <Badge className={cn(
                            "text-[10px] font-bold px-2 py-0.5",
                            m.meeting_outcome === 'Closed Sale' ? "bg-[#005A9C] text-white" :
                            m.meeting_outcome === 'Successful' ? "bg-emerald-500/15 text-[#005A9C] dark:text-[#FF6B00] border border-[#005A9C]/30" :
                            m.meeting_outcome === 'Follow-up Scheduled' ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30" :
                            "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30"
                          )}>
                            {m.meeting_outcome || 'Successful'}
                          </Badge>
                          {m.follow_up_date && (
                            <div className="text-[10px] text-muted-foreground font-medium mt-1 flex items-center gap-1">
                              <span>Next: {m.follow_up_date}</span>
                            </div>
                          )}
                        </td>

                        {/* Time */}
                        <td className="p-3.5 text-muted-foreground text-[11px]">
                          <div className="font-semibold text-foreground">
                            {m.created_at ? format(new Date(m.created_at), 'MMM d, yyyy') : 'N/A'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {m.created_at ? format(new Date(m.created_at), 'h:mm a') : ''}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => setSelectedMeetingDetails(m)}
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-[11px] rounded-lg border-border font-bold text-foreground hover:bg-muted"
                            >
                              Details
                            </Button>
                            {m.latitude && m.longitude && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="h-7 px-2 rounded-lg bg-[#005A9C]/10 text-[#005A9C] dark:text-[#FF6B00] hover:bg-[#005A9C]/20 inline-flex items-center justify-center font-bold text-xs"
                                title="Open in Google Maps"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── FIELD PERSONNEL PERSONAL LOGS SUMMARY (CLEAN 3-COLUMN TABLE ONLY) ── */
        <Card className="border-border rounded-3xl shadow-sm bg-card mt-6">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground">My Logged Client Check-ins</h2>
                <p className="text-xs text-muted-foreground">Confirmed record of client meetings you have logged from the field</p>
              </div>

              <Badge variant="outline" className="text-xs font-semibold border-border bg-muted/40 w-fit">
                {myMeetings.length} Check-ins Logged
              </Badge>
            </div>

            {myMeetings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="font-bold text-sm text-foreground">No client meetings logged yet today</p>
                <p className="text-xs text-muted-foreground mt-1">Tap the <strong>"Log Meeting"</strong> button above when meeting with a client at a property site.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/80 text-muted-foreground font-bold border-b border-border">
                    <tr>
                      <th className="p-3.5">Client Information</th>
                      <th className="p-3.5">Purpose & Property</th>
                      <th className="p-3.5 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {myMeetings.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                        {/* 1. Client Information */}
                        <td className="p-3.5">
                          <div className="font-bold text-foreground text-xs">{m.client_name}</div>
                          {m.client_phone && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-muted-foreground font-mono text-[11px]">{m.client_phone}</span>
                              <a
                                href={`tel:${m.client_phone}`}
                                title="Call Client"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-[#005A9C]/10"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                              <a
                                href={`https://wa.me/${m.client_phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="WhatsApp Client"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-[#005A9C]/10"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </td>

                        {/* 2. Purpose & Property */}
                        <td className="p-3.5">
                          <div className="font-bold text-[#005A9C] dark:text-[#FF6B00]">{m.property_interest || 'General Property Inquiry'}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                            <span>{m.meeting_purpose || 'Client Discussion'}</span>
                          </div>
                        </td>

                        {/* 3. Outcome */}
                        <td className="p-3.5 text-right">
                          <Badge className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5",
                            m.meeting_outcome === 'Closed Sale' ? "bg-[#005A9C] text-white" :
                            m.meeting_outcome === 'Successful' ? "bg-emerald-500/15 text-[#005A9C] dark:text-[#FF6B00] border border-[#005A9C]/30" :
                            m.meeting_outcome === 'Follow-up Scheduled' ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30" :
                            "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30"
                          )}>
                            {m.meeting_outcome || 'Successful'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── CLIENT MEETING FULL DETAILS MODAL ── */}
      <Dialog open={Boolean(selectedMeetingDetails)} onOpenChange={() => setSelectedMeetingDetails(null)}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Meeting Record Details
              </span>
              {selectedMeetingDetails?.meeting_outcome && (
                <Badge className={cn(
                  "text-[10px] font-bold px-2 py-0.5",
                  selectedMeetingDetails.meeting_outcome === 'Closed Sale' ? "bg-[#005A9C] text-white" :
                  selectedMeetingDetails.meeting_outcome === 'Successful' ? "bg-emerald-500/15 text-[#005A9C] dark:text-[#FF6B00] border border-[#005A9C]/30" :
                  selectedMeetingDetails.meeting_outcome === 'Follow-up Scheduled' ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30" :
                  "bg-zinc-500/15 text-zinc-600 border border-zinc-500/30"
                )}>
                  {selectedMeetingDetails.meeting_outcome}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Verified client meeting record attended by <strong className="text-foreground">{selectedMeetingDetails?.marketer_name}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedMeetingDetails && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Client Info Card */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">Client Contact</span>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{selectedMeetingDetails.client_name}</h3>
                    {selectedMeetingDetails.client_email && (
                      <span className="text-xs text-muted-foreground block">{selectedMeetingDetails.client_email}</span>
                    )}
                  </div>
                  {selectedMeetingDetails.client_phone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedMeetingDetails.client_phone}`}
                        className="px-3 py-1.5 rounded-xl bg-[#005A9C] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#00477D] shadow-sm"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${selectedMeetingDetails.client_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-[#005A9C] dark:text-[#FF6B00] font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/25 border border-[#005A9C]/30"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Property & Purpose */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-border bg-card space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">Property of Interest</span>
                  <p className="font-bold text-foreground text-xs">{selectedMeetingDetails.property_interest || 'General Inquiry'}</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-border bg-card space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">Meeting Purpose</span>
                  <p className="font-bold text-foreground text-xs">{selectedMeetingDetails.meeting_purpose || 'Initial Discussion'}</p>
                </div>
              </div>

              {/* Follow up date */}
              {selectedMeetingDetails.follow_up_date && (
                <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-700 dark:text-blue-400">Scheduled Follow-up Date:</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-200">{selectedMeetingDetails.follow_up_date}</span>
                </div>
              )}

              {/* Notes / Feedback */}
              {selectedMeetingDetails.notes && (
                <div className="p-3.5 rounded-2xl border border-border bg-card space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">Meeting Notes & Client Feedback</span>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{selectedMeetingDetails.notes}</p>
                </div>
              )}

              {/* Verified Location */}
              <div className="p-3.5 rounded-2xl border border-border bg-muted/30 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">Verified GPS Location</span>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{selectedMeetingDetails.address_text || 'GPS Location Recorded'}</p>
                      {selectedMeetingDetails.latitude && selectedMeetingDetails.longitude && (
                        <span className="text-[10px] font-mono text-muted-foreground block">
                          Lat: {selectedMeetingDetails.latitude.toFixed(5)}, Lng: {selectedMeetingDetails.longitude.toFixed(5)}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedMeetingDetails.latitude && selectedMeetingDetails.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedMeetingDetails.latitude},${selectedMeetingDetails.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-foreground font-bold hover:bg-muted shrink-0 inline-flex items-center gap-1"
                    >
                      Open Map <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <div className="p-3.5 bg-[#005A9C]/10 border border-[#005A9C]/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Meeting Location
                </span>
                <div className="flex items-center gap-2">
                  {isCapturingLocation && <span className="text-[10px] text-[#005A9C] dark:text-[#FF6B00] animate-pulse">Locating...</span>}
                  <button
                    type="button"
                    onClick={() => setUseManualGps(!useManualGps)}
                    className="text-[10px] underline text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {useManualGps ? 'Use Auto-GPS' : 'Enter Manually'}
                  </button>
                </div>
              </div>

              {useManualGps ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground">Latitude</Label>
                      <Input
                        placeholder="5.6037"
                        value={manualGpsInput.lat}
                        onChange={(e) => setManualGpsInput({ ...manualGpsInput, lat: e.target.value })}
                        className="text-xs h-8 rounded-lg border-border bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-muted-foreground">Longitude</Label>
                      <Input
                        placeholder="-0.1870"
                        value={manualGpsInput.lng}
                        onChange={(e) => setManualGpsInput({ ...manualGpsInput, lng: e.target.value })}
                        className="text-xs h-8 rounded-lg border-border bg-background"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleManualGpsCapture}
                    disabled={isCapturingLocation}
                    size="sm"
                    className="w-full h-8 text-xs rounded-lg bg-[#005A9C] hover:bg-[#00477D] text-white font-bold"
                  >
                    {isCapturingLocation ? 'Looking up address...' : 'Look Up Address from Coords'}
                  </Button>
                  {meetingPositionPreview && (
                    <p className="text-[11px] text-[#005A9C] dark:text-[#FF6B00] font-semibold truncate">
                      📍 {meetingPositionPreview.addr}
                    </p>
                  )}
                </div>
              ) : meetingPositionPreview ? (
                <div className="text-xs text-foreground space-y-0.5">
                  <p className="font-semibold line-clamp-1">{meetingPositionPreview.addr}</p>
                  <p className="text-[10px] font-mono text-[#005A9C] dark:text-[#FF6B00]">
                    Lat: {meetingPositionPreview.lat?.toFixed(5)}, Lng: {meetingPositionPreview.lng?.toFixed(5)} (±{meetingPositionPreview.acc}m accuracy)
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {isCapturingLocation ? 'Capturing high-accuracy position...' : 'GPS unavailable. Tap "Enter Manually" to set location.'}
                </p>
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
                className="bg-[#005A9C] hover:bg-[#00477D] text-white rounded-xl text-xs gap-1.5 font-bold px-5 shadow-md shadow-[#005A9C]/20"
              >
                {isSubmittingMeeting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Submit Meeting Log
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── ROUTE TRAIL MODAL FOR ADMIN (ONLY OPENS ON DEMAND) ── */}
      <Dialog open={showRouteModal} onOpenChange={setShowRouteModal}>
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
                      <span className="h-6 w-6 rounded-full bg-[#005A9C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
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
                        className="text-[10px] text-[#005A9C] dark:text-[#FF6B00] hover:underline font-bold"
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

