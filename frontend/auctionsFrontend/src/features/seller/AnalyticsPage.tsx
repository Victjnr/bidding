import { useGetSellerAnalyticsQuery } from '@/store/api/sellerApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { BarChart2, Globe, Target, Eye, Bookmark, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#0D2137', '#E8540A', '#1E3A5F', '#4A90E2', '#6B7A8D'];

export function AnalyticsPage() {
  const { data: analytics, isLoading } = useGetSellerAnalyticsQuery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Seller Analytics</h1>
        <p className="text-muted mt-1">Deep dive into your listing performance and buyer demographics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Categories Pie Chart */}
        <div className="col-span-1 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2 mb-6">
            <Target className="h-5 w-5 text-orange" /> Top Categories
          </h2>
          <div className="h-[250px] w-full">
            {isLoading ? (
              <div className="h-full w-full animate-pulse rounded-full bg-sky/50" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.topCategories ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(analytics?.topCategories ?? []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Buyer Geography */}
        <div className="col-span-1 rounded-2xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2 mb-6">
            <Globe className="h-5 w-5 text-navy" /> Buyer Geography
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-sky/50" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {analytics?.geography.map((geo) => (
                <div key={geo.code} className="flex items-center justify-between rounded-xl bg-sky/30 p-4 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {getFlagEmoji(geo.code)}
                    </span>
                    <span className="font-semibold text-ink">{geo.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-navy">{geo.count}</span>
                    <span className="text-xs text-muted">buyers</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Listing Performance Table */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-muted" /> Listing Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Listing Title</th>
                <th className="px-6 py-4 font-medium text-center" title="Total Views"><Eye className="h-4 w-4 mx-auto" /></th>
                <th className="px-6 py-4 font-medium text-center" title="Watchlist Adds"><Bookmark className="h-4 w-4 mx-auto" /></th>
                <th className="px-6 py-4 font-medium text-center" title="Unique Bidders"><Users className="h-4 w-4 mx-auto" /></th>
                <th className="px-6 py-4 font-medium text-right">Bid Velocity</th>
                <th className="px-6 py-4 font-medium text-right">Sell-Through Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted">Loading metrics...</td></tr>
              ) : analytics?.performance.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted">No performance data available.</td></tr>
              ) : (
                analytics?.performance.map((item) => (
                  <tr key={item.uuid} className="hover:bg-sky/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-ink max-w-xs truncate">{item.title}</td>
                    <td className="px-6 py-4 text-center font-semibold text-navy">{item.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-semibold text-orange">{item.watchlistAdds.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center font-semibold text-ink">{item.uniqueBidders}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-ink">{item.bidVelocity}</span> <span className="text-[10px] text-muted">bids/hr</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-sky rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", item.sellThroughRate > 50 ? "bg-success" : "bg-orange")} 
                            style={{ width: `${item.sellThroughRate}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold w-8">{item.sellThroughRate}%</span>
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

// Helper to convert ISO 3166-1 alpha-2 code to emoji flag
function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
