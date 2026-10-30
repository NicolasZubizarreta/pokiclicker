import { chargerEvenements } from './evenements';
import { kanto } from './regions';
import type { DonneesRegion } from './sauvegarde';

export const routeRonflex = 'kanto.route-de-ronflex';
export const routeRonflexTerminee = (region: DonneesRegion, zoneId: string) =>
  zoneId === routeRonflex && region.drapeaux.includes('ronflex-vaincu');

/** Compatibilité des sauvegardes antérieures à l'interzone et à l'étape Souffle. */
export function normaliserRonflex(region: DonneesRegion): DonneesRegion {
  const suivantes = kanto.zones.slice(kanto.zones.findIndex(z => z.id === 'kanto.arene-de-parmanie'));
  const avancee = suivantes.some(z => z.id === region.zoneId || region.bossVaincus.includes(z.id));
  const terminee = avancee || region.evenementsJoues.includes('kanto.ronflex-reveil');
  let resultat = region;
  if (terminee && !resultat.drapeaux.includes('ronflex-vaincu')) {
    resultat = { ...resultat, drapeaux: [...resultat.drapeaux, 'ronflex-vaincu'] };
  }
  const enCours = resultat.evenementEnCours?.id;
  if ((terminee && (enCours === 'kanto.ronflex-reveil' || enCours === 'kanto.ronflex-blocage'))
    || (enCours === 'kanto.ronflex-blocage' && resultat.zoneId === 'kanto.centrale')) {
    resultat = { ...resultat, evenementEnCours: undefined };
  }
  if (!resultat.drapeaux.includes('ronflex-vaincu') && resultat.zoneId === 'kanto.centrale'
    && resultat.evenementsJoues.includes('kanto.ronflex-blocage')) {
    resultat = { ...resultat, evenementsJoues: resultat.evenementsJoues.filter(id => id !== 'kanto.ronflex-blocage') };
  }
  if (resultat.evenementEnCours?.id === 'kanto.ronflex-reveil' && resultat.zoneId === 'kanto.centrale') {
    resultat = { ...resultat, zoneId: routeRonflex, etape: 1,
      evenementEnCours: { ...resultat.evenementEnCours, etape: resultat.evenementEnCours.etape + 1 } };
  }
  if (routeRonflexTerminee(resultat, resultat.zoneId) && !resultat.evenementEnCours) {
    resultat = { ...resultat, zoneId: 'kanto.arene-de-parmanie', etape: 1 };
  }
  return resultat;
}

export const evenementsKanto = chargerEvenements(
  import.meta.glob('../../data/evenements/{intro,rival,ronflex,fin,chen-boss}.json', { eager: true, import: 'default' }),
  { zone: id => id === 'kanto.labo' ? { ...kanto.lieu('labo'), id, sansCombat: true, liens: [] } : kanto.zone(id) },
);
