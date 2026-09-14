'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote as VoteIcon,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { BiometricGate } from '@/app/components/biometric-gate';
import { useSession } from 'next-auth/react';

interface Option {
  id: string;
  name: string;
  party?: string;
  bio?: string;
  imageUrl?: string;
  type: string;
}

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  requireBiometric: boolean;
  options: Option[];
  organization: {
    name: string;
    slug: string;
  };
  hasVoted?: boolean;
  isEligible?: boolean;
}

export default function ElectionVotingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const electionId = params.id as string;
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);

  // Voting Selection State
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showBiometricGate, setShowBiometricGate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [receiptHash, setReceiptHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchElection();
  }, [electionId]);

  const fetchElection = async () => {
    try {
      const res = await fetch(`/api/elections/${electionId}`);
      if (res.ok) {
        const data = await res.json();
        setElection(data);
      } else {
        setError('Election not found');
      }
    } catch (err) {
      setError('Failed to load election details');
    } finally {
      setLoading(false);
    }
  };

  const handleCastVoteClick = () => {
    if (!selectedOptionId) return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (election?.requireBiometric) {
      setShowBiometricGate(true);
    } else {
      executeVoteSubmission();
    }
  };

  const executeVoteSubmission = async () => {
    if (!selectedOptionId) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/elections/${electionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selectedOptionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      setReceiptHash(data.receiptHash);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setShowBiometricGate(false);
    }
  };

  const copyReceipt = () => {
    if (!receiptHash) return;
    navigator.clipboard.writeText(receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading secure ballot portal...
      </div>
    );
  }

  if (error && !election) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h1 className="text-xl font-bold text-white mb-2">Error Loading Election</h1>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <Link href="/" className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </Link>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-mono">Zero-Knowledge Encrypted</span>
        </div>
      </header>

      {/* Main Ballot Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Election Header */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
            <Building2 className="w-4 h-4" /> {election?.organization?.name}
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white">{election?.title}</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-3xl">{election?.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Status: {election?.status}
            </span>

            {election?.requireBiometric && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" /> Biometric Verification Mandatory
              </span>
            )}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Not eligible notice */}
        {session && election && election.isEligible === false && !election.hasVoted && (
          <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Voter Roll Approval Required</p>
                <p className="text-xs text-slate-300 mt-0.5">
                  You are not registered on the official voter roll for this election. Apply to{' '}
                  <span className="text-amber-300 font-bold">{election.organization.name}</span> to request voter access.
                </p>
              </div>
            </div>
            <Link
              href={`/orgs/${election.organization.slug}`}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition"
            >
              Apply to Organization
            </Link>
          </div>
        )}

        {/* If user has already voted or just voted */}
        {receiptHash || election?.hasVoted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/40 backdrop-blur-xl text-center space-y-6 max-w-xl mx-auto shadow-2xl shadow-emerald-950/40"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Ballot Successfully Cast!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your vote has been anonymously committed to the immutable database log.
              </p>
            </div>

            {receiptHash && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Cryptographic Ballot Receipt
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-cyan-400 font-bold truncate">
                    {receiptHash}
                  </code>
                  <button
                    onClick={copyReceipt}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 text-left space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Privacy Verification Guarantee
              </p>
              <p className="text-[11px] text-slate-400">
                Your receipt hash proves ballot inclusion without revealing candidate preference to third parties.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-block px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
            >
              Return to Dashboard
            </Link>
          </motion.div>
        ) : (
          /* Ballot Options Selection Grid */
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <VoteIcon className="w-5 h-5 text-cyan-400" /> Select Your Candidate / Choice
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {election?.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={`p-6 rounded-3xl cursor-pointer border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/60 to-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                          {option.party || option.type}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'bg-cyan-500 border-cyan-400 text-white'
                              : 'border-slate-700 bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white">{option.name}</h3>
                      {option.bio && <p className="text-xs text-slate-400 mt-2 line-clamp-3">{option.bio}</p>}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
                      Click card to select candidate
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 backdrop-blur-xl shadow-2xl">
              <div>
                <p className="text-xs text-slate-400">
                  Selected Choice:{' '}
                  <span className="text-cyan-400 font-bold">
                    {election?.options.find((o) => o.id === selectedOptionId)?.name || 'None'}
                  </span>
                </p>
              </div>

              <button
                disabled={!selectedOptionId || submitting}
                onClick={handleCastVoteClick}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {submitting ? 'Submitting Ballot...' : 'Cast Secure Ballot'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Biometric Gate Modal */}
      {showBiometricGate && (
        <BiometricGate
          onSuccess={executeVoteSubmission}
          onCancel={() => setShowBiometricGate(false)}
        />
      )}
    </div>
  );
}
