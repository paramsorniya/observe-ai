import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight,
  Download, Tag, Filter, X, ArrowUpDown, ArrowUp, ArrowDown,
  Flame, Ghost, RotateCcw, Sparkles, Activity, Clock, AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import api from '@/lib/axios';
import { formatDate, formatNumber } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ─── Types ─── */

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  userStatus: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyRequestCount: number;
  monthlyRequestLimit: number;
  apiCallsThisMonth: number;
  totalApiCallsLifetime: number;
  freeLimitHitCount: number;
  firstApiCallAt: string | null;
  lastApiCallAt: string | null;
  lastActiveAt: string;
  planStartedAt: string;
  isBanned: boolean;
  referralSource: string | null;
  createdAt: string;
  tags: string[];
  hasPlanChanges: boolean;
  daysSinceLastActivity: number | null;
  _count: { projects: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SegmentCounts {
  hot_upgrade_leads: number;
  ghosts: number;
  win_back: number;
  new_this_month: number;
  new_active: number;
  long_term_free: number;
  going_dormant: number;
}

/* ─── Status badge component ─── */

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Active' },
  dormant: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Dormant' },
  ghost: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Ghost' },
  integrated: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Integrated' },
  churned: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: 'Churned' },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.ghost;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

const TIER_LABELS: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Pro',
  PRO: 'Pro Plus',
  ENTERPRISE: 'Enterprise',
};

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    FREE: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    STARTER: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    PRO: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    ENTERPRISE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[tier] || colors.FREE}`}>
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}

/* ─── Segment shortcut button data ─── */

const SEGMENTS = [
  { key: 'hot_upgrade_leads', label: 'Hot Upgrade Leads', icon: Flame, color: 'text-orange-500' },
  { key: 'ghosts', label: 'Ghosts', icon: Ghost, color: 'text-red-500' },
  { key: 'win_back', label: 'Win-back', icon: RotateCcw, color: 'text-purple-500' },
  { key: 'new_this_month', label: 'New This Month', icon: Sparkles, color: 'text-blue-500' },
  { key: 'new_active', label: 'New + Active', icon: Activity, color: 'text-green-500' },
  { key: 'long_term_free', label: 'Long-term Free', icon: Clock, color: 'text-cyan-500' },
  { key: 'going_dormant', label: 'Going Dormant', icon: AlertTriangle, color: 'text-yellow-500' },
];

/* ─── Sort columns ─── */

type SortKey = 'email' | 'createdAt' | 'lastApiCallAt' | 'firstApiCallAt' | 'apiCallsThisMonth' | 'freeLimitHitCount' | 'totalApiCallsLifetime' | 'lastActiveAt' | 'monthlyRequestCount';

/* ─── Main component ─── */

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [segmentCounts, setSegmentCounts] = useState<SegmentCounts | null>(null);
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [activeSegment, setActiveSegment] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [planHistoryFilter, setPlanHistoryFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [limitHitFilter, setLimitHitFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<SortKey>('lastApiCallAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Tag dialog
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');

  const buildParams = useCallback((page = 1) => {
    const params: Record<string, string | number> = { page, limit: 20, sortBy, sortOrder };
    if (search) params.search = search;
    if (activeSegment) params.segment = activeSegment;
    if (userStatus) params.userStatus = userStatus;
    if (tierFilter) params.tier = tierFilter;
    if (planHistoryFilter) params.planHistoryFilter = planHistoryFilter;
    if (activityFilter) params.activityFilter = activityFilter;
    if (limitHitFilter) params.limitHitFilter = limitHitFilter;
    if (tagFilter) params.tag = tagFilter;
    return params;
  }, [search, activeSegment, userStatus, tierFilter, planHistoryFilter, activityFilter, limitHitFilter, tagFilter, sortBy, sortOrder]);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = buildParams(page);
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {} finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchSegments = async () => {
    try {
      const res = await api.get('/admin/users/segments');
      setSegmentCounts(res.data);
    } catch {}
  };

  const fetchTags = async () => {
    try {
      const res = await api.get('/admin/users/tags');
      setAllTags(res.data.tags);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchSegments();
    fetchTags();
  }, []);

  // Re-fetch when filters change (debounced via segment/filter buttons)
  const applyFilters = (page = 1) => {
    setSelected(new Set());
    fetchUsers(page);
  };

  const handleSegment = (key: string) => {
    const newSegment = activeSegment === key ? '' : key;
    setActiveSegment(newSegment);
    // Clear other filters when using a segment
    if (newSegment) {
      setUserStatus('');
      setTierFilter('');
      setPlanHistoryFilter('');
      setActivityFilter('');
      setLimitHitFilter('');
    }
    // Use setTimeout to allow state to settle
    setTimeout(() => fetchUsers(1), 0);
  };

  const clearAllFilters = () => {
    setSearch('');
    setActiveSegment('');
    setUserStatus('');
    setTierFilter('');
    setPlanHistoryFilter('');
    setActivityFilter('');
    setLimitHitFilter('');
    setTagFilter('');
    setTimeout(() => fetchUsers(1), 0);
  };

  const hasActiveFilters = activeSegment || userStatus || tierFilter || planHistoryFilter || activityFilter || limitHitFilter || tagFilter || search;

  // Sort handler
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
    setTimeout(() => fetchUsers(1), 0);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  // CSV export
  const handleExport = async () => {
    try {
      const params = buildParams(1);
      // If specific users are selected, we export just them via IDs
      // Otherwise, export based on current filters
      const res = await api.get('/admin/users/export', {
        params,
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  // Bulk tag
  const handleBulkTag = async () => {
    if (!newTag.trim() || selected.size === 0) return;
    try {
      await api.post('/admin/users/bulk-tag', {
        userIds: Array.from(selected),
        tag: newTag.trim(),
      });
      setNewTag('');
      setShowTagDialog(false);
      fetchUsers(pagination.page);
      fetchTags();
    } catch {}
  };

  // Ban/Unban/Delete (single user)
  const handleBan = async (userId: string) => {
    if (!confirm('Ban this user?')) return;
    await api.post(`/admin/users/${userId}/ban`);
    fetchUsers(pagination.page);
  };

  const handleUnban = async (userId: string) => {
    await api.post(`/admin/users/${userId}/unban`);
    fetchUsers(pagination.page);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Permanently delete this user and all their data?')) return;
    await api.delete(`/admin/users/${userId}`);
    fetchUsers(pagination.page);
  };

  const formatShortDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => setShowTagDialog(true)}>
                <Tag className="h-3.5 w-3.5 mr-1.5" /> Tag
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
              </Button>
            </>
          )}
          {selected.size === 0 && hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export Filtered
            </Button>
          )}
        </div>
      </div>

      {/* ─── Segment Shortcuts ─── */}
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map((seg) => {
          const count = segmentCounts ? (segmentCounts as any)[seg.key] : null;
          const isActive = activeSegment === seg.key;
          return (
            <button
              key={seg.key}
              onClick={() => handleSegment(seg.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
                ${isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              <seg.icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : seg.color}`} />
              {seg.label}
              {count !== null && count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold
                  ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Search + Filter Toggle ─── */}
      <div className="flex items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); applyFilters(1); }} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name..."
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
        <Button
          size="sm"
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filters
          {hasActiveFilters && !activeSegment && (
            <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 text-[10px]">!</span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={clearAllFilters}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* ─── Filter Panel ─── */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Status</label>
                <select value={userStatus} onChange={(e) => { setUserStatus(e.target.value); setActiveSegment(''); setTimeout(() => applyFilters(1), 0); }} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="ghost">Ghost</option>
                  <option value="integrated">Integrated</option>
                  <option value="dormant">Dormant</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Plan</label>
                <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setActiveSegment(''); setTimeout(() => applyFilters(1), 0); }} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  <option value="">All</option>
                  <option value="FREE">Free</option>
                  <option value="STARTER">Pro</option>
                  <option value="PRO">Pro Plus</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Activity</label>
                <select value={activityFilter} onChange={(e) => { setActivityFilter(e.target.value); setActiveSegment(''); setTimeout(() => applyFilters(1), 0); }} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  <option value="">All</option>
                  <option value="active_7d">Active last 7d</option>
                  <option value="active_30d">Active last 30d</option>
                  <option value="never_active">Never active</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Limit Hits</label>
                <select value={limitHitFilter} onChange={(e) => { setLimitHitFilter(e.target.value); setActiveSegment(''); setTimeout(() => applyFilters(1), 0); }} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  <option value="">All</option>
                  <option value="hit_1">Hit 1+ times</option>
                  <option value="hit_3">Hit 3+ times</option>
                  <option value="never">Never hit</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Plan History</label>
                <select value={planHistoryFilter} onChange={(e) => { setPlanHistoryFilter(e.target.value); setActiveSegment(''); setTimeout(() => applyFilters(1), 0); }} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  <option value="">All</option>
                  <option value="free_never_upgraded">Free, never upgraded</option>
                  <option value="was_paid_now_free">Was paid, now free</option>
                  <option value="currently_paid">Currently paid</option>
                  <option value="upgraded_last_30d">Upgraded last 30d</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1 block">Tag</label>
                <select value={tagFilter} onChange={(e) => { setTagFilter(e.target.value); setTimeout(() => applyFilters(1), 0); }} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  <option value="">All</option>
                  {allTags.map((t) => (
                    <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Tag Dialog (inline) ─── */}
      {showTagDialog && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-sm font-medium">Tag {selected.size} users:</span>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="e.g. contacted, high-priority, demo-scheduled"
              className="max-w-xs"
            />
            <Button size="sm" onClick={handleBulkTag} disabled={!newTag.trim()}>Apply Tag</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowTagDialog(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Users Table ─── */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-2 w-8">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selected.size === users.length}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-2 font-medium">User</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Plan</th>
                  <th className="text-left p-2 font-medium cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                    <span className="inline-flex items-center gap-1">Registered <SortIcon col="createdAt" /></span>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer select-none" onClick={() => handleSort('firstApiCallAt')}>
                    <span className="inline-flex items-center gap-1">First Call <SortIcon col="firstApiCallAt" /></span>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer select-none" onClick={() => handleSort('lastApiCallAt')}>
                    <span className="inline-flex items-center gap-1">Last Active <SortIcon col="lastApiCallAt" /></span>
                  </th>
                  <th className="text-right p-2 font-medium cursor-pointer select-none" onClick={() => handleSort('apiCallsThisMonth')}>
                    <span className="inline-flex items-center gap-1 justify-end">Calls/mo <SortIcon col="apiCallsThisMonth" /></span>
                  </th>
                  <th className="text-right p-2 font-medium cursor-pointer select-none" onClick={() => handleSort('freeLimitHitCount')}>
                    <span className="inline-flex items-center gap-1 justify-end">Limit Hits <SortIcon col="freeLimitHitCount" /></span>
                  </th>
                  <th className="text-right p-2 font-medium">Days Inactive</th>
                  <th className="text-right p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-8 text-muted-foreground">No users found</td></tr>
                ) : users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border hover:bg-accent/50 cursor-pointer ${selected.has(user.id) ? 'bg-primary/5' : ''}`}
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-sm leading-tight">{user.name || '—'}</p>
                          <p className="text-[11px] text-muted-foreground">{user.email}</p>
                        </div>
                        {user.tags.length > 0 && (
                          <div className="flex gap-1">
                            {user.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                                {tag}
                              </span>
                            ))}
                            {user.tags.length > 2 && (
                              <span className="text-[9px] text-muted-foreground">+{user.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      {user.isBanned ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">
                          Banned
                        </span>
                      ) : (
                        <StatusBadge status={user.userStatus} />
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <TierBadge tier={user.subscriptionTier} />
                        {user.hasPlanChanges && (
                          <span title="Has plan change history" className="text-muted-foreground">
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-muted-foreground text-xs whitespace-nowrap">{formatShortDate(user.createdAt)}</td>
                    <td className="p-2 text-muted-foreground text-xs whitespace-nowrap">{formatShortDate(user.firstApiCallAt)}</td>
                    <td className="p-2 text-muted-foreground text-xs whitespace-nowrap">{formatShortDate(user.lastApiCallAt)}</td>
                    <td className="p-2 text-right text-muted-foreground tabular-nums">{formatNumber(user.apiCallsThisMonth)}</td>
                    <td className="p-2 text-right tabular-nums">
                      {user.freeLimitHitCount > 0 ? (
                        <span className="text-orange-500 font-medium">{user.freeLimitHitCount}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {user.daysSinceLastActivity !== null ? (
                        <span className={user.daysSinceLastActivity > 14 ? 'text-red-500' : user.daysSinceLastActivity > 7 ? 'text-yellow-500' : 'text-muted-foreground'}>
                          {user.daysSinceLastActivity}d
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        {user.isBanned ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnban(user.id)} title="Unban">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleBan(user.id)} title="Ban">
                            <Ban className="h-3.5 w-3.5 text-yellow-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(user.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Pagination ─── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
