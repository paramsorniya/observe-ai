import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/* ─── Local badge components ─── */

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Pro',
  PRO: 'Pro Plus',
  ENTERPRISE: 'Enterprise',
};

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    FREE: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    STARTER: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    PRO: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    ENTERPRISE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[tier] || styles.FREE}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

function InvStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    ACCEPTED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    EXPIRED: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    REVOKED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || styles.EXPIRED}`}>
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    VIEWER: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[role] || styles.VIEWER}`}>
      {role}
    </span>
  );
}

/* ─── Types ─── */

interface CollabStats {
  totalCollaborativeProjects: number;
  totalActiveMembers: number;
  totalInvitationsSent: number;
  pendingInvitations: number;
  invitationAcceptanceRate: number;
  topCollaboratingTier: string;
}

interface CollabProject {
  projectId: string;
  projectName: string;
  projectCreatedAt: string;
  owner: { id: string; email: string; name: string | null; subscriptionTier: string };
  memberCount: number;
  adminCount: number;
  viewerCount: number;
  pendingInviteCount: number;
  lastMemberJoinedAt: string | null;
}

interface CollabInvitation {
  id: string;
  invitedEmail: string;
  role: string;
  status: string;
  projectId: string;
  projectName: string;
  ownerEmail: string;
  sentBy: { id: string; email: string; name: string | null };
  sentAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

interface Pagination { page: number; limit: number; total: number; totalPages: number; }

/* ─── Main Component ─── */

export default function TeamsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CollabStats | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'invitations'>('projects');

