'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Fingerprint, Activity, Layers, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] max-w-[1200px] pointer-events-none opacity-50">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-500/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700 backdrop-blur-md mb-8">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Government-Grade Security</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-100 tracking-tighter mb-8 leading-tight">
            The Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Cryptographic Voting
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            AegisVote Enterprise provides organizations with a zero-knowledge, end-to-end encrypted platform for secure elections. Featuring WebAuthn biometrics, multi-tenant isolation, and immutable audit trails.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_45px_rgba(16,185,129,0.5)]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-sm flex items-center justify-center transition-all backdrop-blur-sm"
            >
              Sign In to Portal
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Lock className="w-8 h-8 text-emerald-400" />}
            title="Zero-Knowledge Privacy"
            description="Votes are completely decoupled from voter identity using SHA-256 cryptographic receipts. No database relations exist between a voter and their ballot."
          />
          <FeatureCard
            icon={<Fingerprint className="w-8 h-8 text-teal-400" />}
            title="FIDO2 Biometrics"
            description="Enforce hardware-level authentication via WebAuthn. Require voters to verify with Fingerprint or Face ID before casting high-stakes ballots."
          />
          <FeatureCard
            icon={<Layers className="w-8 h-8 text-cyan-400" />}
            title="Multi-Tenant Isolation"
            description="Create your own organizational portal. Manage voter rolls, multiple concurrent elections, and role-based admin access."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-md text-left"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}
