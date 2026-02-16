import cron from 'node-cron';
import { runDowngradeProcessor } from './downgradeProcessor.js';
import { runDataRetentionCleanup } from './dataRetentionCleanup.js';
import { runPaymentGraceProcessor } from './paymentGraceProcessor.js';

export function startScheduler() {
  // Downgrade processor: daily at 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    try {
      await runDowngradeProcessor();
    } catch (err) {
      console.error('[Scheduler] Downgrade processor failed:', err);
    }
  }, { timezone: 'UTC' });

  // Payment grace period processor: daily at 01:00 UTC
  cron.schedule('0 1 * * *', async () => {
    try {
      await runPaymentGraceProcessor();
    } catch (err) {
      console.error('[Scheduler] Payment grace processor failed:', err);
    }
  }, { timezone: 'UTC' });

  // Data retention cleanup: daily at 02:00 UTC
  cron.schedule('0 2 * * *', async () => {
    try {
      await runDataRetentionCleanup();
    } catch (err) {
      console.error('[Scheduler] Data retention cleanup failed:', err);
    }
  }, { timezone: 'UTC' });

  console.log('Cron jobs registered');
}
