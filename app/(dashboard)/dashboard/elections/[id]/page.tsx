'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Vote,
  Users,
  Fingerprint,
  ArrowLeft,
  Trophy,
  BarChart3,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface Option {
  id: string;
  name: string;
  party?: string;
  bio?: string;
  type: string;
  _count: {
    votes: number;
  };
}

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  requireBiometric: boolean;
  startDate: string;
  endDate: string;
  organization: {
    name: string;
    slug: string;
  };
  options: Option[];
  _count: {
    votes: number;
  };
}

export default function ElectionResultsPage() {
  const params = useParams();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElection();
  }, [electionId]);

  const fetchElection = async () => {
    try {
      const res = await fetch(`/api/elections/${electionId}`);
      if (res.ok) {
        const data = await res.json();
        setElection(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading election results...
      </div>
    );
  }

  if (!election) {
    return (
      <div className="p-12 text-center space-y-3">
        <Vote className="w-10 h-10 text-slate-600 mx-auto" />
        <p className="text-slate-300 font-semibold">Election not found</p>
        <Link href="/dashboard/elections" className="text-xs text-cyan-400 hover:underline">
          Back to Elections
        </Link>
      </div>
    );
  }

  const totalVotes = election._count.votes;
  const sortedOptions = [...election.options].sort(
    (a, b) => (b._count?.votes || 0) - (a._count?.votes || 0)
  );
  const leadingOption = sortedOptions[0];
  const maxVotes = leadingOption?._count?.votes || 1;

  const now = new Date();
  const endDate = new Date(election.endDate);
  const isExpired = now > endDate;
  const timeRemaining = isExpired
    ? 'Voting Closed'
    : `${Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days remaining`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/elections"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{election.title}</h1>
          <p className="text-xs text-slate-400">{election.organization.name}</p>
        </div>

        <Link
          href={`/elections/${election.id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 border border-slate-700 transition"
        >
          Public Ballot <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          {election.status}
        </span>
        {election.requireBiometric && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5" /> Biometric Guard
          </span>
        )}
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {timeRemaining}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Ballots Cast', value: totalVotes, icon: Vote, color: 'text-cyan-400' },
          { label: 'Candidates / Options', value: election.options.length, icon: Users, color: 'text-purple-400' },
          {
            label: 'Leading',
            value: leadingOption?.name || '—',
            icon: Trophy,
            color: 'text-amber-400',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-white truncate max-w-[180px]">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Results Bar Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" /> Live Vote Distribution
        </h2>

        {totalVotes === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No votes have been cast yet. Results will appear here in real-time.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOptions.map((option, idx) => {
              const votes = option._count?.votes || 0;
              const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0';
              const barWidth = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
              const isLeader = idx === 0 && votes > 0;

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isLeader && <Trophy className="w-4 h-4 text-amber-400" />}
                      <span className="text-sm font-bold text-white">{option.name}</span>
                      {option.party && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                          {option.party}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-cyan-400">{votes}</span>
                      <span className="text-xs text-slate-500 ml-1">({percentage}%)</span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        isLeader
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md shadow-cyan-500/30'
                          : 'bg-gradient-to-r from-slate-600 to-slate-500'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy Footer */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Cryptographic Integrity</p>
          <p className="text-slate-400 mt-0.5">
            All vote counts are derived from the immutable Vote table. Each ballot is cryptographically hashed and cannot be traced back to the voter.
          </p>
        </div>
      </div>
    </div>
  );
}
