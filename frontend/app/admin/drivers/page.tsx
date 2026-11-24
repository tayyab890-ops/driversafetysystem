'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api, AdminDriverItem } from '@/lib/api';
import { 
  Users, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  Truck, 
  Mail, 
  Phone,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<AdminDriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVehicle, setNewVehicle] = useState('');

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminDrivers();
      setDrivers(data.drivers || []);
    } catch (err: any) {
      console.error('Failed to load fleet drivers:', err);
      setError(err?.message || 'Failed to load drivers from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const filteredDrivers = drivers.filter(d =>
    (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.toggleDriverStatus(id);
      setDrivers(prev => prev.map(d => 
        d.id === id ? { ...d, status: res.status as 'active' | 'inactive' | 'offline' } : d
      ));
    } catch (err: any) {
      console.error('Failed to toggle driver status:', err);
      alert(err?.message || 'Failed to update driver status');
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      setModalLoading(true);
      setModalError(null);
      const res = await api.createAdminDriver({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        vehicle: newVehicle.trim() || undefined,
      });

      const newDriver = (res as any).driver || res;
      setDrivers(prev => [newDriver, ...prev]);
      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewVehicle('');
    } catch (err: any) {
      console.error('Failed to enroll driver:', err);
      setModalError(err?.message || 'Failed to enroll driver. Email may already be in use.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        title="Fleet Driver Directory"
        subtitle="Manage licensed commercial operators & assigned vehicle hardware"
        role="admin"
        breadcrumbs={[
          { label: 'Fleet Operations', href: '/admin' },
          { label: 'Drivers' },
        ]}
        actionElement={
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus size={14} />}
            onClick={() => {
              setModalError(null);
              setAddModalOpen(true);
            }}
          >
            Enroll Driver
          </Button>
        }
      />

      <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Search */}
        <div className="p-4 rounded-2xl tactile-raised flex items-center justify-between">
          <div className="w-full sm:w-96">
            <Input
              placeholder="Search driver by name, ID, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[var(--text-muted)] hidden sm:inline">
              Total Enrolled: {drivers.length} Units
            </span>
            <button
              onClick={fetchDrivers}
              disabled={loading}
              title="Refresh Driver Directory"
              className="p-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs font-mono text-[var(--alert-coral)]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchDrivers}>
              Retry
            </Button>
          </div>
        )}

        {/* Drivers Table */}
        <div className="p-5 rounded-2xl tactile-raised overflow-hidden">
          {loading ? (
            <div className="py-16 text-center space-y-3 font-mono text-xs text-[var(--text-muted)]">
              <RefreshCw size={24} className="animate-spin mx-auto text-[var(--primary-blue)]" />
              <p>Retrieving commercial driver fleet directory...</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="py-16 text-center space-y-3 font-mono">
              <Users size={32} className="mx-auto text-[var(--text-muted)] opacity-60" />
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {searchTerm ? 'No drivers matching criteria' : 'No Enrolled Fleet Drivers Found'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search terms to find registered commercial drivers.'
                  : 'Enroll new commercial drivers to provision telemetry cabins and assign vehicle identifiers.'}
              </p>
              {!searchTerm && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<UserPlus size={14} />}
                    onClick={() => {
                      setModalError(null);
                      setAddModalOpen(true);
                    }}
                  >
                    Enroll First Driver
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Driver ID</th>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Vehicle Hardware</th>
                    <th className="py-3 px-3">Safety Index</th>
                    <th className="py-3 px-3">Total Monitored</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                  {filteredDrivers.map((d) => (
                    <tr key={d.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                        {d.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[var(--text-primary)]">{d.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{d.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        {d.vehicle}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${d.safetyScore >= 90 ? 'text-[var(--safety-mint)]' : 'text-[var(--warning-amber)]'}`}>
                          {d.safetyScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {d.totalHours} hrs
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={d.status === 'active' ? 'mint' : 'neutral'} size="sm">
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(d.id)}
                          className="px-2.5 py-1 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] text-[10px] cursor-pointer"
                        >
                          {d.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add Driver Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Enroll New Commercial Driver"
        subtitle="Provision cabin monitoring profile & link vehicle hardware"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddDriver} className="space-y-3.5">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-[var(--alert-coral)]">
              {modalError}
            </div>
          )}

          <Input
            label="Full Legal Name"
            placeholder="e.g. Johnathan Miller"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Input
            label="Corporate Fleet Email"
            type="email"
            placeholder="j.miller@safefleet.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <Input
            label="Contact Phone"
            type="tel"
            placeholder="+1 (555) 019-3321"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />

          <Input
            label="Vehicle ID / Plate Identifier"
            placeholder="VOLVO-XC90-#19"
            value={newVehicle}
            onChange={(e) => setNewVehicle(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={modalLoading}
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={modalLoading}
            >
              {modalLoading ? 'Enrolling...' : 'Enroll & Provision'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}