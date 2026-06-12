import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useUpdateProfileMutation, useUploadAvatarMutation } from '@/store/api/accountApi';
import { KycStatusWidget } from '@/features/auth/KycStatusWidget';
import { UploadCloud, CheckCircle2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const user = useAppSelector(selectCurrentUser);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
    phone: '',
  });
  
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        bio: (user as any).bio || '',
        phone: (user as any).phone || '',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await uploadAvatar(formData).unwrap();
    } catch (err) {
      console.error('Failed to upload avatar', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData).unwrap();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Public Profile Link & Kyc */}
      <div className="flex flex-col sm:flex-row gap-6 items-start justify-between">
        <div className="flex-1 w-full">
          <KycStatusWidget />
        </div>
        <Link 
          to={`/app/seller/profile/${user?.uuid}`} 
          className="btn-outline whitespace-nowrap"
        >
          View Public Profile
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h1 className="font-display text-2xl font-bold text-ink">{user?.displayName || 'My Profile'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 shrink-0 rounded-full border-2 border-dashed border-border bg-sky flex items-center justify-center overflow-hidden group">
              {user?.avatarPath ? (
                <img src={user.avatarPath} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-display font-bold text-orange">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
              <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud className="h-6 w-6 text-white" />
                <span className="text-[10px] font-bold text-white mt-1 uppercase">Change</span>
                <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarUpload} disabled={isUploading} />
              </label>
            </div>
            <div>
              <h3 className="font-medium text-ink">Profile Picture</h3>
              <p className="text-xs text-muted mt-1">PNG or JPG up to 5MB. This will be displayed on your public profile.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">First Name</label>
              <input 
                type="text" 
                value={formData.firstName} 
                onChange={e => setFormData(p => ({ ...p, firstName: e.target.value }))}
                className="input" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Last Name</label>
              <input 
                type="text" 
                value={formData.lastName} 
                onChange={e => setFormData(p => ({ ...p, lastName: e.target.value }))}
                className="input" 
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Display Name</label>
              <input 
                type="text" 
                value={formData.displayName} 
                onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))}
                className="input" 
                required 
              />
              <p className="text-[10px] text-muted">Visible to other users when bidding.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-ink">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                className="input" 
              />
            </div>
            <div className="col-span-full space-y-1.5">
              <label className="text-sm font-medium text-ink">Bio</label>
              <textarea 
                value={formData.bio} 
                onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                className="input min-h-[100px] resize-none" 
                placeholder="Tell buyers and sellers a bit about yourself..."
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <div className="flex items-center gap-2">
              {successMsg && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-success animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" /> {successMsg}
                </span>
              )}
            </div>
            <button type="submit" disabled={isUpdating} className="btn-primary">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
