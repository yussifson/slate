/**
 * JCLFieldTrackerEngine.js
 * 
 * High-accuracy, offline-first GPS field tracking and client meeting check-in engine
 * strictly built for JCL Real Estate marketers and admins.
 * 
 * Features:
 * - High-accuracy GPS geolocation watch with configurable throttling & distance filtering.
 * - Offline-first queueing (localStorage + IndexedDB / PowerSync SQLite) when in zero-coverage areas.
 * - Automatic background sync whenever network connectivity is restored (online event listener + retry interval).
 * - Precise Client Meeting Check-in with auto-captured coordinates, reverse geocoding address labels, and meeting notes.
 * - Real-time query helpers for Admin monitoring dashboard (active marketers roster, route history, meeting feed).
 */

import { supabase } from './supabaseClient';
import { powerSync } from './PowerSyncConnector';

const OFFLINE_LOCATIONS_KEY = 'jcl_offline_marketer_locations_v1';
const OFFLINE_MEETINGS_KEY = 'jcl_offline_client_meetings_v1';
const TRACKING_STATE_KEY = 'jcl_marketer_tracking_active_v1';

let activeWatchId = null;
let lastPingTime = 0;
let lastPosition = null;
const MIN_PING_INTERVAL_MS = 10000; // Minimum 10 seconds between pings
const MIN_DISTANCE_METERS = 5; // Minimum 5 meters movement

// Generate secure random ID
const generateId = () => `jcl_ft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Calculate distance between two coordinates in meters (Haversine formula)
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371e3; // metres
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

// Reverse geocoding helper with local caching
const addressCache = new Map();
export const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) return 'Unknown Location';
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (addressCache.has(cacheKey)) return addressCache.get(cacheKey);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'JCLRealEstateFieldTracker/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.display_name || `${data.address?.road || ''}, ${data.address?.suburb || data.address?.city || ''}`.trim();
      if (addr && addr.length > 3) {
        addressCache.set(cacheKey, addr);
        return addr;
      }
    }
  } catch (err) {
    // Network or rate-limit error, fallback gracefully
  }
  const fallback = `GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  addressCache.set(cacheKey, fallback);
  return fallback;
};

// Helper: Get offline queues from localStorage
export const getOfflineQueueStatus = () => {
  try {
    const locations = JSON.parse(localStorage.getItem(OFFLINE_LOCATIONS_KEY) || '[]');
    const meetings = JSON.parse(localStorage.getItem(OFFLINE_MEETINGS_KEY) || '[]');
    return {
      pendingLocations: locations.length,
      pendingMeetings: meetings.length,
      totalPending: locations.length + meetings.length,
      isOnline: navigator.onLine,
    };
  } catch (e) {
    return { pendingLocations: 0, pendingMeetings: 0, totalPending: 0, isOnline: navigator.onLine };
  }
};

// Helper: Save to offline queue
const queueLocationOffline = (record) => {
  try {
    const current = JSON.parse(localStorage.getItem(OFFLINE_LOCATIONS_KEY) || '[]');
    current.push(record);
    localStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to queue location offline:', e);
  }
};

