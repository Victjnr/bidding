import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/notificationsSlice';
import { getEcho } from '@/lib/echo';
import type { AppNotification } from '@/types';

/**
 * Plays a subtle notification chime using the Web Audio API.
 * No external audio files needed — generates a 150ms sine wave tone.
 */
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch {
    // Silently fail if Web Audio is not available
  }
}

export function useNotificationRoom() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  const handleNewNotification = useCallback(
    (notification: AppNotification) => {
      dispatch(addNotification(notification));
      playNotificationChime();
    },
    [dispatch],
  );

  useEffect(() => {
    const channelId = user?.id || user?.uuid;
    if (!channelId) return;

    const echo = getEcho();
    if (!echo) return;

    echo
      .private(`notifications.${channelId}`)
      .listen('.NewNotification', handleNewNotification);

    return () => {
      try {
        echo.leave(`notifications.${channelId}`);
      } catch {
        // ignore
      }
    };
  }, [user?.id, user?.uuid, handleNewNotification]);
}
