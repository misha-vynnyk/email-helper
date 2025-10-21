import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_API_URL: z.string().url().default('http://localhost:3001'),
  VITE_APP_NAME: z.string().default('Email Builder'),
  VITE_APP_VERSION: z.string().default('0.0.1'),
  VITE_ENABLE_ANALYTICS: z.boolean().default(false),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const env = envSchema.parse(import.meta.env);

export type Env = z.infer<typeof envSchema>;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const config = {
  api: {
    baseUrl: env.VITE_API_URL,
    timeout: 30000,
  },
  app: {
    name: env.VITE_APP_NAME,
    version: env.VITE_APP_VERSION,
  },
  features: {
    analytics: env.VITE_ENABLE_ANALYTICS,
    sentry: env.VITE_SENTRY_DSN,
  },
  logging: {
    level: env.VITE_LOG_LEVEL,
  },
} as const;
