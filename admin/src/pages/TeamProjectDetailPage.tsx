import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/* ─── Local badge components ─── */

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    FREE: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    STARTER: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    PRO: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    ENTERPRISE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[tier] || styles.FREE}`}>
      {tier}
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

interface ProjectDetail {
  project: {
    id: string;
    name: string;
    createdAt: string;
    owner: { id: string; email: string; name: string | null; subscriptionTier: string };
  };
  members: Array<{
    userId: string;
    email: string;
    name: string | null;
    tier: string;
    role: string;
    joinedAt: string;
  }>;
  invitations: Array<{
    id: string;
    invitedEmail: string;
    role: string;
    status: string;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
    sentBy: { id: string; email: string; name: string | null };
  }>;
}

/* ─── Main Component ─── */

export default function TeamProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    api.get(`/admin/collaboration/projects/${projectId}`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Project not found</div>;
  }

  const { project, members, invitations } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground text-sm">
              Owned by {project.owner.name || project.owner.email}
            </p>
            <TierBadge tier={project.owner.subscriptionTier} />
          </div>
        </div>
      </div>

      {/* Members Card */}
      <Card>
        <CardHeader><CardTitle>Members ({members.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Tier</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No members yet</td></tr>
                ) : members.map((m) => (
                  <tr
                    key={m.userId}
                    className="border-b border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => navigate(`/users/${m.userId}`)}
                  >
                    <td className="p-3 font-medium">{m.email}</td>
                    <td className="p-3 text-muted-foreground">{m.name || '—'}</td>
                    <td className="p-3"><TierBadge tier={m.tier} /></td>
                    <td className="p-3"><RoleBadge role={m.role} /></td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDate(m.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invitations Card */}
      <Card>
        <CardHeader><CardTitle>Invitations ({invitations.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Invited Email</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Expires</th>
                  <th className="text-left p-3 font-medium">Accepted</th>
                  <th className="text-left p-3 font-medium">Sent By</th>
                </tr>
              </thead>
              <tbody>
                {invitations.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No invitations yet</td></tr>
                ) : invitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-border hover:bg-accent/50">
                    <td className="p-3 font-medium">{inv.invitedEmail}</td>
                    <td className="p-3"><RoleBadge role={inv.role} /></td>
                    <td className="p-3"><InvStatusBadge status={inv.status} /></td>
                    <td className="p-3 text-xs text-muted-foreground">{formatDate(inv.expiresAt)}</td>
                    <td className="p-3 text-xs text-muted-foreground">{inv.acceptedAt ? formatDate(inv.acceptedAt) : '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">{inv.sentBy.name || inv.sentBy.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
