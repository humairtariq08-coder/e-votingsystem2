'use client';

import React, { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, CheckCircle2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BiometricEnrollment() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleEnrollment = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      // 1. Get options from server
      const optionsResp = await fetch('/api/webauthn/register-options');
      if (!optionsResp.ok) throw new Error('Failed to get registration options');
      const options = await optionsResp.json();

      if (options.error) throw new Error(options.error);

      // 2. Pass options to browser authenticator (Fingerprint/FaceID)
      const attResp = await startRegistration({ optionsJSON: options });

      // 3. Send response back to server for verification
      const verifyResp = await fetch('/api/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });

      if (!verifyResp.ok) throw new Error('Verification failed on server');
      const verification = await verifyResp.json();

      if (verification.verified) {
        setStatus('success');
      } else {
        throw new Error(verification.error || 'Verification failed');
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Biometric enrollment failed or was cancelled.');
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Biometric Security
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Enroll your device&apos;s fingerprint or Face ID to securely authenticate for high-stakes elections. Your biometric data never leaves your device.
          </p>
        </div>

        <button
          onClick={handleEnrollment}
          disabled={status === 'loading' || status === 'success'}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            status === 'success'
              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <AnimatePresence mode="wait">
            {status === 'loading' ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enrolling...</span>
              </motion.div>
            ) : status === 'success' ? (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enrolled</span>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Add Device</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}
    </div>
  );
}
