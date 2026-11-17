import type { NextFunction } from 'grammy';
import type { BotContext } from '../types';
import { loadSession, saveSession, touchMember } from '../../services/members';

export async function sessionMiddleware(ctx: BotContext, next: NextFunction) {
  if (!ctx.from || ctx.from.is_bot) return next();

  if (!ctx.memberId) {
    // /start will create it
    const { defaultSession } = await import('../types');
    ctx.session = defaultSession();
    return next();
  }

  const { session, rowId } = await loadSession(ctx.memberId);
  ctx.session = session;
  ctx.sessionRowId = rowId;

  await next();

  try {
    await saveSession(ctx.memberId, ctx.session);
    await touchMember(ctx.memberId);
  } catch {
    // silent
  }
}
