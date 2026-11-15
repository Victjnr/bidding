import { TrendingUp, TrendingDown, Gavel, Users, Zap, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import {
  useGetAdminDashboardStatsQuery,
  useGetAdminRevenueChartQuery,
  useGetAdminRegistrationsQuery,
  useGetAdminBidVelocityQuery,
} from '@/store/api/adminApi';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data: stats } = useGetAdminDashboardStatsQuery(undefined, { pollingInterval: 5000 });
  const { data: revenueData } = useGetAdminRevenueChartQuery();
  const { data: regData } = useGetAdminRegistrationsQuery();
  const { data: velocityData } = useGetAdminBidVelocityQuery(undefined, { pollingInterval: 5000 });

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-white/40 mt-1 text-sm sm:text-base">Real-time platform health and operations overview.</p>
      </div>

      {/* Live Stats Strip */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <LiveStatCard title="Active Auctions" value={stats?.activeAuctions ?? 0} trend={stats?.activeAuctionsTrend ?? 0} icon={<Gavel className="h-5 w-5" />} />
        <LiveStatCard title="Live Bidders" value={stats?.liveBidders ?? 0} trend={stats?.liveBiddersTrend ?? 0} icon={<Users className="h-5 w-5" />} />
        <LiveStatCard title="Bids / Min" value={stats?.bidsPerMinute ?? 0} trend={stats?.bidsPerMinuteTrend ?? 0} icon={<Zap className="h-5 w-5" />} />
        <LiveStatCard title="Pending KYC" value={stats?.pendingKyc ?? 0} trend={stats?.pendingKycTrend ?? 0} icon={<ShieldCheck className="h-5 w-5" />} />
        <LiveStatCard title="Open Disputes" value={stats?.openDisputes ?? 0} trend={stats?.openDisputesTrend ?? 0} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Revenue Panel */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/5 bg-[#0A1628] p-4 sm:p-6">
          <h2 className="font-display font-bold text-base sm:text-lg text-white mb-4 sm:mb-6">30-Day Revenue</h2>
          <div className="h-[200px] sm:h-[250px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D2137" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0D2137" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8540A" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#E8540A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                <Area type="monotone" dataKey="gmv" name="GMV" stroke="#1E3A5F" fill="url(#gmvGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="commission" name="Commission" stroke="#E8540A" fill="url(#commGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bid Velocity Sparkline + User Growth */}
        <div className="col-span-1 flex flex-col gap-4 sm:gap-6">
          <div className="flex-1 rounded-2xl border border-white/5 bg-[#0A1628] p-4 sm:p-6">
            <h2 className="font-display font-bold text-xs sm:text-sm text-white/60 uppercase tracking-wider mb-3 sm:mb-4">Bid Velocity (60s)</h2>
            <div className="h-[100px] sm:h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityData ?? []}>
                  <Line type="monotone" dataKey="value" stroke="#E8540A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-white/5 bg-[#0A1628] p-4 sm:p-6">
            <h2 className="font-display font-bold text-xs sm:text-sm text-white/60 uppercase tracking-wider mb-3 sm:mb-4">Daily Registrations</h2>
            <div className="h-[100px] sm:h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regData ?? []}>
                  <Bar dataKey="count" fill="#1E3A5F" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <QuickActionCard
          title="Pending Auctions"
          count={stats?.pendingAuctions ?? 0}
          description="Auctions awaiting moderator review"
          linkTo="/app/admin/auctions"
          color="orange"
        />
        <QuickActionCard
          title="KYC Documents"
          count={stats?.pendingKyc ?? 0}
          description="Identity documents to verify"
          linkTo="/app/admin/kyc"
          color="sky"
        />
        <QuickActionCard
          title="Open Disputes"
          count={stats?.openDisputes ?? 0}
          description="Disputes requiring resolution"
          linkTo="/app/admin/auctions"
          color="error"
        />
      </div>
    </div>
  );
}

function LiveStatCard({ title, value, trend, icon }: { title: string; value: number; trend: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0A1628] p-3 sm:p-5 relative overflow-hidden">
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/30 line-clamp-1">{title}</p>
        <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full bg-white/5 text-white/40 flex-shrink-0 ml-2">
          <span className="text-sm sm:text-base">{icon}</span>
        </div>
      </div>
      <div className="font-display text-2xl sm:text-3xl font-bold text-white">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 flex items-center gap-0.5 sm:gap-1.5 text-xs">
        <span className={cn("flex items-center gap-0.5 font-bold flex-shrink-0", trend >= 0 ? "text-emerald-400" : "text-red-400")}>
          {trend >= 0 ? <TrendingUp className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> : <TrendingDown className="h-2.5 sm:h-3 w-2.5 sm:w-3" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-white/20 hidden sm:inline whitespace-nowrap">vs last period</span>
      </div>
      {/* Live pulse indicator */}
      <div className="absolute top-3 sm:top-5 right-10 sm:right-14 flex items-center gap-1">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[8px] sm:text-[9px] font-medium text-emerald-400/70 uppercase hidden sm:inline">Live</span>
      </div>
    </div>
  );
}

function QuickActionCard({ title, count, description, linkTo, color }: { title: string; count: number; description: string; linkTo: string; color: string }) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange/10 text-orange border-orange/20',
    sky: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
    error: 'bg-red-400/10 text-red-400 border-red-400/20',
  };

  return (
    <Link to={linkTo} className={cn("group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border p-4 sm:p-5 transition-all hover:scale-[1.02] gap-3 sm:gap-0", colorMap[color] ?? colorMap.orange)}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display text-xl sm:text-2xl font-bold">{count}</span>
          <span className="text-xs sm:text-sm font-medium opacity-70">{title}</span>
        </div>
        <p className="text-xs opacity-50 line-clamp-1">{description}</p>
      </div>
      <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0 self-start sm:self-auto" />
    </Link>
  );
}
