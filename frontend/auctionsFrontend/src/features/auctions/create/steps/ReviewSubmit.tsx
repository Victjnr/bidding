import { Pencil, Image, Tag, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import type { AuctionType } from '@/types/auction';
import type { MediaItem } from './MediaUpload';

interface ReviewSubmitProps {
  wizardState: {
    auctionType: AuctionType | null;
    title: string;
    description: string;
    category: string;
    condition: string;
    location: string;
    media: MediaItem[];
    startPrice: string;
    reservePrice: string;
    reserveEnabled: boolean;
    binPrice: string;
    binEnabled: boolean;
    bidIncrement: string;
    bidIncrementType: 'fixed' | 'percentage';
    currency: string;
    startAt: string;
    endAt: string;
    antiSnipeEnabled: boolean;
    antiSnipeMinutes: string;
    depositEnabled: boolean;
    depositAmount: string;
  };
  onGoToStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewSubmit({ wizardState, onGoToStep, onSubmit, isSubmitting }: ReviewSubmitProps) {
  const s = wizardState;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Review & Submit</h2>
        <p className="mt-2 text-sm text-muted">
          Please review all details carefully before submitting your listing for review.
        </p>
      </div>

      {/* Auction Type */}
      <ReviewSection title="Auction Type" icon={Tag} step={1} onEdit={onGoToStep}>
        <p className="text-sm font-semibold text-ink capitalize">{s.auctionType ?? '—'}</p>
      </ReviewSection>

      {/* Item Details */}
      <ReviewSection title="Item Details" icon={Pencil} step={2} onEdit={onGoToStep}>
        <dl className="space-y-2 text-sm">
          <Row label="Title" value={s.title || '—'} />
          <Row label="Category" value={s.category || '—'} />
          <Row label="Condition" value={s.condition ? s.condition.replace(/_/g, ' ') : '—'} />
          <Row label="Location" value={s.location || '—'} />
        </dl>
        {s.description && (
          <div className="mt-3 max-h-32 overflow-y-auto rounded-md bg-sky p-3 text-sm text-ink prose prose-sm prose-slate"
            dangerouslySetInnerHTML={{ __html: s.description }}
          />
        )}
      </ReviewSection>

      {/* Media */}
      <ReviewSection title="Media" icon={Image} step={3} onEdit={onGoToStep}>
        {s.media.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {s.media.slice(0, 6).map((m, i) => (
              <div key={m.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border">
                <img src={m.previewUrl} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-orange py-0.5 text-center text-[9px] font-bold text-white">
                    COVER
                  </span>
                )}
              </div>
            ))}
            {s.media.length > 6 && (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-sm font-medium text-muted">
                +{s.media.length - 6}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-error">No media uploaded.</p>
        )}
      </ReviewSection>

      {/* Pricing */}
      <ReviewSection title="Pricing" icon={Tag} step={4} onEdit={onGoToStep}>
        <dl className="space-y-2 text-sm">
          <Row label="Currency" value={s.currency} />
          {s.auctionType === 'bin' ? (
            <Row label="Buy It Now Price" value={`${s.currency} ${s.binPrice || '—'}`} />
          ) : (
            <Row label="Starting Price" value={`${s.currency} ${s.startPrice || '—'}`} />
          )}
          {s.reserveEnabled && <Row label="Reserve Price" value={`${s.currency} ${s.reservePrice}`} />}
          {s.binEnabled && s.auctionType !== 'bin' && <Row label="Buy It Now" value={`${s.currency} ${s.binPrice}`} />}
          {s.bidIncrement && (
            <Row
              label="Bid Increment"
              value={s.bidIncrementType === 'fixed' ? `${s.currency} ${s.bidIncrement}` : `${s.bidIncrement}%`}
            />
          )}
        </dl>
      </ReviewSection>

      {/* Schedule */}
      <ReviewSection title="Schedule" icon={Calendar} step={5} onEdit={onGoToStep}>
        <dl className="space-y-2 text-sm">
          <Row label="Starts" value={s.startAt ? new Date(s.startAt).toLocaleString() : '—'} />
          <Row label="Ends" value={s.endAt ? new Date(s.endAt).toLocaleString() : '—'} />
          <Row label="Anti-Snipe" value={s.antiSnipeEnabled ? `${s.antiSnipeMinutes} min extension` : 'Disabled'} />
          <Row label="Deposit" value={s.depositEnabled ? `${s.currency} ${s.depositAmount}` : 'None'} />
        </dl>
      </ReviewSection>

      {/* Submit */}
      <div className="rounded-xl border-2 border-dashed border-orange/30 bg-orange/5 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-orange" />
        <p className="text-sm font-medium text-ink mb-4">
          Your listing will be submitted for review. You'll be notified once it's approved.
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn-primary px-10 py-3 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting…
            </>
          ) : (
            'Submit for Review'
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function ReviewSection({
  title,
  icon: Icon,
  step,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ElementType;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-orange" />
          {title}
        </div>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs font-medium text-orange hover:underline focus:outline-none"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink capitalize">{value}</dd>
    </div>
  );
}
