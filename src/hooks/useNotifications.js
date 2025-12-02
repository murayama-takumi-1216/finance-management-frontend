import { useEffect, useCallback, useRef } from 'react';
import { useNotificationsStore } from '../store/useStore';
import notificationSound from '../utils/notificationSound';

/**
 * Custom hook for handling notifications with sound and browser notifications
 */
export function useNotifications() {
  const {
    preferences,
    fetchPreferences,
    fetchUnreadCount,
    fetchCustomSounds,
    getCustomSoundUrl,
    addNotification,
    unreadCount,
  } = useNotificationsStore();

  const previousCountRef = useRef(unreadCount);
  const permissionGrantedRef = useRef(false);

  // Load preferences and custom sounds on mount
  useEffect(() => {
    fetchPreferences().catch(console.error);
    fetchCustomSounds().catch(console.error);
  }, [fetchPreferences, fetchCustomSounds]);

  // Request browser notification permission
  useEffect(() => {
    if (preferences?.browserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          permissionGrantedRef.current = permission === 'granted';
        });
      } else {
        permissionGrantedRef.current = Notification.permission === 'granted';
      }
    }
  }, [preferences?.browserNotifications]);

  // Update sound manager when preferences change
  useEffect(() => {
    if (preferences) {
      notificationSound.setEnabled(preferences.notificationsEnabled);
      notificationSound.setVolume(preferences.notificationVolume);
    }
  }, [preferences]);

  // Check if we're in quiet hours
  const isQuietHours = useCallback(() => {
    if (!preferences?.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = (preferences.quietHoursStart || '22:00').split(':').map(Number);
    const [endHour, endMin] = (preferences.quietHoursEnd || '08:00').split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }, [preferences]);

  // Play notification sound
  const playSound = useCallback(() => {
    if (!preferences?.notificationsEnabled || isQuietHours()) return;

    const soundId = preferences?.notificationSound || 'default';
    // Get custom sound URL if it's a custom sound
    const customUrl = soundId.startsWith('custom_') ? getCustomSoundUrl(soundId) : null;
    notificationSound.play(soundId, customUrl);
  }, [preferences, isQuietHours, getCustomSoundUrl]);

  // Show browser notification
  const showBrowserNotification = useCallback((title, options = {}) => {
    if (
      !preferences?.browserNotifications ||
      !permissionGrantedRef.current ||
      isQuietHours()
    ) {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.warn('Failed to show browser notification:', error);
    }
  }, [preferences, isQuietHours]);

  // Trigger a new notification (sound + browser notification)
  const triggerNotification = useCallback((title, message, options = {}) => {
    if (!preferences?.notificationsEnabled) return;

    // Play sound
    playSound();

    // Show browser notification
    showBrowserNotification(title, {
      body: message,
      ...options,
    });

    // Add to local notifications if provided
    if (options.addToStore !== false) {
      addNotification({
        id: `local-${Date.now()}`,
        titulo: title,
        mensaje: message,
        tipo: options.tipo || 'info',
        leido: false,
        createdAt: new Date().toISOString(),
      });
    }
  }, [preferences, playSound, showBrowserNotification, addNotification]);

  // Watch for unread count changes to trigger sound
  useEffect(() => {
    if (unreadCount > previousCountRef.current) {
      playSound();
    }
    previousCountRef.current = unreadCount;
  }, [unreadCount, playSound]);

  // Poll for new notifications periodically
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchUnreadCount().catch(console.error);
    }, 30000); // Every 30 seconds

    return () => clearInterval(pollInterval);
  }, [fetchUnreadCount]);

  return {
    triggerNotification,
    playSound,
    showBrowserNotification,
    isQuietHours,
    preferences,
  };
}

export default useNotifications;
