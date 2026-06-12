import { z } from 'zod';

/* ═══════════════════════════════════════════════════
   Auction Schemas — create, update, search filters
   ═══════════════════════════════════════════════════ */

export const createAuctionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be under 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be under 5000 characters'),
  category_id: z
    .string()
    .min(1, 'Please select a category'),
  type: z.enum(['english', 'dutch', 'sealed', 'buy_now'], {
    required_error: 'Please select an auction type',
  }),
  starting_price: z
    .number({ required_error: 'Starting price is required' })
    .positive('Starting price must be greater than 0'),
  reserve_price: z
    .number()
    .positive('Reserve price must be greater than 0')
    .nullable()
    .optional(),
  buy_now_price: z
    .number()
    .positive('Buy Now price must be greater than 0')
    .nullable()
    .optional(),
  bid_increment: z
    .number({ required_error: 'Bid increment is required' })
    .positive('Bid increment must be greater than 0'),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  starts_at: z.string().min(1, 'Start date is required'),
  ends_at: z.string().min(1, 'End date is required'),
});

export type CreateAuctionFormValues = z.infer<typeof createAuctionSchema>;

export const placeBidSchema = z.object({
  auction_id: z.string().min(1),
  amount: z
    .number({ required_error: 'Bid amount is required' })
    .positive('Bid amount must be greater than 0'),
  max_amount: z
    .number()
    .positive('Max bid must be greater than 0')
    .optional(),
  type: z.enum(['manual', 'proxy', 'auto']).default('manual'),
});

export type PlaceBidFormValues = z.infer<typeof placeBidSchema>;

export const auctionFiltersSchema = z.object({
  query: z.string().optional(),
  category_id: z.string().optional(),
  status: z.array(z.enum(['draft', 'pending_review', 'scheduled', 'live', 'ended', 'sold', 'cancelled', 'unsold'])).optional(),
  type: z.array(z.enum(['english', 'dutch', 'sealed', 'buy_now'])).optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().positive().optional(),
  sort_by: z.enum(['ending_soon', 'newly_listed', 'price_low', 'price_high', 'most_bids']).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().max(100).optional(),
});

export type AuctionFiltersFormValues = z.infer<typeof auctionFiltersSchema>;
