import { describe, expect, it } from 'vitest';
import { blocage, commandeCourante, declencher, etapeTerminee } from './evenements';
import { evenementsKanto as cat } from './evenements-kanto';
import { regionInitiale, type DonneesRegion } from './sauvegarde';

const centrale = 'kanto.centrale';
const parmanie = 'kanto.arene-de-parmanie';
const tour = 'kanto.tour-pokemon';
const entree = { type: 'entree-zone', zone: centrale } as const;
const flute = { type: 'objet-utilise', objet: 'pokeflute', zone: centrale } as const;
const raison = 'Un Ronflex endormi bloque la route de Parmanie. Joue de la Pokéflûte pour le réveiller.';
const region = () => regionInitiale('kanto', centrale);
const recharger = (r: DonneesRegion): DonneesRegion => JSON.parse(JSON.stringify(r));
function dialogues(r: DonneesRegion): DonneesRegion {
  for (let i = 0; i < 20; i++) {
    const commande = commandeCourante(cat, r);
    if (commande?.type !== 'dialogue') return r;
    r = etapeTerminee(cat, r, commande);
  }
  throw new Error('Trop de dialogues');
}

describe('scènes Kanto : Pokéflûte et Ronflex', () => {
  it('donne la Pokéflûte après la Tour sans modifier les entrées ni la redonner au rechargement', () => {
    const initiale = region();
    const avant = structuredClone(initiale);
    const fait = { type: 'boss-vaincu', zone: tour } as const;
    const debut = declencher(cat, initiale, fait);
    const fin = dialogues(debut);
    expect(initiale).toEqual(avant);
    expect(fin.objetsCles).toEqual(['pokeflute']);
    const reprise = recharger(fin);
    expect(declencher(cat, reprise, fait)).toBe(reprise);
    expect(commandeCourante(cat, reprise)).toBeNull();
  });

  it('rattrape le don à la Centrale uniquement si la Tour est vaincue et la flûte absente', () => {
    const initiale = { ...region(), bossVaincus: [tour] };
    const debut = declencher(cat, initiale, entree);
    expect(debut.objetsCles).toEqual(['pokeflute']);
    expect(blocage(cat, debut, parmanie)).toEqual({ ok: false, raison });
    const fin = dialogues(debut);
    expect(fin.objetsCles).toEqual(['pokeflute']);
    expect(blocage(cat, fin, parmanie)).toEqual({ ok: false, raison });
    const sansTour = dialogues(declencher(cat, region(), entree));
    expect(sansTour.objetsCles).toEqual([]);
    const dejaDonnee = dialogues(declencher(cat, { ...initiale, objetsCles: ['pokeflute'] }, entree));
    expect(dejaDonnee.objetsCles).toEqual(['pokeflute']);
    expect(dejaDonnee.evenementsJoues).toEqual(sansTour.evenementsJoues);
  });

  it('bloque dès l’entrée, réveille puis combat Ronflex et ouvre seulement après la victoire', () => {
    const initiale = { ...region(), objetsCles: ['pokeflute'] };
    expect(blocage(cat, initiale, parmanie)).toEqual({ ok: true });
    const debut = declencher(cat, initiale, entree);
    expect(blocage(cat, debut, parmanie)).toEqual({ ok: false, raison });
    const bloque = dialogues(debut);
    const reveil = declencher(cat, bloque, flute);
    expect(commandeCourante(cat, reveil)?.type).toBe('dialogue');
    const combat = dialogues(reveil);
    const commande = commandeCourante(cat, combat);
    expect(commande).toMatchObject({ type: 'combat', pokemon: 143, niveau: 45, capture: 0 });
    expect(combat.drapeaux).not.toContain('ronflex-vaincu');
    expect(blocage(cat, combat, parmanie)).toEqual({ ok: false, raison });
    expect(commandeCourante(cat, recharger(combat))).toEqual(commande);
    const fin = dialogues(etapeTerminee(cat, recharger(combat), commande!));
    expect(fin.drapeaux).toContain('ronflex-vaincu');
    expect(fin.objetsCles).toEqual(['pokeflute']);
    expect(fin.bossVaincus).toEqual([]);
    expect(blocage(cat, fin, parmanie)).toEqual({ ok: true });
    const reprise = recharger(fin);
    expect(declencher(cat, reprise, entree)).toBe(reprise);
    expect(declencher(cat, reprise, flute)).toBe(reprise);
    expect(commandeCourante(cat, reprise)).toBeNull();
  });

  it('préserve les anciennes sauvegardes où Parmanie est vaincue', () => {
    const initiale = { ...region(), bossVaincus: [tour, parmanie] };
    const fin = dialogues(declencher(cat, initiale, entree));
    expect(fin.objetsCles).toEqual(['pokeflute']);
    expect(blocage(cat, fin, parmanie)).toEqual({ ok: true });
  });

  it('ne réveille pas Ronflex avec la flûte ailleurs', () => {
    const initiale = { ...region(), objetsCles: ['pokeflute'] };
    expect(declencher(cat, initiale, { ...flute, zone: tour })).toBe(initiale);
  });
});

describe('scènes Kanto : rival obligatoire', () => {
  it.each(['foret-de-jade', 'arene-de-carmin', 'tour-pokemon', 'sylphe-sarl', 'route-victoire'])(
    '%s : dialogue, combat, absence de rejeu et ancienne sauvegarde intacte', id => {
      const zone = `kanto.${id}`;
      const fait = { type: 'entree-zone', zone } as const;
      const initiale = regionInitiale('kanto', zone);
      const debut = declencher(cat, initiale, fait);
      expect(commandeCourante(cat, debut)).toMatchObject({ type: 'dialogue', locuteur: 'Blue' });
      const combat = dialogues(debut);
      const commande = commandeCourante(cat, combat);
      expect(commande).toMatchObject({ type: 'combat', dresseur: 'Blue' });
      // Blue est présenté (ticket AI) avant son tout premier défi, à la Forêt de Jade.
      expect(combat.evenementsJoues).toEqual(id === 'foret-de-jade' ? ['kanto.blue-presentation'] : []);
      const fin = dialogues(etapeTerminee(cat, combat, commande!));
      expect(fin.evenementsJoues).toContain(commande!.evenement);
      expect(fin.bossVaincus).toEqual([]);
      const reprise = recharger(fin);
      expect(declencher(cat, reprise, fait)).toBe(reprise);
      const ancienne = { ...initiale, bossVaincus: [zone] };
      expect(declencher(cat, ancienne, fait)).toBe(ancienne);
    },
  );
});
