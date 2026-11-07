export type Raccourci = { touche: string; libelle: string; groupe: 'Combat' | 'Partout'; action: string };
const combat: [string, string, string][] = [
  ['Espace', 'Attaquer', 'attaquer'], ['Entrée', 'Attaquer', 'attaquer-entree'], ['C', 'Capturer', 'capturer'], ['B', 'Changer de balle', 'balle'],
  ['A', 'Attaque auto', 'auto'], ['T', 'Arrêt auto', 'arret'], ['R', "Réglage de l’arrêt auto", 'reglage'],
  ['S', 'Sac', 'sac'], ['F', 'Fauchage', 'fauchage'], ['P', 'Poké-Radar', 'radar'],
  ['Flèche gauche', 'Zone précédente', 'zone-precedente'], ['Flèche droite', 'Zone suivante', 'zone-suivante'],
];
const partout: [string, string, string][] = [
  ['1', 'Combat', 'combat'], ['2', 'Équipe', 'equipe'], ['3', 'PC', 'pc'], ['4', 'Shop', 'shop'], ['5', 'Carte', 'carte'], ['6', 'Menu', 'menu'], ['Échap', 'Fermer la fenêtre', 'fermer'], ['Tab', 'Élément suivant', 'suivant'], ['Maj Tab', 'Élément précédent', 'precedent'],
  ['/', 'Chercher (PC, Pokédex)', 'chercher'], ['?', 'Cette liste', 'raccourcis'],
];
export const raccourcis: Raccourci[] = [
  ...combat.map(([touche, libelle, action]) => ({ touche, libelle, action, groupe: 'Combat' as const })),
  ...partout.map(([touche, libelle, action]) => ({ touche, libelle, action, groupe: 'Partout' as const })),
];
