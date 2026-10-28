import { chargerEvenements } from './evenements';
import { kanto } from './regions';

export const evenementsKanto = chargerEvenements(
  import.meta.glob('../../data/evenements/{intro,rival,ronflex,fin,chen-boss}.json', { eager: true, import: 'default' }),
  { zone: id => id === 'kanto.labo' ? { ...kanto.lieu('labo'), id, sansCombat: true, liens: [] } : kanto.zone(id) },
);
