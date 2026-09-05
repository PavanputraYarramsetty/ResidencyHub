import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Settings, Hotel, Shield, Phone, Mail, MapPin } from 'lucide-react';

export function OwnerSettings() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
          <Settings className="w-6 h-6 text-blue-600" />
          Residency & Profile Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">Configuration details for Sridevi Residency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Residency Details */}
        <Card className="space-y-4 border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Hotel className="w-4 h-4 text-blue-600" /> Residency Profile
          </h4>
          <div className="space-y-3 text-xs">
            <Input label="Residency Name" value="SRIDEVI RESIDENCY" disabled />
            <Input label="Registration Number" value="AP-VJA-LODGE-2026-89" disabled />
            <Input label="Official Contact" value="+91 94910 08797" disabled />
            <Input label="Operating Timezone" value="Asia/Kolkata (IST - UTC+05:30)" disabled />
            <Input label="Location" value="Beside Main Bus Stand, Vijayawada, AP" disabled />
          </div>
        </Card>

        {/* User Account */}
        <Card className="space-y-4 border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" /> Current Session Profile
          </h4>
          <div className="space-y-3 text-xs">
            <Input label="Full Name" value={profile?.full_name || 'Front Desk Owner'} disabled />
            <Input label="Email" value={profile?.email || 'owner@sridevi.com'} disabled />
            <Input label="Assigned Role" value={profile?.role?.toUpperCase() || 'OWNER'} disabled />
            <Input label="Phone" value={profile?.phone || '+91 94910 08797'} disabled />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default OwnerSettings;

