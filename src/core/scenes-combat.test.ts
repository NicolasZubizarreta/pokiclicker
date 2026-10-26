import { describe, expect, it } from 'vitest';
import { avancerCombat, creerEnnemi, reprendreCombat } from './combat';
import { nomAdversaireEvenement, zoneDeCombatEvenement, zoneDuCombat } from './combat-evenement';
import { chargerEvenements, type Commande, type MembreEquipe } from './evenements';
import type { Zone } from './monde';
import { regionInitiale } from './sauvegarde';

const zone: Zone = {
  id: 'kanto.route-1', nom: 'Route 1', decor: 'route', niveaux: [2, 3], etapes: 10,
  multiplicateurPv: 1, sauvages: [{ pokemon: 16, rarete: 'commun', apparition: 1, capture: 255 }],
  boss: { pokemon: 18, nom: 'Roucarnage', niveau: 10, capture: 25 }, liens: [], ancienId: 1,
};
type Combat = Extract<Commande, { type: 'combat' }>;
const equipes = {
  '1': [{ pokemon: 16, nom: 'Roucool', niveau: 4 }, { pokemon: 19, nom: 'Rattata', niveau: 5 },
    { pokemon: 4, nom: 'Salamèche', niveau: 6 }],
  '4': [{ pokemon: 16, nom: 'Roucool', niveau: 7 }, { pokemon: 19, nom: 'Rattata', niveau: 8 },
    { pokemon: 7, nom: 'Carapuce', niveau: 9 }],
  '7': [{ pokemon: 16, nom: 'Roucool', niveau: 10 }, { pokemon: 19, nom: 'Rattata', niveau: 11 },
    { pokemon: 1, nom: 'Bulbizarre', niveau: 12 }],
};
const commande: Combat = { type: 'combat', evenement: 'rival', etape: 1, dresseur: 'Blue', equipes };
const alea = () => { throw new Error('Un boss ne doit pas tirer d’aléa'); };

describe('combat d’événement', () => {
  it.each([1, 4, 7, null] as const)('joue l’équipe du starter %s avec des boss à 30 secondes', starter => {
    const avant = structuredClone({ zone, commande });
    const synthetique = zoneDeCombatEvenement(commande, zone, starter);
    const equipe = equipes[starter ?? 1];
    expect(synthetique).toMatchObject({ id: 'evenement:rival', type: 'ligue', etapes: 3, decor: zone.decor });
    expect(synthetique.adversaires).toEqual(equipe.slice(0, -1).map(m => ({ ...m, capture: 0 })));
    expect(synthetique.boss).toEqual({ ...equipe[2], capture: 0 });
    equipe.forEach((membre, i) => {
      expect(creerEnnemi(synthetique, i + 1, alea)).toMatchObject({
        numero: membre.pokemon, niveau: membre.niveau, boss: true, capture: 0, shiny: false,
      });
      expect(reprendreCombat(synthetique, [], alea, i + 1).minuteurMs).toBe(30000);
      expect(nomAdversaireEvenement(commande, starter, i + 1)).toBe(`Blue (${membre.nom})`);
    });
    expect({ zone, commande }).toEqual(avant);
  });

  it('reprend au premier Pokémon après expiration à l’étape 3 sans modifier le combat initial', () => {
    const synthetique = zoneDeCombatEvenement(commande, zone, 4);
    const initial = reprendreCombat(synthetique, [], alea, 3);
    const avant = { ...initial, ennemi: { ...initial.ennemi } };
    const resultat = avancerCombat(initial, 30000);
    expect(resultat).toMatchObject({ etape: 1, minuteurMs: 30000 });
    expect(resultat.ennemi).toEqual(creerEnnemi(synthetique, 1, alea));
    expect(resultat.evenements).toEqual([{ type: 'boss-echoue', zoneId: synthetique.id }]);
    expect(initial).toEqual(avant);
  });

  it.each([1, 2, 3, 6])('émet boss-vaincu seulement après le dernier des %i Pokémon', taille => {
    const equipe: MembreEquipe[] = Array.from({ length: taille }, (_, i) => ({
      pokemon: i + 1, niveau: i + 4, nom: `Adversaire ${i + 1}`,
    }));
    const combat: Combat = { ...commande, dresseur: 'Blue', equipes: { '1': equipe, '4': equipe, '7': equipe } };
    const synthetique = zoneDeCombatEvenement(combat, zone, 1);
    for (let etape = 1; etape <= taille; etape++) {
      const initial = reprendreCombat(synthetique, [{ numero: 150, niveau: 1e9 }], alea, etape);
      const resultat = avancerCombat(initial, 100);
      expect(resultat.evenements.filter(e => e.type === 'ennemi-vaincu')).toHaveLength(1);
      expect(resultat.evenements.filter(e => e.type === 'boss-vaincu'))
        .toEqual(etape === taille ? [{ type: 'boss-vaincu', zoneId: synthetique.id }] : []);
      expect(resultat.etape).toBe(etape === taille ? 1 : etape + 1);
    }
  });

  it('joue un Pokémon seul sans capture et utilise son nom de catalogue si absent', () => {
    const combat: Combat = { type: 'combat', evenement: 'ronflex', etape: 0,
      pokemon: 143, niveau: 45, capture: 255 };
    const synthetique = zoneDeCombatEvenement(combat, zone, null);
    expect(synthetique).toMatchObject({ etapes: 1, adversaires: [],
      boss: { pokemon: 143, niveau: 45, nom: 'Ronflex', capture: 0 } });
    expect(creerEnnemi(synthetique, 1, alea)).toMatchObject({ numero: 143, niveau: 45, boss: true, capture: 0 });
    expect(nomAdversaireEvenement(combat, null, 1)).toBe('Ronflex');
    expect(nomAdversaireEvenement({ ...combat, nom: 'Ronflex endormi' }, null, 1)).toBe('Ronflex endormi');
  });

  it('localise uniquement le combat courant dans la zone de son déclencheur', () => {
    const cat = chargerEvenements({ essai: { version: 1, evenements: [
      { id: 'rival', declencheur: { type: 'entree-zone', zone: zone.id }, etapes: [
        { type: 'dialogue', locuteur: 'Blue', texte: 'Combattons !' },
        { type: 'combat', dresseur: 'Blue', equipes },
      ] },
      { id: 'ronflex', declencheur: { type: 'objet-utilise', objet: 'pokeflute', zone: zone.id },
        etapes: [{ type: 'combat', pokemon: 143, niveau: 45 }] },
      { id: 'sans-zone', declencheur: { type: 'debut-partie' },
        etapes: [{ type: 'combat', pokemon: 16, niveau: 5 }] },
    ] } }, { zone: () => zone });
    const region = regionInitiale('kanto', 'kanto.ailleurs');
    const avant = structuredClone(region);
    expect(zoneDuCombat(cat, region)).toBeNull();
    const enCours = (id: string, etape: number) => ({ ...region, evenementEnCours: { id, etape, file: [] } });
    expect(zoneDuCombat(cat, enCours('rival', 0))).toBeNull();
    expect(zoneDuCombat(cat, enCours('rival', 1))).toBe(zone.id);
    expect(zoneDuCombat(cat, enCours('ronflex', 0))).toBe(zone.id);
    expect(zoneDuCombat(cat, enCours('sans-zone', 0))).toBeNull();
    expect(zoneDuCombat(cat, enCours('inconnu', 0))).toBeNull();
    expect(zoneDuCombat(cat, enCours('rival', 2))).toBeNull();
    expect(region).toEqual(avant);
  });
});
