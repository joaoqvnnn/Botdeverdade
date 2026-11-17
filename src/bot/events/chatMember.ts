import { bot } from '../index';
import { prisma } from '../../db/client';
import { getChannel } from '../../services/channels';
import { logger } from '../../services/logger';

bot.on('chat_member', async (ctx) => {
  const upd = ctx.chatMember;
  const userId = String(upd.new_chat_member.user.id);
  const member = await prisma.member.findUnique({ where: { telegramId: userId } });
  if (!member) return;

  const status = upd.new_chat_member.status;
  const isIn = ['member', 'administrator', 'creator'].includes(status);
  const chatId = String(upd.chat.id);

  const [channel, group] = await Promise.all([
    getChannel('OFFICIAL_CHANNEL'),
    getChannel('OFFICIAL_GROUP'),
  ]);

  const updates: Record<string, any> = {};
  let matched = false;

  if (channel && String(channel.chatId) === chatId) {
    updates.joinedChannelAt = isIn ? new Date() : null;
    matched = true;
  }
  if (group && String(group.chatId) === chatId) {
    updates.joinedGroupAt = isIn ? new Date() : null;
    matched = true;
  }

  if (!matched) return;

  try {
    const updated = await prisma.member.update({ where: { id: member.id }, data: updates });
    const hasBoth = !!updated.joinedChannelAt && !!updated.joinedGroupAt;

    if (hasBoth && !updated.hasAccess) {
      await prisma.member.update({ where: { id: member.id }, data: { hasAccess: true } });
      logger.info({ telegramId: userId }, 'Membro liberou acesso (chat_member)');
      // M3 substitui a mensagem de bloqueio pelo destino
    } else if (!hasBoth && updated.hasAccess) {
      await prisma.member.update({ where: { id: member.id }, data: { hasAccess: false } });
      logger.info({ telegramId: userId }, 'Membro saiu de espaço obrigatório');
    }
  } catch (err) {
    logger.error({ err, userId }, 'Erro chat_member');
  }
});

bot.on('my_chat_member', async (ctx) => {
  const upd = ctx.myChatMember;
  logger.info(
    { chatId: upd.chat.id, status: upd.new_chat_member.status, title: upd.chat.title },
    'my_chat_member'
  );
});
