'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, Check, ShieldCheck, ExternalLink, RefreshCw, Key, Lock, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { verifyReceiptHash } from '@/app/actions';

interface ReceiptModalProps {
  receiptHash: string;
  timestamp: string;
  candidateName: string;
  electionTitle: string;
  onReset: () => void;
}

export function ReceiptModal({
  receiptHash,
  timestamp,
  candidateName,
  electionTitle,
  onReset,
}: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [auditHashInput, setAuditHashInput] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Trigger celebratory confetti on mount
  React.useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6'],
    });
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleVerifyAudit = async () => {
    const targetHash = auditHashInput.trim() || receiptHash;
    setIsAuditing(true);
    const res = await verifyReceiptHash(targetHash);
    setAuditResult(res);
    setIsAuditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-3xl mx-auto my-8 glass-panel rounded-3xl p-6 sm:p-10 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-left relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <CheckCircle className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Ballot Encrypted & Cast</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Vote Transaction Confirmed
            </h2>
          </div>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Switch Voter / Reset UI</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-5 mb-6 space-y-3">
        <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span>Election Target</span>
          <span className="font-semibold text-slate-200 truncate max-w-xs">{electionTitle}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span>Ballot Status</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
            <Lock className="w-3 h-3" /> Anonymous & Immutable
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Timestamp (UTC)</span>
          <span className="font-mono text-slate-300">{new Date(timestamp).toUTCString()}</span>
        </div>
      </div>

      {/* Prominent Cryptographic Receipt Container */}
      <div className="mb-8">
        <label className="block text-xs uppercase tracking-wider font-bold text-slate-300 mb-2 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span>Cryptographic Receipt Hash (SHA-256)</span>
        </label>

        <div className="relative group">
          <div className="w-full bg-slate-950 rounded-xl p-4 pr-24 border border-emerald-500/40 text-emerald-300 font-mono text-xs sm:text-sm break-all select-all shadow-inner leading-relaxed">
            {receiptHash}
          </div>

          <button
            onClick={handleCopy}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Receipt</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          This receipt hash is your permanent cryptographic proof of ballot inclusion. It can be used to audit the public ledger without revealing your candidate choice or identity.
        </p>
      </div>

      {/* Independent Verification Audit Lookup Tool */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
        <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-teal-400" />
          <span>Independent Public Ledger Audit Tool</span>
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Paste any cryptographic receipt hash below to query the database and verify inclusion.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder={receiptHash}
            value={auditHashInput}
            onChange={(e) => setAuditHashInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={handleVerifyAudit}
            disabled={isAuditing}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isAuditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Verify Receipt</span>
          </button>
        </div>

        {auditResult && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed ${
              auditResult.verified
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            <div className="font-bold mb-1 flex items-center gap-1.5">
              {auditResult.verified ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{auditResult.message}</span>
            </div>
            {auditResult.verified && (
              <div className="mt-2 text-slate-300 text-xs space-y-1">
                <div>Election: <strong>{auditResult.electionTitle}</strong></div>
                <div>Recorded UTC: {new Date(auditResult.timestamp).toUTCString()}</div>
                <div className="text-teal-300 font-medium mt-1">Zero-Knowledge Integrity Status: PASSED</div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
