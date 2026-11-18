import { vi } from 'vitest';

vi.mock('./ContexteRegion', async importOriginal => {
  const reel = await importOriginal<typeof import('./ContexteRegion')>();
  const { chargerKanto } = await import('../core/region-kanto');
  const region = await chargerKanto();
  return { ...reel, useRegion: () => region };
});
