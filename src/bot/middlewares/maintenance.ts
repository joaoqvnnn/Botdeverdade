import type { NextFunction } from 'grammy';
import type { BotContext } from '../types';
import { isMaintenanceActive } from '../../services/settings';

export async function maintenanceMiddleware(ctx: BotContext, next: NextFunction) {
  ctx.isUnderMaintenance = await isMaintenanceActive();
  return next();
}

export function blockIfMaintenance(ctx: BotContext): boolean {
  if (!ctx.isUnderMaintenance) return false;
  const isAdmin = !!ctx.isAdmin;
  if (isAdmin) return false;
  return true;
}
