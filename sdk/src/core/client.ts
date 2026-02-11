import type { ObserveAIConfig, LogEntry, BatchPayload } from '../types/index.js';

const DEFAULT_BASE_URL = 'http://localhost:3001/api';
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL = 5000;

export class ObserveAIClient {
  private config: Required<Pick<ObserveAIConfig, 'apiKey' | 'baseUrl' | 'batchSize' | 'flushInterval' | 'debug' | 'enabled'>>;
  private metadata: ObserveAIConfig['metadata'];
  private queue: LogEntry[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  constructor(config: ObserveAIConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
      batchSize: config.batchSize || DEFAULT_BATCH_SIZE,
      flushInterval: config.flushInterval || DEFAULT_FLUSH_INTERVAL,
      debug: config.debug || false,
      enabled: config.enabled ?? true,
    };
    this.metadata = config.metadata;

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  log(entry: LogEntry): void {
    if (!this.config.enabled) return;

    // Merge metadata
    if (this.metadata) {
      entry.userId = entry.userId || this.metadata.userId;
      entry.sessionId = entry.sessionId || this.metadata.sessionId;
      entry.endpoint = entry.endpoint || this.metadata.endpoint;
      entry.tags = entry.tags || this.metadata.tags;
    }

    entry.timestamp = entry.timestamp || new Date().toISOString();
    this.queue.push(entry);

    if (this.config.debug) {
      console.log('[ObserveAI] Queued log entry:', entry.model, entry.status);
    }

    if (this.queue.length >= this.config.batchSize) {
      this.flush().catch(() => {});
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;

    const batch = this.queue.splice(0, this.config.batchSize);

    try {
      const payload: BatchPayload = { requests: batch };
      const response = await fetch(`${this.config.baseUrl}/sdk-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 429) {
          if (this.config.debug) {
            console.warn('[ObserveAI] Usage limit exceeded. Logs dropped.');
          }
        } else {
          // Put back in queue for retry
          this.queue.unshift(...batch);
          if (this.config.debug) {
            console.warn(`[ObserveAI] Failed to send logs: ${response.status}`);
          }
        }
      } else if (this.config.debug) {
        console.log(`[ObserveAI] Flushed ${batch.length} log entries`);
      }
    } catch (err) {
      // Network error - put back in queue
      this.queue.unshift(...batch);
      if (this.config.debug) {
        console.warn('[ObserveAI] Network error, will retry:', err);
      }
    } finally {
      this.flushing = false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    // Flush remaining
    while (this.queue.length > 0) {
      await this.flush();
    }
  }

  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.config.flushInterval);

    // Allow Node.js process to exit even if timer is running
    if (this.timer && typeof this.timer === 'object' && 'unref' in this.timer) {
      this.timer.unref();
    }
  }
}