  // Projects tab
  const [projects, setProjects] = useState<CollabProject[]>([]);
  const [projPagination, setProjPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [projLoading, setProjLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [debouncedProjectSearch, setDebouncedProjectSearch] = useState('');
  const [ownerTierFilter, setOwnerTierFilter] = useState('');
  const [hasPendingFilter, setHasPendingFilter] = useState(false);

  // Invitations tab
  const [invitations, setInvitations] = useState<CollabInvitation[]>([]);
  const [invPagination, setInvPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [invLoading, setInvLoading] = useState(false);
  const [invSearch, setInvSearch] = useState('');
  const [debouncedInvSearch, setDebouncedInvSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/collaboration/stats');
      setStats(res.data);
    } catch {}
  };

  const fetchProjects = async (page = 1) => {
    setProjLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (debouncedProjectSearch) params.search = debouncedProjectSearch;
      if (ownerTierFilter) params.ownerTier = ownerTierFilter;
      if (hasPendingFilter) params.hasPendingInvites = true;
      const res = await api.get('/admin/collaboration/projects', { params });
      setProjects(res.data.projects);
      setProjPagination(res.data.pagination);
    } catch {} finally {
      setProjLoading(false);
    }
  };

  const fetchInvitations = async (page = 1) => {
    setInvLoading(true);
    try {
      const params: any = { page, limit: 30 };
      if (debouncedInvSearch) params.search = debouncedInvSearch;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await api.get('/admin/collaboration/invitations', { params });
      setInvitations(res.data.invitations);
      setInvPagination(res.data.pagination);
    } catch {} finally {
      setInvLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProjectSearch(projectSearch), 400);
    return () => clearTimeout(t);
  }, [projectSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInvSearch(invSearch), 400);
    return () => clearTimeout(t);
  }, [invSearch]);

  useEffect(() => { fetchStats(); fetchProjects(1); }, []);
  useEffect(() => { fetchProjects(1); }, [debouncedProjectSearch, ownerTierFilter, hasPendingFilter]);
  useEffect(() => {
    if (activeTab === 'invitations') fetchInvitations(1);
  }, [activeTab, debouncedInvSearch, statusFilter, roleFilter, fromDate, toDate]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Teams</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Collaborative Projects</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalCollaborativeProjects ?? '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Members</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalActiveMembers ?? '—'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Invites</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.pendingInvitations ?? 0) > 0 ? 'text-yellow-500' : ''}`}>
              {stats?.pendingInvitations ?? '—'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats ? `${stats.invitationAcceptanceRate}%` : '—'}</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { key: 'projects', label: 'Projects' },
          { key: 'invitations', label: 'Invitations' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search project or owner…"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-md border border-input bg-background text-sm w-56 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select
              value={ownerTierFilter}
              onChange={(e) => setOwnerTierFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Tiers</option>
              <option value="FREE">Free</option>
              <option value="STARTER">Pro</option>
              <option value="PRO">Pro Plus</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={hasPendingFilter}
                onChange={(e) => setHasPendingFilter(e.target.checked)}
                className="rounded"
              />
              Pending invites only
            </label>
            {(projectSearch || ownerTierFilter || hasPendingFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setProjectSearch(''); setOwnerTierFilter(''); setHasPendingFilter(false); }}>
                Clear
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">Project</th>
                      <th className="text-left p-3 font-medium">Owner</th>
                      <th className="text-left p-3 font-medium">Members</th>
                      <th className="text-left p-3 font-medium">Pending</th>
                      <th className="text-left p-3 font-medium">Last Joined</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projLoading ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                    ) : projects.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No collaborative projects found</td></tr>
                    ) : projects.map((p) => (
                      <tr key={p.projectId} className="border-b border-border hover:bg-accent/50">
                        <td className="p-3 font-medium">{p.projectName}</td>
                        <td className="p-3">
                          <p className="text-sm">{p.owner.name || p.owner.email}</p>
                          <p className="text-xs text-muted-foreground">{p.owner.email}</p>
                          <div className="mt-0.5"><TierBadge tier={p.owner.subscriptionTier} /></div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{p.memberCount}</span>
                          <span className="text-xs text-muted-foreground ml-1">({p.adminCount}A, {p.viewerCount}V)</span>
                        </td>
                        <td className="p-3">
                          {p.pendingInviteCount > 0 ? (
                            <span className="text-yellow-500 font-medium">{p.pendingInviteCount}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {p.lastMemberJoinedAt ? formatDate(p.lastMemberJoinedAt) : '—'}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{formatDate(p.projectCreatedAt)}</td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/teams/${p.projectId}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {projPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {projPagination.page} of {projPagination.totalPages} ({projPagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={projPagination.page <= 1} onClick={() => fetchProjects(projPagination.page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={projPagination.page >= projPagination.totalPages} onClick={() => fetchProjects(projPagination.page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Invitations */}
      {activeTab === 'invitations' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search email or project…"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-md border border-input bg-background text-sm w-56 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {(invSearch || statusFilter || roleFilter || fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setInvSearch(''); setStatusFilter(''); setRoleFilter(''); setFromDate(''); setToDate(''); }}>
                Clear
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">Invited Email</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Project</th>
                      <th className="text-left p-3 font-medium">Sent By</th>
                      <th className="text-left p-3 font-medium">Sent</th>
                      <th className="text-left p-3 font-medium">Expires</th>
                      <th className="text-left p-3 font-medium">Accepted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invLoading ? (
                      <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                    ) : invitations.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No invitations found</td></tr>
                    ) : invitations.map((inv) => (
                      <tr key={inv.id} className="border-b border-border hover:bg-accent/50">
                        <td className="p-3 font-medium">{inv.invitedEmail}</td>
                        <td className="p-3"><RoleBadge role={inv.role} /></td>
                        <td className="p-3"><InvStatusBadge status={inv.status} /></td>
                        <td className="p-3">
                          <p className="font-medium">{inv.projectName}</p>
                          <p className="text-xs text-muted-foreground">{inv.ownerEmail}</p>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{inv.sentBy.name || inv.sentBy.email}</td>
                        <td className="p-3 text-xs text-muted-foreground">{formatDate(inv.sentAt)}</td>
                        <td className="p-3 text-xs text-muted-foreground">{formatDate(inv.expiresAt)}</td>
                        <td className="p-3 text-xs text-muted-foreground">{inv.acceptedAt ? formatDate(inv.acceptedAt) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {invPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {invPagination.page} of {invPagination.totalPages} ({invPagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={invPagination.page <= 1} onClick={() => fetchInvitations(invPagination.page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={invPagination.page >= invPagination.totalPages} onClick={() => fetchInvitations(invPagination.page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
