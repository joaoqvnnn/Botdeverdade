import { prisma } from '../db/client';

const cache = new Map<string, { value: any; at: number }>();
const TTL = 60_000;

export async function getSetting<T = any>(key: string, fallback: T): Promise<T> {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.value as T;
  const row = await prisma.setting.findUnique({ where: { key } });
  const value = (row?.value ?? fallback) as T;
  cache.set(key, { value, at: Date.now() });
  return value;
}

export async function setSetting(key: string, value: any, category = 'general') {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value, category },
    update: { value, category },
  });
  cache.delete(key);
}

export function invalidateSettingsCache() {
  cache.clear();
}

export async function getMaintenance() {
  const row = await prisma.maintenanceConfig.findFirst();
  if (row) return row;
  return prisma.maintenanceConfig.create({ data: {} });
}

export async function isMaintenanceActive(): Promise<boolean> {
  const cfg = await getMaintenance();
  return cfg.isActive;
}
