import type { Rarete } from './monde';
import { chargerPokemon } from './pokemon';
import { avancerOeuf } from './pension';
import { reglages } from './reglages';
import type { Bonus } from './reglages';
import type { DonneesRegion } from './sauvegarde-types';
import { statsDeCombat } from './stats';

const catalogue = chargerPokemon();

export type Victoire = {
  numero: number; niveau: number; shiny: boolean; boss: boolean; rarete: Rarete | null;
};

function appliquerBonus(valeur: number, bonus: readonly Bonus[], actifs: readonly string[]): number {
  for (const entree of bonus) {
    if (!actifs.includes(entree.cle)) continue;
    valeur *= entree.x;
    if (entree.arrondi) valeur = Math.floor(valeur);
  }
  return valeur;
}

export function calculerOr(v: Victoire, actifs: readonly string[] = [], t = reglages.recompenses): number {
  let or = v.niveau * t.or.coefNiveau + Math.pow(v.niveau, t.or.exposant);
  if (v.boss) or *= t.or.boss;
  else if (v.rarete !== null) or *= t.or.rarete[v.rarete] ?? 1;
  or = Math.floor(appliquerBonus(or, t.or.bonusAvantArrondi, actifs));
  or = appliquerBonus(or, t.or.bonus, actifs);
  if (v.shiny) or *= t.or.shiny;
  // Ticket AB : tous les gains d'argent sont multipliés, une seule fois, ici (la capture passe par cette fonction).
  return or * t.or.multiplicateur;
}

export function calculerXp(v: Victoire, actifs: readonly string[] = [], t = reglages.recompenses): number {
  const pv = statsDeCombat(catalogue.parNumero(v.numero)).pv;
  let xp = Math.floor((pv * v.niveau) * t.xp.coefPv);
  if (v.boss) xp *= t.xp.boss;
  if (xp < t.xp.minimum) xp = t.xp.minimum;
  return appliquerBonus(xp, t.xp.bonus, actifs);
}

export function calculerMaxXp(numero: number, niveau: number, t = reglages.recompenses): number {
  if (niveau >= t.niveauMax) return 0;
  const stats = statsDeCombat(catalogue.parNumero(numero));
  const puissance = stats.puissance + stats.pv;
  const tier = puissance < t.maxXp.faible.sous ? t.maxXp.faible.x
    : puissance > t.maxXp.fort.dessus ? t.maxXp.fort.x : 1;
  return Math.floor(t.maxXp.coef * Math.pow(niveau, t.maxXp.exposant) * tier);
}

export function delaiEnnemiSuivant(actifs: readonly string[] = [], t = reglages.delais): number {
  let ms = t.remplacements.find((entree) => actifs.includes(entree.cle))?.ms ?? t.ennemiSuivantMs;
  for (const entree of t.reducteurs) {
    if (!actifs.includes(entree.cle)) continue;
    ms = Math.floor('diviseur' in entree ? ms / entree.diviseur : ms * entree.x);
  }
  return ms;
}

export function appliquerVictoire(region: DonneesRegion, v: Victoire, actifs: readonly string[] = []) {
  const t = reglages.recompenses;
  const or = calculerOr(v, actifs);
  const xp = calculerXp(v, actifs);
  const bonbons = v.shiny ? t.shiny.quantite : 0;
  const montees: { uid: string; niveau: number }[] = [];
  const eclosions: { uid: string; numero: number }[] = [];
  const equipe = region.equipe.map((original) => {
    const membre = { ...original };
    if (membre.oeuf === undefined && membre.niveau < t.niveauMax) {
      membre.xp += xp;
      const maxXpAvant = calculerMaxXp(membre.numero, membre.niveau);
      if (membre.xp >= maxXpAvant) {
        membre.niveau += 1;
        membre.xp -= maxXpAvant;
        if (membre.niveau >= t.niveauMax) membre.xp = 0;
        montees.push({ uid: membre.uid, niveau: membre.niveau });
      }
    }
    if (membre.bonheur < t.bonheur.max && membre.niveau - v.niveau <= t.bonheur.ecartMax) {
      membre.bonheur += t.bonheur.gain;
    }
    const apres = avancerOeuf(membre);
    if (membre.oeuf && !apres.oeuf) eclosions.push({ uid: apres.uid, numero: apres.numero });
    return apres;
  });
  const inventaire = { ...region.inventaire };
  if (v.shiny) inventaire[t.shiny.objet] = (inventaire[t.shiny.objet] ?? 0) + bonbons;
  return {
    region: {
      ...region, equipe, inventaire, argent: region.argent + or,
      statistiques: {
        ...region.statistiques,
        eliminations: region.statistiques.eliminations + 1,
        argentTotalGagne: region.statistiques.argentTotalGagne + or,
      },
    },
    or, xp, bonbons, montees, eclosions,
  };
}
