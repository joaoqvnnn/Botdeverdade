import type { Api } from 'grammy';
import type { ChannelPurpose } from '@prisma/client';
import { prisma } from '../db/client';

export async function getChannel(purpose: ChannelPurpose) {
  return prisma.channelConfig.findUnique({ where: { purpose } });
}

export async function getRequiredChannels() {
  const [channel, group] = await Promise.all([
    getChannel('OFFICIAL_CHANNEL'),
    getChannel('OFFICIAL_GROUP'),
  ]);
  return { channel, group };
}

export async function isUserInChat(api: Api, chatId: string, userId: string | number): Promise<boolean> {
  try {
    const m = await api.getChatMember(chatId, Number(userId));
    return ['member', 'administrator', 'creator'].includes(m.status);
  } catch {
    return false;
  }
}

export interface AccessResult {
  ok: boolean;
  channel: boolean;
  group: boolean;
  channelLink?: string;
  groupLink?: string;
  channelRequired: boolean;
  groupRequired: boolean;
}

export async function checkAccess(api: Api, telegramId: string | number): Promise<AccessResult> {
  const { channel, group } = await getRequiredChannels();
  const channelRequired = !!channel?.isActive;
  const groupRequired = !!group?.isActive;
  const [inChannel, inGroup] = await Promise.all([
    channel ? isUserInChat(api, channel.chatId, telegramId) : Promise.resolve(false),
    group ? isUserInChat(api, group.chatId, telegramId) : Promise.resolve(false),
  ]);
  const channelOk = !channelRequired || inChannel;
  const groupOk = !groupRequired || inGroup;
  return {
    ok: channelOk && groupOk,
    channel: inChannel,
    group: inGroup,
    channelLink: channel?.inviteLink || undefined,
    groupLink: group?.inviteLink || undefined,
    channelRequired,
    groupRequired,
  };
}
