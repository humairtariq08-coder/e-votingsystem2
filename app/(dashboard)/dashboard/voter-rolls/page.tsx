'use client';

import { useEffect, useState } from 'react';
import { Users, Vote, CheckCircle2, Clock, Mail, Search, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoterEntry {
  id: string;
  votedAt?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  email?: string;
  status?: string;
  addedAt?: string;
}

interface ElectionRoll {
  id: string;
  title: string;
  status: string;
  voterStatuses: VoterEntry[];
  voterRoll: VoterEntry[];
  _count: {
    votes: number;
    voterStatuses: number;
  };
}

export default function VoterRollsPage() {
  const [elections, setElections] = useState<ElectionRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVoterRolls();
  }, []);

  const fetchVoterRolls = async () => {
    try {
      const res = await fetch('/api/voter-rolls');
      if (res.ok) {
        const data = await res.json();
        setElections(data);
        if (data.length > 0) setSelectedElection(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const current = elections.find((e) => e.id === selectedElection);

  const voters = current?.voterStatuses || [];
  const filteredVoters = voters.filter(
    (v) =>
      v.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-cyan-400" /> Voter Rolls & Participation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          View voter participation across your elections. Vote choices are never revealed — only participation status is shown.
        </p>
      </div>

      {/* Election Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Vote className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none"
          >
            {elections.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {e._count.voterStatuses} voter(s)
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search voters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Stats Bar */}
      {current && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Voters', value: current._count.voterStatuses, icon: Users, color: 'text-cyan-400' },
            { label: 'Ballots Cast', value: current._count.votes, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Election Status', value: current.status, icon: Clock, color: 'text-amber-400' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3"
              >
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Voter Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          Loading voter data...
        </div>
      ) : !current || filteredVoters.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No voters found</p>
          <p className="text-xs text-slate-500">
            {elections.length === 0
              ? 'Create an election first to start receiving voters.'
              : 'No one has voted in this election yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Voter</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Voted At</th>
              </tr>
            </thead>
            <tbody>
              {filteredVoters.map((voter, idx) => (
                <tr
                  key={voter.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                >
                  <td className="px-5 py-3 text-xs text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-5 py-3 text-sm text-white font-medium">
                    {voter.user?.name || 'Anonymous Voter'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      {voter.user?.email || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Voted
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">
                    {voter.votedAt
                      ? new Date(voter.votedAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Zero-Knowledge Privacy Guarantee</p>
          <p className="text-slate-400 mt-0.5">
            This panel only shows voter participation status. The actual vote choice (which candidate/option was selected) is cryptographically decoupled and cannot be traced back to any voter.
          </p>
        </div>
      </div>
    </div>
  );
}
