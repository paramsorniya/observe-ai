import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Activity,
  DollarSign,
  Wrench,
  AlertTriangle,
  TrendingDown,
  LayoutDashboard,
  Check,
} from 'lucide-react';

const features = [
  {
    icon: Activity,
    title: 'Request Logging',
    description:
      'Automatically log every AI API request with full prompt, response, and metadata capture.',
  },
  {
    icon: DollarSign,
    title: 'Cost Tracking',
    description:
      'Track spending across models and providers in real-time with detailed cost breakdowns.',
  },
  {
    icon: Wrench,
    title: 'Tool Tracking',
    description:
      'Monitor tool and function call usage, success rates, and latency across your AI workflows.',
  },
  {
    icon: AlertTriangle,
    title: 'Error Detection',
    description:
      'Detect and categorize errors instantly with detailed stack traces and error patterns.',
  },
  {
    icon: TrendingDown,
    title: 'Cost Optimization',
    description:
      'Get actionable suggestions to reduce costs by identifying inefficient prompts and model choices.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description:
      'Comprehensive dashboards with real-time metrics, charts, and customizable views.',
  },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For hobby projects and evaluation',
    features: [
      'Up to 1,000 requests/month',
      'Request logging',
      'Basic cost tracking',
      'Error monitoring',
      '1 project',
      '7-day data retention',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/mo',
    description: 'For growing teams and products',
    features: [
      'Up to 25,000 requests/month',
      'Everything in Free',
      'Tool tracking',
      'Cost optimization',
      'CSV export',
      '5 projects',
      '30-day data retention',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    description: 'For production workloads at scale',
    features: [
      'Up to 200,000 requests/month',
      'Everything in Starter',
      'Advanced analytics',
      'API access',
      'Unlimited projects',
      '90-day data retention',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">AI Observability</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI Observability Platform
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor, track, and optimize your AI API usage. Get full visibility
            into costs, performance, errors, and tool calls across all your AI
            integrations.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/register">Start for Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Comprehensive observability for your AI-powered applications
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="rounded-md bg-primary/10 p-2 w-fit mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlighted
                    ? 'border-primary shadow-md relative'
                    : 'relative'
                }
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 mb-6">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/register">{tier.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI Observability Platform. All
          rights reserved.
        </div>
      </footer>
    </div>
  );
}
