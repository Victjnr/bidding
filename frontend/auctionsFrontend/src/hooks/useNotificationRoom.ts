import { useEffect, useRef, useCallback } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/notificationsSlice';
import type { AppNotification } from '@/types';

if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

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
  const echoRef = useRef<Echo<any> | null>(null);

  const handleNewNotification = useCallback(
    (notification: AppNotification) => {
      dispatch(addNotification(notification));
      playNotificationChime();
    },
    [dispatch],
  );

  useEffect(() => {
    if (!user?.uuid) return;

    const echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
      forceTLS: true,
      authEndpoint: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      },
    });

    echoRef.current = echo;

    echo
      .private(`notifications.${user.uuid}`)
      .listen('.NewNotification', handleNewNotification);

    return () => {
      echo.leave(`notifications.${user.uuid}`);
      echo.disconnect();
      echoRef.current = null;
    };
  }, [user?.uuid, handleNewNotification]);
}
