export interface ApiEnvironment {
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
}

function isServiceUrl(value: unknown, protocols: string[]): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false;

  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) && url.hostname !== '';
  } catch {
    return false;
  }
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): ApiEnvironment {
  const rawPort = environment.PORT ?? 3001;
  const port =
    typeof rawPort === 'number'
      ? rawPort
      : typeof rawPort === 'string' && /^\d+$/.test(rawPort)
        ? Number(rawPort)
        : NaN;
  const errors: string[] = [];

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer from 1 to 65535');
  }

  const databaseUrl = environment.DATABASE_URL;
  const redisUrl = environment.REDIS_URL;
  const validDatabaseUrl = isServiceUrl(databaseUrl, [
    'postgresql:',
    'postgres:',
  ]);
  const validRedisUrl = isServiceUrl(redisUrl, ['redis:', 'rediss:']);

  if (!validDatabaseUrl) {
    errors.push('DATABASE_URL must be a PostgreSQL URL with a host');
  }
  if (!validRedisUrl) {
    errors.push('REDIS_URL must be a Redis URL with a host');
  }
  if (errors.length > 0 || !validDatabaseUrl || !validRedisUrl) {
    throw new Error(`Invalid API configuration: ${errors.join('; ')}`);
  }

  return { PORT: port, DATABASE_URL: databaseUrl, REDIS_URL: redisUrl };
}
