'use client';

import { Settings, ShieldCheck, User } from 'lucide-react';
import { BiometricEnrollment } from '@/app/components/biometric-enrollment';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyan-400" /> Account Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account security and biometric credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" /> Personal Information
          </h2>
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
            <p className="text-sm text-slate-400">
              Profile management features will be available in a future update.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Security
          </h2>
          <BiometricEnrollment />
        </div>
      </div>
    </div>
  );
}
