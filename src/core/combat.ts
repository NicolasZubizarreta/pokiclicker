import types from '../../data/types.json';
import type { Zone } from './monde';
import { chargerPokemon } from './pokemon';
import { calculerDps } from './stats';
import { reglages } from './reglages';
import { creerEnnemi } from './ennemis';
import type { Ennemi } from './ennemis';
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
  | { type: 'ennemi-vaincu'; numero: number; niveau: number; shiny: boolean; boss: boolean }
  | { type: 'boss-vaincu'; zoneId: string };
export type EtatCombat = {
  zoneId: string; etape: number; ennemi: Ennemi; equipe: readonly MembreEquipe[];
  actifs: readonly string[]; evenements: readonly EvenementCombat[];
  zone: Zone; alea: () => number;
};

export function creerCombat(zone: Zone, equipe: readonly MembreEquipe[], alea: () => number,
  actifs: readonly string[] = []): EtatCombat {
  return reprendreCombat(zone, equipe, alea, 1, actifs);
}

export function reprendreCombat(zone: Zone, equipe: readonly MembreEquipe[], alea: () => number,
  etape: number, actifs: readonly string[] = []): EtatCombat {
  if (!Number.isInteger(etape) || etape < 1 || etape > zone.etapes) throw new Error('Étape de reprise invalide');
  return { zoneId: zone.id, etape, ennemi: creerEnnemi(zone, etape, alea),
    equipe, actifs, evenements: [], zone, alea };
}

function infliger(etat: EtatCombat, degats: number): EtatCombat {
  const pv = Math.max(0, etat.ennemi.pv - degats);
  if (pv > 0) return { ...etat, ennemi: { ...etat.ennemi, pv } };
  const { numero, niveau, shiny, boss } = etat.ennemi;
  const evenements: EvenementCombat[] = [...etat.evenements,
    { type: 'ennemi-vaincu', numero, niveau, shiny, boss }];
  if (boss) evenements.push({ type: 'boss-vaincu', zoneId: etat.zoneId });
  const etape = boss ? 1 : etat.etape + 1;
  return { ...etat, etape, evenements, ennemi: creerEnnemi(etat.zone, etape, etat.alea) };
}

export function avancerCombat(etat: EtatCombat, pasMs: number): EtatCombat {
  if (!Number.isFinite(pasMs) || pasMs < 0) throw new Error('Durée de combat invalide');
  // Conversion d'unité, indépendante des réglages d'équilibrage.
  return infliger(etat, calculerDpsEquipe(etat.equipe, etat.ennemi, etat.actifs) * pasMs / 1e3);
}

export function cliquer(etat: EtatCombat, limiteur: { essayer(): boolean }): EtatCombat {
  if (!limiteur.essayer()) return etat;
  return infliger(etat, calculerClic(calculerDpsEquipe(etat.equipe, etat.ennemi, etat.actifs), etat.actifs));
}

export function viderEvenements(etat: EtatCombat): EtatCombat {
  return { ...etat, evenements: [] };
}
