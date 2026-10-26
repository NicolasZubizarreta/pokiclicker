import { chargerEvenements } from './evenements';
import { kanto } from './regions';

export const evenementsKanto = chargerEvenements(
  import.meta.glob('../../data/evenements/{intro,rival,ronflex}.json', { eager: true, import: 'default' }),
  kanto,
);
