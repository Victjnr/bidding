import { useGetPayoutsQuery } from '@/store/api/paymentApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ArrowUpRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock chart data for presentation
const chartData = [
  { name: 'Week 1', gmv: 4000, commission: 200 },
  { name: 'Week 2', gmv: 3000, commission: 150 },
  { name: 'Week 3', gmv: 5500, commission: 275 },
  { name: 'Week 4', gmv: 4800, commission: 240 },
  { name: 'Week 5', gmv: 7000, commission: 350 },
  { name: 'Week 6', gmv: 9200, commission: 460 },
];

export function PayoutsPage() {
  const { data: payouts, isLoading } = useGetPayoutsQuery(1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-success/10 text-success';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500';
      case 'failed':
        return 'bg-error/10 text-error';
      default:
        return 'bg-orange/10 text-orange'; // pending
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Seller Payouts</h1>
          <p className="text-muted mt-1">Track your earnings and request bank deposits.</p>
        </div>
        <button className="btn-primary gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Request Payout
        </button>
      </div>

      {/* Chart Section */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="font-display font-semibold text-ink mb-6">Earnings vs GMV (Last 6 Weeks)</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D2137" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0D2137" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8540A" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#E8540A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBF4FD" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7A8D" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7A8D" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="gmv" name="Gross Merchandise Volume" stroke="#0D2137" fillOpacity={1} fill="url(#colorGmv)" />
              <Area type="monotone" dataKey="commission" name="Your Earnings" stroke="#E8540A" strokeWidth={3} fillOpacity={1} fill="url(#colorCommission)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="font-display font-semibold text-ink flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted" /> Payout History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink">
            <thead className="bg-sky/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Destination</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted">Loading payouts...</td>
                </tr>
              ) : payouts?.data?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted">No payouts requested yet.</td>
                </tr>
              ) : (
                payouts?.data?.map((payout) => (
                  <tr key={payout.id} className="hover:bg-sky/30 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium">
                      {format(new Date(payout.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      EcoCash / Bank ending in {payout.providerTxnId.slice(-4)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase", getStatusBadge(payout.status))}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-display font-bold">
                      ${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