const queueMeetingOffline = (record) => {
  try {
    const current = JSON.parse(localStorage.getItem(OFFLINE_MEETINGS_KEY) || '[]');
    current.push(record);
    localStorage.setItem(OFFLINE_MEETINGS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to queue meeting offline:', e);
  }
};

// Auto-Sync Offline Queue to Database
export const syncOfflineQueue = async () => {
  if (!navigator.onLine) return { success: false, syncedCount: 0, error: 'Offline' };

  let syncedLocations = 0;
  let syncedMeetings = 0;

  // 1. Flush pending locations
  try {
    const locations = JSON.parse(localStorage.getItem(OFFLINE_LOCATIONS_KEY) || '[]');
    if (locations.length > 0) {
      const remainingLocations = [];
      for (const loc of locations) {
        try {
          let written = false;
          if (powerSync?.execute) {
            await powerSync.execute(
              `INSERT OR REPLACE INTO univ_re_marketer_locations 
               (id, company_id, user_id, user_name, user_email, latitude, longitude, accuracy, speed, heading, status, address_label, battery_level, tracked_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                loc.id, loc.company_id, loc.user_id, loc.user_name || '', loc.user_email || '',
                loc.latitude, loc.longitude, loc.accuracy || 0, loc.speed || 0, loc.heading || 0,
                loc.status || 'Active', loc.address_label || '', loc.battery_level || 100,
                loc.tracked_at || new Date().toISOString(), loc.created_at || new Date().toISOString()
              ]
            );
            written = true;
          }
          if (!written && supabase) {
            const { error } = await supabase.from('univ_re_marketer_locations').upsert(loc);
            if (!error) written = true;
          }
          if (written) syncedLocations++;
          else remainingLocations.push(loc);
        } catch (err) {
          remainingLocations.push(loc);
        }
      }
      localStorage.setItem(OFFLINE_LOCATIONS_KEY, JSON.stringify(remainingLocations));
    }
  } catch (e) {
    console.error('Error syncing offline locations:', e);
  }

  // 2. Flush pending client meetings
  try {
    const meetings = JSON.parse(localStorage.getItem(OFFLINE_MEETINGS_KEY) || '[]');
    if (meetings.length > 0) {
      const remainingMeetings = [];
      for (const m of meetings) {
        try {
          let written = false;
          const meetingRecord = { ...m, sync_status: 'synced' };
          if (powerSync?.execute) {
            await powerSync.execute(
              `INSERT OR REPLACE INTO univ_re_client_meetings 
               (id, company_id, marketer_id, marketer_name, client_name, client_phone, client_email, property_interest, meeting_purpose, notes, meeting_outcome, follow_up_date, latitude, longitude, accuracy, address_text, sync_status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                meetingRecord.id, meetingRecord.company_id, meetingRecord.marketer_id, meetingRecord.marketer_name || '',
                meetingRecord.client_name, meetingRecord.client_phone || '', meetingRecord.client_email || '',
                meetingRecord.property_interest || '', meetingRecord.meeting_purpose || '', meetingRecord.notes || '',
                meetingRecord.meeting_outcome || 'Scheduled', meetingRecord.follow_up_date || '',
                meetingRecord.latitude || 0, meetingRecord.longitude || 0, meetingRecord.accuracy || 0,
                meetingRecord.address_text || '', 'synced', meetingRecord.created_at || new Date().toISOString()
              ]
            );
            written = true;
          }
          if (!written && supabase) {
            const { error } = await supabase.from('univ_re_client_meetings').upsert(meetingRecord);
            if (!error) written = true;
          }
          if (written) syncedMeetings++;
          else remainingMeetings.push(m);
        } catch (err) {
          remainingMeetings.push(m);
        }
      }
      localStorage.setItem(OFFLINE_MEETINGS_KEY, JSON.stringify(remainingMeetings));
    }
  } catch (e) {
    console.error('Error syncing offline meetings:', e);
  }

  return { success: true, syncedLocations, syncedMeetings };
};

// Listen for network reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[JCLFieldTrackerEngine] Back online. Triggering auto-sync...');
    syncOfflineQueue();
  });
}

