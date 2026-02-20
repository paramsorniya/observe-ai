import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Crown,
  Trash2,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useProjects } from '@/hooks/useProjects';
import api from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeatureLockedScreen } from '@/components/shared/FeatureLockedScreen';
import { useAuthStore } from '@/store/authStore';

type Role = 'OWNER' | 'ADMIN' | 'VIEWER';

interface TeamMember {
  id: string;
  role: Role;
  joinedAt: string;
  isOwner: boolean;
  user: { id: string; name: string | null; email: string } | null;
}

interface PendingInvitation {
  id: string;
  invitedEmail: string;
  role: Role;
  token: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
}

interface TeamData {
  ownerId: string;
  members: TeamMember[];
  pendingInvitations: PendingInvitation[];
}

const roleConfig: Record<Role, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }> = {
  OWNER: { label: 'Owner', icon: Crown, variant: 'default' },
  ADMIN: { label: 'Admin', icon: Shield, variant: 'secondary' },
  VIEWER: { label: 'Viewer', icon: Eye, variant: 'outline' },
};

function RoleBadge({ role }: { role: Role }) {
  const cfg = roleConfig[role];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function InviteLinkCopy({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/invite/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 text-xs h-7">
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : 'Copy link'}
    </Button>
  );
}

export default function TeamPage() {
  const { hasAccess, minimumPlan } = useFeatureAccess('team_collaboration');
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Check if current project is shared (user is a collaborator, not owner)
  const { data: projectsData } = useProjects();
  const allProjects = (projectsData as any)?.projects ?? projectsData ?? [];
  const currentProject = allProjects.find((p: any) => p.id === currentProjectId);
  const isSharedProject = currentProject && currentProject.isOwner === false;

  // Allow access if user has PRO+ OR if they're viewing a shared project (owner must have PRO+)
  const canAccess = hasAccess || isSharedProject;

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const {
    data: team,
    isLoading,
    error,
  } = useQuery<TeamData>({
    queryKey: ['team', currentProjectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${currentProjectId}/team`);
      return res.data;
    },
    enabled: canAccess && !!currentProjectId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/projects/${currentProjectId}/team/invitations`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      return res.data;
    },
    onSuccess: () => {
      setInviteEmail('');
      setInviteError(null);
      queryClient.invalidateQueries({ queryKey: ['team', currentProjectId] });
    },
    onError: (err: any) => {
      setInviteError(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) =>
      api.delete(`/projects/${currentProjectId}/team/invitations/${invitationId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', currentProjectId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/projects/${currentProjectId}/team/members/${memberId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', currentProjectId] }),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'ADMIN' | 'VIEWER' }) =>
      api.patch(`/projects/${currentProjectId}/team/members/${memberId}`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', currentProjectId] }),
  });

  if (!canAccess) {
    return (
      <FeatureLockedScreen
        feature="Team Collaboration"
        minimumPlan={minimumPlan ?? 'PRO'}
      />
    );
  }

  const isOwner = team?.ownerId === currentUser?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">
          Manage who has access to this project
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load team"
          description={(error as any)?.response?.data?.message || 'Something went wrong'}
        />
      ) : !currentProjectId ? (
        <EmptyState
          icon={Users}
          title="No project selected"
          description="Select a project to manage its team."
        />
      ) : (
        <>
          {/* Invite Member Card — OWNER and ADMIN only */}
          {(isOwner || team?.members.some((m) => !m.isOwner && m.user?.id === currentUser?.id && m.role === 'ADMIN')) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4" />
                  Invite a Team Member
                </CardTitle>
                <CardDescription>
                  Invite someone by email. They'll receive a link to join this project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteError(null);
                    }}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && inviteMutation.mutate()}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'VIEWER')}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="VIEWER">Viewer — read-only access</option>
                    <option value="ADMIN">Admin — can manage team</option>
                  </select>
                  <Button
                    onClick={() => inviteMutation.mutate()}
                    disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
                {inviteError && (
                  <p className="text-sm text-destructive mt-2">{inviteError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Invite links are valid for 7 days. Share the link manually with your colleague.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Members
                <Badge variant="secondary">{team?.members.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team?.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members yet
                </p>
              ) : (
                <div className="divide-y">
                  {team?.members.map((member) => {
                    const displayName = member.user?.name || member.user?.email || '—';
                    const displayEmail = member.user?.email;
                    const isMe = member.user?.id === currentUser?.id;
                    const isMemberOwner = member.isOwner;

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-3 gap-4"
                      >
                        {/* Avatar + info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                            {(member.user?.name?.[0] || member.user?.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {displayName}
                              {isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
                            </p>
                            {displayEmail && displayEmail !== displayName && (
                              <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                            )}
                          </div>
                        </div>

                        {/* Role + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <RoleBadge role={member.role} />

                          {/* Role change — project owner only, not on the owner row, not on self */}
                          {isOwner && !isMemberOwner && !isMe && (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                changeRoleMutation.mutate({
                                  memberId: member.user!.id,
                                  role: e.target.value as 'ADMIN' | 'VIEWER',
                                })
                              }
                              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                              disabled={changeRoleMutation.isPending}
                            >
                              <option value="VIEWER">Viewer</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          )}

                          {/* Remove — owner can remove anyone (except owner row); admin can remove viewers */}
                          {!isMemberOwner && !isMe && (isOwner || member.role === 'VIEWER') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                if (!confirm(`Remove ${displayName} from this project?`)) return;
                                removeMutation.mutate(member.user!.id);
                              }}
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          {(team?.pendingInvitations?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Pending Invitations
                  <Badge variant="secondary">{team?.pendingInvitations.length}</Badge>
                </CardTitle>
                <CardDescription>
                  These invitations haven't been accepted yet. Share the link with the recipient.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {team?.pendingInvitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.invitedEmail}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <RoleBadge role={inv.role} />
                        <InviteLinkCopy token={inv.token} />
                        {(isOwner || true) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => revokeMutation.mutate(inv.id)}
                            disabled={revokeMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role legend */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">Role Permissions</p>
              <div className="grid sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Crown className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Owner</span>
                    <p>Full control — can delete project, manage billing</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 mt-0.5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Admin</span>
                    <p>Can invite / remove viewers and view all data</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">Viewer</span>
                    <p>Read-only access to dashboards and analytics</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
