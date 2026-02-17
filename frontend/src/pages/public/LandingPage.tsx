import { useEffect, useRef, useState, useMemo } from 'react';
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
  Eye,
  Terminal,
  Cpu,
  Radio,
} from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

/* ─── helpers ─── */

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

/* ─── Animated mini-monitor tile (the "repeating video" feel) ─── */

type MonitorVariant = 'bars' | 'logs' | 'cost' | 'latency' | 'errors' | 'sparkline';

const monitorGrid: { variant: MonitorVariant; label: string; accent: string }[] = [
  { variant: 'bars', label: 'Requests/min', accent: 'bg-blue-500' },
  { variant: 'cost', label: 'Cost $4.21', accent: 'bg-green-500' },
  { variant: 'logs', label: 'Live Stream', accent: 'bg-cyan-500' },
  { variant: 'errors', label: '0 Errors', accent: 'bg-red-500' },
  { variant: 'latency', label: '142ms avg', accent: 'bg-purple-500' },
  { variant: 'sparkline', label: 'Tokens/req', accent: 'bg-yellow-500' },
  { variant: 'logs', label: 'GPT-4o', accent: 'bg-blue-400' },
  { variant: 'bars', label: 'Throughput', accent: 'bg-emerald-500' },
  { variant: 'cost', label: 'Cost $1.08', accent: 'bg-green-400' },
  { variant: 'sparkline', label: 'P95 Latency', accent: 'bg-orange-500' },
  { variant: 'errors', label: '2 Warnings', accent: 'bg-amber-500' },
  { variant: 'latency', label: '89ms avg', accent: 'bg-violet-500' },
];

function MiniMonitor({ variant, label, accent, delay }: { variant: MonitorVariant; label: string; accent: string; delay: number }) {
  // Each monitor tile has a small animated "screen"
  return (
    <div
      className="relative rounded-lg border bg-card/80 backdrop-blur-sm overflow-hidden monitor-scanline group hover:border-primary/40 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-b bg-muted/40">
        <div className={`w-1.5 h-1.5 rounded-full ${accent}`} />
        <span className="text-[9px] font-mono text-muted-foreground truncate">{label}</span>
      </div>
      {/* Screen content */}
      <div className="h-16 p-1.5 flex items-end">
        <MonitorContent variant={variant} accent={accent} delay={delay} label={label} />
      </div>
    </div>
  );
}

