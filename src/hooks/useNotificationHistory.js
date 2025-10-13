import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing notification history and unread badges
 * Tracks which notifications have been seen and provides badge counts
 */
export function useNotificationHistory() {
  const [seenNotifications, setSeenNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('vertex_plugin_notifications_seen');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [lastSeenTimestamps, setLastSeenTimestamps] = useState(() => {
    try {
      const stored = localStorage.getItem('vertex_plugin_notifications_timestamps');
      return stored ? new Map(JSON.parse(stored)) : new Map();
    } catch {
      return new Map();
    }
  });

  const currentNotificationKeys = useRef(new Set());

  // Persist seen notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vertex_plugin_notifications_seen', JSON.stringify([...seenNotifications]));
    } catch (error) {
      console.warn('[NotificationHistory] Failed to persist seen notifications:', error);
    }
  }, [seenNotifications]);

  // Persist timestamps to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vertex_plugin_notifications_timestamps', JSON.stringify([...lastSeenTimestamps]));
    } catch (error) {
      console.warn('[NotificationHistory] Failed to persist timestamps:', error);
    }
  }, [lastSeenTimestamps]);

  /**
   * Mark a notification as seen
   */
  const markAsSeen = useCallback((notificationKey) => {
    setSeenNotifications((prev) => {
      const next = new Set(prev);
      next.add(notificationKey);
      return next;
    });

    setLastSeenTimestamps((prev) => {
      const next = new Map(prev);
      next.set(notificationKey, Date.now());
      return next;
    });
  }, []);

  /**
   * Mark all current notifications as seen
   */
  const markAllAsSeen = useCallback(() => {
    const keys = Array.from(currentNotificationKeys.current);
    if (keys.length === 0) return;

    setSeenNotifications((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => next.add(key));
      return next;
    });

    const now = Date.now();
    setLastSeenTimestamps((prev) => {
      const next = new Map(prev);
      keys.forEach((key) => next.set(key, now));
      return next;
    });
  }, []);

  /**
   * Check if a notification is unseen
   */
  const isUnseen = useCallback((notificationKey) => {
    return !seenNotifications.has(notificationKey);
  }, [seenNotifications]);

  /**
   * Get count of unseen notifications
   */
  const getUnseenCount = useCallback((notificationKeys) => {
    if (!notificationKeys || notificationKeys.length === 0) return 0;
    return notificationKeys.filter((key) => !seenNotifications.has(key)).length;
  }, [seenNotifications]);

  /**
   * Update the current set of notification keys
   * This should be called whenever the notification list changes
   */
  const updateCurrentNotifications = useCallback((notificationKeys) => {
    currentNotificationKeys.current = new Set(notificationKeys);

    // Clean up old seen notifications that no longer exist
    setSeenNotifications((prev) => {
      const validKeys = new Set(notificationKeys);
      const next = new Set();
      let changed = false;

      prev.forEach((key) => {
        if (validKeys.has(key)) {
          next.add(key);
        } else {
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    // Clean up old timestamps
    setLastSeenTimestamps((prev) => {
      const validKeys = new Set(notificationKeys);
      const next = new Map();
      let changed = false;

      prev.forEach((timestamp, key) => {
        if (validKeys.has(key)) {
          next.set(key, timestamp);
        } else {
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setSeenNotifications(new Set());
    setLastSeenTimestamps(new Map());
    try {
      localStorage.removeItem('vertex_plugin_notifications_seen');
      localStorage.removeItem('vertex_plugin_notifications_timestamps');
    } catch {}
  }, []);

  return {
    markAsSeen,
    markAllAsSeen,
    isUnseen,
    getUnseenCount,
    updateCurrentNotifications,
    clearHistory,
    seenNotifications,
    lastSeenTimestamps,
  };
}

export default useNotificationHistory;
