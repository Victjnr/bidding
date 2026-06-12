import { useState, useMemo } from 'react';
import { useGetSettingsQuery, useUpdateSettingsGroupMutation, useGetFeatureFlagsQuery, useUpdateFeatureFlagMutation } from '@/store/api/adminApi';
import { ChevronDown, ChevronRight, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemSetting, FeatureFlag } from '@/types/admin';

export default function SettingsPage() {
  const { data: settings, isLoading: settingsLoading } = useGetSettingsQuery();
  const { data: flags, isLoading: flagsLoading } = useGetFeatureFlagsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsGroupMutation();
  const [updateFlag] = useUpdateFeatureFlagMutation();

  // Group settings by their 'group' property
  const grouped = useMemo(() => {
    if (!settings) return {};
    return settings.reduce<Record<string, SystemSetting[]>>((acc, s) => {
      if (!acc[s.group]) acc[s.group] = [];
      acc[s.group].push(s);
      return acc;
    }, {});
  }, [settings]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-white/40 mt-1">Manage global configuration and feature flags.</p>
      </div>

      {/* Settings Accordion Groups */}
      <div className="space-y-4">
        {settingsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)
        ) : (
          Object.entries(grouped).map(([group, items]) => (
            <SettingsGroup key={group} group={group} items={items} onSave={updateSettings} isSaving={isSaving} />
          ))
        )}
      </div>

      {/* Feature Flags */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold text-white">Feature Flags</h2>
        <div className="rounded-xl border border-white/5 bg-[#0A1628] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/30">
              <tr>
                <th className="px-6 py-4 font-medium">Feature</th>
                <th className="px-6 py-4 font-medium text-center">Enabled</th>
                <th className="px-6 py-4 font-medium text-center">Rollout %</th>
                <th className="px-6 py-4 font-medium">Allowed Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {flagsLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-white/30">Loading flags...</td></tr>
              ) : flags?.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-white/30">No feature flags configured.</td></tr>
              ) : (
                flags?.map((flag) => (
                  <FeatureFlagRow key={flag.id} flag={flag} onUpdate={updateFlag} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ group, items, onSave, isSaving }: { group: string; items: SystemSetting[]; onSave: any; isSaving: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState<Record<string, string | number | boolean>>(() =>
    items.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {} as Record<string, string | number | boolean>)
  );
  const [hasChanges, setHasChanges] = useState(false);

  const updateLocal = (key: string, value: string | number | boolean) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave({ group, settings: localValues }).unwrap();
    setHasChanges(false);
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#0A1628] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="h-4 w-4 text-white/30" /> : <ChevronRight className="h-4 w-4 text-white/30" />}
          <h3 className="font-display font-bold text-white capitalize">{group.replace(/_/g, ' ')}</h3>
          <span className="text-xs text-white/20">({items.length} settings)</span>
        </div>
        {hasChanges && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-orange">
            <AlertCircle className="h-3.5 w-3.5" /> Unsaved changes
          </span>
        )}
      </button>

      {isOpen && (
        <div className="border-t border-white/5 px-6 py-6 space-y-6">
          {items.map((setting) => (
            <div key={setting.key} className="space-y-1.5">
              <label className="text-sm font-medium text-white">{setting.label}</label>
              <p className="text-xs text-white/30">{setting.description}</p>
              {setting.type === 'toggle' ? (
                <button
                  onClick={() => updateLocal(setting.key, !localValues[setting.key])}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    localValues[setting.key] ? "bg-orange" : "bg-white/10"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                    localValues[setting.key] && "translate-x-5"
                  )} />
                </button>
              ) : setting.type === 'select' ? (
                <select
                  value={String(localValues[setting.key])}
                  onChange={(e) => updateLocal(setting.key, e.target.value)}
                  className="w-full max-w-xs rounded-lg bg-white/5 px-3 py-2 text-sm text-white border border-white/5 outline-none"
                >
                  {setting.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={setting.type === 'number' ? 'number' : 'text'}
                  value={String(localValues[setting.key])}
                  onChange={(e) => updateLocal(setting.key, setting.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full max-w-xs rounded-lg bg-white/5 px-3 py-2 text-sm text-white border border-white/5 outline-none"
                />
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-white/5">
            <button onClick={handleSave} disabled={!hasChanges || isSaving} className="flex items-center gap-2 rounded-lg bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange/90 disabled:opacity-30 transition-colors">
              <Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Group'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureFlagRow({ flag, onUpdate }: { flag: FeatureFlag; onUpdate: any }) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [rollout, setRollout] = useState(flag.rolloutPercentage);
  const [dirty, setDirty] = useState(false);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setDirty(true);
    onUpdate({ id: flag.id, enabled: next, rolloutPercentage: rollout, allowedRoles: flag.allowedRoles });
    setDirty(false);
  };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-4">
        <p className="font-medium text-white">{flag.name}</p>
        <p className="text-xs text-white/30 mt-0.5">{flag.description}</p>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={handleToggle}
          className={cn("relative h-6 w-11 rounded-full transition-colors mx-auto block", enabled ? "bg-emerald-500" : "bg-white/10")}
        >
          <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform", enabled && "translate-x-5")} />
        </button>
      </td>
      <td className="px-6 py-4 text-center">
        <input
          type="number"
          min={0}
          max={100}
          value={rollout}
          onChange={(e) => { setRollout(Number(e.target.value)); setDirty(true); }}
          onBlur={() => { if (dirty) { onUpdate({ id: flag.id, enabled, rolloutPercentage: rollout, allowedRoles: flag.allowedRoles }); setDirty(false); } }}
          className="w-20 rounded-lg bg-white/5 px-2 py-1 text-center text-sm text-white border border-white/5 outline-none"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-1 flex-wrap">
          {flag.allowedRoles.map((role) => (
            <span key={role} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-white/40">{role}</span>
          ))}
        </div>
      </td>
    </tr>
  );
}
