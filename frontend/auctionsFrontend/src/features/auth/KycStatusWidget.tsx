import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, FileText, Fingerprint, UploadCloud, CheckCircle2, Lock, Loader2, Camera, CreditCard, BookOpen, FileCheck, Mail } from 'lucide-react';
import { useKycStatus } from '@/hooks/useKycStatus';
import { useUploadKycDocumentMutation, useResendEmailVerificationMutation } from '@/store/api/authApi';
import { cn } from '@/lib/utils';

const DOC_TYPES = [
  { value: 'national_id', label: 'National ID', icon: CreditCard },
  { value: 'passport', label: 'Passport', icon: BookOpen },
  { value: 'drivers_license', label: "Driver's License", icon: FileCheck },
] as const;

export function KycStatusWidget() {
  const { tier, isApproved, pendingDoc, nextTierRequirement, refetch } = useKycStatus();
  const [uploadDoc, { isLoading: isUploading }] = useUploadKycDocumentMutation();
  const [resendEmail, { isLoading: isResendingEmail }] = useResendEmailVerificationMutation();
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('national_id');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const tiers = [
    { level: 0, label: 'Unverified', icon: ShieldAlert },
    { level: 1, label: 'Email Verified', icon: Mail },
    { level: 2, label: 'ID Document', icon: FileText },
    { level: 3, label: 'Biometric', icon: Fingerprint },
  ];

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleFileUpload(file);
    }
  }, [uploadDoc, selectedDocType, refetch]);

  const handleResendEmail = async () => {
    try {
      setUploadError('');
      setUploadSuccess(false);
      await resendEmail().unwrap();
      setUploadSuccess(true);
      // We can reuse uploadSuccess for email sent success temporarily
    } catch (err: any) {
      setUploadError(err.data?.message || 'Failed to resend verification email');
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    setUploadSuccess(false);

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, and PDF files are accepted.');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);

    // Determine document type based on tier
    if (tier === 1) {
      formData.append('type', selectedDocType);
    } else if (tier === 2) {
      formData.append('type', 'selfie');
    }
    
    try {
      await uploadDoc(formData).unwrap();
      setUploadSuccess(true);
      setShowUploadZone(false);
      refetch();
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      setUploadError(err?.data?.message || 'Failed to upload document. Please try again.');
    }
  };

  const handleUpgradeClick = () => {
    if (tier === 0) {
      // Tier 0 → 1: Email verification — no upload needed
      return;
    }
    setShowUploadZone(true);
  };

  return (
    <div className="card w-full max-w-2xl overflow-hidden">
      <div className="bg-navy p-6 text-white">
        <h3 className="font-display text-xl font-bold">Identity Verification</h3>
        <p className="mt-1 text-sm text-white/70">
          Unlock higher bidding limits and selling privileges.
        </p>
      </div>

      <div className="card-body">
        {/* Tier Progress */}
        <div className="relative flex justify-between">
          <div className="absolute left-6 top-5 h-0.5 w-[calc(100%-3rem)] bg-border" />
          
          {tiers.map((t) => {
            const isCompleted = tier >= t.level;
            const isCurrent = tier === t.level - 1;
            const isLocked = tier < t.level - 1;
            const Icon = t.icon;

            return (
              <div key={t.level} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-colors",
                    isCompleted ? "border-success text-success" : 
                    isCurrent ? "border-orange text-orange" : 
                    "border-border text-muted bg-sky"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : 
                   isLocked ? <Lock className="h-4 w-4" /> : 
                   <Icon className="h-5 w-5" />}
                </div>
                <div className="text-center mt-2 max-w-[80px]">
                  <span className={cn(
                    "block text-[10px] sm:text-xs font-semibold uppercase tracking-wider",
                    isCompleted ? "text-success" : isCurrent ? "text-orange" : "text-muted"
                  )}>
                    Tier {t.level}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-ink break-words leading-tight mt-0.5 inline-block">{t.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Document uploaded successfully! Our team will review it within 24 hours.
            </motion.div>
          )}
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Area */}
        <div className="mt-8 rounded-lg border border-border bg-sky p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-ink">Next Step: {tiers[Math.min(tier + 1, 3)]?.label}</h4>
              <p className="text-sm text-muted">{nextTierRequirement}</p>
            </div>
            
            {pendingDoc ? (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                <Loader2 className="h-3 w-3 animate-spin" /> Review Pending
              </span>
            ) : tier >= 3 ? (
              <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Fully Verified
              </span>
            ) : tier >= 1 ? (
              <button onClick={handleUpgradeClick} className="btn-primary">
                Upgrade Verification
              </button>
            ) : null}
          </div>

          {/* Document Type Selection (Tier 1 → 2: ID Document) */}
          <AnimatePresence>
            {showUploadZone && tier === 1 && !pendingDoc && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-ink mb-2 block">Select Document Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {DOC_TYPES.map((doc) => {
                      const DocIcon = doc.icon;
                      return (
                        <button
                          key={doc.value}
                          type="button"
                          onClick={() => setSelectedDocType(doc.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all",
                            selectedDocType === doc.value
                              ? "border-orange bg-orange/5 text-orange shadow-sm"
                              : "border-border bg-white text-muted hover:border-orange/40 hover:text-ink"
                          )}
                        >
                          <DocIcon className="h-6 w-6" />
                          {doc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={onDrop}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                    isDragActive ? "border-orange bg-orange/5" : "border-border hover:bg-white"
                  )}
                >
                  <input
                    type="file"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                    disabled={isUploading}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-orange" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-muted" />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">
                    Drag & drop your {DOC_TYPES.find(d => d.value === selectedDocType)?.label ?? 'document'} here
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Supports JPG, PNG, PDF (Max 5MB)
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Requirements:</strong> Upload a clear, full-colour photo of your unexpired government-issued ID. 
                    All four corners must be visible. No glare, blur, or cropping.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selfie Upload (Tier 2 → 3: Biometric) */}
          <AnimatePresence>
            {showUploadZone && tier === 2 && !pendingDoc && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 space-y-4"
              >
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange/10">
                    <Camera className="h-8 w-8 text-orange" />
                  </div>
                  <h5 className="mt-3 font-semibold text-ink">Biometric Selfie Verification</h5>
                  <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
                    Take a clear photo of yourself holding your verified ID document next to your face.
                  </p>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={onDrop}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                    isDragActive ? "border-orange bg-orange/5" : "border-border hover:bg-white"
                  )}
                >
                  <input
                    type="file"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                    disabled={isUploading}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-orange" />
                    ) : (
                      <Camera className="h-6 w-6 text-muted" />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink">Upload your selfie verification photo</p>
                  <p className="mt-1 text-xs text-muted">JPG or PNG only (Max 5MB)</p>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Requirements:</strong> A well-lit photo showing your face clearly alongside your ID document. 
                    Both your face and the document must be fully visible. No filters, masks, or sunglasses.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
