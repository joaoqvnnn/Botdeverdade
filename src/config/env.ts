import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),

  BOT_TOKEN: z.string().min(10),
  BOT_USERNAME: z.string().min(1),
  WEBHOOK_URL: z.string().url(),
  WEBHOOK_SECRET: z.string().min(16),

  ADMIN_TELEGRAM_ID: z.string().regex(/^\d+$/, 'ADMIN_TELEGRAM_ID deve ser numérico'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  SESSION_SECRET: z.string().min(16),
  JWT_SECRET: z.string().min(16),

  PIX_PROVIDER: z.string().default('gerencianet'),
  PIX_CLIENT_ID: z.string().optional(),
  PIX_CLIENT_SECRET: z.string().optional(),
  PIX_CERTIFICATE_BASE64: z.string().optional(),
  PIX_PIX_KEY: z.string().optional(),
  PIX_SANDBOX: z.string().default('false').transform(v => v === 'true'),
  PIX_WEBHOOK_SECRET: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(v => (v ? Number(v) : undefined)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  CHANNEL_ID: z.string().optional(),
  GROUP_ID: z.string().optional(),
  SUPPLY_CHANNEL_ID: z.string().optional(),
  PURCHASES_CHANNEL_ID: z.string().optional(),
  SUPPORT_USERNAME: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
