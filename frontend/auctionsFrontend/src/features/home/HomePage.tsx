import { useState, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Search, Gavel, Users, DollarSign, ArrowRight, Laptop, Home, Car, Shirt, Heart, Book, Coffee, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useListAuctionsQuery } from '@/store/api/auctionApi';
import { useAppSelector } from '@/hooks/useRedux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { AuctionCard } from '@/components/shared/AuctionCard';
import { GlobalSearchBar } from '@/components/layout/GlobalSearchBar';

const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', icon: <Laptop className="h-6 w-6" />, count: '2.4k+' },
  { id: 'real-estate', name: 'Real Estate', icon: <Home className="h-6 w-6" />, count: '850+' },
  { id: 'vehicles', name: 'Vehicles', icon: <Car className="h-6 w-6" />, count: '1.2k+' },
  { id: 'fashion', name: 'Fashion', icon: <Shirt className="h-6 w-6" />, count: '5k+' },
  { id: 'health-beauty', name: 'Health & Beauty', icon: <Heart className="h-6 w-6" />, count: '3.1k+' },
  { id: 'books-media', name: 'Books & Media', icon: <Book className="h-6 w-6" />, count: '10k+' },
  { id: 'home-garden', name: 'Home & Garden', icon: <Coffee className="h-6 w-6" />, count: '4.2k+' },
  { id: 'all', name: 'All Categories', icon: <Grid className="h-6 w-6" />, count: 'Browse All' },
];

function AnimatedCounter({ end, prefix = '', suffix = '', decimals = 0 }: { end: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const duration = 2000; // 2 seconds

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

export function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // Fetch a few auctions for the "Ending Soon" section
  const { data: featuredData, isLoading: isFeaturedLoading } = useListAuctionsQuery({ limit: 4, sortBy: 'ending_soonest' });
  const { data: trendingData, isLoading: isTrendingLoading } = useListAuctionsQuery({ limit: 8, sortBy: 'bids_desc' });
  const { data: endingData, isLoading: isEndingLoading } = useListAuctionsQuery({ limit: 4, sortBy: 'ending_soonest' });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-navy px-6 py-20 text-center sm:px-12 sm:py-32">
        {/* Hexagonal Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}
        />
        
        <div className="relative z-10 mx-auto max-w-3xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Bid Smarter. <span className="text-orange">Win More.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-sky/80 sm:text-xl">
              Discover unique items, place real-time bids, and experience the thrill of the auction on Upload Auctions.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/20 shadow-2xl">
              <GlobalSearchBar />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <section className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm border border-border">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 text-orange">
              <Gavel className="h-6 w-6" />
            </div>
            <h3 className="font-display text-3xl font-bold text-ink">
              <AnimatedCounter end={2847} />
            </h3>
            <p className="text-sm font-medium text-muted uppercase tracking-wider mt-1">Active Auctions</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm border border-border">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-navy">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-display text-3xl font-bold text-ink">
              <AnimatedCounter end={14312} />
            </h3>
            <p className="text-sm font-medium text-muted uppercase tracking-wider mt-1">Registered Bidders</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm border border-border">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="font-display text-3xl font-bold text-ink">
              <AnimatedCounter end={4.2} prefix="$" suffix="M" decimals={1} />
            </h3>
            <p className="text-sm font-medium text-muted uppercase tracking-wider mt-1">Bids Today</p>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Explore Categories</h2>
            <p className="text-muted mt-1">Find exactly what you're looking for.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/app/search?category=${category.id}`)}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-orange/50 hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky text-navy transition-colors group-hover:bg-orange group-hover:text-white">
                {category.icon}
              </div>
              <div>
                <h3 className="font-semibold text-ink group-hover:text-orange transition-colors">{category.name}</h3>
                <p className="text-xs text-muted">{category.count}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Auctions */}
      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
              Featured Right Now <span className="flex h-2 w-2 rounded-full bg-orange animate-pulse" />
            </h2>
          </div>
          <button onClick={() => navigate('/app/search?featured=true')} className="hidden sm:flex text-sm font-medium text-orange hover:text-orange/80 items-center gap-1 transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
          {featuredData?.data?.map((auction: any) => (
            <div key={auction.uuid} className="w-[280px] shrink-0 snap-start sm:w-auto">
              <AuctionCard auction={auction} variant="grid" />
            </div>
          ))}
        </div>
      </section>

      {/* Ending Soon */}
      <section className="rounded-3xl bg-orange/5 p-8 border border-orange/10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Ending Soon</h2>
            <p className="text-muted mt-1">Don't miss out on these final minutes.</p>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {endingData?.data?.map((auction: any) => (
            <AuctionCard key={auction.uuid} auction={auction} variant="list" />
          ))}
        </div>
      </section>

      {/* Recommendations (Auth Only) */}
      {isAuthenticated && (
        <section>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">Recommended For You</h2>
              <p className="text-muted mt-1">Based on your bidding history and saved searches.</p>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {endingData?.data?.slice(0, 3).map((auction: any) => ( // Reusing data for demo
              <div key={`rec-${auction.uuid}`} className="w-[300px] shrink-0 snap-start">
                <AuctionCard auction={auction} variant="grid" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