function MonitorContent({ variant, accent, delay, label }: { variant: MonitorVariant; accent: string; delay: number; label: string }) {
  if (variant === 'bars') {
    return (
      <div className="flex items-end gap-[2px] w-full h-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm ${accent} opacity-70`}
            style={{
              height: `${25 + Math.sin((i + delay / 100) * 0.8) * 35 + Math.random() * 30}%`,
              animation: `bar-grow ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 200 + delay}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'logs') {
    return (
      <div className="w-full h-full flex flex-col justify-end gap-[2px] overflow-hidden">
        {['200 OK', '200 OK', '201 CR', '200 OK'].map((log, i) => (
          <div
            key={i}
            className="flex items-center gap-1 animate-fade-in"
            style={{ animationDelay: `${i * 400 + delay}ms`, opacity: 0.4 + i * 0.2 }}
          >
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span className="text-[7px] font-mono text-muted-foreground">{log}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'cost') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-lg font-bold text-green-500 tabular-nums shimmer-text">
          {label.replace('Cost ', '')}
        </span>
      </div>
    );
  }

  if (variant === 'latency') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-baseline gap-0.5">
          <span className="text-base font-bold text-purple-500 tabular-nums">{label.replace(' avg', '')}</span>
          <span className="text-[7px] text-muted-foreground">avg</span>
        </div>
      </div>
    );
  }

  if (variant === 'errors') {
    const isClean = label.startsWith('0');
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className={`flex items-center gap-1 ${isClean ? 'text-green-500' : 'text-amber-500'}`}>
          <div className={`w-2 h-2 rounded-full ${isClean ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-[9px] font-mono font-medium">{label}</span>
        </div>
      </div>
    );
  }

  // sparkline
  return (
    <div className="w-full h-full flex items-end">
      <svg viewBox="0 0 60 24" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points="0,20 5,16 10,18 15,10 20,14 25,8 30,12 35,6 40,10 45,4 50,8 55,6 60,2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="0,20 5,16 10,18 15,10 20,14 25,8 30,12 35,6 40,10 45,4 50,8 55,6 60,2"
          fill="url(#sparkFill)"
          opacity="0.15"
        />
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── Live log ticker ─── */

const tickerLogs = [
  { status: 200, model: 'gpt-4o', tokens: 342, cost: '$0.0041', latency: '1.2s' },
  { status: 200, model: 'claude-3.5', tokens: 891, cost: '$0.0134', latency: '2.1s' },
  { status: 200, model: 'gpt-4o-mini', tokens: 128, cost: '$0.0003', latency: '0.4s' },
  { status: 429, model: 'gpt-4', tokens: 0, cost: '$0.00', latency: '0.1s' },
  { status: 200, model: 'claude-3.5', tokens: 2104, cost: '$0.0315', latency: '4.8s' },
  { status: 200, model: 'gpt-4o', tokens: 567, cost: '$0.0068', latency: '1.8s' },
  { status: 500, model: 'gpt-4', tokens: 0, cost: '$0.00', latency: '30s' },
  { status: 200, model: 'gpt-4o-mini', tokens: 95, cost: '$0.0002', latency: '0.3s' },
];

function TickerItem({ log }: { log: typeof tickerLogs[0] }) {
  const statusColor = log.status === 200 ? 'text-green-500' : log.status === 429 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 mx-2 rounded-md border bg-card/60 backdrop-blur-sm whitespace-nowrap text-xs font-mono">
      <span className={`font-bold ${statusColor}`}>{log.status}</span>
      <span className="text-muted-foreground">{log.model}</span>
      <span className="text-foreground/70">{log.tokens} tok</span>
      <span className="text-green-500">{log.cost}</span>
      <span className="text-muted-foreground">{log.latency}</span>
    </div>
  );
}

/* ─── Data ─── */

const features = [
  {
    icon: Activity,
    title: 'Request Logging',
    description: 'Automatically log every AI API request with full prompt, response, tokens, and metadata capture.',
    color: 'bg-blue-500/10 text-blue-500',
    size: 'col-span-1 row-span-1',
  },
  {
    icon: DollarSign,
    title: 'Cost Tracking',
    description: 'Track spending across models and providers in real-time with detailed cost breakdowns per request.',
    color: 'bg-green-500/10 text-green-500',
    size: 'col-span-1 row-span-1 md:col-span-2',
  },
  {
    icon: Wrench,
    title: 'Tool & API Tracking',
    description: 'Monitor tool and function call usage, success rates, and latency across your AI workflows.',
    color: 'bg-purple-500/10 text-purple-500',
    size: 'col-span-1 row-span-1',
  },
  {
    icon: AlertTriangle,
    title: 'Error Detection',
    description: 'Detect and categorize errors instantly - timeouts, rate limits, API failures, and invalid responses.',
    color: 'bg-red-500/10 text-red-500',
    size: 'col-span-1 row-span-1',
  },
  {
    icon: TrendingDown,
    title: 'Cost Optimization',
    description: 'Get actionable suggestions to reduce costs - model downgrades, prompt optimization, caching opportunities.',
    color: 'bg-yellow-500/10 text-yellow-600',
    size: 'col-span-1 row-span-1 md:col-span-2',
  },
  {
    icon: LayoutDashboard,
    title: 'Real-time Dashboard',
    description: 'Comprehensive dashboards with live metrics, charts, request timelines, and filterable views.',
    color: 'bg-cyan-500/10 text-cyan-500',
    size: 'col-span-1 row-span-1',
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

/* ─── Typewriter hook for hero subtitle ─── */

function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];
    const timeout = isDeleting ? speed / 2 : speed;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setText(current.slice(0, text.length + 1));
        if (text.length + 1 === current.length) {
          setTimeout(() => setIsDeleting(true), pause);
        }
      } else {
        setText(current.slice(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [text, wordIndex, isDeleting, words, speed, pause]);

  return text;
}

/* ─── Live counter ─── */

function LiveCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

/* ─── Main Component ─── */

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  const typewriterText = useTypewriter(['costs', 'errors', 'latency', 'tokens', 'tool calls'], 100, 1800);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/60 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="relative rounded-lg bg-primary p-1.5">
              <Activity className="h-5 w-5 text-primary-foreground" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight">ObserveAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={cycleTheme} title={`Theme: ${theme}`}>
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

      {/* ─── HERO: Control Room ─── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Animated monitor grid behind the hero text */}
        <div className="absolute inset-0 -z-10 grid-mask">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 p-4 opacity-40 dark:opacity-30">
            {monitorGrid.map((m, i) => (
              <MiniMonitor key={i} {...m} delay={i * 150} />
            ))}
            {/* Duplicate to fill more space */}
            {monitorGrid.map((m, i) => (
              <MiniMonitor key={`dup-${i}`} {...m} delay={(i + 12) * 150} />
            ))}
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 -z-[5] bg-gradient-to-b from-background/80 via-background/40 to-background" />

        {/* Hero content */}
        <div className="relative z-10 container mx-auto px-4 text-center py-20">
          {/* Live badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm mb-8">
            <Radio className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-muted-foreground">Live monitoring for</span>
            <span className="font-medium text-foreground">OpenAI & Anthropic</span>
          </div>

          <h1 className="animate-fade-in-up animation-delay-150 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl mx-auto leading-[1.1]">
            Your AI ops command center.{' '}
            <br className="hidden sm:block" />
            <span className="text-muted-foreground">See every</span>{' '}
            <span className="relative inline-block min-w-[140px] sm:min-w-[200px] text-left">
              <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient">
                {typewriterText}
              </span>
              <span className="text-primary animate-pulse">|</span>
            </span>
          </h1>

          <p className="animate-fade-in-up animation-delay-300 mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One SDK. Full observability. Monitor every API call, track real-time costs,
            catch errors before your users do, and cut spending with smart optimization.
          </p>

          <div className="animate-fade-in-up animation-delay-450 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8 h-12 gap-2 glow-cta" asChild>
              <Link to="/register">
                Start Monitoring Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12 gap-2" asChild>
              <a href="#how-it-works">
                <Terminal className="h-4 w-4" />
                See How It Works
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in-up animation-delay-600 mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> No credit card</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> 2-minute setup</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Zero latency impact</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> SOC 2 compliant</span>
          </div>
        </div>
      </section>

      {/* ─── Live Log Ticker (scrolling bar) ─── */}
      <section className="py-4 border-y bg-muted/20 overflow-hidden">
        <div className="flex items-center">
          <div className="shrink-0 pl-4 pr-4 flex items-center gap-2 text-xs text-muted-foreground border-r">
            <Radio className="h-3 w-3 text-green-500 animate-pulse" />
            <span className="font-mono font-medium whitespace-nowrap">LIVE FEED</span>
          </div>
          <div className="overflow-hidden flex-1">
            <div className="ticker-track">
              {/* Duplicate array for seamless loop */}
              {[...tickerLogs, ...tickerLogs].map((log, i) => (
                <TickerItem key={i} log={log} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats (animated counters) ─── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <RevealSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: 10, suffix: 'M+', label: 'Requests Logged', icon: Activity },
                { value: 99, suffix: '.9%', label: 'Uptime SLA', icon: Shield },
                { value: 1, suffix: 'ms', label: 'SDK Overhead', icon: Zap },
                { value: 2, suffix: ' min', label: 'Setup Time', icon: Cpu },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground">
                    {stat.suffix === 'M+' ? (
                      <><LiveCounter target={stat.value} />{stat.suffix}</>
                    ) : stat.suffix === '.9%' ? (
                      <><LiveCounter target={stat.value} />{stat.suffix}</>
                    ) : stat.suffix === 'ms' ? (
                      <><span className="text-muted-foreground/60">{'<'}</span><LiveCounter target={stat.value} />{stat.suffix}</>
                    ) : (
                      <><LiveCounter target={stat.value} />{stat.suffix}</>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Features Bento Grid ─── */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Eye className="h-3 w-3" /> Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to monitor AI</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
              Comprehensive observability for your AI-powered applications, from prototype to production.
            </p>
          </RevealSection>

          {/* Bento layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <RevealSection key={feature.title} delay={`reveal-delay-${Math.min(i + 1, 5)}`} className={feature.size}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 group">
                  <CardHeader>
                    <div className={`rounded-xl p-2.5 w-fit mb-3 ${feature.color} group-hover:scale-110 transition-transform`}>
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

      {/* ─── How It Works (terminal style) ─── */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Terminal className="h-3 w-3" /> Integration
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Up and running in minutes</h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-lg">
              Three simple steps to full AI observability. No config files, no complex setup.
            </p>
          </RevealSection>

          {/* Timeline layout */}
          <div className="max-w-3xl mx-auto relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-border" />

            {steps.map((step, i) => (
              <RevealSection key={step.number} delay={`reveal-delay-${i + 1}`}>
                <div className="relative flex gap-6 md:gap-8 mb-12 last:mb-0">
                  {/* Step number circle */}
                  <div className="relative z-10 shrink-0 flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg">
                    {step.number}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    {/* Terminal block */}
                    <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
                      <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                        <span className="ml-2 text-[10px] text-muted-foreground font-mono">terminal</span>
                      </div>
                      <div className="px-4 py-3 font-mono text-sm">
                        <span className="text-green-500">$</span>{' '}
                        <span className="text-foreground/90">{step.code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Code Preview ─── */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <RevealSection>
            <div className="max-w-2xl mx-auto">
              <div className="rounded-xl border bg-card shadow-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-muted-foreground font-mono">app.ts</span>
                  <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    TypeScript
                  </div>
                </div>
                <pre className="p-5 text-sm font-mono overflow-x-auto leading-relaxed">
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
          </RevealSection>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
              <DollarSign className="h-3 w-3" /> Pricing
            </div>
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

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 max-w-3xl">
          <RevealSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Shield className="h-3 w-3" /> FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
          </RevealSection>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <RevealSection key={i} delay={`reveal-delay-${Math.min(i + 1, 5)}`}>
                <div className="border rounded-lg overflow-hidden bg-card">
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

      {/* ─── CTA ─── */}
      <section className="py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <RevealSection>
            <h2 className="text-3xl md:text-4xl font-bold max-w-2xl mx-auto">
              Stop guessing. Start observing.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Free forever for up to 10,000 requests/month. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8 h-12 gap-2 glow-cta" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ─── Footer ─── */}
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
