import type { Context, SessionFlavor } from 'grammy';

export interface SessionData {
  screen: string;
  previousScreen: string | null;
  pendingOperation: string | null;
  pendingData?: Record<string, unknown>;
  replyChainMessageId?: number;
  productId?: string;
  quantity?: number;
  mainMessageId?: number;
  catalogPage?: number;
}

export type BotContext = Context & SessionFlavor<SessionData>;
