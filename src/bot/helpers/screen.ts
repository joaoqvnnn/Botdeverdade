import type { InlineKeyboard } from 'grammy';
import type { BotContext } from '../types';

interface ScreenOptions {
  keyboard?: InlineKeyboard;
  disablePreview?: boolean;
  parseMode?: 'HTML' | 'MarkdownV2';
}

export async function editScreen(ctx: BotContext, text: string, opts: ScreenOptions = {}): Promise<void> {
  const payload: any = {
    parse_mode: opts.parseMode ?? 'HTML',
    link_preview_options: { is_disabled: opts.disablePreview ?? true },
  };
  if (opts.keyboard) payload.reply_markup = opts.keyboard;

  if (ctx.callbackQuery && ctx.callbackQuery.message) {
    try {
      await ctx.api.editMessageText(
        ctx.callbackQuery.message.chat.id,
        ctx.callbackQuery.message.message_id,
        text,
        payload
      );
      return;
    } catch (err: any) {
      const desc = String(err?.description || '');
      if (desc.includes('message is not modified')) return;
    }
  }

  const sent = await ctx.reply(text, payload);
  ctx.session.mainMessageId = sent.message_id;
}

export async function sendScreen(ctx: BotContext, text: string, opts: ScreenOptions = {}) {
  const payload: any = {
    parse_mode: opts.parseMode ?? 'HTML',
    link_preview_options: { is_disabled: opts.disablePreview ?? true },
  };
  if (opts.keyboard) payload.reply_markup = opts.keyboard;
  const sent = await ctx.reply(text, payload);
  ctx.session.mainMessageId = sent.message_id;
  return sent;
}

export async function replyChain(ctx: BotContext, text: string, opts: ScreenOptions = {}) {
  const payload: any = {
    parse_mode: opts.parseMode ?? 'HTML',
    reply_parameters: {
      message_id: ctx.msg?.message_id,
      allow_sending_without_reply: true,
    },
    link_preview_options: { is_disabled: opts.disablePreview ?? true },
  };
  if (opts.keyboard) payload.reply_markup = opts.keyboard;
  const sent = await ctx.reply(text, payload);
  ctx.session.replyChainMessageId = sent.message_id;
  return sent;
}

export async function editReplyChain(ctx: BotContext, text: string, opts: ScreenOptions = {}) {
  if (!ctx.session.replyChainMessageId || !ctx.chat) {
    return replyChain(ctx, text, opts);
  }
  const payload: any = {
    parse_mode: opts.parseMode ?? 'HTML',
    link_preview_options: { is_disabled: opts.disablePreview ?? true },
  };
  if (opts.keyboard) payload.reply_markup = opts.keyboard;
  try {
    await ctx.api.editMessageText(ctx.chat.id, ctx.session.replyChainMessageId, text, payload);
  } catch (err: any) {
    const desc = String(err?.description || '');
    if (!desc.includes('message is not modified')) {
      return replyChain(ctx, text, opts);
    }
  }
}

export function clearReplyChain(ctx: BotContext) {
  ctx.session.replyChainMessageId = null;
}
