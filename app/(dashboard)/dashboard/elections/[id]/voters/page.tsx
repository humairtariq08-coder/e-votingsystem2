'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  CheckCircle2,
  ArrowLeft,
  Trash2,
  Mail,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface VoterRollEntry {
  id: string;
  email: string;
  status: string;
  addedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

interface OrgMember {
  id: string;
  userId: string;
  role: string;
  status: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function ElectionVotersPage() {
  const params = useParams();
  const electionId = params.id as string;

  const [voterRoll, setVoterRoll] = useState<VoterRollEntry[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [electionOrgId, setElectionOrgId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [electionId]);

  const fetchData = async () => {
    try {
      // Get voter roll
      const rollRes = await fetch(`/api/elections/${electionId}/voter-roll`);
      if (rollRes.ok) {
        const rollData = await rollRes.json();
        setVoterRoll(rollData);
      }

      // Get election to find org ID
      const elRes = await fetch(`/api/elections/${electionId}`);
      if (elRes.ok) {
        const elData = await elRes.json();
        setElectionOrgId(elData.organizationId);

        // Get approved org members
        const membersRes = await fetch(`/api/organizations/${elData.organizationId}/members`);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setOrgMembers(membersData.filter((m: OrgMember) => m.status === 'APPROVED'));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter out members already on the voter roll
  const voterRollUserIds = voterRoll.map((v) => v.user?.id).filter(Boolean);
  const availableMembers = orgMembers.filter(
    (m) => !voterRollUserIds.includes(m.userId) && m.role === 'VOTER'
  );

  const filteredAvailable = availableMembers.filter(
    (m) =>
      m.user.email.toLowerCase().includes(search.toLowerCase()) ||
      m.user.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (selectedUserIds.length === filteredAvailable.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredAvailable.map((m) => m.userId));
    }
  };

  const handleAddToRoll = async () => {
    if (selectedUserIds.length === 0) return;
    setAdding(true);

    try {
      const res = await fetch(`/api/elections/${electionId}/voter-roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds }),
      });

      if (res.ok) {
        setSelectedUserIds([]);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (rollId: string) => {
    try {
      await fetch(`/api/elections/${electionId}/voter-roll?rollId=${rollId}`, {
        method: 'DELETE',
      });
      setVoterRoll((prev) => prev.filter((v) => v.id !== rollId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">Loading voter management...</div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/elections/${electionId}`}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" /> Election Voter Roll
          </h1>
          <p className="text-xs text-slate-400">
            Add approved organization voters to this election. Only voters on this list can cast a ballot.
          </p>
        </div>
      </div>

      {/* Current Voter Roll */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Current Voter Roll ({voterRoll.length})
        </h2>

        {voterRoll.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-sm text-slate-500">
            No voters assigned yet. Add approved organization members below.
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Voter</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Added</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {voterRoll.map((entry, idx) => (
                  <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3 text-xs text-slate-500 font-mono">{idx + 1}</td>
                    <td className="px-5 py-3 text-sm text-white font-medium">
                      {entry.user?.name || 'Anonymous'}
                    </td>
                    <td className="px-5 py-3 text-xs text-cyan-400 font-mono">{entry.email}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(entry.addedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleRemove(entry.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Voters Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-purple-400" /> Add Approved Members to Voter Roll
        </h2>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {filteredAvailable.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-sm text-slate-500">
            {availableMembers.length === 0
              ? 'All approved voters have already been added to this election, or no voters have been approved yet.'
              : 'No matching members found.'}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={selectAll}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                {selectedUserIds.length === filteredAvailable.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleAddToRoll}
                disabled={selectedUserIds.length === 0 || adding}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition disabled:opacity-40 flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {adding ? 'Adding...' : `Add ${selectedUserIds.length} to Voter Roll`}
              </button>
            </div>

            <div className="space-y-2">
              {filteredAvailable.map((member, idx) => {
                const isSelected = selectedUserIds.includes(member.userId);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => toggleSelect(member.userId)}
                    className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 border-cyan-400 text-white'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{member.user.name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {member.user.email}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
