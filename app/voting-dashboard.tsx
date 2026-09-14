'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  AlertTriangle,
  Send,
  Loader2,
  BarChart3,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Users,
  CheckCircle2
} from 'lucide-react';
import { CandidateCard, CandidateProps } from '@/app/components/candidate-card';
import { PrivacyBadge } from '@/app/components/privacy-badge';
import { ReceiptModal } from '@/app/components/receipt-modal';
import { castVote, checkUserVoteStatus } from '@/app/actions';

interface UserOption {
  id: string;
  email: string;
  name: string | null;
}

interface ElectionData {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  candidates: (CandidateProps & { _count?: { votes: number } })[];
  _count?: { votes: number; voterStatuses: number };
}

interface VotingDashboardProps {
  election: ElectionData;
  users: UserOption[];
  initialVoterStatuses: { userId: string; votedAt: Date }[];
}

export default function VotingDashboard({
  election,
  users,
  initialVoterStatuses,
}: VotingDashboardProps) {
  // Active User session selection (defaults to Alice Vance)
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || 'voter-alice-001');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Voting state management
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<{
    hash: string;
    timestamp: string;
  } | null>(null);

  // Analytics Tally View state
  const [showTally, setShowTally] = useState<boolean>(false);

  // Track voted users in local state for responsive UI updates
  const [votedUserIds, setVotedUserIds] = useState<Set<string>>(
    new Set(initialVoterStatuses.map((s) => s.userId))
  );

  // Update voted status whenever active user changes
  useEffect(() => {
    setHasVoted(votedUserIds.has(selectedUserId));
    setSelectedCandidateId(null);
    setErrorMessage(null);
  }, [selectedUserId, votedUserIds]);

  const activeUser = users.find((u) => u.id === selectedUserId) || users[0];
  const selectedCandidate = election.candidates.find((c) => c.id === selectedCandidateId);

  const handleCastVote = async () => {
    if (!selectedCandidateId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    // Call Next.js Server Action
    const result = await castVote({
      userId: selectedUserId,
      electionId: election.id,
      optionId: selectedCandidateId,
    });

    setIsSubmitting(false);

    if (result.success && result.receiptHash && result.timestamp) {
      setVotedUserIds((prev) => new Set(prev).add(selectedUserId));
      setHasVoted(true);
      setReceiptData({
        hash: result.receiptHash,
        timestamp: result.timestamp,
      });
    } else {
      setErrorMessage(result.error || 'Failed to submit ballot transaction.');
    }
  };

  const handleResetSession = () => {
    setReceiptData(null);
    setSelectedCandidateId(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-16">
      {/* Top Cyber Navigation Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[1px] shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-100 uppercase">
                  Aegis<span className="text-emerald-400">Vote</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  v2.6 ZK-ACID
                </span>
              </div>
              <p className="text-xs text-slate-400">Decoupled Cryptographic Election Protocol</p>
            </div>
          </div>

          {/* Active Voter Session Selector */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 px-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 pr-2 border-r border-slate-800">
              <Users className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">Active Voter:</span>
            </div>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold px-3 py-1.5 focus:outline-none focus:border-emerald-400 transition-colors"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} {votedUserIds.has(u.id) ? ' (Ballot Cast)' : ' (Eligible)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        {/* Election Header Banner */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 border border-teal-500/30 text-teal-300 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Global Election</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-3">
                {election.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {election.description}
              </p>
            </div>

            <button
              onClick={() => setShowTally(!showTally)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all shadow-md shrink-0"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>{showTally ? 'Hide Live Tally' : 'View Anonymous Tally'}</span>
            </button>
          </div>

          {/* Anonymous Tally Breakdown Drawer */}
          <AnimatePresence>
            {showTally && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-6 pt-6 border-t border-slate-800 overflow-hidden"
              >
                <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-Time Anonymous Vote Distribution (Public Ledger)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {election.candidates.map((c) => {
                    const votes = c._count?.votes || 0;
                    const total = election._count?.votes || 1;
                    const percent = Math.round((votes / (total || 1)) * 100);

                    return (
                      <div key={c.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-200 mb-1">
                          <span className="truncate pr-2">{c.name}</span>
                          <span className="text-emerald-400">{votes} votes ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Display: Show Receipt Modal if vote confirmed, else show voting UI */}
        {receiptData ? (
          <ReceiptModal
            receiptHash={receiptData.hash}
            timestamp={receiptData.timestamp}
            candidateName={selectedCandidate?.name || 'Selected Candidate'}
            electionTitle={election.title}
            onReset={handleResetSession}
          />
        ) : (
          <div>
            {/* Voter Eligibility Alert Banner */}
            {hasVoted ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-amber-950/40 border border-amber-500/40 p-4 mb-6 flex items-center gap-3 text-amber-200 text-xs sm:text-sm"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold">Ballot Already Cast for {activeUser.name || activeUser.email}:</span>{' '}
                  The database has recorded a <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-300">VoterStatus</code> entry for this election. Double-voting is strictly blocked. Switch active voter above to cast another ballot!
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Select Candidate Profile (Horizontal 3D Carousel)</span>
                </div>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Swipe horizontally or scroll to inspect candidates • Hover for 3D tilt
                </span>
              </div>
            )}

            {/* Error Alert Toast */}
            {errorMessage && (
              <div className="rounded-2xl bg-red-950/60 border border-red-500/50 p-4 mb-6 text-red-200 text-xs font-medium flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Candidate Carousel Horizontal Snap Container */}
            <div className="relative mb-10 group">
              <div className="flex items-center gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 pt-2 px-2 scroll-smooth">
                {election.candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={selectedCandidateId === candidate.id}
                    onSelect={(id) => setSelectedCandidateId(id)}
                    disabled={hasVoted || isSubmitting}
                  />
                ))}
              </div>
            </div>

            {/* Voting Action Section */}
            <div className="flex flex-col items-center justify-center mb-12">
              <button
                onClick={handleCastVote}
                disabled={!selectedCandidateId || hasVoted || isSubmitting}
                className={`relative px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-3 transition-all duration-300 shadow-2xl ${
                  selectedCandidateId && !hasVoted && !isSubmitting
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 hover:brightness-110 shadow-[0_0_35px_rgba(16,185,129,0.5)] scale-105 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                    <span>Encrypting Payload & Dispatching ACID Transaction...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 stroke-[2.5]" />
                    <span>
                      {hasVoted
                        ? 'Ballot Already Submitted'
                        : selectedCandidateId
                        ? `Cast Secure Vote for ${selectedCandidate?.name}`
                        : 'Select a Candidate to Cast Vote'}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Protected by SHA-256 zero-knowledge identity decoupling
              </p>
            </div>

            {/* Privacy Architecture Diagram Component */}
            <PrivacyBadge />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-500 py-6 border-t border-slate-900 mt-12">
        <p>AegisVote Zero-Knowledge Engine • Powered by Next.js 14 App Router, Prisma ORM, & Node Crypto</p>
      </footer>
    </div>
  );
}
