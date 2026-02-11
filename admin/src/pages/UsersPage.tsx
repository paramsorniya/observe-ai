import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';
import { formatDate, formatNumber } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyRequestCount: number;
  monthlyRequestLimit: number;
  isBanned: boolean;
  createdAt: string;
  lastActiveAt: string;
  _count: { projects: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (tierFilter) params.tier = tierFilter;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
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
        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setTimeout(() => fetchUsers(1), 0); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Tiers</option>
          <option value="FREE">Free</option>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Usage</th>
                  <th className="text-left p-3 font-medium">Projects</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No users found</td></tr>
                ) : users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td className="p-3">
                      <p className="font-medium">{user.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                        {user.subscriptionTier}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {formatNumber(user.monthlyRequestCount)} / {formatNumber(user.monthlyRequestLimit)}
                    </td>
                    <td className="p-3 text-muted-foreground">{user._count.projects}</td>
                    <td className="p-3">
                      {user.isBanned ? (
                        <span className="text-destructive text-xs font-medium">Banned</span>
                      ) : (
                        <span className="text-green-500 text-xs font-medium">{user.subscriptionStatus}</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(user.createdAt)}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {user.isBanned ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUnban(user.id)}>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleBan(user.id)}>
                            <Ban className="h-4 w-4 text-yellow-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Pagination */}
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
