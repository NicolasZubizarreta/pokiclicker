import { describe, expect, it } from 'vitest';
import { calculerObjectifs, chargerObjectifs, listeFenetre, objectifAffiche, type EntreeObjectifs } from './objectifs';

export function entree(): EntreeObjectifs {
  return { zone: { nom: 'Arène', type: 'arene', etapes: 10, boss: { nom: 'Pierre (Onix)' } }, zoneSuivante: { nom: 'Route 2', ouverte: false }, argent: 0,
    boutique: { ouverte: true, objets: [] }, progression: { pokedex: { nombre: 3 }, prochain: { palier: 10, restantes: 7 }, paliers: [{ palier: 10, description: 'Dégâts Clic x2', recu: false }] },
    pension: { ouverte: false, parents: 0, oeufs: 0, especesEcloses: 0 } };
}
it('calcule le boss selon la zone et sa destination', () => {
  const e = entree();
  expect(calculerObjectifs(e).boss?.texte).toBe('Boss : Pierre, étape 10');
  e.zone!.type = 'ligue'; expect(calculerObjectifs(e).boss?.texte).toBe('Boss : Pierre, étape 10');
  e.zone!.type = 'route'; e.zone!.boss.nom = 'Rattata (Géant)';
  expect(calculerObjectifs(e).boss?.texte).toContain('Rattata (Géant)');
  e.zoneSuivante!.ouverte = true; expect(calculerObjectifs(e).boss?.texte).toBe('Zone suivante : Route 2');
  expect(calculerObjectifs(e).boss).toMatchObject({ fait: false, cible: 'Combat', guide: 'zoneSuivante' });
  e.zoneSuivante!.atteinte = true;
  expect(calculerObjectifs(e).boss).toMatchObject({ fait: true, applicable: false, cible: null, texte: 'Zone suivante visitée : Route 2' });
  expect(calculerObjectifs(e).boss).not.toHaveProperty('guide');
  e.zoneSuivante = null; expect(calculerObjectifs(e).boss?.texte).toContain('Boss : ');
  e.zone = null; expect(calculerObjectifs(e).boss).toBeNull();
});
it('distingue les équipements abordables et achetés, sans les objets exclus', () => {
  const e = entree();
  const objectif = () => calculerObjectifs(e).fonctionnalites[0]!;
  expect(objectif().applicable).toBe(false);
  e.boutique.objets = [{ id: 'force', categorie: 'equipement', possede: false, abordable: false }];
  expect(objectif().applicable).toBe(false);
  e.boutique.objets[0]!.abordable = true; expect(objectif().applicable).toBe(true);
  e.boutique.objets[0]!.possede = true; expect(objectif()).toMatchObject({ fait: true, applicable: false, texte: 'Équipement acheté' });
  e.boutique.objets[0]!.id = 'pokeradar'; expect(objectif().fait).toBe(false);
  e.boutique.ouverte = false; expect(calculerObjectifs(e).fonctionnalites.some(o => o.id === 'equipement')).toBe(false);
});
it('reprend le bonus du palier et termine le Pokédex', () => {
  const e = entree();
  expect(calculerObjectifs(e).fonctionnalites[1]!.texte).toBe('Pokédex : 3/10 pour un bonus (Dégâts Clic x2)');
  e.progression.prochain = null; expect(calculerObjectifs(e).fonctionnalites[1]).toMatchObject({ fait: true, applicable: false });
});
it('liste la pension ouverte et reconnaît chaque preuve de son utilisation', () => {
  const e = entree(); const pension = () => calculerObjectifs(e).fonctionnalites.find(o => o.id === 'pension');
  expect(pension()).toBeUndefined(); e.pension.ouverte = true; expect(pension()?.applicable).toBe(true);
  for (const preuve of [{ parents: 2, oeufs: 0, especesEcloses: 0 }, { parents: 0, oeufs: 1, especesEcloses: 0 }, { parents: 0, oeufs: 0, especesEcloses: 1 }]) {
    Object.assign(e.pension, preuve); expect(pension()).toMatchObject({ fait: true, applicable: false });
  }
});
it('ne révèle que les objets en vente et reconnaît leur achat', () => {
  const e = entree(); const radar = () => calculerObjectifs(e).fonctionnalites.find(o => o.id === 'poke-radar');
  expect(radar()).toBeUndefined(); e.boutique.objets.push({ id: 'pokeradar', categorie: 'equipement', possede: false, abordable: false });
  expect(radar()?.applicable).toBe(true); e.boutique.objets[0]!.possede = true;
  expect(radar()).toMatchObject({ fait: true, applicable: false });
});
it('alterne le boss et les seules fonctionnalités applicables', () => {
  const e = entree(); e.pension.ouverte = true;
  const r = calculerObjectifs(e);
  expect(listeFenetre(r).map(o => o.id)).toEqual(['boss', 'equipement', 'palier-pokedex', 'pension']);
  expect(Array.from({ length: 8 }, (_, i) => objectifAffiche(i, r)?.id)).toEqual(['boss', 'palier-pokedex', 'boss', 'pension', 'boss', 'palier-pokedex', 'boss', 'pension']);
  r.boss = null; expect(objectifAffiche(1, r)?.id).toBe('pension');
  r.fonctionnalites.forEach(o => { o.fait = true; }); expect(objectifAffiche(0, r)).toBeNull();
  r.boss = calculerObjectifs(e).boss; expect(objectifAffiche(99, r)?.id).toBe('boss');
});
describe('chargeur', () => {
  it('charge les données du dépôt', () => expect(chargerObjectifs().alternanceMs).toBe(8000));
  const invalides: ((d: ReturnType<typeof chargerObjectifs>) => void)[] = [
    d => { Object.assign(d, { inconnu: true }); }, d => { d.alternanceMs = 0; },
    d => { d.boss.texteBoss = ''; }, d => { d.boss.texteBoss = '{inconnu}'; },
    d => { d.fonctionnalites[1]!.id = d.fonctionnalites[0]!.id; },
    d => { Object.assign(d.fonctionnalites[0]!, { type: 'inconnu' }); },
    d => { d.fonctionnalites[0]!.texteFait = ''; }, d => { d.fonctionnalites[0]!.cible = 'inconnue'; },
    d => { Object.assign(d.fonctionnalites[0]!, { exclus: 'non' }); }, d => { d.fonctionnalites[3]!.objet = ''; },
    d => { d.fonctionnalites[0]!.texte = '{nom}'; }, d => { Object.assign(d, { boss: null }); },
    d => { Object.assign(d, { fonctionnalites: null }); }, d => { d.fonctionnalites[0]!.id = ''; },
  ];
  invalides.forEach((modifier, i) => it(`rejette la donnée invalide ${i}`, () => { const d = chargerObjectifs(); modifier(d); expect(() => chargerObjectifs(d)).toThrow(); }));
});
