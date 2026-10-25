import types from '../../data/types.json';
import type { Rarete, Zone } from './monde';
import { chargerPokemon } from './pokemon';
import { calculerDps } from './stats';
import { reglages } from './reglages';
import { creerEnnemi } from './ennemis';
import type { Ennemi } from './ennemis';
import type { ReglagesArret } from './sauvegarde-types';
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
  | { type: 'boss-echoue'; zoneId: string }
  | { type: 'capture-reussie'; numero: number; niveau: number; shiny: boolean; boss: boolean; rarete: Rarete | null }
  | { type: 'capture-echouee' }
  | { type: 'arret-auto'; motif: Rarete | 'shiny' | 'nouveau' }
  | { type: 'reprise-auto' };
type OptionsCombat = {
  autoAttaque?: boolean; arret?: ReglagesArret | null; pokedex?: readonly number[]; autoClic?: boolean;
};
export type EtatCombat = {
  zoneId: string; etape: number; ennemi: Ennemi; equipe: readonly MembreEquipe[];
  actifs: readonly string[]; evenements: readonly EvenementCombat[];
  zone: Zone; alea: () => number; attenteMs: number; minuteurMs: number | null; pauseDpsMs: number;
  autoAttaque: boolean; interrompu: boolean; arret: ReglagesArret | null; pokedex: readonly number[];
  autoClic: boolean; avantArret: { autoAttaque: boolean; autoClic: boolean } | null;
  capture: { chance: number; restantMs: number } | null; attenteCapture: boolean;
};

export function motifArret(ennemi: Ennemi, nouveau: boolean, arret: ReglagesArret | null,
  autoAttaque: boolean): Rarete | 'shiny' | 'nouveau' | null {
  if (!arret?.actif || !autoAttaque || ennemi.boss) return null;
  const cle = ennemi.rarete === 'peu-commun' ? 'peuCommun'
    : ennemi.rarete === 'tres-rare' ? 'tresRare' : ennemi.rarete;
  if (!(cle !== null && arret[cle])
    && !(ennemi.shiny && arret.shiny) && !(nouveau && arret.nouveau)) return null;
  if (ennemi.shiny) return 'shiny';
  if (nouveau && arret.nouveau) return 'nouveau';
  return ennemi.rarete;
}

function apparaitre(etat: EtatCombat): EtatCombat {
  const motif = motifArret(etat.ennemi, !etat.pokedex.includes(etat.ennemi.numero), etat.arret, etat.autoAttaque || etat.autoClic);
  return motif === null ? etat : { ...etat, autoAttaque: false, autoClic: false, interrompu: true,
    avantArret: { autoAttaque: etat.autoAttaque, autoClic: etat.autoClic },
    evenements: [...etat.evenements, { type: 'arret-auto', motif }] };
}

export function basculerAutoAttaque(etat: EtatCombat, actif: boolean): EtatCombat {
  return { ...etat, autoAttaque: actif };
}

export function basculerAutoClic(etat: EtatCombat, actif: boolean): EtatCombat {
  return { ...etat, autoClic: actif };
}

export function lancerCapture(etat: EtatCombat, chance: number): EtatCombat {
  if (etat.attenteMs > 0 || etat.attenteCapture || etat.capture || etat.ennemi.capture === 0) return etat;
  return { ...etat, capture: { chance, restantMs: reglages.capture.animationMs } };
}

export function creerCombat(zone: Zone, equipe: readonly MembreEquipe[], alea: () => number,
  actifs: readonly string[] = [], options: OptionsCombat = {}): EtatCombat {
  return reprendreCombat(zone, equipe, alea, 1, actifs, options);
}

export function reprendreCombat(zone: Zone, equipe: readonly MembreEquipe[], alea: () => number,
  etape: number, actifs: readonly string[] = [],
  { autoAttaque = true, arret = null, pokedex = [], autoClic = false }: OptionsCombat = {}): EtatCombat {
  if (!Number.isInteger(etape) || etape < 1 || etape > zone.etapes) throw new Error('Étape de reprise invalide');
  const ennemi = creerEnnemi(zone, etape, alea, reglages.combat, actifs);
  return apparaitre({ zoneId: zone.id, etape, ennemi, autoAttaque, autoClic, avantArret: null, interrompu: false, arret, pokedex,
    equipe, actifs, evenements: [], zone, alea, attenteMs: 0, pauseDpsMs: 0, capture: null, attenteCapture: false,
    minuteurMs: ennemi.boss ? reglages.combat.minuteurBossMs : null });
}

function infliger(etat: EtatCombat, degats: number): EtatCombat {
  const reste = etat.ennemi.pv - degats;
  const pv = etat.ennemi.fauche && reste < 1 ? 1 : Math.max(0, reste);
  if (pv > 0) return { ...etat, ennemi: { ...etat.ennemi, pv } };
  return terminerEnnemi(etat, false);
}

