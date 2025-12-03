import { useState, useEffect, useCallback, useRef } from 'react';
import { useEventsStore } from '../store/useStore';

export function useReminderAlarm() {
  const { reminders, fetchAllReminders } = useEventsStore();
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [snoozedReminders, setSnoozedReminders] = useState({});
  const checkedRemindersRef = useRef(new Set());

  // Fetch reminders on mount and every 30 seconds
  useEffect(() => {
    fetchAllReminders();
    const fetchInterval = setInterval(fetchAllReminders, 30000);
    return () => clearInterval(fetchInterval);
  }, [fetchAllReminders]);

  const checkReminders = useCallback(() => {
    const now = new Date();

    for (const reminder of reminders) {
      // Skip if already shown and dismissed (not snoozed)
      if (checkedRemindersRef.current.has(reminder.id) && !snoozedReminders[reminder.id]) {
        continue;
      }

      // Check if this reminder is snoozed and if snooze time has passed
      const snoozeTime = snoozedReminders[reminder.id];
      if (snoozeTime && new Date(snoozeTime) > now) {
        continue; // Still in snooze period
      }

      // Parse reminder time
      const reminderTime = new Date(reminder.fechaRecordatorio);

      // Check if reminder time has been reached (within the last minute)
      const timeDiff = now - reminderTime;
      if (timeDiff >= 0 && timeDiff < 60000) {
        // Reminder is due!
        setActiveAlarm(reminder);
        return;
      }

      // Also check for snoozed reminders that are now due
      if (snoozeTime && new Date(snoozeTime) <= now) {
        setActiveAlarm(reminder);
        // Remove from snoozed
        setSnoozedReminders(prev => {
          const next = { ...prev };
          delete next[reminder.id];
          return next;
        });
        return;
      }
    }
  }, [reminders, snoozedReminders]);

  // Check reminders every 10 seconds
  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  const dismissAlarm = useCallback(() => {
    if (activeAlarm) {
      checkedRemindersRef.current.add(activeAlarm.id);
      setActiveAlarm(null);
    }
  }, [activeAlarm]);

  const snoozeAlarm = useCallback(() => {
    if (activeAlarm) {
      // Set snooze for 5 minutes from now
      const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
      setSnoozedReminders(prev => ({
        ...prev,
        [activeAlarm.id]: snoozeTime.toISOString(),
      }));
      setActiveAlarm(null);
    }
  }, [activeAlarm]);

  return {
    activeAlarm,
    dismissAlarm,
    snoozeAlarm,
  };
}
