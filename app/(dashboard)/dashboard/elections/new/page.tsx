'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Vote,
  Fingerprint,
  Calendar,
  UserPlus,
  Trash2,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface Org {
  id: string;
  name: string;
  slug: string;
}

export default function CreateElectionPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('CANDIDATE_SELECTION');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [requireBiometric, setRequireBiometric] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  // Candidates / Options
  const [options, setOptions] = useState([
    { name: '', party: '', bio: '', imageUrl: '', type: 'CANDIDATE' },
    { name: '', party: '', bio: '', imageUrl: '', type: 'CANDIDATE' },
  ]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addOption = () => {
    setOptions([
      ...options,
      { name: '', party: '', bio: '', imageUrl: '', type: 'CANDIDATE' },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: string, value: string) => {
    const updated = [...options];
    (updated[index] as any)[field] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedOrgId) {
      setError('Please select or create an organization first.');
      return;
    }

    if (!title || !description) {
      setError('Title and description are required.');
      return;
    }

    const validOptions = options.filter((opt) => opt.name.trim().length > 0);
    if (validOptions.length < 2) {
      setError('At least 2 valid candidate/option names are required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          title,
          description,
          type,
          visibility,
          requireBiometric,
          startDate,
          endDate,
          options: validOptions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create election.');
      }

      router.push('/dashboard/elections');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Election</h1>
          <p className="text-xs text-slate-400">
            Configure secure voting terms, biometric gates, and candidate profiles.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Organization & Basic Info */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" /> Organization & Basic Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hosting Organization
              </label>
              {orgs.length > 0 ? (
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                >
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.slug})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between">
                  <span>No Organization found.</span>
                  <Link href="/dashboard/orgs/new" className="underline font-bold">
                    Create Org
                  </Link>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Election Title
              </label>
              <input
                type="text"
                placeholder="e.g., General Presidential Election 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Detail the scope, regulations, and candidates of this election..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
        </div>

        {/* Step 2: Election Type & Biometric Gate */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security & Biometrics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Election Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="CANDIDATE_SELECTION">Candidate Selection (Single Choice)</option>
                <option value="REFERENDUM">Referendum (Yes / No Motion)</option>
                <option value="MULTI_SELECT">Multi-Select Ballot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="PUBLIC">Public (Open to All Users)</option>
                <option value="PRIVATE">Private (Restricted Roll)</option>
                <option value="INVITE_ONLY">Invite Only</option>
              </select>
            </div>
          </div>

          {/* Biometric Toggle Switch */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Require Biometric Authentication</p>
                <p className="text-xs text-slate-400">
                  Enforces WebAuthn fingerprint or Face ID touch verification before ballot submit.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requireBiometric}
                onChange={(e) => setRequireBiometric(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 3: Candidate / Ballot Options */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Vote className="w-4 h-4 text-purple-400" /> Candidates & Ballot Choices
            </h2>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Candidate
            </button>
          </div>

          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shrink-0">
                  #{idx + 1}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Candidate / Option Name"
                    value={opt.name}
                    onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Party / Affiliation (Optional)"
                    value={opt.party}
                    onChange={(e) => handleOptionChange(idx, 'party', e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Bio / Manifesto (Optional)"
                    value={opt.bio}
                    onChange={(e) => handleOptionChange(idx, 'bio', e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
          >
            {loading ? 'Publishing Election...' : 'Publish Election Now'}
          </button>
        </div>
      </form>
    </div>
  );
}
