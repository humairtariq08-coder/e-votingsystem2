'use client';

import { useEffect, useState } from 'react';
import { Vote, Fingerprint, Plus, ArrowUpRight, Search, Shield } from 'lucide-react';
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

export default function ElectionsListPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = elections.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Election Management</h1>
          <p className="text-xs text-slate-400">
            Monitor ballot collection, voter participation, and active election lifecycles.
          </p>
        </div>

        <Link
          href="/dashboard/elections/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Election
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter elections by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Elections Table / Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          Loading election portal...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <Vote className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No elections found</p>
          <Link
            href="/dashboard/elections/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-semibold"
          >
            Create New Election
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((election) => (
            <div
              key={election.id}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {election.status}
                  </span>

                  {election.requireBiometric && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Fingerprint className="w-3 h-3" /> Biometric Guard
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white">{election.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{election.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-mono font-bold">
                  {election._count?.votes || 0} Votes Cast
                </span>

                <Link
                  href={`/elections/${election.id}`}
                  className="flex items-center gap-1 text-slate-300 hover:text-white font-semibold"
                >
                  View Portal <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
