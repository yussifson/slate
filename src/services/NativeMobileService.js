import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class NativeMobileService {
  constructor() {
    this.initialized = false;
    this.audioContext = null;
  }

  isNative() {
    return Capacitor.isNativePlatform();
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    if (this.isNative()) {
      try {
        // 1. Create native notification channel with high priority and alert sound
        await LocalNotifications.createChannel({
          id: 'jcl_alerts',
          name: 'JCL Office Alerts',
          description: 'Real estate leads, offers, viewing bookings, procurement, and finance alerts',
          importance: 5, // High / Heads-up notification
          visibility: 1, // Public on lockscreen
          sound: 'notification_sound.wav',
          vibration: true,
          lights: true,
          lightColor: '#005A9C'
        });

        // 2. Request notification permission
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (err) {
        console.warn('[NativeMobileService] Channel/permission setup warning:', err);
      }
    }
  }

  /**
   * Set native app icon badge count (supports Badging API with fallback)
   */
  async setBadgeCount(count) {
    try {
      if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      }
    } catch {
      // Ignore unsupported platforms
    }
  }

  /**
   * Play an audible high-fidelity corporate notification chime
   * (Two-tone ascending alert 880Hz -> 1760Hz with natural decay)
   */
  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = this.audioContext && this.audioContext.state !== 'closed' 
        ? this.audioContext 
        : new AudioCtx();
      this.audioContext = audioCtx;

      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      const now = audioCtx.currentTime;
      // Ascending crisp bell chime
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.40);
    } catch (e) {
      console.debug('[NativeMobileService] WebAudio chime silenced:', e);
    }
  }

  /**
   * Trigger native tactile haptic feedback
   */
  async triggerHaptic(type = 'notification') {
    if (!this.isNative()) return;
    try {
      if (type === 'notification') {
        await Haptics.notification({ type: NotificationType.Success });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch {
      // Ignore unsupported platforms
    }
  }

  /**
   * Dispatch an immediate notification with sound, haptics, and heads-up banner
   */
  async notify({ id = Date.now(), title, body, extra = {} }) {
    // 1. Play chime sound
    this.playChime();

    // 2. Trigger native vibration/haptics & schedule heads-up notification
    if (this.isNative()) {
      try {
        await this.triggerHaptic('notification');
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Number(String(id).slice(-8)) || Math.floor(Math.random() * 10000000),
              title: title || 'JCL Office Notification',
              body: body || 'New workspace activity recorded.',
              channelId: 'jcl_alerts',
              extra,
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#005A9C'
            }
          ]
        });
      } catch (err) {
        console.warn('[NativeMobileService] LocalNotifications.schedule error:', err);
      }
    }
  }
}

export const nativeMobile = new NativeMobileService();
