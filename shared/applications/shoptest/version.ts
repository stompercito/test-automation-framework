import { BrowserContext, Page } from '@playwright/test';

export type ShopTestVersion = 1 | 2 | 3;

type InitScriptTarget = Page | BrowserContext;

export function resolveShopTestVersion(tags: string[] = [], fallback: ShopTestVersion = 3): ShopTestVersion {
  if (tags.includes('@v1')) return 1;
  if (tags.includes('@v2')) return 2;
  if (tags.includes('@v3')) return 3;
  return fallback;
}

export async function applyShopTestVersion(
  target: InitScriptTarget,
  version: ShopTestVersion,
): Promise<void> {
  await target.addInitScript((selectedVersion: ShopTestVersion) => {
    window.localStorage.setItem('shoptest-version', String(selectedVersion));
  }, version);
}
