import { chargerEvenements } from './evenements';
import { kanto } from './regions';

export const evenementsKanto = chargerEvenements(
  import.meta.glob('../../data/evenements/*.json', { eager: true, import: 'default' }),
  kanto,
);