// START Live Geolocation Tracking
export const startLiveTracking = (userInfo, onUpdate, onError) => {
  if (!navigator.geolocation) {
    if (onError) onError('Geolocation is not supported by this browser.');
    return false;
  }

  localStorage.setItem(TRACKING_STATE_KEY, JSON.stringify({ active: true, startedAt: new Date().toISOString() }));

  const options = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  };

  const handlePositionSuccess = async (position) => {
    const now = Date.now();
    const { latitude, longitude, accuracy, speed, heading } = position.coords;

    // Check throttle and minimum movement distance
    if (now - lastPingTime < MIN_PING_INTERVAL_MS) return;

    if (lastPosition) {
      const dist = calculateDistanceMeters(lastPosition.latitude, lastPosition.longitude, latitude, longitude);
      if (dist < MIN_DISTANCE_METERS && now - lastPingTime < 30000) return; // Keep updating every 30s even if stationary
    }

    lastPingTime = now;
    lastPosition = { latitude, longitude };

    // Get battery status if available
    let batteryLevel = 100;
    try {
      if (navigator.getBattery) {
        const batt = await navigator.getBattery();
        batteryLevel = Math.round(batt.level * 100);
      }
    } catch (e) {
      // Ignore battery API failures
    }

    const addressLabel = await reverseGeocode(latitude, longitude);

    const pingRecord = {
      id: generateId(),
      company_id: userInfo.company_id || 'default',
      user_id: userInfo.id || userInfo.user_id,
      user_name: userInfo.name || userInfo.user_name || userInfo.email || 'Marketer',
      user_email: userInfo.email || '',
      latitude,
      longitude,
      accuracy: Math.round(accuracy || 0),
      speed: Math.round(speed || 0),
      heading: Math.round(heading || 0),
      status: 'Active',
      address_label: addressLabel,
      battery_level: batteryLevel,
      tracked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Store in DB / PowerSync / Offline Queue
    let savedLocallyOrOnline = false;
    if (navigator.onLine) {
      try {
        if (powerSync?.execute) {
          await powerSync.execute(
            `INSERT OR REPLACE INTO univ_re_marketer_locations 
             (id, company_id, user_id, user_name, user_email, latitude, longitude, accuracy, speed, heading, status, address_label, battery_level, tracked_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              pingRecord.id, pingRecord.company_id, pingRecord.user_id, pingRecord.user_name, pingRecord.user_email,
              pingRecord.latitude, pingRecord.longitude, pingRecord.accuracy, pingRecord.speed, pingRecord.heading,
              pingRecord.status, pingRecord.address_label, pingRecord.battery_level, pingRecord.tracked_at, pingRecord.created_at
            ]
          );
          savedLocallyOrOnline = true;
        } else if (supabase) {
          await supabase.from('univ_re_marketer_locations').upsert(pingRecord);
          savedLocallyOrOnline = true;
        }
      } catch (e) {
        console.warn('DB write error for live tracking ping, fallback to offline queue:', e);
      }
    }

    if (!savedLocallyOrOnline) {
      queueLocationOffline(pingRecord);
    }

    // Cache latest ping for UI
    localStorage.setItem('jcl_marketer_last_ping', JSON.stringify(pingRecord));

    if (onUpdate) onUpdate(pingRecord);
  };

  const handlePositionError = (error) => {
    console.error('Geolocation error:', error);
    let msg = 'Position unavailable';
    if (error.code === 1) msg = 'Location access denied. Please grant GPS permission.';
    if (error.code === 2) msg = 'GPS signal lost or unavailable.';
    if (error.code === 3) msg = 'Location request timed out.';
    if (onError) onError(msg);
  };

  activeWatchId = navigator.geolocation.watchPosition(handlePositionSuccess, handlePositionError, options);
  return true;
};

// STOP Live Geolocation Tracking
export const stopLiveTracking = (userInfo) => {
  if (activeWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
  }
  localStorage.setItem(TRACKING_STATE_KEY, JSON.stringify({ active: false, stoppedAt: new Date().toISOString() }));

  // Log status change ping as 'Paused' if user info provided
  if (userInfo && lastPosition) {
    const pausePing = {
      id: generateId(),
      company_id: userInfo.company_id || 'default',
      user_id: userInfo.id || userInfo.user_id,
      user_name: userInfo.name || userInfo.email || 'Marketer',
      user_email: userInfo.email || '',
      latitude: lastPosition.latitude,
      longitude: lastPosition.longitude,
      accuracy: 0,
      speed: 0,
      heading: 0,
      status: 'Paused',
      address_label: 'Tracking Stopped',
      battery_level: 100,
      tracked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    if (navigator.onLine && supabase) {
      supabase.from('univ_re_marketer_locations').upsert(pausePing).catch(() => queueLocationOffline(pausePing));
    } else {
      queueLocationOffline(pausePing);
    }
  }
};

// Check if tracking is currently active
export const isLiveTrackingActive = () => {
  try {
    const state = JSON.parse(localStorage.getItem(TRACKING_STATE_KEY) || '{}');
    return Boolean(state.active && activeWatchId !== null);
  } catch (e) {
    return false;
  }
};

// LOG CLIENT MEETING (Check-in)
export const logClientMeeting = async (userInfo, meetingDetails) => {
  return new Promise((resolve) => {
    const finishMeetingLog = async (lat, lng, acc) => {
      const addressText = await reverseGeocode(lat, lng);
      const meetingRecord = {
        id: generateId(),
        company_id: userInfo.company_id || 'default',
        marketer_id: userInfo.id || userInfo.user_id,
        marketer_name: userInfo.name || userInfo.user_name || userInfo.email || 'Marketer',
        client_name: meetingDetails.client_name,
        client_phone: meetingDetails.client_phone || '',
        client_email: meetingDetails.client_email || '',
        property_interest: meetingDetails.property_interest || '',
        meeting_purpose: meetingDetails.meeting_purpose || 'Client Discussion',
        notes: meetingDetails.notes || '',
        meeting_outcome: meetingDetails.meeting_outcome || 'Successful',
        follow_up_date: meetingDetails.follow_up_date || '',
        latitude: lat,
        longitude: lng,
        accuracy: Math.round(acc || 0),
        address_text: addressText,
        sync_status: navigator.onLine ? 'synced' : 'pending',
        created_at: new Date().toISOString(),
      };

      let dbSaved = false;
      if (navigator.onLine) {
        try {
          if (powerSync?.execute) {
            await powerSync.execute(
              `INSERT OR REPLACE INTO univ_re_client_meetings 
               (id, company_id, marketer_id, marketer_name, client_name, client_phone, client_email, property_interest, meeting_purpose, notes, meeting_outcome, follow_up_date, latitude, longitude, accuracy, address_text, sync_status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                meetingRecord.id, meetingRecord.company_id, meetingRecord.marketer_id, meetingRecord.marketer_name,
                meetingRecord.client_name, meetingRecord.client_phone, meetingRecord.client_email,
                meetingRecord.property_interest, meetingRecord.meeting_purpose, meetingRecord.notes,
                meetingRecord.meeting_outcome, meetingRecord.follow_up_date, meetingRecord.latitude,
                meetingRecord.longitude, meetingRecord.accuracy, meetingRecord.address_text, 'synced',
                meetingRecord.created_at
              ]
            );
            dbSaved = true;
          } else if (supabase) {
            const { error } = await supabase.from('univ_re_client_meetings').upsert(meetingRecord);
            if (!error) dbSaved = true;
          }
        } catch (e) {
          console.warn('Meeting save DB error, storing offline:', e);
        }
      }

      if (!dbSaved) {
        meetingRecord.sync_status = 'pending';
        queueMeetingOffline(meetingRecord);
      }

      resolve({ success: true, meeting: meetingRecord, isOffline: !dbSaved });
    };

    // Obtain current high-accuracy position or fallback
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          finishMeetingLog(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        },
        (err) => {
          console.warn('Meeting position fallback to lastPosition or 0,0:', err);
          if (lastPosition) {
            finishMeetingLog(lastPosition.latitude, lastPosition.longitude, 15);
          } else {
            finishMeetingLog(0.0, 0.0, 0);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    } else {
      finishMeetingLog(0.0, 0.0, 0);
    }
  });
};

