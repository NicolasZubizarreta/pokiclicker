import donneesBadges from '../../data/badges.json';
import donneesJalons from '../../data/jalons.json';
import { objetsActifs } from './boutique';
import type { DonneesRegion } from './sauvegarde-types';

export type Badge = {
  readonly id: string; readonly nom: string; readonly zone: string;
  readonly description: string; readonly image: string; readonly ordre: number;
};

export type Jalon = {
  readonly palier: number; readonly titre: string; readonly description: string;
  readonly recompense: {
    readonly argent?: number;
    readonly inventaire?: Readonly<Partial<Record<string, number>>>;
    readonly ameliorations?: readonly string[];
  };
};

export function chargerBadges(): readonly Badge[] {
  return donneesBadges;
}

export function chargerJalons(): readonly Jalon[] {
  return donneesJalons.paliers;
}

export function badgeDeZone(zoneId: string): Badge | null {
  return chargerBadges().find(badge => badge.zone === zoneId) ?? null;
}

export function accorderBadge(region: DonneesRegion, zoneId: string): {
  region: DonneesRegion; badge: Badge | null;
} {
  const badge = badgeDeZone(zoneId);
  if (!badge || region.badges.includes(badge.id)) return { region, badge: null };
  return { region: { ...region, badges: [...region.badges, badge.id] }, badge };
}

export function accorderJalons(region: DonneesRegion, nombre: number): {
  region: DonneesRegion; recus: readonly Jalon[];
} {
  const recus = chargerJalons().filter(jalon =>
    jalon.palier <= nombre && !region.jalonsRecus.includes(jalon.palier));
  if (recus.length === 0) return { region, recus };
  const inventaire = { ...region.inventaire };
  const ameliorations = [...region.ameliorations];
  let argent = region.argent;
  for (const { recompense } of recus) {
    argent += recompense.argent ?? 0;
    for (const [cle, quantite] of Object.entries(recompense.inventaire ?? {})) {
      inventaire[cle] = (inventaire[cle] ?? 0) + (quantite ?? 0);
    }
    for (const id of recompense.ameliorations ?? []) {
      if (!ameliorations.includes(id)) ameliorations.push(id);
    }
  }
  return {
    region: {
      ...region, argent, inventaire, ameliorations,
      jalonsRecus: [...region.jalonsRecus, ...recus.map(jalon => jalon.palier)],
    },
    recus,
  };
}

export function actifsDe(region: DonneesRegion): string[] {
  return [
    ...objetsActifs(region),
    ...region.badges.map(id => 'badge:' + id),
    ...region.jalonsRecus.map(palier => 'jalon:' + palier),
    ...((region.inventaire.omniExp ?? 0) > 0 ? ['objet:omniExp'] : []),
  ];
}

export function prochainJalon(nombre: number): { jalon: Jalon; restantes: number } | null {
  const jalon = chargerJalons().find(jalon => jalon.palier > nombre);
  return jalon ? { jalon, restantes: jalon.palier - nombre } : null;
}
