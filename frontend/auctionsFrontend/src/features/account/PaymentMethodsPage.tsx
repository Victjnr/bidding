import { useState } from 'react';
import { Plus, CreditCard, Smartphone, CheckCircle2, Trash2, ShieldCheck } from 'lucide-react';
import { useListPaymentMethodsQuery, useAttachPaymentMethodMutation, useDeletePaymentMethodMutation } from '@/store/api/paymentApi';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

export default function PaymentMethodsPage() {
  const { data: methods, isLoading } = useListPaymentMethodsQuery();
  const [setDefaultMethod] = useAttachPaymentMethodMutation();
  const [deleteMethod] = useDeletePaymentMethodMutation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Paynow integration mock state for adding a method
  const [paynowType, setPaynowType] = useState<'ecocash' | 'card'>('ecocash');
  const [ecocashNumber, setEcocashNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    // In a real Paynow integration, this would initiate a verification/authorization request
    setTimeout(() => {
      setIsAdding(false);
      setIsAddModalOpen(false);
      // invalidate payment methods tag in real app
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Payment Methods</h2>
          <p className="text-sm text-muted mt-1">Manage your saved Ecocash numbers and cards securely via Paynow.</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" /> Add Method
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-sky/50" />)
        ) : methods?.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border-2 border-dashed border-border bg-sky/20">
            <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="font-medium text-ink">No payment methods saved</p>
            <p className="text-sm text-muted mt-1">Add a method to easily pay for winning bids.</p>
          </div>
        ) : (
          methods?.map((method: any) => (
            <div key={method.id} className={cn("relative flex flex-col rounded-xl border p-5 transition-all", method.isDefault ? "border-orange bg-orange/5 shadow-md shadow-orange/10" : "border-border bg-white shadow-sm")}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex h-10 w-14 items-center justify-center rounded bg-sky">
                  {method.provider === 'ecocash' ? <Smartphone className="h-6 w-6 text-emerald-500" /> : <CreditCard className="h-6 w-6 text-navy" />}
                </div>
                {method.isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange">
                    <CheckCircle2 className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
              
              <div className="mt-auto">
                <p className="font-medium text-ink">
                  {method.provider === 'ecocash' ? 'EcoCash' : method.cardBrand}
                </p>
                <p className="text-sm font-mono text-muted mt-0.5">
                  •••• {method.lastFour}
                </p>
                {method.expMonth && (
                  <p className="text-xs text-muted mt-1">Expires {method.expMonth}/{method.expYear}</p>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!method.isDefault && (
                  <button className="rounded p-1.5 text-muted hover:bg-sky hover:text-ink">Set Default</button>
                )}
                <button onClick={() => deleteMethod(method.id)} className="rounded p-1.5 text-error/60 hover:bg-error/10 hover:text-error" title="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {/* Ensure actions are visible on touch devices / always show small button if not default */}
              {!method.isDefault && (
                <div className="mt-4 pt-4 border-t border-border flex justify-between">
                  <button className="text-xs font-medium text-orange hover:underline">Set as Default</button>
                  <button onClick={() => deleteMethod(method.id)} className="text-xs font-medium text-error hover:underline">Remove</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg bg-sky/50 p-4 flex gap-3 text-sm text-muted">
        <ShieldCheck className="h-5 w-5 text-navy shrink-0" />
        <p>Your payment information is securely processed by <strong>Paynow</strong>. We never store your full card numbers or mobile money PINs on our servers.</p>
      </div>

      {/* Add Method Modal (Paynow specific) */}
      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-dark/40 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <Dialog.Title className="font-display text-xl font-bold text-ink">Add Payment Method</Dialog.Title>
            <Dialog.Description className="text-sm text-muted mt-1 mb-6">Select a Paynow supported provider.</Dialog.Description>
            
            <form onSubmit={handleAddMethod} className="space-y-6">
              <div className="flex gap-2 p-1 bg-sky rounded-lg">
                <button type="button" onClick={() => setPaynowType('ecocash')} className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", paynowType === 'ecocash' ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>EcoCash</button>
                <button type="button" onClick={() => setPaynowType('card')} className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", paynowType === 'card' ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>Credit / Debit</button>
              </div>

              {paynowType === 'ecocash' ? (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-right-4">
                  <label className="text-sm font-medium text-ink">EcoCash Number</label>
                  <input type="tel" required value={ecocashNumber} onChange={e => setEcocashNumber(e.target.value)} placeholder="077X XXX XXX" className="input" />
                  <p className="text-[10px] text-muted mt-1">A verification prompt will be sent to this phone.</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink">Cardholder Name</label>
                    <input type="text" required className="input" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink">Card Number</label>
                    <input type="text" required placeholder="0000 0000 0000 0000" className="input font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-ink">Expiry</label>
                      <input type="text" required placeholder="MM/YY" className="input font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-ink">CVV</label>
                      <input type="text" required placeholder="123" className="input font-mono" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Dialog.Close asChild><button type="button" className="btn-outline border-transparent">Cancel</button></Dialog.Close>
                <button type="submit" disabled={isAdding} className="btn-primary">{isAdding ? 'Processing...' : 'Save Method'}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
