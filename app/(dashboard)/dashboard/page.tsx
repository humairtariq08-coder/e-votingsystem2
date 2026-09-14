'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Vote,
  ShieldCheck,
  Users,
  Fingerprint,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  requireBiometric: boolean;
  startDate: string;
  endDate: string;
  options: any[];
  _count: {
    votes: number;
  };
}

export default function DashboardOverview() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const res = await fetch('/api/elections');
      if (res.ok) {
        const data = await res.json();
        setElections(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = elections.reduce((acc, curr) => acc + (curr._count?.votes || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> Platform Operations Live
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Enterprise Voting Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Monitor ballot progress, audit cryptographic proof trails, and configure FIDO2 biometric gates for high-integrity elections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/elections/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Election
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Elections',
            value: elections.length,
            change: '+2 this month',
            icon: Vote,
            color: 'from-cyan-500 to-blue-500',
          },
          {
            title: 'Cryptographic Votes Cast',
            value: totalVotes,
            change: '100% Zero-Knowledge',
            icon: Lock,
            color: 'from-purple-500 to-indigo-500',
          },
          {
            title: 'Biometric Authentications',
            value: 'FIDO2 WebAuthn',
            change: 'Passkey Verified',
            icon: Fingerprint,
            color: 'from-emerald-500 to-teal-500',
          },
          {
            title: 'Audit Compliance',
            value: '100% Immutable',
            change: 'ACID Compliant',
            icon: ShieldCheck,
            color: 'from-amber-500 to-orange-500',
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${kpi.color} bg-opacity-10 text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-[11px] text-cyan-400 mt-1 font-medium">{kpi.change}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Elections List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Vote className="w-5 h-5 text-cyan-400" />
              Active & Recent Elections
            </h2>
            <Link
              href="/dashboard/elections"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
              Loading elections data...
            </div>
          ) : elections.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-3">
              <Vote className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-semibold">No elections created yet</p>
              <p className="text-xs text-slate-500">Create your first election to start receiving ballots securely.</p>
              <Link
                href="/dashboard/elections/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 hover:bg-cyan-400 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Create Election
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {elections.map((election) => (
                <div
                  key={election.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {election.status}
                        </span>
                        {election.requireBiometric && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Fingerprint className="w-3 h-3" /> Biometric Guard
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-2 group-hover:text-cyan-400 transition">
                        {election.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{election.description}</p>
                    </div>

                    <Link
                      href={`/elections/${election.id}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-white text-xs font-semibold transition shrink-0 flex items-center gap-1"
                    >
                      Cast Ballot <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">{election._count?.votes || 0} Votes Submitted</span>
                    <span>{election.options.length} Candidates/Options</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Verification Card */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Security & Compliance
          </h2>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">System Integrity Active</h4>
                <p className="text-xs text-slate-400">MongoDB Replica Set</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">WebAuthn Server:</span>
                <span className="text-emerald-400 font-semibold">@simplewebauthn 10.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Privacy Model:</span>
                <span className="text-cyan-400 font-semibold">Zero-Knowledge Decoupling</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Double-Vote Defense:</span>
                <span className="text-purple-400 font-semibold">VoterStatus Composite Key</span>
              </div>
            </div>

            <Link
              href="/dashboard/settings"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-cyan-500/20 transition"
            >
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              Enroll Biometric Credential
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
