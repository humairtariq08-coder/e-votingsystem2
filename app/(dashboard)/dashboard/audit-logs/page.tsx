'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Building2,
  Vote,
  Users,
  Settings,
  UserPlus,
  FileText,
  Clock,
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

const actionConfig: Record<string, { icon: any; color: string; label: string }> = {
  ELECTION_CREATED: { icon: Vote, color: 'text-cyan-400', label: 'Election Created' },
  ELECTION_CLOSED: { icon: Vote, color: 'text-amber-400', label: 'Election Closed' },
  ORGANIZATION_CREATED: { icon: Building2, color: 'text-emerald-400', label: 'Organization Created' },
  VOTER_ADDED: { icon: UserPlus, color: 'text-purple-400', label: 'Voter Added' },
  MEMBER_INVITED: { icon: Users, color: 'text-blue-400', label: 'Member Invited' },
  SETTINGS_UPDATED: { icon: Settings, color: 'text-amber-400', label: 'Settings Updated' },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.email.toLowerCase().includes(search.toLowerCase()) ||
      log.organization.name.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction ? log.action === filterAction : true;
    return matchSearch && matchAction;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" /> Immutable Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Every administrative action is permanently logged for compliance and transparency. These records cannot be modified or deleted.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, user, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {actionConfig[action]?.label || action}
            </option>
          ))}
        </select>
      </div>

      {/* Log Entries */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          Loading audit trail...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No audit entries found</p>
          <p className="text-xs text-slate-500">Actions will appear here as you create elections and manage organizations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log, idx) => {
            const config = actionConfig[log.action] || {
              icon: FileText,
              color: 'text-slate-400',
              label: log.action,
            };
            const Icon = config.icon;
            let meta: any = {};
            try {
              meta = log.metadata ? JSON.parse(log.metadata) : {};
            } catch {}

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition flex items-start gap-4"
              >
                <div className={`w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                      {log.targetType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    By <span className="text-slate-200 font-medium">{log.user.name || log.user.email}</span>
                    {' in '}
                    <span className="text-cyan-400 font-medium">{log.organization.name}</span>
                  </p>

                  {meta.title && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      Target: {meta.title || meta.name}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
