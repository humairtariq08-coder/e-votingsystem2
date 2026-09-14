'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Sparkles, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { registerUser } from '@/app/actions/auth';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains a number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const allRulesMet = PASSWORD_RULES.every((r) => r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch || !allRulesMet) return;

    setIsLoading(true);
    setError(null);

    const result = await registerUser({ name, email, password });

    if (!result.success) {
      setIsLoading(false);
      setError(result.error || 'Registration failed.');
      return;
    }

    // Auto-login after registration
    const signInResult = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    setIsLoading(false);

    if (signInResult?.error) {
      setError('Account created, but auto-login failed. Please sign in manually.');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <div className="rounded-3xl bg-slate-900/70 backdrop-blur-2xl border border-slate-800/80 shadow-2xl shadow-emerald-900/10 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[1.5px] shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-6">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">
            Create Account
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Join AegisVote to create or participate in elections
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-950/50 border border-red-500/40 p-3 text-red-200 text-xs font-medium text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@organization.com"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a strong password"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicators */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1 pt-1"
              >
                {PASSWORD_RULES.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <CheckCircle2
                      className={`w-3 h-3 ${
                        rule.test(password) ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    />
                    <span className={rule.test(password) ? 'text-emerald-400' : 'text-slate-500'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      : 'border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                    : 'border-slate-700/80 focus:border-emerald-500/60'
                }`}
              />
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[11px] text-red-400">Passwords do not match</p>
            )}
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={isLoading || !passwordsMatch || !allRulesMet}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-600">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500/50" />
        <span>End-to-end encrypted • Zero-knowledge architecture</span>
      </div>
    </motion.div>
  );
}
