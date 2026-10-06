// Explicit fixtures: tests do not read local environment files or contact services.
process.env.NODE_ENV = 'test';
process.env.PORT = '3101';
process.env.DATABASE_URL =
  'postgresql://test:test_password@localhost:5432/fielddesk_test';
process.env.REDIS_URL = 'redis://localhost:6379/15';
