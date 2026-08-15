'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { Input } from '@/components/ui/input';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationMsg, setConfirmationMsg] = useState('');

  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);


  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/google');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Google sign-in not available');
      }
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    setError('');
    setConfirmationMsg('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setSubmitting(true);

    const result =
      mode === 'login'
        ? await login(email, password)
        : await register(email, password, name || undefined);

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (result.emailConfirmationRequired) {
      setConfirmationMsg('Check your email for a confirmation link!');
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key='auth-backdrop'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm'
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key='auth-modal'
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className='fixed inset-0 z-[201] flex items-center justify-center p-4'
          >
            <div
              className='bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className='relative bg-gradient-to-br from-red-600/20 via-zinc-950 to-zinc-950 p-6 pb-5'>
                <button
                  onClick={onClose}
                  className='absolute top-4 right-4 text-white/40 hover:text-white transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
                <h2 className='text-xl font-bold text-white'>
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className='text-sm text-white/40 mt-1'>
                  {mode === 'login'
                    ? 'Sign in to your StreamVault account'
                    : 'Sign up to get started'}
                </p>
              </div>

              {/* Form */}
              <div className='p-6 space-y-4'>
                {/* Google OAuth */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={submitting}
                  className='w-full h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white'
                >
                  <svg className='w-4 h-4' viewBox='0 0 24 24'>
                    <path
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z'
                      fill='#4285F4'
                    />
                    <path
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      fill='#34A853'
                    />
                    <path
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      fill='#FBBC05'
                    />
                    <path
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      fill='#EA4335'
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className='flex items-center gap-3'>
                  <div className='flex-1 h-px bg-white/[0.08]' />
                  <span className='text-xs text-white/25 uppercase tracking-wider'>or</span>
                  <div className='flex-1 h-px bg-white/[0.08]' />
                </div>

                {/* Name (register only) */}
                {mode === 'register' && (
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25' />
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder='Name (optional)'
                      className='pl-10 h-11 bg-white/[0.06] border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:border-red-500/40 rounded-lg'
                    />
                  </div>
                )}

                {/* Email */}
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25' />
                  <Input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Email address'
                    className='pl-10 h-11 bg-white/[0.06] border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:border-red-500/40 rounded-lg'
                  />
                </div>

                {/* Password */}
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25' />
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Password'
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                    className='pl-10 pr-10 h-11 bg-white/[0.06] border-white/[0.08] text-sm text-white placeholder:text-white/25 focus:border-red-500/40 rounded-lg'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPw(!showPw)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors'
                  >
                    {showPw ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2'
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Confirmation message */}
                <AnimatePresence>
                  {confirmationMsg && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className='text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2'
                    >
                      {confirmationMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`
                    w-full h-11 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                    ${submitting
                      ? 'bg-white/10 text-white/40 cursor-wait'
                      : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                    }
                  `}
                >
                  {submitting ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>

                {/* Toggle mode */}
                <p className='text-center text-sm text-white/40'>
                  {mode === 'login'
                    ? "Don't have an account?"
                    : 'Already have an account?'}{' '}
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setError('');
                      setConfirmationMsg('');
                    }}
                    className='text-red-400 hover:text-red-300 font-medium transition-colors'
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
