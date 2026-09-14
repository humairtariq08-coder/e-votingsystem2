'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Shield,
  ArrowLeft,
  Crown,
  UserCheck,
  UserX,
} from 'lucide-react';
import Link from 'next/link';

interface Member {
  id: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Clock, label: 'Pending' },
  APPROVED: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2, label: 'Approved' },
  REJECTED: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: XCircle, label: 'Rejected' },
};

export default function OrgMembersPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [orgId]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (memberId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, status } : m))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = members.filter((m) => m.status === 'PENDING');
  const approved = members.filter((m) => m.status === 'APPROVED');
  const rejected = members.filter((m) => m.status === 'REJECTED');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orgs"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" /> Manage Members
          </h1>
          <p className="text-xs text-slate-400">
            Approve or reject voter registration requests for your organization.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests', value: pending.length, icon: Clock, color: 'text-amber-400' },
          { label: 'Approved Members', value: approved.length, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Rejected', value: rejected.length, icon: UserX, color: 'text-rose-400' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Pending Approval ({pending.length})
          </h2>
          {pending.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-bold text-white">{member.user.name || 'No Name'}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3" /> {member.user.email}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Applied {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAction(member.id, 'APPROVED')}
                  disabled={actionLoading === member.id}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleAction(member.id, 'REJECTED')}
                  disabled={actionLoading === member.id}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-slate-700 hover:border-rose-500/30 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* All Members Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          Loading members...
        </div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No members yet</p>
          <p className="text-xs text-slate-500">Share your organization link for voters to apply.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {[...approved, ...rejected].map((member) => {
                const config = statusConfig[member.status] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                return (
                  <tr key={member.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3 text-sm text-white font-medium">
                      {member.user.name || 'Anonymous'}
                    </td>
                    <td className="px-5 py-3 text-xs text-cyan-400 font-mono">{member.user.email}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 w-fit">
                        {member.role === 'OWNER' && <Crown className="w-3 h-3 text-amber-400" />}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${config.color}`}>
                        <StatusIcon className="w-3 h-3" /> {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
