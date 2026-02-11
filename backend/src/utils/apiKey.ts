import crypto from 'crypto';

export function generateApiKey(): string {
  return `obs_${crypto.randomBytes(24).toString('base64url')}`;
}
