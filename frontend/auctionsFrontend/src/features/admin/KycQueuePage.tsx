import { useState } from 'react';
import { useGetKycQueueQuery, useApproveKycMutation, useRejectKycMutation } from '@/store/api/adminApi';
import { ShieldCheck, Check, X, RotateCw, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

export default function KycQueuePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetKycQueueQuery({ page });
  const [approveKyc] = useApproveKycMutation();
  const [rejectKyc] = useRejectKycMutation();

  const [viewDoc, setViewDoc] = useState<{ url: string; userName: string; docType: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const [rejectUuid, setRejectUuid] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = async () => {
    if (!rejectUuid) return;
    await rejectKyc({ uuid: rejectUuid, reason: rejectReason }).unwrap();
    setRejectUuid(null);
    setRejectReason('');
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'id_card': return 'ID Card';
      case 'passport': return 'Passport';
      case 'proof_of_address': return 'Proof of Address';
      case 'selfie': return 'Selfie';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">KYC Queue</h1>
          <p className="text-white/40 mt-1">Review and verify user identity documents.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/30">
          <ShieldCheck className="h-5 w-5" />
          <span>{data?.meta.total ?? 0} pending</span>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/5" />)
        ) : data?.data.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-emerald-400/20" />
            <p className="text-lg font-bold text-white/50">KYC queue is clear!</p>
            <p className="text-sm text-white/20">No pending verifications at this time.</p>
          </div>
        ) : (
          data?.data.map((doc) => (
            <div key={doc.uuid} className="rounded-2xl border border-white/5 bg-[#0A1628] p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{doc.userName}</h3>
                  <p className="text-xs text-white/30">{doc.userEmail}</p>
                </div>
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white/40">
                  {getDocTypeLabel(doc.docType)}
                </span>
              </div>

              {/* Document Preview */}
              <button
                onClick={() => setViewDoc({ url: doc.fileUrl, userName: doc.userName, docType: doc.docType })}
                className="group relative w-full h-32 rounded-lg bg-white/5 overflow-hidden border border-white/5 hover:border-orange/30 transition-colors"
              >
                <img src={doc.fileUrl} alt={doc.docType} className="h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              </button>

              <p className="text-[10px] text-white/20">Submitted {formatDistanceToNow(new Date(doc.submittedAt))} ago</p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => approveKyc(doc.uuid)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  onClick={() => setRejectUuid(doc.uuid)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                <button className="flex items-center justify-center rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors">
                  <RotateCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full-Screen Document Viewer */}
      <Dialog.Root open={!!viewDoc} onOpenChange={(open) => { if (!open) { setViewDoc(null); setZoom(1); setRotation(0); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 animate-in fade-in" />
          <Dialog.Content className="fixed inset-4 z-50 flex flex-col rounded-2xl border border-white/10 bg-[#070F1A] shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div>
                <Dialog.Title className="font-display text-lg font-bold text-white">{viewDoc?.userName}</Dialog.Title>
                <Dialog.Description className="text-xs text-white/30">{viewDoc?.docType && getDocTypeLabel(viewDoc.docType)}</Dialog.Description>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="rounded-lg bg-white/5 p-2 text-white/40 hover:text-white"><ZoomOut className="h-4 w-4" /></button>
                <span className="text-xs text-white/30 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="rounded-lg bg-white/5 p-2 text-white/40 hover:text-white"><ZoomIn className="h-4 w-4" /></button>
                <button onClick={() => setRotation(r => r + 90)} className="rounded-lg bg-white/5 p-2 text-white/40 hover:text-white"><RotateCcw className="h-4 w-4" /></button>
                <Dialog.Close asChild>
                  <button className="rounded-lg bg-white/5 p-2 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
                </Dialog.Close>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-8">
              {viewDoc && (
                <img
                  src={viewDoc.url}
                  alt="KYC Document"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.2s' }}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Rejection Modal */}
      <Dialog.Root open={!!rejectUuid} onOpenChange={(open) => { if (!open) setRejectUuid(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0A1628] p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <Dialog.Title className="font-display text-xl font-bold text-white mb-1">Reject Document</Dialog.Title>
            <Dialog.Description className="text-sm text-white/40 mb-4">Provide a reason for rejecting this KYC submission.</Dialog.Description>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white border border-white/5 outline-none min-h-[100px] resize-none" placeholder="e.g., Document is blurry or expired..." />
            <div className="flex justify-end gap-3 mt-4">
              <Dialog.Close asChild><button className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/50 hover:bg-white/10">Cancel</button></Dialog.Close>
              <button onClick={handleReject} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600">Reject</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