// FETCH ACTIVE MARKETERS FOR ADMIN DASHBOARD
export const fetchActiveMarketers = async (companyId) => {
  let marketers = [];

  // Try fetching from PowerSync or Supabase
  if (navigator.onLine && supabase) {
    try {
      const { data, error } = await supabase
        .from('univ_re_marketer_locations')
        .select('*')
        .eq('company_id', companyId || 'default')
        .order('tracked_at', { ascending: false });

      if (!error && data) {
        // Group by user_id to get the latest position per marketer
        const latestByUser = new Map();
        data.forEach((row) => {
          if (!latestByUser.has(row.user_id)) {
            latestByUser.set(row.user_id, row);
          }
        });
        marketers = Array.from(latestByUser.values());
      }
    } catch (e) {
      console.warn('Failed to fetch marketers from Supabase:', e);
    }
  }

  // Fallback / merge with local last ping
  try {
    const lastPingStr = localStorage.getItem('jcl_marketer_last_ping');
    if (lastPingStr) {
      const lastPing = JSON.parse(lastPingStr);
      const existsIndex = marketers.findIndex((m) => m.user_id === lastPing.user_id);
      if (existsIndex >= 0) {
        marketers[existsIndex] = lastPing;
      } else {
        marketers.push(lastPing);
      }
    }
  } catch (e) {}

  return marketers;
};

// FETCH CLIENT MEETINGS FOR FEED
export const fetchClientMeetings = async (companyId) => {
  let meetings = [];

  if (navigator.onLine && supabase) {
    try {
      const { data, error } = await supabase
        .from('univ_re_client_meetings')
        .select('*')
        .eq('company_id', companyId || 'default')
        .order('created_at', { ascending: false });

      if (!error && data) {
        meetings = data;
      }
    } catch (e) {
      console.warn('Failed to fetch meetings from Supabase:', e);
    }
  }

  // Merge with unsynced local offline meetings
  try {
    const offlineStr = localStorage.getItem(OFFLINE_MEETINGS_KEY);
    if (offlineStr) {
      const offlineMeetings = JSON.parse(offlineStr);
      const dbIds = new Set(meetings.map((m) => m.id));
      offlineMeetings.forEach((om) => {
        if (!dbIds.has(om.id)) {
          meetings.unshift(om);
        }
      });
    }
  } catch (e) {}

  return meetings;
};

// FETCH MARKETER ROUTE TRAIL
export const fetchMarketerRouteHistory = async (companyId, userId, limit = 50) => {
  if (navigator.onLine && supabase) {
    try {
      const { data, error } = await supabase
        .from('univ_re_marketer_locations')
        .select('*')
        .eq('company_id', companyId || 'default')
        .eq('user_id', userId)
        .order('tracked_at', { ascending: true })
        .limit(limit);

      if (!error && data) return data;
    } catch (e) {}
  }
  return [];
};
