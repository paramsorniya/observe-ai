import { useEffect, useRef, useState } from 'react';
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
  ChevronDown,
  ArrowRight,
  Code,
  BarChart3,
  Shield,
  Zap,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

// Scroll reveal hook
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible'); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '', delay = '' }: { children: React.ReactNode; className?: string; delay?: string }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${delay} ${className}`}>{children}</div>;
}

// Animated counter
function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  return <span className="tabular-nums">{value}{suffix}</span>;
}

const features = [
  {
    icon: Activity,
    title: 'Request Logging',
    description: 'Automatically log every AI API request with full prompt, response, tokens, and metadata capture.',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: DollarSign,
    title: 'Cost Tracking',
    description: 'Track spending across models and providers in real-time with detailed cost breakdowns per request.',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: Wrench,
    title: 'Tool & API Tracking',
    description: 'Monitor tool and function call usage, success rates, and latency across your AI workflows.',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: AlertTriangle,
    title: 'Error Detection',
    description: 'Detect and categorize errors instantly - timeouts, rate limits, API failures, and invalid responses.',
    color: 'bg-red-500/10 text-red-500',
  },
  {
    icon: TrendingDown,
    title: 'Cost Optimization',
    description: 'Get actionable suggestions to reduce costs - model downgrades, prompt optimization, caching opportunities.',
    color: 'bg-yellow-500/10 text-yellow-600',
  },
  {
    icon: LayoutDashboard,
    title: 'Real-time Dashboard',
    description: 'Comprehensive dashboards with live metrics, charts, request timelines, and filterable views.',
    color: 'bg-cyan-500/10 text-cyan-500',
  },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For hobby projects and evaluation',
    features: [
      '10,000 requests/month',
      '1 project',
      '7-day data retention',
      'Request logging',
      'Cost tracking',
      'Error monitoring',
      'Dashboard',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/mo',
    description: 'For growing teams and products',
    features: [
      '100,000 requests/month',
      '5 projects',
      '30-day data retention',
      'Everything in Free',
      'Cost optimization suggestions',
      'Tool/API call tracking',
      'CSV export',
      'Custom date ranges',
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
      '1,000,000 requests/month',
      'Unlimited projects',
      '90-day data retention',
      'Everything in Starter',
      'Advanced analytics',
      'API access',
      'Webhook integrations',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
];

const steps = [
  {
    number: '01',
    icon: Code,
    title: 'Install the SDK',
    description: 'One-line install. Wrap your OpenAI or Anthropic client and you\'re done.',
    code: 'npm install observeai-sdk',
  },
  {
    number: '02',
    icon: Zap,
    title: 'Start Making Requests',
    description: 'Use your AI APIs exactly as before. The SDK automatically logs every call in the background.',
    code: 'const observed = wrapOpenAI(openai, { apiKey })',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Analyze & Optimize',
    description: 'Open your dashboard to see costs, performance, errors, and optimization suggestions in real-time.',
    code: 'Dashboard auto-updates in real-time',
  },
];

const faqs = [
  {
    q: 'How does the SDK work?',
    a: 'The SDK wraps your existing OpenAI or Anthropic client. It intercepts API calls, measures latency, captures tokens/cost, and sends logs asynchronously to our backend. Your app performance is unaffected.',
  },
  {
    q: 'Does it slow down my API calls?',
    a: 'No. Logs are batched and sent asynchronously in the background. Your API calls return immediately with zero added latency. The SDK uses a queue with configurable batch sizes and flush intervals.',
  },
  {
    q: 'What data do you store?',
    a: 'We store request metadata (model, tokens, cost, latency, status), prompts, and responses. You control what\'s logged. All data is encrypted in transit and at rest. Data retention depends on your plan tier.',
  },
  {
    q: 'Can I self-host?',
    a: 'The Enterprise plan includes an on-premise deployment option. Contact our sales team for details on self-hosted installations.',
  },
  {
    q: 'Which AI providers are supported?',
    a: 'Currently OpenAI (GPT-4, GPT-4o, GPT-3.5) and Anthropic (Claude 3 family). More providers coming soon including Google Gemini and Mistral.',
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">ObserveAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              title={`Theme: ${theme}`}
            >
              <ThemeIcon className="h-5 w-5" />
              <span className="sr-only">Toggle theme</span>
            </Button>
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
      <section className="relative py-24 md:py-36 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute top-40 right-[15%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-glow animation-delay-300" />
          <div className="absolute bottom-10 left-[30%] w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse-glow animation-delay-600" />
        </div>

        <div className="container mx-auto px-4 text-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Now supporting OpenAI & Anthropic
          </div>

          <h1 className="animate-fade-in-up animation-delay-150 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto">
            Full Visibility Into Your{' '}
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
              AI Spending
            </span>
          </h1>

          <p className="animate-fade-in-up animation-delay-300 mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Monitor every API call, track costs in real-time, catch errors instantly,
            and get optimization suggestions. One SDK, complete observability.
          </p>

          <div className="animate-fade-in-up animation-delay-450 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12 gap-2" asChild>
              <Link to="/register">
                Start for Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          {/* Code preview */}
          <div className="animate-fade-in-up animation-delay-600 mt-16 max-w-xl mx-auto">
            <div className="rounded-lg border bg-card shadow-lg overflow-hidden text-left">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">app.ts</span>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto">
                <code>
                  <span className="text-blue-400">import</span> {'{'} wrapOpenAI {'}'} <span className="text-blue-400">from</span> <span className="text-green-400">'observeai-sdk'</span>{'\n'}
                  {'\n'}
                  <span className="text-muted-foreground">// Wrap your existing client - that's it!</span>{'\n'}
                  <span className="text-blue-400">const</span> openai = wrapOpenAI(client, {'{\n'}
                  {'  '}apiKey: <span className="text-green-400">'your-project-key'</span>{'\n'}
                  {'})'}{'\n'}
                  {'\n'}
                  <span className="text-muted-foreground">// Use as normal - logs sent automatically</span>{'\n'}
                  <span className="text-blue-400">const</span> res = <span className="text-blue-400">await</span> openai.chat.completions.create({'{'}{'\n'}
                  {'  '}model: <span className="text-green-400">'gpt-4o-mini'</span>,{'\n'}
                  {'  '}messages: [{'{ '}role: <span className="text-green-400">'user'</span>, content: <span className="text-green-400">'Hello!'</span> {'}'}]{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <RevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '10M+', label: 'Requests Logged' },
                { value: '99.9%', label: 'Uptime SLA' },
                { value: '<1ms', label: 'SDK Overhead' },
                { value: '2 min', label: 'Setup Time' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl md:text-4xl font-bold text-primary">
                    <AnimatedNumber value={stat.value} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2 tracking-wider uppercase">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to monitor AI</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
              Comprehensive observability for your AI-powered applications, from prototype to production.
            </p>
          </RevealSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <RevealSection key={feature.title} delay={`reveal-delay-${Math.min(i + 1, 5)}`}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
                  <CardHeader>
                    <div className={`rounded-lg p-2.5 w-fit mb-3 ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2 tracking-wider uppercase">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold">Up and running in minutes</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
              Three simple steps to full AI observability. No config files, no complex setup.
            </p>
          </RevealSection>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <RevealSection key={step.number} delay={`reveal-delay-${i + 1}`}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-lg mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {step.description}
                  </p>
                  <div className="inline-block rounded-md bg-card border px-3 py-1.5 font-mono text-xs text-muted-foreground">
                    {step.code}
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Security Badge Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <RevealSection>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-muted-foreground">
              {[
                { icon: Shield, label: 'SOC 2 Compliant' },
                { icon: Zap, label: 'Zero-latency SDK' },
                { icon: Activity, label: '99.9% Uptime' },
                { icon: Code, label: 'Open Source SDK' },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 text-sm">
                  <badge.icon className="h-5 w-5" />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2 tracking-wider uppercase">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
              Start free. Scale as you grow. No hidden fees, no surprises.
            </p>
          </RevealSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <RevealSection key={tier.name} delay={`reveal-delay-${i + 1}`}>
                <Card
                  className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-lg ${
                    tier.highlighted
                      ? 'border-primary shadow-md scale-[1.02]'
                      : 'hover:-translate-y-1'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
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
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
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
              </RevealSection>
            ))}
          </div>

          <RevealSection className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Need more? <span className="font-medium text-foreground">Enterprise plans</span> with unlimited requests, SSO, SLA, and dedicated support.{' '}
              <a href="mailto:support@observeai.com" className="text-primary hover:underline">Contact sales</a>
            </p>
          </RevealSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <RevealSection className="text-center mb-16">
            <p className="text-sm font-medium text-primary mb-2 tracking-wider uppercase">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
          </RevealSection>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <RevealSection key={i} delay={`reveal-delay-${Math.min(i + 1, 5)}`}>
                <div className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform duration-200 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <RevealSection>
            <h2 className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto">
              Start monitoring your AI costs today
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Free forever for up to 10,000 requests/month. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8 h-12 gap-2" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary p-1.5">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">ObserveAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <a href="mailto:support@observeai.com" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ObserveAI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
