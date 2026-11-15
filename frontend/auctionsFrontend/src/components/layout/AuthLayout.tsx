import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════
   Auth Layout — login / register / 2FA pages
   ═══════════════════════════════════════════════════ */

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* ─── Left panel: brand hero ─── */}
      <div className="hidden flex-col justify-between bg-navy p-10 lg:flex lg:w-1/2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" aria-label="Upload Auctions Home">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange font-display text-xl font-bold text-white">
            U
          </div>
          <span className="font-display text-2xl font-bold text-white">
            Upload Auctions
          </span>
        </Link>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-md"
        >
          <h1 className="font-display text-4xl font-bold leading-tight text-white">
            The Modern Auction
            <span className="text-gradient-orange block">Experience</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            Real-time bidding, transparent pricing, and secure payments.
            Join thousands of buyers and sellers on the platform built for
            serious auctioneers.
          </p>
        </motion.div>

        {/* Social proof */}
        {/* <div className="flex gap-8 text-sm text-white/40">
          <div>
            <span className="block font-display text-2xl font-bold text-white">12k+</span>
            Active Users
          </div>
          <div>
            <span className="block font-display text-2xl font-bold text-white">$4.2M</span>
            Total Volume
          </div>
          <div>
            <span className="block font-display text-2xl font-bold text-white">98%</span>
            Satisfaction
          </div>
        </div> */}
      </div>

      {/* ─── Right panel: auth forms ─── */}
      <div className="flex flex-1 items-center justify-center bg-sky p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
