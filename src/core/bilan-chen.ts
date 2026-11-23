import { messagesDuDefi } from './defi-chen';
import { pokedexDeKanto } from './pokedex';
import { zonesDeEspece } from './zones-espece';

/** Nombre de routes citées par Chen quand il reste des espèces à trouver. */
export const ZONES_CITEES = 3;

export type BilanPokedex = {
  nombre: number; total: number; manquantes: number;
  /** Les zones où manquent le plus d'espèces (première zone sauvage de chaque espèce manquante), les plus fournies d'abord. */
  zones: { id: string; nom: string; manquantes: number }[];
  /** Espèces manquantes qu'aucune zone sauvage ne donne, ni elles ni leur stade précédent. */
  sansZone: number;
};

/** Bilan du Pokédex de Kanto : espèces manquantes regroupées par la zone où les trouver le plus tôt. */
export function bilanPokedex(pokedex: readonly number[], catalogue: { readonly liste: readonly { numero: number }[] },
  zonesDe: typeof zonesDeEspece = zonesDeEspece): BilanPokedex {
  const { captures, nombre, total } = pokedexDeKanto(pokedex, catalogue);
  const parZone = new Map<string, { id: string; nom: string; manquantes: number }>();
  let sansZone = 0;
  for (const { numero } of catalogue.liste) {
    if (captures.has(numero)) continue;
    const premiere = zonesDe(numero).zones[0];
    if (!premiere) { sansZone++; continue; }
    const entree = parZone.get(premiere.id) ?? { ...premiere, manquantes: 0 };
    entree.manquantes++;
    parZone.set(premiere.id, entree);
  }
  const zones = [...parZone.values()].sort((a, b) => b.manquantes - a.manquantes || a.nom.localeCompare(b.nom, 'fr')).slice(0, ZONES_CITEES);
  return { nombre, total, manquantes: total - nombre, zones, sansZone };
}

/** La phrase de Chen sur le Pokédex, composée avec les textes de `data/defi-chen.json`. */
export function messageBilan(bilan: BilanPokedex): string {
  const m = messagesDuDefi;
  const remplir = (modele: string, valeurs: Record<string, string | number>) =>
    Object.entries(valeurs).reduce((texte, [cle, valeur]) => texte.replaceAll(`{${cle}}`, String(valeur)), modele);
  if (bilan.manquantes === 0) return remplir(m.bilanComplet, { total: bilan.total });
  return [
    remplir(m.bilan, { nombre: bilan.nombre, total: bilan.total, manquantes: bilan.manquantes }),
    bilan.zones.length ? remplir(m.bilanZones, { zones: bilan.zones.map(z => `${z.nom} (${z.manquantes})`).join(', ') }) : '',
    bilan.sansZone ? remplir(m.bilanSansZone, { n: bilan.sansZone }) : '',
  ].filter(Boolean).join(' ');
}
