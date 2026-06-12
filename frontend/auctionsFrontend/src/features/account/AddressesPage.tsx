import { useState } from 'react';
import { useGetAddressesQuery, useAddAddressMutation, useDeleteAddressMutation, useSetDefaultAddressMutation } from '@/store/api/accountApi';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

export default function AddressesPage() {
  const { data: addresses, isLoading } = useGetAddressesQuery();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefault] = useSetDefaultAddressMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  
  const [form, setForm] = useState({
    type: 'shipping' as 'shipping' | 'billing',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addAddress({ ...form, isDefault: false }).unwrap();
    setIsModalOpen(false);
    setForm({ type: 'shipping', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'United States' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Saved Addresses</h2>
          <p className="text-sm text-muted mt-1">Manage your shipping and billing addresses.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" /> Add Address
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-sky/50" />)
        ) : addresses?.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border-2 border-dashed border-border bg-sky/20">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="font-medium text-ink">No addresses saved</p>
            <p className="text-sm text-muted mt-1">Add an address for faster checkout.</p>
          </div>
        ) : (
          addresses?.map(addr => (
            <div key={addr.id} className={cn("relative flex flex-col rounded-xl border p-5 transition-all", addr.isDefault ? "border-orange bg-orange/5 shadow-md shadow-orange/10" : "border-border bg-white shadow-sm")}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {addr.type === 'shipping' ? <Truck className="h-5 w-5 text-navy" /> : <Home className="h-5 w-5 text-navy" />}
                  <span className="font-bold uppercase tracking-wider text-xs text-ink">{addr.type}</span>
                </div>
                {addr.isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange">
                    <CheckCircle2 className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
              
              <div className="text-sm text-muted space-y-0.5 flex-1">
                <p className="font-medium text-ink">{addr.line1}</p>
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                <p>{addr.country}</p>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-border flex justify-between">
                {!addr.isDefault ? (
                  <button onClick={() => setDefault({ uuid: addr.uuid, type: addr.type })} className="text-xs font-medium text-orange hover:underline">Set as Default</button>
                ) : <span />}
                <button onClick={() => deleteAddress(addr.uuid)} className="text-xs font-medium text-error hover:underline flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Address Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-dark/40 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <Dialog.Title className="font-display text-xl font-bold text-ink">Add New Address</Dialog.Title>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="flex gap-2 p-1 bg-sky rounded-lg mb-4">
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'shipping' }))} className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", form.type === 'shipping' ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>Shipping</button>
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'billing' }))} className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", form.type === 'billing' ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink")}>Billing</button>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Street Address</label>
                <input type="text" required value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} className="input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink">Apt, Suite, etc. (Optional)</label>
                <input type="text" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">City</label>
                  <input type="text" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">State / Province</label>
                  <input type="text" required value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Postal Code</label>
                  <input type="text" required value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} className="input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-ink">Country</label>
                  <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="input bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7A8D%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 appearance-none">
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <Dialog.Close asChild><button type="button" className="btn-outline border-transparent">Cancel</button></Dialog.Close>
                <button type="submit" disabled={isAdding} className="btn-primary">{isAdding ? 'Saving...' : 'Save Address'}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
