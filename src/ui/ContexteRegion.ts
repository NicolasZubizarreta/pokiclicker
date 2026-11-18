import { createContext, useContext } from 'react';
import type { Region } from '../core/region';

export const ContexteRegion = createContext<Region | null>(null);

export function useRegion(): Region {
  const region = useContext(ContexteRegion);
  if (!region) throw new Error('Aucune région fournie');
  return region;
}
