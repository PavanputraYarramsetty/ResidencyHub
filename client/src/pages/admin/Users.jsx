import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { ShieldCheck, Plus, UserCheck, Shield } from 'lucide-react';

const INITIAL_USERS = [
  { id: '1', full_name: 'Front Desk Owner', email: 'owner@sridevi.com', role: 'owner', phone: '+91 94910 08797', is_active: true },
  { id: '2', full_name: 'System Admin', email: 'admin@sridevi.com', role: 'admin', phone: '+91 98480 22338', is_active: true },
  { id: '3', full_name: 'Night Shift Manager', email: 'manager@sridevi.com', role: 'manager', phone: '+91 98765 43210', is_active: true },
  { id: '4', full_name: 'Day Receptionist', email: 'reception@sridevi.com', role: 'receptionist', phone: '+91 91234 56789', is_active: true },
];

export function AdminUsers() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('receptionist');
  const [phone, setPhone] = useState('');

  function handleCreateUser(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const newUser = {
      id: `user-${Date.now()}`,
      full_name: name.trim(),
      email: email.trim(),
      role,
      phone: phone.trim() || '+91 90000 00000',
      is_active: true,
    };
    setUsers((prev) => [...prev, newUser]);
    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            User & Role Management
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage lodge staff accounts, access tiers, and security policies</p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Staff Member
        </Button>
      </div>

      <Card className="overflow-hidden p-0 border-[#1f293d] bg-[#121929]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1f293d] bg-[#161f33] text-gray-400 font-semibold uppercase tracking-wider">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#161f33]/60 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-600/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                        {u.full_name?.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-100">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300 font-mono">{u.email}</td>
                  <td className="p-4 text-gray-300 font-mono">{u.phone}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Badge variant="available">ACTIVE</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff User" maxWidth="max-w-md">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <Input label="Full Name *" placeholder="e.g. Ramesh Varma" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email Address *" type="email" placeholder="ramesh@sridevi.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Phone Number" placeholder="+91 98480 00000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Role Permission Tier</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#161f33] border border-[#24314c] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="owner">Owner / Business Head</option>
              <option value="receptionist">Receptionist / Front Desk</option>
              <option value="manager">Lodge Manager</option>
              <option value="accountant">Accountant</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>
          <div className="pt-3 border-t border-[#1f293d] flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create User Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminUsers;
