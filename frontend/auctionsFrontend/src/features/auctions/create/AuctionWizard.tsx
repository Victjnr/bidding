import { useReducer, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { TypeSelector } from './steps/TypeSelector';
import { ItemDetails } from './steps/ItemDetails';
import { MediaUpload, type MediaItem } from './steps/MediaUpload';
import { Pricing } from './steps/Pricing';
import { Schedule } from './steps/Schedule';
import { ReviewSubmit } from './steps/ReviewSubmit';
import { useCreateAuctionMutation, useSubmitForReviewMutation, useUploadMediaMutation } from '@/store/api/auctionApi';
import toast from 'react-hot-toast';
import type { AuctionType } from '@/types/auction';

/* ═══════════════════════════════════════════════════
   Wizard State
   ═══════════════════════════════════════════════════ */

interface WizardState {
  currentStep: number;
  completedSteps: number[];
  // Step 1
  auctionType: AuctionType | null;
  // Step 2
  title: string;
  description: string;
  category: string;
  condition: string;
  location: string;
  // Step 3
  media: MediaItem[];
  // Step 4
  startPrice: string;
  reservePrice: string;
  reserveEnabled: boolean;
  binPrice: string;
  binEnabled: boolean;
  bidIncrement: string;
  bidIncrementType: 'fixed' | 'percentage';
  currency: string;
  // Step 5
  startAt: string;
  endAt: string;
  antiSnipeEnabled: boolean;
  antiSnipeMinutes: string;
  depositEnabled: boolean;
  depositAmount: string;
}

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'COMPLETE_STEP'; step: number }
  | { type: 'UPDATE_FIELDS'; fields: Partial<WizardState> }
  | { type: 'RESET' };

const SESSION_KEY = 'upload_auctions_create_wizard';

function getInitialState(): WizardState {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Media items can't survive serialisation (File objects), strip them
      return { ...parsed, media: [] };
    }
  } catch {
    // Corrupted storage, ignore
  }

  return {
    currentStep: 1,
    completedSteps: [],
    auctionType: null,
    title: '',
    description: '',
    category: '',
    condition: '',
    location: '',
    media: [],
    startPrice: '',
    reservePrice: '',
    reserveEnabled: false,
    binPrice: '',
    binEnabled: false,
    bidIncrement: '',
    bidIncrementType: 'fixed',
    currency: 'USD',
    startAt: '',
    endAt: '',
    antiSnipeEnabled: true,
    antiSnipeMinutes: '5',
    depositEnabled: false,
    depositAmount: '',
  };
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'COMPLETE_STEP':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.step)
          ? state.completedSteps
          : [...state.completedSteps, action.step],
      };
    case 'UPDATE_FIELDS':
      return { ...state, ...action.fields };
    case 'RESET':
      return getInitialState();
    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════════
   Wizard Component
   ═══════════════════════════════════════════════════ */

