import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const PLAN_DETAILS: Record<string, { name: string; price: number }> = {
  STARTER: { name: 'Starter', price: 19 },
  PRO: { name: 'Pro', price: 49 },
};

export default function MockCheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = searchParams.get('plan') ?? '';
  const token = searchParams.get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const details = PLAN_DETAILS[plan];

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/subscriptions/mock-confirm', { token });
      navigate('/dashboard/upgrade/success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!details || !token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-destructive">Invalid checkout link. Please try upgrading again.</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard/upgrade')}>
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Mock Checkout</Badge>
          </div>
          <CardTitle className="text-xl">Subscribe to {details.name}</CardTitle>
          <CardDescription>
            <span className="text-2xl font-bold text-foreground">${details.price}</span>
            <span className="text-muted-foreground">/month</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Card number</label>
              <div className="relative">
                <Input
                  defaultValue="4242 4242 4242 4242"
                  disabled
                  className="pr-10"
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Expiry</label>
                <Input defaultValue="12/30" disabled />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">CVC</label>
                <Input defaultValue="123" disabled />
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 border p-3 text-xs text-muted-foreground flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            This is a mock checkout for staging. No real payment will be processed.
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/dashboard/upgrade')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handlePay} disabled={loading}>
              {loading ? 'Processing...' : `Pay $${details.price}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
