import type { AuctionType } from '@/types/auction';

interface PricingProps {
  auctionType: AuctionType;
  startPrice: string;
  reservePrice: string;
  reserveEnabled: boolean;
  binPrice: string;
  binEnabled: boolean;
  bidIncrement: string;
  bidIncrementType: 'fixed' | 'percentage';
  currency: string;
  onChange: (fields: Partial<{
    startPrice: string;
    reservePrice: string;
    reserveEnabled: boolean;
    binPrice: string;
    binEnabled: boolean;
    bidIncrement: string;
    bidIncrementType: 'fixed' | 'percentage';
    currency: string;
  }>) => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD'];

export function Pricing({
  auctionType,
  startPrice,
  reservePrice,
  reserveEnabled,
  binPrice,
  binEnabled,
  bidIncrement,
  bidIncrementType,
  currency,
  onChange,
}: PricingProps) {
  const showStartPrice = auctionType !== 'bin';
  const showReserve = auctionType === 'forward' || auctionType === 'live';
  const showBin = auctionType === 'forward';
  const showBidIncrement = auctionType !== 'bin' && auctionType !== 'sealed';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Set Pricing</h2>
        <p className="mt-2 text-sm text-muted">
          Configure pricing rules for your <span className="font-semibold text-orange">{auctionType}</span> auction.
        </p>
      </div>

      {/* Currency */}
      <div className="space-y-1.5">
        <label htmlFor="currency" className="text-sm font-medium text-ink">Currency</label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => onChange({ currency: e.target.value })}
          className="input"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Starting Price */}
      {showStartPrice && (
        <div className="space-y-1.5">
          <label htmlFor="start-price" className="text-sm font-medium text-ink">
            Starting Price <span className="text-error">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
              {currency}
            </span>
            <input
              id="start-price"
              type="number"
              min="0"
              step="0.01"
              value={startPrice}
              onChange={(e) => onChange({ startPrice: e.target.value })}
              className="input pl-14"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {/* BIN-only price */}
      {auctionType === 'bin' && (
        <div className="space-y-1.5">
          <label htmlFor="bin-fixed-price" className="text-sm font-medium text-ink">
            Buy It Now Price <span className="text-error">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
              {currency}
            </span>
            <input
              id="bin-fixed-price"
              type="number"
              min="0"
              step="0.01"
              value={binPrice}
              onChange={(e) => onChange({ binPrice: e.target.value })}
              className="input pl-14"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {/* Reserve Price Toggle */}
      {showReserve && (
        <div className="rounded-lg border border-border bg-sky/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Reserve Price</p>
              <p className="text-xs text-muted">Set a hidden minimum price. The item won't sell below this.</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ reserveEnabled: !reserveEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 ${
                reserveEnabled ? 'bg-orange' : 'bg-border'
              }`}
              role="switch"
              aria-checked={reserveEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  reserveEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {reserveEnabled && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                {currency}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={reservePrice}
                onChange={(e) => onChange({ reservePrice: e.target.value })}
                className="input pl-14"
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      )}

      {/* Buy It Now Toggle (for forward auctions) */}
      {showBin && (
        <div className="rounded-lg border border-border bg-sky/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Buy It Now Option</p>
              <p className="text-xs text-muted">Allow buyers to purchase immediately at a fixed price.</p>
            </div>
            <button
              type="button"
              onClick={() => onChange({ binEnabled: !binEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 ${
                binEnabled ? 'bg-orange' : 'bg-border'
              }`}
              role="switch"
              aria-checked={binEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  binEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          {binEnabled && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
                {currency}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={binPrice}
                onChange={(e) => onChange({ binPrice: e.target.value })}
                className="input pl-14"
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      )}

      {/* Bid Increment */}
      {showBidIncrement && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-ink">Bid Increment</label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="increment-type"
                checked={bidIncrementType === 'fixed'}
                onChange={() => onChange({ bidIncrementType: 'fixed' })}
                className="h-4 w-4 border-border text-orange focus:ring-orange"
              />
              <span className="text-sm text-ink">Fixed Amount</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="increment-type"
                checked={bidIncrementType === 'percentage'}
                onChange={() => onChange({ bidIncrementType: 'percentage' })}
                className="h-4 w-4 border-border text-orange focus:ring-orange"
              />
              <span className="text-sm text-ink">Percentage (%)</span>
            </label>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
              {bidIncrementType === 'fixed' ? currency : '%'}
            </span>
            <input
              type="number"
              min="0"
              step={bidIncrementType === 'fixed' ? '0.01' : '1'}
              value={bidIncrement}
              onChange={(e) => onChange({ bidIncrement: e.target.value })}
              className="input pl-14"
              placeholder={bidIncrementType === 'fixed' ? '10.00' : '5'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
