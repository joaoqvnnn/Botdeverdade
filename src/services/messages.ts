import { InlineKeyboard } from 'grammy';
import { prisma } from '../db/client';
import { env } from '../config/env';

const cache = new Map<string, { content: string; at: number }>();
const TTL = 60_000;

export async function getTemplate(key: string): Promise<string> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.content;
  const row = await prisma.messageTemplate.findUnique({ where: { key } });
  const content = row?.content || '';
  cache.set(key, { content, at: Date.now() });
  return content;
}

export function render(tpl: string, vars: Record<string, any>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export async function getRendered(key: string, vars: Record<string, any> = {}, fallback = ''): Promise<string> {
  const tpl = (await getTemplate(key)) || fallback;
  return render(tpl, vars);
}

export function invalidateMessagesCache() {
  cache.clear();
}

export async function getKeyboardForMessage(key: string): Promise<InlineKeyboard | undefined> {
  const tpl = await prisma.messageTemplate.findUnique({
    where: { key },
    include: {
      buttons: {
        where: { isActive: true, isVisible: true },
        orderBy: [{ row: 'asc' }, { position: 'asc' }],
      },
    },
  });
  if (!tpl || tpl.buttons.length === 0) return undefined;
  const kb = new InlineKeyboard();
  let lastRow = -1;
  for (const b of tpl.buttons) {
    if (lastRow !== -1 && b.row !== lastRow) kb.row();
    lastRow = b.row;
    const label = b.emoji ? `${b.emoji} ${b.label}` : b.label;
    const value = b.actionValue || '';
    switch (b.actionType) {
      case 'URL':
        kb.url(label, value);
        break;
      case 'DEEPLINK':
        kb.url(label, `https://t.me/${env.BOT_USERNAME}?start=${encodeURIComponent(value)}`);
        break;
      case 'SHARE':
        kb.switchToChat(label, value);
        break;
      case 'COPY':
        kb.copyText(label, value);
        break;
      default:
        kb.text(label, `${b.internalId}:${value}`);
    }
  }
  return kb;
}

export async function renderWithKeyboard(
  key: string,
  vars: Record<string, any> = {},
  fallback = ''
): Promise<{ text: string; keyboard?: InlineKeyboard }> {
  const [text, keyboard] = await Promise.all([getRendered(key, vars, fallback), getKeyboardForMessage(key)]);
  return { text, keyboard };
}
