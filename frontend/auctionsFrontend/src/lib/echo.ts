import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { store } from '@/store';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

export let echo: Echo<any> | null = null;

export const setupEcho = () => {
  if (echo) return;

  const state = store.getState() as any;
  const token = state.auth.accessToken;

  if (!token) return;

  echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  window.Echo = echo;
};

export const disconnectEcho = () => {
  if (echo) {
    echo.disconnect();
    echo = null;
    delete (window as any).Echo;
  }
};
