'use client';

import { useSession } from 'next-auth/react';
import { Shield, Bell, Search, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';

export function DashboardHeader() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar */}
      <div className="relative w-72">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search elections, receipt hashes..."
          className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition"
        />
      </div>

      {/* Right Header Action Items */}
      <div className="flex items-center gap-4">
        {/* Verification Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 font-medium">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>FIDO2 / Zero-Knowledge Protected</span>
        </div>

        {/* Public Voting Portal Button */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Public Portal</span>
        </Link>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-cyan-500/20">
            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200">{session?.user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 capitalize">{session?.user?.email || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
