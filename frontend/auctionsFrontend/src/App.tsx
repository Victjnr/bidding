import { useEffect, Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { authApi } from '@/store/api/authApi';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { setupEcho, disconnectEcho } from '@/lib/echo';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { FullPageLoader } from '@/components/layout/FullPageLoader';
import { ErrorBoundary } from '@/components/layout/ErrorPage';

function AppInitializer() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Initial boot sequence
  useEffect(() => {
    // Attempt to fetch user if we have a token or just on boot
    dispatch(authApi.endpoints.getCurrentUser.initiate());
  }, [dispatch]);

  // Handle Echo WebSocket connection lifecycle
  useEffect(() => {
    if (isAuthenticated) {
      setupEcho();
    } else {
      disconnectEcho();
    }
  }, [isAuthenticated]);

  return (
    <Suspense fallback={<FullPageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AppInitializer />
      </ErrorBoundary>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'font-sans text-sm font-medium shadow-xl',
          style: {
            background: '#070F1A',
            color: '#fff',
            borderLeft: '4px solid #E8540A',
            borderRadius: '0.5rem',
          },
          success: {
            iconTheme: {
              primary: '#16A34A',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #16A34A',
            }
          },
          error: {
            iconTheme: {
              primary: '#DC2626',
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #DC2626',
            }
          }
        }}
      />
    </HelmetProvider>
  );
}
