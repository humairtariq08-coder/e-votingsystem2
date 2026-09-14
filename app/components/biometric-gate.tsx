'use client';

import React, { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface BiometricGateProps {
  onSuccess?: () => void;
  onVerified?: (verificationToken?: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BiometricGate({ onSuccess, onVerified, onCancel, isSubmitting = false }: BiometricGateProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleVerification = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      // 1. Get auth options from server
      const optionsResp = await fetch('/api/webauthn/auth-options');
      if (!optionsResp.ok) throw new Error('Failed to get authentication options');
      const options = await optionsResp.json();

      if (options.error) throw new Error(options.error);

      // 2. Pass options to browser authenticator (Fingerprint/FaceID)
      const asseResp = await startAuthentication({ optionsJSON: options });

      // 3. Send response back to server for verification
      const verifyResp = await fetch('/api/webauthn/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asseResp),
      });

      if (!verifyResp.ok) throw new Error('Verification failed on server');
      const verification = await verifyResp.json();

      if (verification.verified) {
        if (onSuccess) onSuccess();
        if (onVerified) onVerified('webauthn-verified-token');
      } else {
        throw new Error(verification.error || 'Verification failed');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Biometric verification failed or was cancelled.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/20 blur-[80px] pointer-events-none" />

        <div className="p-8 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-950 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-6 text-emerald-400">
            <Fingerprint className="w-10 h-10 animate-pulse" />
          </div>

          <h3 className="text-xl font-black text-slate-100 tracking-tight mb-2">
            Biometric Verification Required
          </h3>
          <p className="text-sm text-slate-400 mb-8">
            This election requires strong authentication. Please verify your identity using your device&apos;s biometric sensor (Fingerprint/Face ID).
          </p>

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-3 text-left"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
              <div>
                <span className="font-bold block mb-0.5">Verification Failed</span>
                {errorMessage}
              </div>
            </motion.div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleVerification}
              disabled={status === 'loading' || isSubmitting}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' || isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSubmitting ? 'Casting Ballot...' : 'Awaiting Sensor...'}</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  <span>Verify to Cast Ballot</span>
                </>
              )}
            </button>
            
            <button
              onClick={onCancel}
              disabled={status === 'loading' || isSubmitting}
              className="w-full py-3 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
