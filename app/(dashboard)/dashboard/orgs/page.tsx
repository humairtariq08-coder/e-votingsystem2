'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Users,
  Vote,
  Globe,
  Shield,
  ArrowUpRight,
  Crown,
} from 'lucide-react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  tier: string;
  isVerified: boolean;
  role: string;
  _count: {
    elections: number;
    members: number;
  };
}

const tierConfig: Record<string, { color: string; label: string }> = {
  FREE: { color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', label: 'Free' },
  PRO: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Pro' },
  ENTERPRISE: { color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'Enterprise' },
  GOVERNMENT: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'Government' },
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgs();
  }, []);

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" /> Organizations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your organization portals, members, and election infrastructure.
          </p>
        </div>

        <Link
          href="/dashboard/orgs/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> New Organization
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          Loading organizations...
        </div>
      ) : orgs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No organizations yet</p>
          <p className="text-xs text-slate-500">Create your first organization to start hosting elections.</p>
          <Link
            href="/dashboard/orgs/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Create Organization
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orgs.map((org, idx) => {
            const tier = tierConfig[org.tier] || tierConfig.FREE;

            return (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tier.color}`}>
                      {tier.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> {org.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-slate-700 flex items-center justify-center text-cyan-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition">
                        {org.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">/{org.slug}</p>
                    </div>
                  </div>

                  {org.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{org.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Vote className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-white">{org._count.elections}</span> Elections
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-bold text-white">{org._count.members}</span> Members
                      </span>
                    </div>

                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-cyan-400 transition"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/dashboard/orgs/${org.id}/members`}
                      className="flex-1 text-center py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold text-xs border border-purple-500/30 transition flex items-center justify-center gap-1.5"
                    >
                      <Users className="w-3 h-3" /> Manage Members
                    </Link>
                    <Link
                      href={`/orgs/${org.slug}`}
                      className="flex-1 text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      Public Portal <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
