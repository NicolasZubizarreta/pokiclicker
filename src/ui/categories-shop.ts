export function categorieShop(objet: { categorie: string; unique: boolean }): 'balles' | 'objets' | 'accessoires' {
  return objet.categorie === 'balles' ? 'balles' : objet.unique ? 'accessoires' : 'objets';
}

export const categoriesShop = [
  { cle: 'balles', nom: 'Poké Ball' },
  { cle: 'objets', nom: 'Objets' },
  { cle: 'accessoires', nom: 'Accessoires' },
];
