import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Search, X, ChevronDown, Check, Pencil, ExternalLink } from 'lucide-react';
import api from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ─── Types ─── */

interface EnterpriseContact {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  useCase: string;
  monthlyVolume: string;
  phone?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  user?: { id: string; email: string; name?: string; subscriptionTier: string } | null;
}

interface EnterpriseConfig {
  id: string;
  userId: string;
  customRequestLimit: number;
  customRetentionDays: number;
  customTeamMembers: number;
  monthlyPrice: number;
  contractStart: string;
  contractEnd?: string | null;
  notes?: string | null;
}

interface EnterpriseUser {
  id: string;
  email: string;
  name?: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  planStartedAt: string;
  monthlyRequestLimit: number;
  monthlyRequestCount: number;
  enterpriseConfig?: EnterpriseConfig | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ─── Status badge ─── */

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  qualified: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  closed_won: 'bg-emerald-100 text-emerald-800 font-semibold dark:bg-emerald-900/40 dark:text-emerald-300',
  closed_lost: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${STATUS_COLORS[status] || 'bg-muted text-muted-foreground'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

/* ─── Lead Detail Modal ─── */

function LeadDetailModal({
  lead,
  onClose,
  onUpdated,
  onGrant,
}: {
  lead: EnterpriseContact;
  onClose: () => void;
  onUpdated: () => void;
  onGrant: (lead: EnterpriseContact) => void;
}) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/enterprise/leads/${lead.id}`, { status, adminNotes: notes });
      setMsg('Saved');
      onUpdated();
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Lead Details</h2>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Name</p><p className="font-medium">{lead.name}</p></div>
            <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{lead.email}</p></div>
            <div><p className="text-muted-foreground text-xs">Company</p><p className="font-medium">{lead.company}</p></div>
            <div><p className="text-muted-foreground text-xs">Role</p><p className="font-medium">{lead.role}</p></div>
            <div><p className="text-muted-foreground text-xs">Monthly Volume</p><p className="font-medium">{lead.monthlyVolume}</p></div>
            <div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium">{lead.phone || '—'}</p></div>
            <div><p className="text-muted-foreground text-xs">Submitted</p><p className="font-medium">{formatDate(lead.createdAt)}</p></div>
            {lead.user && (
              <div><p className="text-muted-foreground text-xs">Account Tier</p><p className="font-medium">{lead.user.subscriptionTier}</p></div>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Use Case</p>
            <p className="text-sm bg-muted/40 rounded p-2">{lead.useCase}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {['new', 'contacted', 'qualified', 'closed_won', 'closed_lost'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Internal notes..."
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {msg && <span className="text-xs text-muted-foreground self-center">{msg}</span>}
          <div className="flex-1" />
          <Button onClick={() => onGrant(lead)} size="sm" variant="default">
            Grant Enterprise
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Grant Enterprise Modal ─── */

function GrantEnterpriseModal({
  prefillEmail,
  prefillUserId,
  onClose,
  onSuccess,
}: {
  prefillEmail?: string;
  prefillUserId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [userEmail, setUserEmail] = useState(prefillEmail || '');
  const [userId, setUserId] = useState(prefillUserId || '');
  const [lookupMsg, setLookupMsg] = useState('');
  const [customRequestLimit, setCustomRequestLimit] = useState(999999999);
  const [customRetentionDays, setCustomRetentionDays] = useState(365);
  const [customTeamMembers, setCustomTeamMembers] = useState(999);
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [contractEnd, setContractEnd] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [charged, setCharged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const lookupUser = async () => {
    if (!userEmail.trim()) return;
    try {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(userEmail)}&limit=1`);
      const found = res.data.users?.[0];
      if (found) {
        setUserId(found.id);
        setLookupMsg(`Found: ${found.name || found.email} (${found.subscriptionTier})`);
      } else {
        setUserId('');
        setLookupMsg('No user found with that email');
      }
    } catch {
      setLookupMsg('Lookup failed');
    }
  };

  const handleSubmit = async () => {
    if (!userId) { setError('Please look up and select a user first'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/admin/enterprise/grant/${userId}`, {
        customRequestLimit,
        customRetentionDays,
        customTeamMembers,
        monthlyPrice,
        contractEnd: contractEnd || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        charged,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to grant Enterprise');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4">Grant Enterprise</h2>

        <div className="space-y-4">
          {/* User lookup */}
          {!prefillUserId && (
            <div>
              <label className="text-sm font-medium">User Email</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@company.com"
                  onKeyDown={(e) => e.key === 'Enter' && lookupUser()}
                />
                <Button variant="outline" size="sm" onClick={lookupUser}>Lookup</Button>
              </div>
              {lookupMsg && <p className="text-xs text-muted-foreground mt-1">{lookupMsg}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Request Limit / month</label>
              <Input
                type="number"
                value={customRequestLimit}
                onChange={(e) => setCustomRequestLimit(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Retention (days)</label>
              <Input
                type="number"
                value={customRetentionDays}
                onChange={(e) => setCustomRetentionDays(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Team Members</label>
              <Input
                type="number"
                value={customTeamMembers}
                onChange={(e) => setCustomTeamMembers(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Monthly Price ($)</label>
              <Input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Contract End (optional)</label>
            <Input
              type="date"
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for override"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Internal notes..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={charged}
              onChange={(e) => setCharged(e.target.checked)}
              className="rounded"
            />
            Charge for this (creates revenue invoice)
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting || !userId}>
              {submitting ? 'Granting...' : 'Grant Enterprise'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Config Modal ─── */

function EditConfigModal({
  user,
  config,
  onClose,
  onSuccess,
}: {
  user: EnterpriseUser;
  config: EnterpriseConfig;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customRequestLimit, setCustomRequestLimit] = useState(config.customRequestLimit);
  const [customRetentionDays, setCustomRetentionDays] = useState(config.customRetentionDays);
  const [customTeamMembers, setCustomTeamMembers] = useState(config.customTeamMembers);
  const [monthlyPrice, setMonthlyPrice] = useState(config.monthlyPrice);
  const [contractEnd, setContractEnd] = useState(
    config.contractEnd ? new Date(config.contractEnd).toISOString().split('T')[0] : ''
  );
  const [notes, setNotes] = useState(config.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/admin/enterprise/config/${user.id}`, {
        customRequestLimit,
        customRetentionDays,
        customTeamMembers,
        monthlyPrice,
        contractEnd: contractEnd || null,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update config');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold mb-1">Edit Enterprise Config</h2>
        <p className="text-sm text-muted-foreground mb-4">{user.name || user.email}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Request Limit / month</label>
              <Input type="number" value={customRequestLimit} onChange={(e) => setCustomRequestLimit(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Retention (days)</label>
              <Input type="number" value={customRetentionDays} onChange={(e) => setCustomRetentionDays(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Team Members</label>
              <Input type="number" value={customTeamMembers} onChange={(e) => setCustomTeamMembers(Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Monthly Price ($)</label>
              <Input type="number" value={monthlyPrice} onChange={(e) => setMonthlyPrice(Number(e.target.value))} className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Contract End (optional)</label>
            <Input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Config'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Leads Tab ─── */

function LeadsTab() {
  const [leads, setLeads] = useState<EnterpriseContact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<EnterpriseContact | null>(null);
  const [grantingLead, setGrantingLead] = useState<EnterpriseContact | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/enterprise/leads?${params}`);
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {['new', 'contacted', 'qualified', 'closed_won', 'closed_lost'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <Button onClick={() => { setShowGrantModal(true); setGrantingLead(null); }}>
          + Grant Enterprise
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No enterprise leads found</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                {['Date', 'Name', 'Company', 'Role', 'Volume', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3">{lead.company}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.role}</td>
                  <td className="px-4 py-3">{lead.monthlyVolume}</td>
                  <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setSelectedLead(lead)}>
                        Details
                      </Button>
                      <Button size="sm" onClick={() => { setGrantingLead(lead); setShowGrantModal(true); }}>
                        Grant
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={() => { setSelectedLead(null); fetchLeads(); }}
          onGrant={(lead) => { setSelectedLead(null); setGrantingLead(lead); setShowGrantModal(true); }}
        />
      )}

      {/* Grant Modal */}
      {showGrantModal && (
        <GrantEnterpriseModal
          prefillEmail={grantingLead?.email}
          prefillUserId={grantingLead?.user?.id}
          onClose={() => { setShowGrantModal(false); setGrantingLead(null); }}
          onSuccess={() => { setShowGrantModal(false); setGrantingLead(null); fetchLeads(); }}
        />
      )}
    </div>
  );
}

/* ─── Enterprise Users Tab ─── */

function EnterpriseUsersTab() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<{ user: EnterpriseUser; config: EnterpriseConfig } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await api.get(`/admin/enterprise/users?${params}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No enterprise users yet</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                {['User', 'Request Limit', 'Retention', 'Team', 'Price/mo', 'Contract End', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const cfg = u.enterpriseConfig;
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {cfg ? cfg.customRequestLimit.toLocaleString() : u.monthlyRequestLimit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{cfg ? `${cfg.customRetentionDays}d` : '—'}</td>
                    <td className="px-4 py-3">{cfg ? cfg.customTeamMembers : '—'}</td>
                    <td className="px-4 py-3">{cfg ? `$${cfg.monthlyPrice}` : '—'}</td>
                    <td className="px-4 py-3">
                      {cfg?.contractEnd ? new Date(cfg.contractEnd).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {cfg && (
                          <Button variant="outline" size="sm" onClick={() => setEditUser({ user: u, config: cfg })}>
                            <Pencil className="h-3 w-3 mr-1" />Edit
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${u.id}`)}>
                          <ExternalLink className="h-3 w-3 mr-1" />View
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
          </div>
        </div>
      )}

      {editUser && (
        <EditConfigModal
          user={editUser.user}
          config={editUser.config}
          onClose={() => setEditUser(null)}
          onSuccess={() => { setEditUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function EnterprisePage() {
  const [tab, setTab] = useState<'leads' | 'users'>('leads');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-7 w-7" /> Enterprise
        </h1>
        <p className="text-muted-foreground mt-1">Manage enterprise leads and custom configurations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([['leads', 'Leads', Building2], ['users', 'Enterprise Users', Users]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'leads' ? <LeadsTab /> : <EnterpriseUsersTab />}
    </div>
  );
}
