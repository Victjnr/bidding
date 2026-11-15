import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Gavel, Users, DollarSign, Shield, Zap, ArrowRight,
  Laptop, Home, Car, Shirt, Heart, Book, Coffee, Grid,
  Clock, TrendingUp, Award, CheckCircle, Star
} from 'lucide-react';
import { useGetCategoriesQuery, useListAuctionsQuery, useGetLandingStatsQuery } from '@/store/api/auctionApi';
import { AuctionGrid } from '@/features/auctions/components/AuctionGrid';
import { AuctionDetailsModal } from '@/features/auctions/components/AuctionDetailsModal';

/* ═══════════════════════════════════════════════════
   Public Landing Page — visible to all visitors
   ═══════════════════════════════════════════════════ */

function AnimatedCounter({ end, prefix = '', suffix = '', decimals = 0 }: { end: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const duration = 2000;
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const progress = (time - startTime) / duration;
        if (progress < 1) {
          setCount(end * progress);
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

// Categories are now fetched dynamically from the API

const HOW_IT_WORKS = [
  {
    icon: <Users className="h-7 w-7" />,
    title: 'Create Account',
    description: 'Sign up in seconds with email verification and start bidding immediately.',
  },
  {
    icon: <Gavel className="h-7 w-7" />,
    title: 'Place Your Bid',
    description: 'Browse thousands of items and place competitive bids in real-time with live updates.',
  },
  {
    icon: <Award className="h-7 w-7" />,
    title: 'Win & Pay',
    description: 'Win auctions and complete secure transactions with verified buyers and sellers.',
  },
];



const ICONS_MAP: Record<string, React.ReactNode> = {
  laptop: <Laptop className="h-6 w-6" />,
  home: <Home className="h-6 w-6" />,
  car: <Car className="h-6 w-6" />,
  shirt: <Shirt className="h-6 w-6" />,
  heart: <Heart className="h-6 w-6" />,
  book: <Book className="h-6 w-6" />,
  coffee: <Coffee className="h-6 w-6" />,
  grid: <Grid className="h-6 w-6" />,
};

export default function LandingPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);

  const { data: categoryData, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const dynamicCategories = categoryData?.data || [];

  const { data: auctionsData, isLoading: auctionsLoading } = useListAuctionsQuery({
    page: 1,
    per_page: 8,
    ...(selectedCategoryId ? { 'filter[category_id]': selectedCategoryId } : {}),
    'filter[status]': 'active'
  });

  const { data: statsData } = useGetLandingStatsQuery();
  const stats = statsData?.data || {
    active_auctions: 0,
    registered_bidders: 0,
    bids_today: 0
  };

  return (
    <div className="overflow-hidden">
      <AuctionDetailsModal
        auctionId={selectedAuctionId}
        isOpen={!!selectedAuctionId}
        onClose={() => setSelectedAuctionId(null)}
      />

      {/* ═══ Hero Section ═══ */}
      <section className="relative bg-navy px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 h-80 w-80 rounded-full bg-orange/20 blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 h-60 w-60 rounded-full bg-orange/10 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange/10 px-4 py-1.5 text-sm font-semibold text-orange border border-orange/20">
              <Zap className="h-3.5 w-3.5" /> Live Auctions Happening Now
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-white sm:text-7xl leading-[1.1]">
              Bid Smarter.{' '}
              <span className="bg-gradient-to-r from-orange to-[#FF8A50] bg-clip-text text-transparent">
                Win More.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 sm:text-xl leading-relaxed">
              Discover unique items, place real-time bids, and experience the thrill of winning
              on Upload Auctions — the modern bidding platform built for speed and trust.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              to="/auth/register"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold shadow-lg shadow-orange/30 hover:shadow-orange/50 transition-all"
            >
              Start Bidding Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all"
            >
              Log In
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-400" /> Secure Payments
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-400" /> Verified Sellers
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-orange" /> Real-Time Bids
            </span>
          </motion.div>
        </div>
      </section>

      {/* ═══ Live Stats Strip ═══ */}
      <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: <Gavel className="h-6 w-6" />, value: stats.active_auctions, label: 'Active Auctions', color: 'orange' },
              { icon: <Users className="h-6 w-6" />, value: stats.registered_bidders, label: 'Registered Bidders', color: 'navy' },
              { icon: <DollarSign className="h-6 w-6" />, value: stats.bids_today, label: 'Bids Today', color: 'success', prefix: '$', suffix: '', decimals: 2 },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-xl border border-border"
              >
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-${stat.color}/10 text-${stat.color}`}>
                  {stat.icon}
                </div>
                <h3 className="font-display text-3xl font-bold text-ink">
                  <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} />
                </h3>
                <p className="text-sm font-medium text-muted uppercase tracking-wider mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Category Grid ═══ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Explore Categories</h2>
            <p className="mt-3 text-lg text-muted">Find exactly what you're looking for across thousands of listings.</p>
          </motion.div>

          {categoriesLoading ? (
             <div className="flex justify-center p-10"><Zap className="animate-pulse text-orange h-10 w-10" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {dynamicCategories.map((category: any, i: number) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => {
                      setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id);
                    }}
                    className={`group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-orange/50 hover:shadow-lg ${selectedCategoryId === category.id ? 'border-orange ring-1 ring-orange' : 'border-border'}`}
                  >
                    <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${selectedCategoryId === category.id ? 'bg-orange text-white' : 'bg-sky text-navy group-hover:bg-orange group-hover:text-white'}`}>
                      {ICONS_MAP[category.icon] || <Grid className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink group-hover:text-orange transition-colors">{category.name}</h3>
                      <p className="text-xs text-muted">Browse</p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ Public Auctions Grid ═══ */}
      <section className="px-4 py-10 sm:px-6 lg:px-8 bg-sky/30">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              {selectedCategoryId ? 'Category Auctions' : 'Active Auctions'}
            </h2>
          </motion.div>

          <AuctionGrid
            auctions={auctionsData?.data || []}
            isLoading={auctionsLoading}
            isFetchingNextPage={false}
            hasNextPage={false}
            fetchNextPage={() => {}}
            viewMode="grid"
            onClick={(auction) => setSelectedAuctionId(auction.uuid)}
          />
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="bg-navy/[0.03] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-lg text-muted">Get started in three simple steps.</p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step number */}
                <div className="absolute -top-3 right-4 font-display text-[5rem] font-black text-orange/[0.06] leading-none select-none">
                  {i + 1}
                </div>
                <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange to-[#FF8A50] text-white shadow-lg shadow-orange/20">
                  {step.icon}
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-ink">{step.title}</h3>
                <p className="text-muted leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Features Grid ═══ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">Why Choose Upload Auctions?</h2>
            <p className="mt-3 text-lg text-muted">Built with modern technology for the ultimate bidding experience.</p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Zap />, title: 'Real-Time Bidding', desc: 'Live updates powered by WebSocket — see bids the instant they happen.' },
              { icon: <Shield />, title: 'Secure Transactions', desc: 'Safe, transparent bidding with verified buyer and seller profiles.' },
              { icon: <TrendingUp />, title: 'Smart Analytics', desc: 'Sellers get detailed dashboards with bid analytics, conversion rates, and revenue tracking.' },
              { icon: <Clock />, title: 'Anti-Snipe Protection', desc: 'Automatic bid extension prevents last-second sniping and ensures fair auction outcomes.' },
              { icon: <Users />, title: 'Trusted Community', desc: 'Connect with verified members committed to fair, transparent auctions.' },
              { icon: <Award />, title: 'Seller Tools', desc: 'Professional listing wizard, bulk uploads, scheduled auctions, and reserve price management.' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange/10 text-orange">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-display text-lg font-bold text-ink">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* ═══ Final CTA ═══ */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A1628] to-navy px-8 py-16 text-center sm:px-16"
          >
            {/* Decorative orb */}
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-orange/20 blur-[80px]" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-orange/10 blur-[60px]" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Ready to Start Bidding?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
                Join thousands of buyers and sellers on Upload Auctions. Create your free account today
                and discover amazing deals.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  to="/auth/register"
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold shadow-lg shadow-orange/30"
                >
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/auth/login"
                  className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                >
                  Already have an account? Log in →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
