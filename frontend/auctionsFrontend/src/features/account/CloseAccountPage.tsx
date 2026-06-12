import { useState } from 'react';
import { useCloseAccountMutation } from '@/store/api/accountApi';
import { useAppDispatch } from '@/hooks/useRedux';
import { clearCredentials } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CloseAccountPage() {
  const [closeAccount, { isLoading }] = useCloseAccountMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    if (confirmText !== 'DELETE') {
      setErrorMsg('Please type DELETE exactly as shown.');
      return;
    }
    setErrorMsg('');
    
    try {
      await closeAccount({ confirmation: confirmText }).unwrap();
      dispatch(clearCredentials());
      navigate('/auth/login', { replace: true });
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to close account. Please ensure all pending transactions are resolved.');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-error">Close Account</h2>
        <p className="text-sm text-muted mt-1">This action is permanent and cannot be undone.</p>
      </div>

      <div className="rounded-xl border border-error/20 bg-error/5 p-6 space-y-6">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Are you sure you want to delete your account?</h3>
            <p className="text-sm text-muted mt-1">
              Closing your account means you will lose access to all your data, bidding history, and seller profile.
            </p>
          </div>
        </div>

        <ul className="space-y-3 rounded-lg bg-white/50 p-4 border border-error/10 text-sm">
          <li className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-error shrink-0" />
            <span className="text-ink">Any active listings will be immediately cancelled.</span>
          </li>
          <li className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-error shrink-0" />
            <span className="text-ink">Any pending payouts must be cleared before closing.</span>
          </li>
          <li className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-error shrink-0" />
            <span className="text-ink">Your wallet balance must be $0.00.</span>
          </li>
        </ul>

        {step === 1 ? (
          <div className="flex justify-end pt-4 border-t border-error/20">
            <button onClick={() => setStep(2)} className="rounded-lg bg-error px-4 py-2 text-sm font-bold text-white hover:bg-error/90 transition-colors">
              I understand, continue
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-4 border-t border-error/20 animate-in fade-in slide-in-from-bottom-4">
            {errorMsg && (
              <div className="rounded-md bg-error/10 p-3 text-sm text-error">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">
                To confirm, type <span className="font-bold font-mono bg-error/10 text-error px-1 rounded">DELETE</span> below:
              </label>
              <input 
                type="text" 
                value={confirmText} 
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className={cn("input font-mono", confirmText === 'DELETE' ? "border-error focus:ring-error/20" : "")}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setStep(1)} className="btn-outline border-transparent text-muted hover:text-ink">
                Cancel
              </button>
              <button 
                onClick={handleConfirm} 
                disabled={isLoading || confirmText !== 'DELETE'} 
                className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-bold text-white hover:bg-error/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : <><Trash2 className="h-4 w-4" /> Permanently Delete Account</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
