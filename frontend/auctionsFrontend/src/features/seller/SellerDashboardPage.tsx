import { useState } from 'react';
import { useGetSellerDashboardStatsQuery, useGetSellerRevenueChartQuery, useGetSellerListingsQuery } from '@/store/api/sellerApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Line, ComposedChart } from 'recharts';
import { Gavel, TrendingUp, TrendingDown, DollarSign, WalletCards, ArrowRight, Eye, Edit2, Play, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export function SellerDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetSellerDashboardStatsQuery();
  const [chartRange, setChartRange] = useState<'7D'|'30D'|'90D'>('30D');
  const { data: revenueData, isLoading: chartLoading } = useGetSellerRevenueChartQuery({ range: chartRange });
  const { data: listings, isLoading: listingsLoading } = useGetSellerListingsQuery({ page: 1, status: 'active' });

  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Seller Dashboard</h1>
        <p className="text-muted mt-1">Overview of your sales, revenue, and active listings.</p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Listings" 
          value={stats?.activeListings ?? 0} 
          trend={stats?.activeListingsTrend ?? 0} 
          icon={<Gavel className="h-5 w-5" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Bids Today" 
          value={stats?.bidsToday ?? 0} 
          trend={stats?.bidsTodayTrend ?? 0} 
          icon={<TrendingUp className="h-5 w-5" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="GMV This Month" 
          value={`$${(stats?.gmvMonth ?? 0).toLocaleString()}`} 
          trend={stats?.gmvMonthTrend ?? 0} 
          icon={<DollarSign className="h-5 w-5" />} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Pending Payouts" 
          value={`$${(stats?.pendingPayouts ?? 0).toLocaleString()}`} 
          trend={stats?.pendingPayoutsTrend ?? 0} 
          icon={<WalletCards className="h-5 w-5" />} 
          loading={statsLoading} 
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg text-ink">Revenue Overview</h2>
          <div className="flex rounded-lg bg-sky p-1">
            {['7D', '30D', '90D'].map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range as any)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  chartRange === range ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          {chartLoading ? (
            <div className="h-full w-full animate-pulse bg-sky/50 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBF4FD" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7A8D" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#6B7A8D" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#E8540A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Bar yAxisId="left" dataKey="gmv" name="GMV" fill="#0D2137" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="commission" name="Commission" stroke="#E8540A" strokeWidth={3} dot={{ r: 4, fill: '#E8540A', strokeWidth: 2, stroke: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Mini Active Listings Table */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-ink">Recent Active Listings</h2>
          <Link to="/app/seller/listings" className="text-sm font-medium text-orange hover:text-orange/80 flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Item</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Current Bid</th>
                <th className="px-6 py-4 font-medium text-right">Bids</th>
                <th className="px-6 py-4 font-medium">Ends In</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listingsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted">Loading listings...</td>
                </tr>
              ) : listings?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">No active listings found.</td>
                </tr>
              ) : (
                listings?.data?.slice(0, 5).map((auction) => (
                  <tr key={auction.uuid} className="hover:bg-sky/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={auction.media.find(m => m.isPrimary)?.cdnUrl || 'https://placehold.co/100x100/EBF4FD/6B7A8D?text=No+Image'} 
                          alt="" 
                          className="h-10 w-10 rounded-md object-cover border border-border" 
                        />
                        <p className="font-medium text-ink line-clamp-1 max-w-[200px]">{auction.title}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold uppercase text-success">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-display font-bold text-ink">
                      ${auction.currentPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-muted">
                      {auction.totalBids}
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {formatDistanceToNow(new Date(auction.endAt))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/app/auctions/${auction.uuid}`)} className="p-1.5 text-muted hover:text-navy hover:bg-sky rounded" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded" title="Cancel">
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
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

function StatCard({ title, value, trend, icon, loading }: { title: string, value: string | number, trend: number, icon: React.ReactNode, loading: boolean }) {
  return (
    <div className="rounded-2xl bg-navy p-6 text-white shadow-lg relative overflow-hidden">
      <div className="flex justify-between items-start">
        <p className="text-sky/80 font-medium tracking-wide uppercase text-sm">{title}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-4xl font-display font-bold text-orange">
        {loading ? '...' : value}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-sm">
        {loading ? null : (
          <>
            <span className={cn("flex items-center gap-0.5 font-bold", trend >= 0 ? "text-success" : "text-error")}>
              {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </span>
            <span className="text-sky/60">vs last period</span>
          </>
        )}
      </div>
    </div>
  );
}
