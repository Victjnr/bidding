import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
import { useRegisterMutation } from '@/store/api/authApi';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [registerMutation] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
      termsAccepted: false,
    },
  });

  const passwordVal = watch('password');

  // Simple password strength calculator
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return score;
    if (pwd.length > 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strengthScore = getPasswordStrength(passwordVal);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
        terms_accepted: data.termsAccepted,
      };
      await registerMutation(payload as any).unwrap();
      navigate('/app', { replace: true });
    } catch (error: any) {
      // Parse Laravel validation errors (422 response)
      const serverErrors = error?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        const allErrors = Object.values(serverErrors).flat().join(' ');
        setErrorMsg(allErrors || 'Validation failed. Please check your input.');
      } else {
        setErrorMsg(
          error?.data?.message || 'Failed to create account. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Create Account</h2>
        <p className="mt-2 text-sm text-muted">Join the modern auction experience.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-1">
            <label className="text-sm font-medium leading-none text-ink">First Name</label>
            <input
              {...register('firstName')}
              className={cn('input', errors.firstName && 'border-error')}
              disabled={isSubmitting}
            />
            {errors.firstName && <p className="text-xs text-error">{errors.firstName.message}</p>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-1">
            <label className="text-sm font-medium leading-none text-ink">Last Name</label>
            <input
              {...register('lastName')}
              className={cn('input', errors.lastName && 'border-error')}
              disabled={isSubmitting}
            />
            {errors.lastName && <p className="text-xs text-error">{errors.lastName.message}</p>}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-1">
          <label className="text-sm font-medium leading-none text-ink">Email address</label>
          <input
            {...register('email')}
            type="email"
            className={cn('input', errors.email && 'border-error')}
            disabled={isSubmitting}
          />
          {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-1">
          <label className="text-sm font-medium leading-none text-ink">Phone (optional)</label>
          <input
            {...register('phone')}
            type="tel"
            className={cn('input', errors.phone && 'border-error')}
            disabled={isSubmitting}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-1">
          <label className="text-sm font-medium leading-none text-ink">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className={cn('input pr-10', errors.password && 'border-error')}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink focus-visible:outline-orange"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Password strength meter */}
          <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-border/50">
            <div className={cn("h-full transition-all duration-300", 
              strengthScore === 1 ? "w-1/4 bg-error" :
              strengthScore === 2 ? "w-2/4 bg-orange" :
              strengthScore === 3 ? "w-3/4 bg-warning" :
              strengthScore >= 4 ? "w-full bg-success" : "w-0"
            )} />
          </div>
          {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-1">
          <label className="text-sm font-medium leading-none text-ink">Confirm Password</label>
          <input
            {...register('passwordConfirmation')}
            type={showPassword ? 'text' : 'password'}
            className={cn('input', errors.passwordConfirmation && 'border-error')}
            disabled={isSubmitting}
          />
          {errors.passwordConfirmation && <p className="text-xs text-error">{errors.passwordConfirmation.message}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-start space-x-2 pt-2">
          <input
            {...register('termsAccepted')}
            type="checkbox"
            id="terms"
            className="mt-1 h-4 w-4 rounded border-border text-orange focus:ring-orange/30"
            disabled={isSubmitting}
          />
          <label htmlFor="terms" className="text-sm text-muted">
            I agree to the <a href="/terms" className="text-orange hover:underline">Terms of Service</a> and <a href="/privacy" className="text-orange hover:underline">Privacy Policy</a>
          </label>
        </motion.div>
        {errors.termsAccepted && <p className="text-xs text-error -mt-2">You must accept the terms.</p>}

        {errorMsg && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 rounded-md bg-error/10 p-3 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </motion.div>
        )}

        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Account
        </motion.button>
      </form>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/auth/login" className="font-medium text-orange hover:underline focus-visible:outline-orange">
          Log In
        </Link>
      </motion.p>
    </div>
  );
}
