import { chargerEvolutions, type Evolutions } from './evolution';
import { kanto } from './regions';

export type ZonesEspece = {
  /** Zones sauvages dans l'ordre du fichier, avec leur nom. */
  zones: { id: string; nom: string }[];
  /** Stade précédent fournissant les zones, sinon null. */
  via: number | null;
};
type Donnees = {
  zones: { id: string; nom: string; sauvages?: { pokemon: number }[] }[];
  evolutions: Evolutions;
};
const defaut: Donnees = { zones: kanto.zones, evolutions: chargerEvolutions() };

export function zonesDeEspece(numero: number, donnees: Donnees = defaut): ZonesEspece {
  const origines = new Map([...donnees.evolutions.niveau, ...donnees.evolutions.pierre]
    .map(evolution => [evolution.vers, evolution.de]));
  let stade: number | undefined = numero;
  while (stade !== undefined) {
    const zones = donnees.zones.filter(zone => zone.sauvages?.some(p => p.pokemon === stade))
      .map(({ id, nom }) => ({ id, nom }));
    if (zones.length) return { zones, via: stade === numero ? null : stade };
    stade = origines.get(stade);
  }
  return { zones: [], via: null };
}
