import type { NextFunction } from 'grammy';
import type { BotContext } from '../types';
import { env } from '../../config/env';

export async function adminMiddleware(ctx: BotContext, next: NextFunction) {
  if (ctx.from && String(ctx.from.id) === env.ADMIN_TELEGRAM_ID) {
    ctx.isAdmin = true;
  }
  return next();
}

export function requireAdmin(ctx: BotContext): boolean {
  return !!ctx.isAdmin;
}
