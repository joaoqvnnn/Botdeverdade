import { bot } from '../index';
import { prisma } from '../../db/client';
import { getChannel } from '../../services/channels';
import { logger } from '../../services/logger';
import { bot as botApi } from '../index';
import { buildMainMenuKeyboard, welcomeScreenData } from '../helpers/menu';
import { env } from '../../config/env';

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
      logger.info({ telegramId: userId }, 'Acesso liberado');

      const session = await prisma.memberSession.findUnique({ where: { memberId: member.id } });
      const chatIdToEdit = session?.mainMessageId ? env.ADMIN_TELEGRAM_ID : null; // não usado
      if (session?.mainMessageId) {
        const userName =
          updated.username ? `@${updated.username}` : updated.firstName || 'membro';
        const text = await welcomeScreenData(member.id, {
          id: Number(updated.telegramId),
          username: updated.username || undefined,
          first_name: updated.firstName || undefined,
        });
        const kb = await buildMainMenuKeyboard(member.id);
        try {
          await botApi.api.editMessageText(
            updated.telegramId,
            Number(session.mainMessageId),
            text,
            {
              parse_mode: 'HTML',
              link_preview_options: { is_disabled: true },
              reply_markup: kb,
            }
          );
        } catch (e) {
          // fallback silencioso
        }
      }
    } else if (!hasBoth && updated.hasAccess) {
      await prisma.member.update({ where: { id: member.id }, data: { hasAccess: false } });
      logger.info({ telegramId: userId }, 'Acesso revogado');
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
