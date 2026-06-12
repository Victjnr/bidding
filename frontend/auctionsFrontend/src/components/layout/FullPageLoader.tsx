import { Gavel } from 'lucide-react';

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-sky/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings */}
        <div className="absolute h-24 w-24 animate-ping rounded-full border-2 border-orange opacity-20"></div>
        <div className="absolute h-32 w-32 animate-ping rounded-full border-2 border-orange/50 opacity-20" style={{ animationDelay: '0.2s' }}></div>
        
        {/* Logo */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-navy shadow-xl">
          <Gavel className="h-8 w-8 text-orange" />
        </div>
      </div>
      <p className="mt-6 font-display text-lg font-bold text-navy animate-pulse">
        Loading Upload Auctions...
      </p>
    </div>
  );
}
