import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, FileText, Fingerprint, UploadCloud, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { useKycStatus } from '@/hooks/useKycStatus';
import { useUploadKycDocumentMutation } from '@/store/api/authApi';
import { cn } from '@/lib/utils';

export function KycStatusWidget() {
  const { tier, isApproved, pendingDoc, nextTierRequirement, refetch } = useKycStatus();
  const [uploadDoc, { isLoading: isUploading }] = useUploadKycDocumentMutation();
  const [isDragActive, setIsDragActive] = useState(false);

  const tiers = [
    { level: 0, label: 'Unverified', icon: ShieldAlert },
    { level: 1, label: 'Email Verified', icon: CheckCircle2 },
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
  }, []);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    const formData = new FormData();
    formData.append('document', file);
    
    try {
      await uploadDoc(formData).unwrap();
      refetch();
    } catch {
      alert('Failed to upload document');
    }
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
          
          {tiers.map((t, index) => {
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
                <div className="text-center">
                  <span className={cn(
                    "block text-xs font-semibold uppercase tracking-wider",
                    isCompleted ? "text-success" : isCurrent ? "text-orange" : "text-muted"
                  )}>
                    Tier {t.level}
                  </span>
                  <span className="text-sm font-medium text-ink">{t.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Area */}
        <div className="mt-8 rounded-lg border border-border bg-sky p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-ink">Next Step: {tiers[Math.min(tier + 1, 3)]?.label}</h4>
              <p className="text-sm text-muted">{nextTierRequirement}</p>
            </div>
            
            {pendingDoc ? (
              <span className="badge badge-warning">Review Pending</span>
            ) : tier < 3 ? (
              <button className="btn-primary">
                Upgrade Verification
              </button>
            ) : (
              <span className="badge badge-success">Fully Verified</span>
            )}
          </div>

          {/* Document Upload Zone (only if Tier 1 and needing Tier 2) */}
          {tier === 1 && !pendingDoc && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
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
                  Drag & drop your ID document here
                </p>
                <p className="mt-1 text-xs text-muted">
                  Supports JPG, PNG, PDF (Max 5MB)
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
