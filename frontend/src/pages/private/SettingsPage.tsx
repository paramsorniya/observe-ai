import { useState } from 'react';
import {
  User,
  Key,
  FolderKanban,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useProjects, useCreateProject, useDeleteProject, useRegenerateKey } from '@/hooks/useProjects';
import api from '@/lib/axios';
import { formatDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const projects = (projectsData as any)?.projects ?? projectsData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, projects, and API keys
        </p>
      </div>

      {/* Profile */}
      <ProfileSection user={user} updateUser={updateUser} />

      {/* Projects / API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Projects & API Keys
              </CardTitle>
              <CardDescription>
                Manage your projects and their API keys
              </CardDescription>
            </div>
            <CreateProjectButton
              disabled={projects.length >= (user?.projectLimit ?? 1)}
              limit={user?.projectLimit ?? 1}
            />
          </div>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <LoadingSpinner />
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No projects yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <DeleteAccountButton logout={logout} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---- Sub-components ---- */

function ProfileSection({
  user,
  updateUser,
}: {
  user: any;
  updateUser: (u: any) => void;
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body: any = {};
      if (name !== user?.name) body.name = name;
      if (email !== user?.email) body.email = email;
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      const res = await api.put('/user/profile', body);
      updateUser(res.data.user);
      setMessage('Profile updated');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
        <CardDescription>
          Your account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required to change password"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {message && (
            <span className="text-sm text-muted-foreground">{message}</span>
          )}
        </div>

        {/* Plan info */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Plan:</span>
          <Badge variant="secondary">{user?.subscriptionTier}</Badge>
          <span className="text-sm text-muted-foreground">
            {user?.monthlyRequestCount?.toLocaleString()} / {user?.monthlyRequestLimit?.toLocaleString()} requests
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project }: { project: any }) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const deleteProject = useDeleteProject();
  const regenerateKey = useRegenerateKey(project.id);
  const currentProjectId = useAppStore((s) => s.currentProjectId);
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId);

  const handleCopy = () => {
    navigator.clipboard.writeText(project.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    deleteProject.mutate(project.id);
    if (currentProjectId === project.id) {
      setCurrentProjectId(null);
    }
  };

  const handleRegenerate = () => {
    if (!confirm('Regenerate API key? The old key will stop working immediately.')) return;
    regenerateKey.mutate();
  };

  const maskedKey = project.apiKey.slice(0, 8) + '...' + project.apiKey.slice(-4);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{project.name}</span>
          {!project.isActive && <Badge variant="outline">Inactive</Badge>}
          {project._count && (
            <span className="text-xs text-muted-foreground">
              {project._count.requests?.toLocaleString()} requests
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={regenerateKey.isPending}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Regenerate
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteProject.isPending}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-muted-foreground" />
        <code
          className="text-sm bg-muted px-2 py-1 rounded cursor-pointer"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? project.apiKey : maskedKey}
        </code>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Created {formatDate(project.createdAt)}
      </p>
    </div>
  );
}

function CreateProjectButton({
  disabled,
  limit,
}: {
  disabled: boolean;
  limit: number;
}) {
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState('');
  const createProject = useCreateProject();

  const handleCreate = () => {
    if (!name.trim()) return;
    createProject.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          setName('');
          setShowInput(false);
        },
      }
    );
  };

  if (showInput) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="w-48"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button size="sm" onClick={handleCreate} disabled={createProject.isPending}>
          Create
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={() => setShowInput(true)} disabled={disabled}>
      <Plus className="h-4 w-4 mr-1" />
      New Project
      {disabled && <span className="ml-1 text-xs">({limit} max)</span>}
    </Button>
  );
}

function DeleteAccountButton({ logout }: { logout: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/user/account');
      logout();
      window.location.href = '/';
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-destructive">Are you sure?</span>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Yes, Delete'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
      Delete Account
    </Button>
  );
}