function terminerEnnemi(etat: EtatCombat, capture: boolean): EtatCombat {
  const { numero, niveau, shiny, boss, rarete } = etat.ennemi;
  const evenements: EvenementCombat[] = [...etat.evenements,
    { type: capture ? 'capture-reussie' : 'ennemi-vaincu', numero, niveau, shiny, boss, rarete }];
  const bossFinal = boss && (etat.zone.type !== 'ligue' || etat.etape === reglages.combat.etapeBoss);
  if (bossFinal && !capture) evenements.push({ type: 'boss-vaincu', zoneId: etat.zoneId });
  if (etat.interrompu) evenements.push({ type: 'reprise-auto' });
  const etape = bossFinal ? 1 : etat.etape + 1;
  const attenteMs = capture ? reglages.capture.reapparitionMs : delaiEnnemiSuivant(etat.actifs);
  const ennemi = creerEnnemi(etat.zone, etape, etat.alea, reglages.combat, etat.actifs);
  const suivant: EtatCombat = { ...etat, etape, evenements, ennemi, attenteMs,
    capture: null, attenteCapture: capture && attenteMs > 0,
    autoAttaque: etat.avantArret?.autoAttaque ?? etat.autoAttaque,
    autoClic: etat.avantArret?.autoClic ?? etat.autoClic, avantArret: null, interrompu: false,
    minuteurMs: attenteMs === 0 && ennemi.boss ? reglages.combat.minuteurBossMs : null };
  return attenteMs === 0 ? apparaitre(suivant) : suivant;
}

export function suspendreDps(etat: EtatCombat, ms: number): EtatCombat {
  if (!Number.isFinite(ms) || ms < 0) throw new Error('Durée de pause invalide');
  return { ...etat, pauseDpsMs: ms };
}

export function avancerCombat(etat: EtatCombat, pasMs: number): EtatCombat {
  if (!Number.isFinite(pasMs) || pasMs < 0) throw new Error('Durée de combat invalide');
  // Conversion d'unité, indépendante des réglages d'équilibrage.
  if (pasMs === 0) return etat;
  while (pasMs > 0) {
    if (etat.attenteMs > 0) {
      const attente = Math.min(pasMs, etat.attenteMs);
      const attenteMs = etat.attenteMs - attente;
      etat = { ...etat, attenteMs, pauseDpsMs: Math.max(0, etat.pauseDpsMs - attente),
        attenteCapture: etat.attenteCapture && attenteMs > 0,
        minuteurMs: attenteMs === 0 && etat.ennemi.boss
        ? reglages.combat.minuteurBossMs : etat.minuteurMs };
      pasMs -= attente;
      if (attenteMs === 0) etat = apparaitre(etat);
      if (pasMs === 0) return etat;
    }
    const minuteur = etat.minuteurMs;
    const dt = Math.min(pasMs, minuteur ?? Infinity, etat.capture?.restantMs ?? Infinity,
      etat.pauseDpsMs > 0 ? etat.pauseDpsMs : Infinity);
    const suivant = infliger({ ...etat, pauseDpsMs: Math.max(0, etat.pauseDpsMs - dt) },
      etat.autoAttaque && etat.pauseDpsMs === 0
      ? calculerDpsEquipe(etat.equipe, etat.ennemi, etat.actifs) * dt / 1e3 : 0);
    pasMs -= dt;
    // La victoire prime sur l’expiration, même dans la dernière tranche ; une seule mort par pas, comme avant.
    if (suivant.evenements.length !== etat.evenements.length) return suivant;
    etat = { ...suivant, minuteurMs: minuteur === null ? null : minuteur - dt,
      capture: etat.capture ? { ...etat.capture, restantMs: etat.capture.restantMs - dt } : null };
    if (etat.capture?.restantMs === 0) {
      if (etat.alea() < etat.capture.chance) {
        etat = terminerEnnemi(etat, true);
        continue;
      }
      etat = { ...etat, capture: null,
        evenements: [...etat.evenements, { type: 'capture-echouee' }] };
    }
    if (etat.minuteurMs === 0) {
      const etape = etat.zone.type === 'ligue' ? 1 : reglages.combat.etapeBoss - 1;
      const ennemi = creerEnnemi(etat.zone, etape, etat.alea, reglages.combat, etat.actifs);
      etat = apparaitre({ ...etat, etape, ennemi, attenteMs: 0, capture: null, attenteCapture: false,
        minuteurMs: ennemi.boss ? reglages.combat.minuteurBossMs : null,
        evenements: [...etat.evenements, { type: 'boss-echoue', zoneId: etat.zoneId }] });
    }
  }
  return etat;
}

export function cliquer(etat: EtatCombat, limiteur: { essayer(): boolean }): EtatCombat {
  if (etat.attenteMs > 0 || !limiteur.essayer()) return etat;
  return infliger(etat, calculerClic(calculerDpsEquipe(etat.equipe, etat.ennemi, etat.actifs), etat.actifs));
}

export function faucher(etat: EtatCombat): EtatCombat {
  if (etat.ennemi.boss || etat.attenteMs > 0) return etat;
  return { ...etat, ennemi: { ...etat.ennemi, fauche: true } };
}

export function invoquerBoss(etat: EtatCombat): EtatCombat {
  const etape = reglages.combat.etapeBoss;
  const ennemi = creerEnnemi(etat.zone, etape, etat.alea, reglages.combat, etat.actifs);
  return apparaitre({ ...etat, etape, ennemi, attenteMs: 0, capture: null,
    attenteCapture: false, minuteurMs: reglages.combat.minuteurBossMs });
}

export function viderEvenements(etat: EtatCombat): EtatCombat {
  return { ...etat, evenements: [] };
}
