import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuctionMedia } from '@/types/auction';

export function ImageGallery({ media }: { media: AuctionMedia[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!media || media.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-sky text-muted">
        No media available
      </div>
    );
  }

  const selectedMedia = media[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-sky border border-border">
        {selectedMedia.type === 'video' ? (
          <video
            src={selectedMedia.cdnUrl}
            controls
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={selectedMedia.cdnUrl}
            alt="Auction item main view"
            className="h-full w-full object-contain cursor-zoom-in"
            onClick={() => setIsFullscreen(true)}
          />
        )}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-ink opacity-0 shadow-sm backdrop-blur transition-all group-hover:opacity-100 hover:bg-white focus:outline-none focus:ring-2 focus:ring-orange focus:opacity-100"
          aria-label="View fullscreen"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      {media.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus:outline-none",
                index === selectedIndex
                  ? "border-orange ring-2 ring-orange/20 ring-offset-1"
                  : "border-transparent hover:border-orange/50"
              )}
            >
              {item.type === 'video' ? (
                <div className="flex h-full w-full items-center justify-center bg-navy text-white text-xs font-bold">
                  VIDEO
                </div>
              ) : (
                <img src={item.cdnUrl} alt={`Thumbnail ${index + 1}`} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-12"
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={selectedMedia.cdnUrl}
              alt="Fullscreen view"
              className="max-h-full max-w-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
