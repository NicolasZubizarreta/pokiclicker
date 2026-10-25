import donnees from '../../data/ligue.json';
import type { Zone } from './monde';
import { kanto } from './regions';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';

export type FichierLigue = typeof donnees;
type ZoneLigue = string | Pick<Zone, 'id' | 'type'>;

export function chargerLigue(fichier: unknown, zone: Zone): FichierLigue {
  function verifier(ok: unknown, raison: string): asserts ok {
    if (!ok) throw new Error(`Ligue invalide : ${raison}`);
  }
  verifier(fichier && typeof fichier === 'object', 'fichier attendu.');
  const ligue = fichier as FichierLigue;
  verifier(ligue.version === 1, 'version inconnue.');
  verifier(ligue.zone === zone.id && zone.type === 'ligue', 'zone incompatible.');
  verifier(Array.isArray(ligue.combats) && ligue.combats.length === 10, '10 combats attendus.');
  verifier(Array.isArray(ligue.dresseurs) && ligue.dresseurs.length === 5, '5 dresseurs attendus.');
  verifier(Array.isArray(ligue.counter) && ligue.counter.length === 3, '3 counters attendus.');
  verifier(zone.adversaires?.length === 9 && zone.etapes === 10, 'rencontres de la zone incompatibles.');
  const ids = new Set<string>();
  ligue.dresseurs.forEach(dresseur => {
    verifier(dresseur && typeof dresseur.id === 'string' && dresseur.id.length > 0
      && typeof dresseur.nom === 'string' && dresseur.nom.length > 0
      && !ids.has(dresseur.id), 'dresseur invalide.');
    ids.add(dresseur.id);
  });
  ligue.combats.forEach((combat, i) => {
    const rencontre = i === 9 ? zone.boss : zone.adversaires![i]!;
    verifier(combat && combat.etape === i + 1
      && combat.dresseur === ligue.dresseurs[Math.floor(i / 2)]!.id, 'ordre des combats invalide.');
    verifier(combat.pokemon === rencontre.pokemon && combat.niveau === rencontre.niveau
      && combat.nom === rencontre.nom, `combat ${i + 1} différent de la zone.`);
    verifier(combat.minuteurMs === reglages.combat.minuteurBossMs, 'minuteur incompatible.');
  });
  const starters = new Set([1, 4, 7]);
  ligue.counter.forEach(counter => {
    verifier(counter && starters.delete(counter.starter)
      && Number.isInteger(counter.pokemon) && counter.pokemon > 0
      && typeof counter.nom === 'string' && counter.nom.length > 0, 'counter invalide.');
  });
  verifier(ligue.messages && ['enchainement', 'victoire', 'defaite'].every(cle => {
    const message = ligue.messages[cle as keyof FichierLigue['messages']];
    return typeof message === 'string' && message.includes('{dresseur}')
      && (cle !== 'enchainement' || message.includes('{suivant}'));
  }), 'messages invalides.');
  return structuredClone(ligue);
}

const ligue = chargerLigue(donnees, kanto.zoneDeCombat(donnees.zone));
const idDe = (zone: ZoneLigue) => typeof zone === 'string' ? zone : zone.id;

export function estZoneDeLigue(zone: ZoneLigue): boolean {
  return typeof zone === 'string' ? zone === ligue.zone : zone.type === 'ligue';
}

function combatDe(zone: ZoneLigue, etape: number) {
  return idDe(zone) === ligue.zone ? ligue.combats.find(combat => combat.etape === etape) : undefined;
}

export function zoneDeLigue(zone: Zone, starterId: number | null): Zone {
  const counter = ligue.counter.find(counter => counter.starter === starterId);
  if (zone.id !== ligue.zone || !estZoneDeLigue(zone) || !counter) return zone;
  return { ...zone, boss: { ...zone.boss, pokemon: counter.pokemon, nom: counter.nom } };
}

export function dresseurDe(zone: ZoneLigue, etape: number): FichierLigue['dresseurs'][number] | null {
  const combat = combatDe(zone, etape);
  const dresseur = ligue.dresseurs.find(dresseur => dresseur.id === combat?.dresseur);
  return dresseur ? { ...dresseur } : null;
}

export function etapeDeReprise(zone: ZoneLigue, etape: number): number {
  const combat = combatDe(zone, etape);
  return ligue.combats.find(premier => premier.dresseur === combat?.dresseur)?.etape ?? 1;
}

export function messageEnchainement(zone: ZoneLigue, etape: number): string | null {
  const dresseur = dresseurDe(zone, etape);
  const suivant = dresseurDe(zone, etape + 1);
  if (!dresseur || suivant?.id === dresseur.id) return null;
  return (suivant ? ligue.messages.enchainement : ligue.messages.victoire)
    .replace('{dresseur}', dresseur.nom).replace('{suivant}', suivant?.nom ?? '');
}

export function nomAdversaire(zone: Zone, etape: number): string | null {
  const combat = combatDe(zone, etape);
  return combat ? etape === 10 ? zone.boss.nom : combat.nom : null;
}

export function enregistrerVictoireLigue(region: DonneesRegion): DonneesRegion {
  return { ...region, ligueGagnee: region.ligueGagnee + 1 };
}
