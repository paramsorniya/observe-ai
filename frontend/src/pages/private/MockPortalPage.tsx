import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MockPortalPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Mock Portal</Badge>
          </div>
          <CardTitle className="text-xl">Billing Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/50 border p-4 text-sm space-y-2">
            <p><span className="font-medium">Current plan:</span> {user?.subscriptionTier ?? 'FREE'}</p>
            <p><span className="font-medium">Status:</span> {user?.subscriptionStatus ?? 'active'}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            This is a mock billing portal for staging/development. No real billing management is available.
          </p>
          <Button variant="outline" onClick={() => navigate('/dashboard/settings')}>
            Back to Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
