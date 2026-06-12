import { useState } from 'react';
import { useOpenDisputeMutation, useGetDisputeQuery } from '@/store/api/paymentApi';

import { AlertTriangle, UploadCloud, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DisputeResource } from '@/types/payment';

export function DisputeFlow({ transactionUuid, existingDisputeUuid }: { transactionUuid: string; existingDisputeUuid?: string }) {
  if (existingDisputeUuid) {
    return <DisputeStatusCard disputeUuid={existingDisputeUuid} />;
  }
  return <OpenDisputeForm transactionUuid={transactionUuid} />;
}

function OpenDisputeForm({ transactionUuid }: { transactionUuid: string }) {
  const [openDispute, { isLoading }] = useOpenDisputeMutation();
  const [reason, setReason] = useState('not_received');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length < 50) {
      setErrorMsg('Please provide a detailed description of the issue (minimum 50 characters).');
      return;
    }
    
    try {
      await openDispute({ transactionUuid, reason, description }).unwrap();
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to open dispute.');
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="font-display text-xl font-bold text-ink">Dispute Submitted</h3>
        <p className="mt-2 text-muted">
          Our moderation team has been notified. The funds will be held securely in escrow while we review the evidence.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="bg-navy p-6 text-white">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-orange" />
          <h2 className="font-display text-lg font-bold">Open a Dispute</h2>
        </div>
        <p className="mt-1 text-sm text-sky/80">
          If you have an issue with your transaction, you can open a dispute. Funds remain locked until resolution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMsg && (
          <div className="rounded-md bg-error/10 p-3 text-sm text-error">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">Reason for Dispute</label>
          <select 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            className="input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7A8D%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
          >
            <option value="not_received">Item not received</option>
            <option value="not_as_described">Item not as described</option>
            <option value="fraud">Suspected fraud</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-ink">Detailed Description</label>
            <span className={cn("text-xs font-medium", description.length < 50 ? 'text-error' : 'text-success')}>
              {description.length} / 50 min
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please explain the issue clearly..."
            className="input min-h-[120px] resize-none"
          />
        </div>

        {/* Evidence Uploader Stub */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink">Evidence (Optional)</label>
          <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-sky/50 p-6 transition-colors hover:border-orange/50 hover:bg-orange/5">
            <UploadCloud className="mb-2 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-ink">Click or drag images here</p>
            <p className="text-xs text-muted">PNG, JPG up to 10MB</p>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || description.length < 50} 
          className="btn-primary w-full"
        >
          {isLoading ? 'Submitting...' : 'Submit Dispute'}
        </button>
      </form>
    </div>
  );
}

function DisputeStatusCard({ disputeUuid }: { disputeUuid: string }) {
  const { data: dispute, isLoading } = useGetDisputeQuery(disputeUuid);

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-sky/50" />;
  if (!dispute) return null;

  const steps = ['opened', 'under_review', 'resolved'];
  const currentStepIdx = steps.indexOf(dispute.status) !== -1 ? steps.indexOf(dispute.status) : 2;

  const getResolutionBadge = (resolution?: string) => {
    if (resolution === 'buyer_favoured') return 'bg-success text-white';
    if (resolution === 'seller_favoured') return 'bg-navy text-white';
    return 'bg-muted text-white';
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Dispute Status</h2>
          <p className="text-sm text-muted">ID: {dispute.uuid.substring(0, 8).toUpperCase()}</p>
        </div>
        {dispute.status === 'resolved' && (
          <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", getResolutionBadge(dispute.resolution))}>
            {dispute.resolution?.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {['Opened', 'Under Review', 'Resolved'].map((label, idx) => (
          <div key={label} className="flex flex-1 items-center">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
              idx <= currentStepIdx ? "border-orange bg-orange text-white" : "border-border bg-sky text-muted"
            )}>
              {idx + 1}
            </div>
            {idx < 2 && (
              <div className={cn(
                "h-1 flex-1 mx-2 rounded-full",
                idx < currentStepIdx ? "bg-orange" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-sky p-4 text-sm">
        <h4 className="font-bold text-ink">Your Description</h4>
        <p className="text-muted mt-1">{dispute.description}</p>
      </div>

      {dispute.moderatorNotes && (
        <div className="rounded-lg border border-orange/20 bg-orange/5 p-4 text-sm">
          <h4 className="font-bold text-orange flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Moderator Decision
          </h4>
          <p className="text-ink mt-1">{dispute.moderatorNotes}</p>
        </div>
      )}
    </div>
  );
}
