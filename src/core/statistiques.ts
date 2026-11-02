import { chargerObjets } from './boutique';
import { calculerClic } from './combat';
import { clesActives } from './objets-actifs';
import { actifsDe, chargerBadges, chargerJalons } from './progression';
import { reglages, type Bonus } from './reglages';
import { regionInitiale } from './sauvegarde';
import type { DonneesRegion } from './sauvegarde-types';
import { calculerDps, statsDeCombat } from './stats';
import { chargerPokemon } from './pokemon';

export type Statistique = { libelle: string; valeur?: number; unite?: string; base?: string; libelleBase?: string; boosts?: string[]; total?: string };
type Source = Omit<Partial<DonneesRegion>, 'statistiques'> & { statistiques?: Partial<DonneesRegion['statistiques']> };
const noms = new Map([
  ...chargerObjets().map(o => [`objet:${o.id}`, o.nom] as const),
  ...chargerBadges().map(b => [`badge:${b.id}`, `Badge ${b.nom}`] as const),
  ...chargerJalons().map(j => [`jalon:${j.palier}`, j.titre] as const),
  ['boost:attaque', 'Attaque +'], ['boost:dps', 'Attaque Spé +'],
]);
const catalogue = chargerPokemon();

/** Chiffres neutres de la V1, sans avantage de type contre l'ennemi courant. */
export function calculerStatistiques(source: Source = {}, maintenant = 0): Statistique[] {
  const region = { ...regionInitiale('kanto', 'kanto.bourg-palette'), ...source,
    statistiques: { eliminations: 0, argentTotalGagne: 0, ...source.statistiques } };
  const actifs = [...actifsDe(region), ...clesActives(region.chronos, maintenant)];
  const selection = (bonus: readonly Bonus[]) => bonus.filter(b => actifs.includes(b.cle));
  const boosts = (bonus: readonly Bonus[]) => selection(bonus).map(b => `${noms.get(b.cle) ?? b.cle} (x${b.x})`);
  const produit = (bonus: readonly Bonus[]) => selection(bonus).reduce((n, b) => n * b.x, 1);
  const equipe = region.equipe.filter(p => !p.oeuf);
  const baseDps = equipe.reduce((n, p) => n + statsDeCombat(catalogue.parNumero(p.numero)).puissance * p.niveau / reglages.degats.diviseurNiveau, 0);
  const dps = equipe.reduce((n, p) => n + calculerDps(p), 0) * produit(reglages.bonus.dps);
  const argent = [...reglages.recompenses.or.bonusAvantArrondi, ...reglages.recompenses.or.bonus];
  return [
    { libelle: 'Pokémon vaincus', valeur: region.statistiques.eliminations },
    { libelle: 'Argent total', valeur: region.statistiques.argentTotalGagne, unite: ' $' },
    { libelle: 'Dégâts clic', libelleBase: 'Base (5+0.2% DPS)', base: String(reglages.combat.clicBase + Math.floor(dps * reglages.combat.clicPartDps)), boosts: boosts(reglages.bonus.clic), total: String(calculerClic(dps, actifs)) },
    { libelle: 'DPS équipe', base: baseDps.toFixed(1), boosts: boosts(reglages.bonus.dps), total: dps.toFixed(1) },
    { libelle: 'Gains argent', base: '100%', boosts: boosts(argent), total: `x${(produit(argent) * reglages.recompenses.or.multiplicateur).toFixed(2)}` },
    { libelle: 'Gains XP', base: '100%', boosts: boosts(reglages.recompenses.xp.bonus), total: `x${produit(reglages.recompenses.xp.bonus).toFixed(2)}` },
    { libelle: 'Taux capture', boosts: boosts(reglages.capture.bonus) },
  ];
}
