import type { Member } from '@prisma/client';

export interface SessionData {
  screen: string;
  previousScreen: string | null;
  pendingOperation: string | null;
  pendingData: Record<string, unknown>;
  replyChainMessageId: number | null;
  mainMessageId: number | null;
  catalogPage: number;
  productId: string | null;
  quantity: number | null;
  startPayload: string | null;
}

export function defaultSession(): SessionData {
  return {
    screen: 'main',
    previousScreen: null,
    pendingOperation: null,
    pendingData: {},
    replyChainMessageId: null,
    mainMessageId: null,
    catalogPage: 0,
    productId: null,
    quantity: null,
    startPayload: null,
  };
}

declare module 'grammy' {
  interface Context {
    member?: Member | null;
    memberId?: string | null;
    session: SessionData;
    sessionRowId?: string;
    isUnderMaintenance?: boolean;
    isAdmin?: boolean;
  }
}
