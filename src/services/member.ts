import type { Member } from '@prisma/client';
import { prisma } from '../db/client';
import { defaultSession, type SessionData } from '../bot/types';

export async function getMemberByTelegramId(telegramId: string): Promise<Member | null> {
  return prisma.member.findUnique({ where: { telegramId } });
}

export async function ensureMember(from: {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
}): Promise<Member> {
  const telegramId = String(from.id);
  const existing = await prisma.member.findUnique({ where: { telegramId } });
  if (existing) {
    return prisma.member.update({
      where: { id: existing.id },
      data: {
        username: from.username ?? existing.username,
        firstName: from.first_name ?? existing.firstName,
        lastName: from.last_name ?? existing.lastName,
        languageCode: from.language_code ?? existing.languageCode,
        isPremium: from.is_premium ?? existing.isPremium,
        lastActivityAt: new Date(),
      },
    });
  }
  return prisma.member.create({
    data: {
      telegramId,
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      languageCode: from.language_code,
      isPremium: from.is_premium ?? false,
      wallet: { create: {} },
      cart: { create: {} },
    },
    include: { wallet: true },
  });
}

export async function loadSession(memberId: string): Promise<{ session: SessionData; rowId: string }> {
  let row = await prisma.memberSession.findUnique({ where: { memberId } });
  if (!row) row = await prisma.memberSession.create({ data: { memberId } });
  return {
    rowId: row.id,
    session: {
      screen: row.screen,
      previousScreen: row.previousScreen,
      pendingOperation: row.pendingOperation,
      pendingData: (row.pendingData as Record<string, unknown>) || {},
      replyChainMessageId: row.replyChainMessageId ? Number(row.replyChainMessageId) : null,
      mainMessageId: row.mainMessageId ? Number(row.mainMessageId) : null,
      catalogPage: row.catalogPage,
      productId: row.productId,
      quantity: row.quantity,
      startPayload: null,
    },
  };
}

export async function saveSession(memberId: string, s: SessionData): Promise<void> {
  await prisma.memberSession.upsert({
    where: { memberId },
    create: {
      memberId,
      screen: s.screen,
      previousScreen: s.previousScreen,
      pendingOperation: s.pendingOperation,
      pendingData: s.pendingData as any,
      replyChainMessageId: s.replyChainMessageId ? BigInt(s.replyChainMessageId) : null,
      mainMessageId: s.mainMessageId ? BigInt(s.mainMessageId) : null,
      catalogPage: s.catalogPage,
      productId: s.productId,
      quantity: s.quantity,
    },
    update: {
      screen: s.screen,
      previousScreen: s.previousScreen,
      pendingOperation: s.pendingOperation,
      pendingData: s.pendingData as any,
      replyChainMessageId: s.replyChainMessageId ? BigInt(s.replyChainMessageId) : null,
      mainMessageId: s.mainMessageId ? BigInt(s.mainMessageId) : null,
      catalogPage: s.catalogPage,
      productId: s.productId,
      quantity: s.quantity,
    },
  });
}

export async function touchMember(memberId: string) {
  await prisma.member.update({ where: { id: memberId }, data: { lastActivityAt: new Date() } }).catch(() => {});
}

export { defaultSession };
