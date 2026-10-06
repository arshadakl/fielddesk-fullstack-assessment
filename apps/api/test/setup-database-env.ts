import { config } from 'dotenv';
import { resolve } from 'node:path';

config({
  path: resolve(__dirname, '../../../packages/database/.env.test'),
  quiet: true,
});
const testUrl = process.env.TEST_DATABASE_URL;
if (
  !testUrl ||
  decodeURIComponent(new URL(testUrl).pathname.slice(1)) !== 'fielddesk_test'
) {
  throw new Error('An explicit fielddesk_test connection URL is required');
}
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testUrl;
process.env.REDIS_URL = 'redis://localhost:6379/15';
