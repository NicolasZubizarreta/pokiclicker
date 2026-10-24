import types from '../../data/types.json';
import type { Rarete, Zone } from './monde';
import { chargerPokemon } from './pokemon';
import { calculerDps } from './stats';
import { reglages } from './reglages';
import { creerEnnemi } from './ennemis';
import type { Ennemi } from './ennemis';
import { delaiEnnemiSuivant } from './recompenses';
export { creerEnnemi } from './ennemis';
export { creerLimiteurClics } from './clics';

const catalogue = chargerPokemon();
type Efficacite = Record<string, Record<string, number>>;
export type MembreEquipe = Omit<Parameters<typeof calculerDps>[0], 'multiplicateurType'> & { oeuf?: boolean };

export function multiplicateurType(typesAttaquant: string[], typesDefenseur: string[],
  efficacite: Efficacite = types.efficacite): number {
  if (!typesDefenseur.length) return 1;
  return typesAttaquant.reduce((meilleur, attaque) => Math.max(meilleur,
    typesDefenseur.reduce((produit, defense) => produit * (efficacite[attaque]?.[defense] ?? 1), 1)), 0);
}

export function calculerDpsEquipe(equipe: readonly MembreEquipe[], cible: Pick<Ennemi, 'numero'>,
  actifs: readonly string[] = []): number {
  const defense = catalogue.parNumero(cible.numero).types;
  const somme = equipe.reduce((total, membre) => membre.oeuf ? total : total + calculerDps({ ...membre,
    multiplicateurType: multiplicateurType(catalogue.parNumero(membre.numero).types, defense),
  }), 0);
  return reglages.bonus.dps.reduce((dps, bonus) => actifs.includes(bonus.cle) ? dps * bonus.x : dps, somme);
}

export function calculerClic(dpsEquipe: number, actifs: readonly string[] = []): number {
  const base = reglages.combat.clicBase + Math.floor(dpsEquipe * reglages.combat.clicPartDps);
  return reglages.bonus.clic.reduce((clic, bonus) => {
    if (!actifs.includes(bonus.cle)) return clic;
    const resultat = clic * bonus.x;
    return bonus.arrondi ? Math.floor(resultat) : resultat;
  }, base);
}

export type EvenementCombat =
  | { type: 'ennemi-vaincu'; numero: number; niveau: number; shiny: boolean; boss: boolean; rarete: Rarete | null }
  | { type: 'boss-vaincu'; zoneId: string }
  | { type: 'boss-echoue'; zoneId: string };
export type EtatCombat = {
  zoneId: string; etape: number; ennemi: Ennemi; equipe: readonly MembreEquipe[];
  actifs: readonly string[]; evenements: readonly EvenementCombat[];
  zone: Zone; alea: () => number; attenteMs: number; minuteurMs: number | null;
};

export function creerCombat(zone: Zone, equipe: readonly MembreEquipe[], alea: () => number,
  actifs: readonly string[] = []): EtatCombat {
  return reprendreCombat(zone, equipe, alea, 1, actifs);
}

export function reprendreCombat(zone: Zone, equipe: readonly MembreEquipe[], alea: () => number,
  etape: number, actifs: readonly string[] = []): EtatCombat {
  if (!Number.isInteger(etape) || etape < 1 || etape > zone.etapes) throw new Error('Étape de reprise invalide');
  const ennemi = creerEnnemi(zone, etape, alea);
  return { zoneId: zone.id, etape, ennemi,
    equipe, actifs, evenements: [], zone, alea, attenteMs: 0,
    minuteurMs: ennemi.boss ? reglages.combat.minuteurBossMs : null };
}

function infliger(etat: EtatCombat, degats: number): EtatCombat {
  const pv = Math.max(0, etat.ennemi.pv - degats);
  if (pv > 0) return { ...etat, ennemi: { ...etat.ennemi, pv } };
  const { numero, niveau, shiny, boss, rarete } = etat.ennemi;
  const evenements: EvenementCombat[] = [...etat.evenements,
    { type: 'ennemi-vaincu', numero, niveau, shiny, boss, rarete }];
  const bossFinal = boss && (etat.zone.type !== 'ligue' || etat.etape === reglages.combat.etapeBoss);
  if (bossFinal) evenements.push({ type: 'boss-vaincu', zoneId: etat.zoneId });
  const etape = bossFinal ? 1 : etat.etape + 1;
  const attenteMs = delaiEnnemiSuivant(etat.actifs);
  const ennemi = creerEnnemi(etat.zone, etape, etat.alea);
  return { ...etat, etape, evenements, ennemi, attenteMs,
    minuteurMs: attenteMs === 0 && ennemi.boss ? reglages.combat.minuteurBossMs : null };
}

export function avancerCombat(etat: EtatCombat, pasMs: number): EtatCombat {
  if (!Number.isFinite(pasMs) || pasMs < 0) throw new Error('Durée de combat invalide');
  // Conversion d'unité, indépendante des réglages d'équilibrage.
  if (pasMs === 0) return etat;
  while (pasMs > 0) {
    if (etat.attenteMs > 0) {
      const attente = Math.min(pasMs, etat.attenteMs);
      const attenteMs = etat.attenteMs - attente;
      etat = { ...etat, attenteMs, minuteurMs: attenteMs === 0 && etat.ennemi.boss
        ? reglages.combat.minuteurBossMs : etat.minuteurMs };
      pasMs -= attente;
      if (pasMs === 0) return etat;
    }
    const minuteur = etat.minuteurMs;
    const dt = minuteur === null ? pasMs : Math.min(pasMs, minuteur);
    const suivant = infliger(etat, calculerDpsEquipe(etat.equipe, etat.ennemi, etat.actifs) * dt / 1e3);
    pasMs -= dt;
    // La victoire prime sur l’expiration, même dans la dernière tranche ; une seule mort par pas, comme avant.
    if (minuteur === null || suivant.evenements.length !== etat.evenements.length) return suivant;
    etat = { ...suivant, minuteurMs: minuteur - dt };
    if (etat.minuteurMs === 0) {
      const etape = etat.zone.type === 'ligue' ? 1 : reglages.combat.etapeBoss - 1;
      const ennemi = creerEnnemi(etat.zone, etape, etat.alea);
      etat = { ...etat, etape, ennemi, attenteMs: 0,
        minuteurMs: ennemi.boss ? reglages.combat.minuteurBossMs : null,
        evenements: [...etat.evenements, { type: 'boss-echoue', zoneId: etat.zoneId }] };
    }
  }
  return etat;
}

export function cliquer(etat: EtatCombat, limiteur: { essayer(): boolean }): EtatCombat {
  if (etat.attenteMs > 0 || !limiteur.essayer()) return etat;
  return infliger(etat, calculerClic(calculerDpsEquipe(etat.equipe, etat.ennemi, etat.actifs), etat.actifs));
}

export function viderEvenements(etat: EtatCombat): EtatCombat {
  return { ...etat, evenements: [] };
}
