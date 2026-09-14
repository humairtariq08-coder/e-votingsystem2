'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Building2,
  Vote,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowLeft,
  Globe,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

interface Org {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  tier: string;
  isVerified: boolean;
  _count: {
    elections: number;
    members: number;
  };
}

export default function PublicOrgPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const slug = params.slug as string;

  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchOrg();
  }, [slug]);

  const fetchOrg = async () => {
    try {
      // We need to find the org by slug - use the organizations API
      const res = await fetch(`/api/organizations?slug=${slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const orgData = data[0];
          setOrg(orgData);
          // Check if user already has a membership status
          if (orgData.membershipStatus) {
            setMembershipStatus(orgData.membershipStatus);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!org) return;
    setApplyStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/organizations/${org.id}/join`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok) {
        setApplyStatus('success');
        setMembershipStatus('PENDING');
      } else {
        if (data.error?.includes('already applied')) {
          setApplyStatus('already');
        } else {
          setApplyStatus('error');
          setErrorMsg(data.error || 'Application failed.');
        }
      }
    } catch (err) {
      setApplyStatus('error');
      setErrorMsg('Network error.');
    }
  };

  const tierLabels: Record<string, string> = {
    FREE: 'Community',
    PRO: 'Corporate',
    ENTERPRISE: 'Enterprise',
    GOVERNMENT: 'Government Grade',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading organization...
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <Building2 className="w-12 h-12 text-slate-600 mb-3" />
        <h1 className="text-xl font-bold text-white mb-2">Organization Not Found</h1>
        <Link href="/" className="text-xs text-cyan-400 hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-mono">AegisVote Verified Portal</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
        {/* Org Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 relative overflow-hidden text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-slate-700 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-cyan-400" />
          </div>

          <h1 className="text-3xl font-extrabold text-white">{org.name}</h1>
          <p className="text-sm text-slate-400 mt-2 font-mono">/{org.slug}</p>

          {org.description && (
            <p className="text-sm text-slate-400 mt-4 max-w-lg mx-auto">{org.description}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              {tierLabels[org.tier] || org.tier}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <Vote className="w-3.5 h-3.5" /> {org._count.elections} Elections
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {org._count.members} Members
            </span>
          </div>

          {org.website && (
            <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 mt-4 transition">
              <Globe className="w-3.5 h-3.5" /> {org.website}
            </a>
          )}
        </motion.div>

        {/* Apply Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4"
        >
          <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" /> Register as Voter
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Apply to join this organization as a voter. Once approved by the organization admin, you will be eligible to vote in their elections.
          </p>

          {membershipStatus === 'APPROVED' ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> You are an approved member of this organization.
            </div>
          ) : membershipStatus === 'PENDING' || applyStatus === 'success' ? (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 text-sm flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" /> Your application is pending admin approval.
            </div>
          ) : membershipStatus === 'REJECTED' ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 text-sm">
              Your application was not approved.
            </div>
          ) : (
            <>
              {applyStatus === 'error' && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}
              {applyStatus === 'already' && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs">
                  You have already applied to this organization.
                </div>
              )}
              <button
                onClick={handleApply}
                disabled={applyStatus === 'loading'}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {applyStatus === 'loading' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Applying...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Apply to Join as Voter</>
                )}
              </button>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
