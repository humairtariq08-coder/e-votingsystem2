'use client';

import React from 'react';
import { Shield, Lock, Key, ArrowRight, CheckCircle, Database, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function PrivacyBadge() {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl glass-panel p-6 border border-emerald-500/20 shadow-2xl relative overflow-hidden my-8">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Isolation Protocol</span>
            </div>
            <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Cryptographic Identity Separation Architecture
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>ACID Transaction Protected</span>
          </div>
        </div>

        {/* Visual Architecture Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Identity Box */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Identity Verification
            </span>
            <span className="text-sm font-bold text-slate-200 mb-2">VoterStatus Model</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stores <code className="text-teal-300 font-mono bg-slate-950 px-1 py-0.5 rounded">userId + electionId</code> constraint. Prevents double-voting without recording your selection.
            </p>
          </div>

          {/* Decoupling Barrier */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 p-4 flex flex-col items-center justify-center text-center relative">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mb-2 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <EyeOff className="w-6 h-6" />
            </motion.div>
            <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase mb-1">
              SHA-256 Decoupler
            </span>
            <p className="text-xs text-slate-300">
              No foreign key linkage exists between voter identity and vote choice.
            </p>
          </div>

          {/* Vote Payload Box */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-3 text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Anonymous Ballot
            </span>
            <span className="text-sm font-bold text-slate-200 mb-2">Vote Model</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stores <code className="text-emerald-300 font-mono bg-slate-950 px-1 py-0.5 rounded">candidateId + receiptHash</code>. Completely detached from voter identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