export default function AuctionWizard() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createAuction] = useCreateAuctionMutation();
  const [submitForReview] = useSubmitForReviewMutation();
  const [uploadMedia] = useUploadMediaMutation();

  // Persist to sessionStorage on every change (excluding media/File objects)
  useEffect(() => {
    const { media, ...serialisable } = state;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(serialisable));
  }, [state]);

  const updateFields = useCallback(
    (fields: Partial<WizardState>) => dispatch({ type: 'UPDATE_FIELDS', fields }),
    [],
  );

  const goToStep = useCallback((step: number) => dispatch({ type: 'SET_STEP', step }), []);

  const handleNext = () => {
    dispatch({ type: 'COMPLETE_STEP', step: state.currentStep });
    dispatch({ type: 'SET_STEP', step: Math.min(state.currentStep + 1, 6) });
  };

  const handlePrev = () => {
    dispatch({ type: 'SET_STEP', step: Math.max(state.currentStep - 1, 1) });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        auction_type: state.auctionType,
        title: state.title,
        description: state.description,
        category_id: Number(state.category),
        condition: state.condition,
        location_city: state.location.split(',')[0]?.trim() || state.location,
        location_country: 'ZW', // Simplified for prototype
        start_price: Number(state.startPrice) || 0,
        currency_code: state.currency,
        start_at: state.startAt,
        end_at: state.endAt,
      };

      if (state.reserveEnabled) payload.reserve_price = Number(state.reservePrice);
      if (state.binEnabled || state.auctionType === 'bin') payload.bin_price = Number(state.binPrice);

      payload.bid_increment_type = state.bidIncrementType === 'percentage' ? 'percentage' : 'static';
      payload.bid_increment_value = Number(state.bidIncrement) || 0;

      payload.anti_snipe_minutes = state.antiSnipeEnabled ? Number(state.antiSnipeMinutes) : 0;
      payload.anti_snipe_extend_minutes = state.antiSnipeEnabled ? Number(state.antiSnipeMinutes) : 0;
      payload.max_extension_minutes = 60; // default
      payload.deposit_required = state.depositEnabled;
      if (state.depositEnabled) payload.deposit_amount = Number(state.depositAmount);

      const auction = await createAuction(payload as any).unwrap();

      // Upload media if present
      if (state.media.length > 0) {
        const formData = new FormData();
        let hasFiles = false;
        state.media.forEach((m) => {
          if (m.file) {
            formData.append('files[]', m.file);
            hasFiles = true;
          }
        });

        if (hasFiles) {
          await uploadMedia({ uuid: auction.uuid, files: formData }).unwrap();
        }
      }

      await submitForReview(auction.uuid).unwrap();

      sessionStorage.removeItem(SESSION_KEY);
      toast.success('Auction submitted for review! An administrator will review your listing.');
      navigate(`/app/auctions/${auction.uuid}`, { replace: true });
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to submit auction. Please check your details and try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    switch (state.currentStep) {
      case 1:
        return state.auctionType !== null;
      case 2:
        return (
          state.title.trim().length > 0 &&
          state.condition !== '' &&
          state.category !== '' &&
          state.location.trim().length > 0
        );
      case 3:
        return true; // Media is optional
      case 4:
        if (state.auctionType === 'bin') return state.binPrice !== '';
        return state.startPrice !== '';
      case 5:
        return state.startAt !== '' && state.endAt !== '';
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <TypeSelector
            selected={state.auctionType}
            onSelect={(type) => updateFields({ auctionType: type })}
          />
        );
      case 2:
        return (
          <ItemDetails
            title={state.title}
            description={state.description}
            category={state.category}
            condition={state.condition}
            location={state.location}
            onChange={updateFields}
          />
        );
      case 3:
        return (
          <MediaUpload
            items={state.media}
            onChange={(media) => updateFields({ media })}
          />
        );
      case 4:
        return (
          <Pricing
            auctionType={state.auctionType!}
            startPrice={state.startPrice}
            reservePrice={state.reservePrice}
            reserveEnabled={state.reserveEnabled}
            binPrice={state.binPrice}
            binEnabled={state.binEnabled}
            bidIncrement={state.bidIncrement}
            bidIncrementType={state.bidIncrementType}
            currency={state.currency}
            onChange={updateFields}
          />
        );
      case 5:
        return (
          <Schedule
            startAt={state.startAt}
            endAt={state.endAt}
            antiSnipeEnabled={state.antiSnipeEnabled}
            antiSnipeMinutes={state.antiSnipeMinutes}
            depositEnabled={state.depositEnabled}
            depositAmount={state.depositAmount}
            currency={state.currency}
            onChange={updateFields}
          />
        );
      case 6:
        return (
          <ReviewSubmit
            wizardState={state}
            onGoToStep={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Create Auction</h1>
        <p className="mt-1 text-sm text-muted">Step {state.currentStep} of 6</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-10">
        <StepIndicator
          currentStep={state.currentStep}
          onStepClick={goToStep}
          completedSteps={state.completedSteps}
        />
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {state.currentStep < 6 && (
        <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
          <button
            type="button"
            onClick={handlePrev}
            disabled={state.currentStep === 1}
            className="btn-outline gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {state.currentStep === 5 ? 'Review' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
