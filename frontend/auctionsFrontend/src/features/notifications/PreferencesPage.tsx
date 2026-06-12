import { useEffect, useRef, useCallback } from 'react';
import { useGetNotificationPreferencesQuery, useUpdateNotificationPreferencesMutation } from '@/store/api/notificationApi';
import { Settings, Save } from 'lucide-react';
import type { NotificationPreferences } from '@/types/notification';

type PreferenceKey = keyof NotificationPreferences;

interface PreferenceRow {
  label: string;
  emailKey?: PreferenceKey;
  pushKey?: PreferenceKey;
  smsKey?: PreferenceKey;
}

const PREFERENCE_ROWS: PreferenceRow[] = [
  { label: 'Outbid notification', emailKey: 'emailOutbid', pushKey: 'pushOutbid', smsKey: 'smsOutbid' },
  { label: 'Auction ending soon', emailKey: 'emailEndingSoon', pushKey: 'pushEndingSoon' },
  { label: 'Auction won', emailKey: 'emailWon', pushKey: 'pushWon' },
  { label: 'Payment due', emailKey: 'emailPaymentDue' },
  { label: 'Marketing & newsletters', emailKey: 'emailMarketing' },
];

export default function PreferencesPage() {
  const { data: preferences, isLoading } = useGetNotificationPreferencesQuery();
  const [updatePreferences] = useUpdateNotificationPreferencesMutation();

  // Debounced save
  const pendingUpdatesRef = useRef<Partial<NotificationPreferences>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updatePreferences(pendingUpdatesRef.current);
        pendingUpdatesRef.current = {};
      }, 500);
    },
    [updatePreferences],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleToggle = (key: PreferenceKey) => {
    if (!preferences) return;
    const newValue = !preferences[key];
    debouncedSave({ [key]: newValue });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-sky/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink flex items-center gap-3">
          <Settings className="h-7 w-7 text-muted" />
          Notification Preferences
        </h1>
        <p className="text-muted mt-1">Choose how and when you want to be notified.</p>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky/50">
            <tr>
              <th className="px-6 py-4 font-medium text-muted uppercase text-xs tracking-wider">Event</th>
              <th className="px-6 py-4 text-center font-medium text-muted uppercase text-xs tracking-wider">Email</th>
              <th className="px-6 py-4 text-center font-medium text-muted uppercase text-xs tracking-wider">Push</th>
              <th className="px-6 py-4 text-center font-medium text-muted uppercase text-xs tracking-wider">SMS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PREFERENCE_ROWS.map((row) => (
              <tr key={row.label} className="hover:bg-sky/30 transition-colors">
                <td className="px-6 py-4 font-medium text-ink">{row.label}</td>
                <td className="px-6 py-4 text-center">
                  {row.emailKey ? (
                    <ToggleSwitch
                      checked={preferences?.[row.emailKey] ?? false}
                      onToggle={() => handleToggle(row.emailKey!)}
                    />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {row.pushKey ? (
                    <ToggleSwitch
                      checked={preferences?.[row.pushKey] ?? false}
                      onToggle={() => handleToggle(row.pushKey!)}
                    />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {row.smsKey ? (
                    <ToggleSwitch
                      checked={preferences?.[row.smsKey] ?? false}
                      onToggle={() => handleToggle(row.smsKey!)}
                    />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted flex items-center gap-1.5">
        <Save className="h-3.5 w-3.5" />
        Changes are saved automatically.
      </p>
    </div>
  );
}

function ToggleSwitch({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange/30 ${
        checked ? 'bg-orange' : 'bg-border'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
