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
let wsServerUnreachable = false;

export const setupEcho = () => {
  if (echo) return echo;
  if (wsServerUnreachable) return null;
  if (import.meta.env.VITE_ENABLE_WEBSOCKETS === 'false') return null;

  const state = store.getState() as any;
  const token = state?.auth?.accessToken || localStorage.getItem('access_token');

  if (!token) return null;

  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:8000/api/v1';

  const isHttps = import.meta.env.VITE_PUSHER_SCHEME === 'https';
  const port = Number(import.meta.env.VITE_PUSHER_PORT || 8080);

  echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
    wsPort: port,
    wssPort: port,
    forceTLS: isHttps,
    disableStats: true,
    enabledTransports: isHttps ? ['ws', 'wss'] : ['ws'],
    authEndpoint: `${apiBase}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  const pusher = (echo.connector as any)?.pusher;
  if (pusher?.connection) {
    let connectedOnce = false;
    pusher.connection.bind('connected', () => {
      connectedOnce = true;
    });
    const stopRetryIfOffline = () => {
      if (!connectedOnce) {
        wsServerUnreachable = true;
        try {
          pusher.disconnect();
        } catch {
          // ignore
        }
      }
    };
    pusher.connection.bind('error', stopRetryIfOffline);
    pusher.connection.bind('unavailable', stopRetryIfOffline);
    pusher.connection.bind('failed', stopRetryIfOffline);
  }

  window.Echo = echo;
  return echo;
};

export const getEcho = () => echo || setupEcho();

export const disconnectEcho = () => {
  if (echo) {
    try {
      echo.disconnect();
    } catch {
      // ignore
    }
    echo = null;
    delete (window as any).Echo;
  }
};
