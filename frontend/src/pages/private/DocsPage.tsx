import { useState } from 'react';
import { Copy, Check, BookOpen, Zap, Settings2, DollarSign, Package } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-[hsl(222.2_84%_4.9%)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-foreground/90 font-mono leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SectionAnchor({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-semibold tracking-tight scroll-mt-6">
      {children}
    </h2>
  );
}

export default function DocsPage() {
  const { data: projectsData } = useProjects();
  const projects = (projectsData as any)?.projects ?? projectsData ?? [];
  const firstKey = projects?.[0]?.apiKey ?? 'YOUR_API_KEY';

  const sections = [
    { id: 'installation', label: 'Installation' },
    { id: 'openai', label: 'OpenAI Setup' },
    { id: 'anthropic', label: 'Anthropic Setup' },
    { id: 'gemini', label: 'Gemini Setup' },
    { id: 'config', label: 'Configuration' },
    { id: 'models', label: 'Supported Models' },
    { id: 'manual', label: 'Manual Logging' },
  ];

  return (
    <div className="flex gap-8">
      {/* Sticky sidebar TOC */}
      <aside className="hidden lg:block w-52 shrink-0">
        <div className="sticky top-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            On this page
          </p>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
            >
              {s.label}
            </a>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-10 pb-16">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">SDK Documentation</h1>
          </div>
          <p className="text-muted-foreground">
            Integrate ObserveAI into your app in minutes. One line wraps your existing AI client
            — no changes to your prompts or logic required.
          </p>
        </div>

        {/* Your API Key callout */}
        {projects.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-1">Your API Key (from first project)</p>
              <code className="text-xs font-mono text-primary break-all">{firstKey}</code>
              <p className="text-xs text-muted-foreground mt-1">
                Find all your keys in{' '}
                <a href="/dashboard/settings" className="underline hover:text-foreground">Settings → Projects & API Keys</a>.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Installation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <SectionAnchor id="installation">Installation</SectionAnchor>
          </div>
          <p className="text-sm text-muted-foreground">
            Install the ObserveAI SDK alongside your existing AI SDK(s).
          </p>
          <CodeBlock language="bash" code="npm install observeai-sdk" />
          <p className="text-sm text-muted-foreground">Or with yarn / pnpm:</p>
          <CodeBlock language="bash" code={`yarn add observeai-sdk\n# or\npnpm add observeai-sdk`} />
        </section>

        {/* OpenAI */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-500" />
            <SectionAnchor id="openai">OpenAI Setup</SectionAnchor>
          </div>
          <p className="text-sm text-muted-foreground">
            Wrap your OpenAI client with <code className="text-xs bg-muted px-1 py-0.5 rounded">wrapOpenAI</code>.
            Every call to <code className="text-xs bg-muted px-1 py-0.5 rounded">chat.completions.create</code> is
            automatically logged.
          </p>
          <CodeBlock language="typescript" code={`import OpenAI from 'openai';
import { wrapOpenAI } from 'observeai-sdk';

const openai = wrapOpenAI(
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  {
    apiKey: '${firstKey}',
    metadata: {
      userId: 'user-123',       // optional — tag logs by user
      sessionId: 'sess-abc',    // optional — group by session
      tags: ['production'],     // optional — custom labels
    },
  }
);

// Use exactly like normal OpenAI — logging is automatic
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});`} />

          <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supported OpenAI Models</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'].map((m) => (
                <span key={m} className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{m}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Anthropic */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-400" />
            <SectionAnchor id="anthropic">Anthropic / Claude Setup</SectionAnchor>
          </div>
          <p className="text-sm text-muted-foreground">
            Wrap your Anthropic client with <code className="text-xs bg-muted px-1 py-0.5 rounded">wrapAnthropic</code>.
            Calls to <code className="text-xs bg-muted px-1 py-0.5 rounded">messages.create</code> are captured automatically.
          </p>
          <CodeBlock language="typescript" code={`import Anthropic from '@anthropic-ai/sdk';
import { wrapAnthropic } from 'observeai-sdk';

const anthropic = wrapAnthropic(
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  {
    apiKey: '${firstKey}',
    metadata: {
      userId: 'user-123',
      sessionId: 'sess-abc',
      tags: ['production'],
    },
  }
);

// Use exactly like normal Anthropic
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});`} />

          <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supported Anthropic Models</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'].map((m) => (
                <span key={m} className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{m}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Gemini */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            <SectionAnchor id="gemini">Google Gemini Setup</SectionAnchor>
          </div>
          <p className="text-sm text-muted-foreground">
            Wrap your <code className="text-xs bg-muted px-1 py-0.5 rounded">GoogleGenerativeAI</code> instance with{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">wrapGemini</code>. Both{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">generateContent</code> and{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">generateContentStream</code> are tracked automatically.
          </p>
          <p className="text-sm text-muted-foreground">
            First, install the Google AI SDK if you haven't already:
          </p>
          <CodeBlock language="bash" code="npm install @google/generative-ai" />
          <CodeBlock language="typescript" code={`import { GoogleGenerativeAI } from '@google/generative-ai';
import { wrapGemini } from 'observeai-sdk';

const genAI = wrapGemini(
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY!),
  {
    apiKey: '${firstKey}',
    metadata: {
      userId: 'user-123',
      sessionId: 'sess-abc',
      tags: ['production'],
    },
  }
);

// Use exactly like normal Gemini
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const result = await model.generateContent('Explain quantum computing in simple terms.');
console.log(result.response.text());`} />

          <CodeBlock language="typescript" code={`// Streaming example
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

const streamResult = await model.generateContentStream('Write a poem about AI.');
for await (const chunk of streamResult.stream) {
  process.stdout.write(chunk.text());
}
// Token usage + cost is logged automatically after the stream resolves`} />

          <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supported Gemini Models</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'].map((m) => (
                <span key={m} className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{m}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Configuration */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <SectionAnchor id="config">Configuration Options</SectionAnchor>
          </div>
          <p className="text-sm text-muted-foreground">
            All three wrappers accept the same config object.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Option</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Required</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { opt: 'apiKey', type: 'string', req: 'Yes', desc: 'Your ObserveAI project API key' },
                  { opt: 'baseUrl', type: 'string', req: 'No', desc: 'Backend URL (default: http://localhost:3001/api)' },
                  { opt: 'batchSize', type: 'number', req: 'No', desc: 'Logs per flush batch (default: 10)' },
                  { opt: 'flushInterval', type: 'number', req: 'No', desc: 'Auto-flush interval in ms (default: 5000)' },
                  { opt: 'enabled', type: 'boolean', req: 'No', desc: 'Set to false to disable logging (e.g. in tests)' },
                  { opt: 'debug', type: 'boolean', req: 'No', desc: 'Log SDK activity to console' },
                  { opt: 'metadata.userId', type: 'string', req: 'No', desc: 'Tag logs with your app user ID' },
                  { opt: 'metadata.sessionId', type: 'string', req: 'No', desc: 'Group logs by conversation session' },
                  { opt: 'metadata.endpoint', type: 'string', req: 'No', desc: 'Label which endpoint made the request' },
                  { opt: 'metadata.tags', type: 'string[]', req: 'No', desc: 'Custom labels for filtering in the dashboard' },
                ].map((row) => (
                  <tr key={row.opt} className="hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs text-primary">{row.opt}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{row.type}</td>
                    <td className="p-3 text-xs">
                      <span className={row.req === 'Yes' ? 'text-orange-400' : 'text-muted-foreground'}>
                        {row.req}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CodeBlock language="typescript" code={`// Full config example
{
  apiKey: '${firstKey}',
  baseUrl: 'https://your-backend.com/api', // if self-hosted
  batchSize: 20,
  flushInterval: 3000,
  enabled: process.env.NODE_ENV !== 'test',
  debug: process.env.NODE_ENV === 'development',
  metadata: {
    userId: req.user.id,
    sessionId: req.headers['x-session-id'],
    endpoint: '/api/chat',
    tags: ['production', 'v2'],
  },
}`} />
        </section>

        {/* Supported models pricing */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <SectionAnchor id="models">Supported Models & Pricing</SectionAnchor>
          </div>
          <p className="text-sm text-muted-foreground">
            Cost is calculated automatically based on token usage. Prices are per 1,000 tokens.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Provider</th>
                  <th className="text-left p-3 font-medium">Model</th>
                  <th className="text-right p-3 font-medium">Input / 1K tokens</th>
                  <th className="text-right p-3 font-medium">Output / 1K tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { provider: 'OpenAI', model: 'gpt-4o', input: '$0.005', output: '$0.015' },
                  { provider: 'OpenAI', model: 'gpt-4o-mini', input: '$0.00015', output: '$0.0006' },
                  { provider: 'OpenAI', model: 'gpt-4-turbo', input: '$0.01', output: '$0.03' },
                  { provider: 'OpenAI', model: 'gpt-4', input: '$0.03', output: '$0.06' },
                  { provider: 'OpenAI', model: 'gpt-3.5-turbo', input: '$0.0005', output: '$0.0015' },
                  { provider: 'Anthropic', model: 'claude-3.5-sonnet', input: '$0.003', output: '$0.015' },
                  { provider: 'Anthropic', model: 'claude-3-opus', input: '$0.015', output: '$0.075' },
                  { provider: 'Anthropic', model: 'claude-3-sonnet', input: '$0.003', output: '$0.015' },
                  { provider: 'Anthropic', model: 'claude-3-haiku', input: '$0.00025', output: '$0.00125' },
                  { provider: 'Gemini', model: 'gemini-2.0-flash', input: '$0.0001', output: '$0.0004' },
                  { provider: 'Gemini', model: 'gemini-2.0-flash-lite', input: '$0.000075', output: '$0.0003' },
                  { provider: 'Gemini', model: 'gemini-1.5-pro', input: '$0.00125', output: '$0.005' },
                  { provider: 'Gemini', model: 'gemini-1.5-flash', input: '$0.000075', output: '$0.0003' },
                  { provider: 'Gemini', model: 'gemini-1.5-flash-8b', input: '$0.0000375', output: '$0.00015' },
                ].map((row) => (
                  <tr key={row.model} className="hover:bg-muted/20">
                    <td className="p-3 text-xs">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.provider === 'OpenAI'
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : row.provider === 'Anthropic'
                          ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      }`}>
                        {row.provider}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{row.model}</td>
                    <td className="p-3 text-xs text-right font-mono">{row.input}</td>
                    <td className="p-3 text-xs text-right font-mono">{row.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            If a model isn't in the pricing table, cost will be logged as $0. Contact support to add a custom model.
          </p>
        </section>

        {/* Manual logging */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <SectionAnchor id="manual">Manual Logging</SectionAnchor>
          </div>
          <p className="text-sm text-muted-foreground">
            If you use a provider we don't have a wrapper for yet, you can log manually using{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">ObserveAIClient</code>.
          </p>
          <CodeBlock language="typescript" code={`import { ObserveAIClient } from 'observeai-sdk';

const client = new ObserveAIClient({
  apiKey: '${firstKey}',
});

// Log any request manually
client.log({
  provider: 'my-provider',
  model: 'my-model',
  promptTokens: 150,
  completionTokens: 80,
  totalTokens: 230,
  totalCost: 0.0023,
  latencyMs: 1200,
  status: 'success',
  prompt: 'What is 2 + 2?',
  response: '4',
});

// Force flush (e.g. before process exits)
await client.flush();`} />
        </section>
      </div>
    </div>
  );
}
