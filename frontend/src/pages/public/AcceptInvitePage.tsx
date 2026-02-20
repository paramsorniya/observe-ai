import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Activity, CheckCircle, XCircle, Loader2, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

type State = 'loading' | 'preview' | 'accepting' | 'success' | 'error';

interface Preview {
  projectName: string;
  invitedBy: string;
  role: string;
  invitedEmail: string;
  expiresAt: string;
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const [state, setState] = useState<State>('loading');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successProject, setSuccessProject] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    api
      .get(`/invitations/${token}/preview`)
      .then((res) => {
        setPreview(res.data);
        setState('preview');
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || 'Invalid or expired invitation');
        setState('error');
      });
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }
    setState('accepting');
    try {
      const res = await api.post(`/invitations/${token}/accept`);
      setSuccessProject(res.data.projectName);
      setState('success');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept invitation');
      setState('error');
    }
  };

  const emailMismatch =
    isAuthenticated &&
    preview &&
    user?.email.toLowerCase() !== preview.invitedEmail.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="rounded-lg bg-primary p-1.5">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">ObserveAI</span>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm text-center space-y-4">
          {state === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading invitation…</p>
            </>
          )}

          {state === 'preview' && preview && (
            <>
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Activity className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">You've been invited!</h1>
                <p className="text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{preview.invitedBy}</span> invited{' '}
                  <span className="font-medium text-foreground">{preview.invitedEmail}</span> to
                  join{' '}
                  <span className="font-medium text-foreground">{preview.projectName}</span> as a{' '}
                  <span className="font-medium text-foreground capitalize">
                    {preview.role.toLowerCase()}
                  </span>
                  .
                </p>
              </div>

              {/* Email mismatch warning */}
              {emailMismatch && (
                <div className="rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-800 dark:text-yellow-200 text-left">
                  ⚠️ This invitation was sent to{' '}
                  <strong>{preview.invitedEmail}</strong>. You are logged in as{' '}
                  <strong>{user?.email}</strong>. Please log out and sign in with the correct
                  account.
                </div>
              )}

              {/* Must have account note when not logged in */}
              {!isAuthenticated && (
                <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200 text-left">
                  <LogIn className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                  You need an existing ObserveAI account to accept this invitation. Please sign in
                  with <strong>{preview.invitedEmail}</strong>.
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {!isAuthenticated ? (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign in to Accept
                  </Button>
                ) : (
                  <Button
                    onClick={handleAccept}
                    disabled={!!emailMismatch}
                    className="w-full"
                  >
                    Accept Invitation
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Expires {new Date(preview.expiresAt).toLocaleDateString()}
              </p>
            </>
          )}

          {state === 'accepting' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Joining project…</p>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h1 className="text-xl font-bold">You're in!</h1>
              <p className="text-muted-foreground">
                You've joined{' '}
                <span className="font-medium text-foreground">{successProject}</span>.
              </p>
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-bold">Invitation Invalid</h1>
              <p className="text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
