import { useState } from 'react';
import { useChangePasswordMutation, useGetSessionsQuery, useRevokeSessionMutation, useGetLoginHistoryQuery } from '@/store/api/accountApi';
import { useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { TwoFactorSetupModal } from '@/features/auth/TwoFactorSetupModal';
import { Shield, KeyRound, Smartphone, Laptop, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SecurityPage() {
  const user = useAppSelector(selectCurrentUser);
  const [changePassword, { isLoading: isChangingPwd }] = useChangePasswordMutation();
  const { data: sessions } = useGetSessionsQuery();
  const { data: history } = useGetLoginHistoryQuery();
  const [revokeSession] = useRevokeSessionMutation();

  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess(false);

    if (pwdForm.new !== pwdForm.confirm) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (pwdForm.new.length < 8) {
      setPwdError('Password must be at least 8 characters long.');
      return;
    }

    try {
      await changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.new }).unwrap();
      setPwdSuccess(true);
      setPwdForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err: any) {
      setPwdError(err?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 2FA Card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
        <div className="flex gap-4 items-start">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white", user?.twoFactorEnabled ? "bg-success" : "bg-muted")}>
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              Two-Factor Authentication (2FA)
              {user?.twoFactorEnabled ? (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">Enabled</span>
              ) : (
                <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">Disabled</span>
              )}
            </h2>
            <p className="text-sm text-muted mt-1 max-w-lg">
              Add an extra layer of security to your account. When enabled, you'll be required to enter a code from your authenticator app when logging in.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShow2FAModal(true)}
          className={cn("whitespace-nowrap font-medium", user?.twoFactorEnabled ? "btn-outline text-error border-error/20 hover:bg-error/10 hover:border-error" : "btn-primary")}
        >
          {user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Change Password */}
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted" />
            <h3 className="font-display font-bold text-ink">Change Password</h3>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            {pwdError && <div className="rounded-md bg-error/10 p-3 text-sm text-error">{pwdError}</div>}
            {pwdSuccess && <div className="rounded-md bg-success/10 p-3 text-sm text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Password updated successfully.</div>}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Current Password</label>
              <input type="password" required value={pwdForm.current} onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))} className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">New Password</label>
              <input type="password" required value={pwdForm.new} onChange={e => setPwdForm(p => ({ ...p, new: e.target.value }))} className="input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Confirm New Password</label>
              <input type="password" required value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} className="input" />
            </div>
            <button type="submit" disabled={isChangingPwd} className="btn-primary w-full mt-2">
              {isChangingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Active Sessions */}
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted" />
            <h3 className="font-display font-bold text-ink">Active Sessions</h3>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {sessions?.map(session => (
              <div key={session.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-sky/30">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-muted">
                    {session.device.toLowerCase().includes('mobile') ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink flex items-center gap-2">
                      {session.device}
                      {session.isCurrent && <span className="rounded bg-success/10 px-1.5 py-0.5 text-[9px] uppercase font-bold text-success">Current</span>}
                    </p>
                    <p className="text-xs text-muted font-mono mt-0.5">{session.ip}</p>
                    <p className="text-[10px] text-muted mt-1">Last active: {formatDistanceToNow(new Date(session.lastActive))} ago</p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button onClick={() => revokeSession(session.id)} className="p-1.5 text-error/60 hover:text-error hover:bg-error/10 rounded transition-colors" title="Revoke Session">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login History */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted" />
          <h3 className="font-display font-bold text-ink">Login History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Device / Browser</th>
                <th className="px-6 py-3 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history?.map(entry => (
                <tr key={entry.id}>
                  <td className="px-6 py-3">
                    {entry.success ? (
                      <span className="flex items-center gap-1.5 text-success font-medium"><CheckCircle2 className="h-4 w-4" /> Success</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-error font-medium"><AlertTriangle className="h-4 w-4" /> Failed</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted">{format(new Date(entry.time), 'MMM d, yyyy HH:mm')}</td>
                  <td className="px-6 py-3 font-medium text-ink">{entry.device}</td>
                  <td className="px-6 py-3 text-muted font-mono text-xs">{entry.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TwoFactorSetupModal 
        isOpen={show2FAModal} 
        onClose={() => setShow2FAModal(false)} 
        onSuccess={() => {/* handled by api invalidation */}} 
      />
    </div>
  );
}
