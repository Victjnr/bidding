import { Outlet, Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   Public Layout — landing, about, etc.
   ═══════════════════════════════════════════════════ */

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-sky">
      {/* ─── Public Navbar ─── */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Upload Auctions Home">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange to-[#FF8A50] text-white shadow-lg shadow-orange/20">
              <Gavel className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-ink">
              Upload Auctions
            </span>
          </Link>

          <nav className="flex items-center gap-4" aria-label="Public navigation">
            <Link
              to="/auth/login"
              className="btn-ghost text-sm"
            >
              Log In
            </Link>
            <Link
              to="/auth/register"
              className="btn-primary text-sm"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main role="main">
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-navy py-8 text-sm text-white/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Upload Technologies. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/support" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
