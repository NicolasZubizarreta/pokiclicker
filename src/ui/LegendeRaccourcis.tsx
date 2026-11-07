import { useStore } from 'zustand';
import { storeJeu } from './store';
import type { Page } from './Navigation';

export function LegendeRaccourcis({ page }: { page: Page }) {
  const fauchage = useStore(storeJeu, e => e.fauchage.possede);
  const radar = useStore(storeJeu, e => e.radar);
  const liste = page === 'Combat'
    ? [['Espace', 'Attaquer'], ['C', 'Capturer'], ['B', 'Balle'], ['A', 'Auto'], ['T', 'Arrêt'], ['S', 'Sac'], ...(fauchage ? [['F', 'Fauchage']] : []), ...(radar ? [['P', 'Radar']] : []), ['← →', 'Zone'], ['1–6', 'Onglets'], ['?', 'Tous']]
    : [['1–6', 'Onglets'], ['Tab', 'Naviguer'], ['Échap', 'Fermer'], ...(page === 'PC' ? [['/', 'Chercher']] : []), ['?', 'Raccourcis']];
  return <footer aria-label="Raccourcis clavier" className="hidden shrink-0 flex-wrap items-center gap-4 border-t border-bordure bg-surface px-8 py-2 text-xs text-texte-doux lg:flex">{liste.map(([touche, libelle]) => <span key={touche}><kbd>{touche}</kbd> {libelle}</span>)}</footer>;
}
