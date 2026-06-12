interface ScheduleProps {
  startAt: string;
  endAt: string;
  antiSnipeEnabled: boolean;
  antiSnipeMinutes: string;
  depositEnabled: boolean;
  depositAmount: string;
  currency: string;
  onChange: (fields: Partial<{
    startAt: string;
    endAt: string;
    antiSnipeEnabled: boolean;
    antiSnipeMinutes: string;
    depositEnabled: boolean;
    depositAmount: string;
  }>) => void;
}

export function Schedule({
  startAt,
  endAt,
  antiSnipeEnabled,
  antiSnipeMinutes,
  depositEnabled,
  depositAmount,
  currency,
  onChange,
}: ScheduleProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Schedule & Rules</h2>
        <p className="mt-2 text-sm text-muted">
          Set when your auction starts and ends, and configure anti-snipe protection.
        </p>
      </div>

      {/* Start Date/Time */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="start-at" className="text-sm font-medium text-ink">
            Start Date & Time <span className="text-error">*</span>
          </label>
          <input
            id="start-at"
            type="datetime-local"
            value={startAt}
            onChange={(e) => onChange({ startAt: e.target.value })}
            className="input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="end-at" className="text-sm font-medium text-ink">
            End Date & Time <span className="text-error">*</span>
          </label>
          <input
            id="end-at"
            type="datetime-local"
            value={endAt}
            onChange={(e) => onChange({ endAt: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {/* Anti-Snipe Config */}
      <div className="rounded-lg border border-border bg-sky/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Anti-Snipe Protection</p>
            <p className="text-xs text-muted">
              Automatically extends the auction if a bid is placed in the final minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ antiSnipeEnabled: !antiSnipeEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 ${
              antiSnipeEnabled ? 'bg-orange' : 'bg-border'
            }`}
            role="switch"
            aria-checked={antiSnipeEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                antiSnipeEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {antiSnipeEnabled && (
          <div className="space-y-1.5">
            <label htmlFor="snipe-mins" className="text-xs font-medium text-muted">
              Extension window (minutes)
            </label>
            <input
              id="snipe-mins"
              type="number"
              min="1"
              max="30"
              value={antiSnipeMinutes}
              onChange={(e) => onChange({ antiSnipeMinutes: e.target.value })}
              className="input w-32"
              placeholder="5"
            />
          </div>
        )}
      </div>

      {/* Deposit Toggle */}
      <div className="rounded-lg border border-border bg-sky/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Require Deposit</p>
            <p className="text-xs text-muted">
              Bidders must place a refundable deposit before participating.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ depositEnabled: !depositEnabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 ${
              depositEnabled ? 'bg-orange' : 'bg-border'
            }`}
            role="switch"
            aria-checked={depositEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                depositEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {depositEnabled && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
              {currency}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={(e) => onChange({ depositAmount: e.target.value })}
              className="input w-48 pl-14"
              placeholder="50.00"
            />
          </div>
        )}
      </div>
    </div>
  );
}
