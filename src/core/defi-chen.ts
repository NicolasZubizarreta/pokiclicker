import donnees from '../../data/defi-chen.json';
import type { Zone } from './monde';
import { kanto } from './regions';
import { reglages } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';

export type FichierDefiChen = typeof donnees;

export function chargerDefiChen(fichier: unknown): FichierDefiChen {
  function verifier(ok: unknown, raison: string): asserts ok {
    if (!ok) throw new Error(`Défi de Chen invalide : ${raison}`);
  }
  verifier(fichier && typeof fichier === 'object', 'fichier attendu.');
  const defi = fichier as FichierDefiChen;
  verifier(defi.version === 1, 'version inconnue.');
  verifier(Array.isArray(defi.combats) && defi.combats.length === 6, '6 combats attendus.');
  defi.combats.forEach((combat, i) => {
    verifier(combat && combat.etape === i + 1 && Number.isInteger(combat.pokemon)
      && combat.pokemon > 0 && combat.pokemon <= 151 && combat.niveau === 100
      && combat.capture === 0 && combat.minuteurMs === reglages.combat.minuteurBossMs
      && typeof combat.nom === 'string' && combat.nom.length > 0, 'combat invalide.');
  });
  verifier(Array.isArray(defi.counter) && defi.counter.length === 4, '4 counters attendus.');
  const starters = new Set<number | null>([1, 4, 7, null]);
  defi.counter.forEach(counter => {
    verifier(counter && starters.delete(counter.starter) && Number.isInteger(counter.pokemon)
      && counter.pokemon > 0 && counter.pokemon <= 151
      && typeof counter.nom === 'string' && counter.nom.length > 0, 'counter invalide.');
  });
  verifier(defi.messages && typeof defi.messages.echec === 'string' && defi.messages.echec.length > 0,
    'message d’échec attendu.');
  verifier(defi.dialogues && ['fin', 'intro', 'victoire'].every(cle => {
    const lignes = defi.dialogues[cle as keyof FichierDefiChen['dialogues']];
    return Array.isArray(lignes) && lignes.length > 0
      && lignes.every(ligne => typeof ligne === 'string' && ligne.length > 0);
  }), 'dialogues invalides.');
  return structuredClone(defi);
}

const defi = chargerDefiChen(donnees);

export function peutLancer(region: Pick<DonneesRegion, 'ligueGagnee' | 'drapeaux'>,
  especes: number, finPokedexVue: boolean): boolean {
  return region.ligueGagnee >= 1 && finPokedexVue && especes >= 151
    && !region.drapeaux.includes('defi-chen-gagne');
}

export function zoneDuDefi(starterId: number | null): Zone {
  const labo = kanto.lieu('labo');
  const counter = defi.counter.find(c => c.starter === starterId) ?? defi.counter.find(c => c.starter === null)!;
  const combats = defi.combats.map(combat => ({ ...combat,
    ...(combat.etape === 5 ? { pokemon: counter.pokemon, nom: counter.nom } : {}) }));
  return { id: 'kanto.labo', nom: labo.nom, decor: labo.decor, ancienId: labo.ancienId,
    type: 'ligue', niveaux: [100, 100], etapes: combats.length, multiplicateurPv: 1,
    sauvages: [], adversaires: combats.slice(0, -1), boss: combats[combats.length - 1]!,
    liens: [{ vers: labo.depuis }] };
}

export function echec(region: DonneesRegion): { region: DonneesRegion; message: string | null } {
  if (!region.drapeaux.includes('defi-chen-actif') || region.drapeaux.includes('defi-chen-gagne')) {
    return { region, message: null };
  }
  return { region: { ...region, etape: 1, zoneId: kanto.lieu('labo').depuis }, message: defi.messages.echec };
}

export function victoire(region: DonneesRegion): DonneesRegion {
  if (region.zoneId !== 'kanto.labo' || region.etape !== defi.combats.length
    || !region.drapeaux.includes('defi-chen-actif') || region.drapeaux.includes('defi-chen-gagne')) return region;
  return { ...region, etape: 1,
    drapeaux: [...region.drapeaux.filter(drapeau => drapeau !== 'defi-chen-actif'), 'defi-chen-gagne'] };
}
