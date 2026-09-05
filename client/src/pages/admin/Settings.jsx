import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Building, ShieldCheck, Database, Key, Clock, Globe } from 'lucide-react';

export function AdminSettings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
          <Building className="w-6 h-6 text-purple-600" />
          Residency System Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">Master system settings, 24-hour stay rules, and Supabase integration readiness</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Rules */}
        <Card className="space-y-4 border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Lodge Policy Engine
          </h4>
          <div className="space-y-3 text-xs">
            <Input label="Residency Name" value="SRIDEVI RESIDENCY" disabled />
            <Input label="Minimum Stay Billing Unit" value="24 Hours (Minimum 1 Cycle Rule)" disabled />
            <Input label="Default Timezone" value="Asia/Kolkata (IST)" disabled />
            <Input label="Default Currency" value="INR (₹)" disabled />
          </div>
        </Card>

        {/* Database & Security */}
        <Card className="space-y-4 border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" /> Database & Storage Specs
          </h4>
          <div className="space-y-3 text-xs">
            <Input label="Database Target" value="Supabase PostgreSQL (Ready for reconnect)" disabled />
            <Input label="Document Storage" value="Private Supabase Storage (Aadhaar/Passports)" disabled />
            <Input label="Access Control" value="Role-Based Row Level Security (RLS)" disabled />
            <Input label="Real-time Subscriptions" value="Universal Event Broadcast Ready" disabled />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AdminSettings;

