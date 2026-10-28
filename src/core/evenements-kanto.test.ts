import { describe, expect, it } from 'vitest';
import { combatEnPause, commandeCourante, declencher, etapeTerminee, type Commande } from './evenements';
import { evenementsKanto as catalogue } from './evenements-kanto';
import { spriteDe } from './personnages';
import { reglages } from './reglages';
import { regionInitiale } from './sauvegarde';

const depart = () => regionInitiale('kanto', 'kanto.route-1');
const texte = (c: Commande | null) => (c?.type === 'dialogue' ? c.texte : null);

function jouer(region: ReturnType<typeof depart>) {
  const repliques: Commande[] = [];
  for (let c = commandeCourante(catalogue, region); c; c = commandeCourante(catalogue, region)) {
    repliques.push(c);
    region = etapeTerminee(catalogue, region, c);
  }
  return { region, repliques };
}

describe('Chen au premier boss (AI)', () => {
  const evenement = catalogue.parId('kanto.chen-premier-boss');
  const dialogues = evenement.etapes.filter(e => e.type === 'dialogue');

  it('tient en 3 à 5 répliques de Chen, avec son sprite', () => {
    expect(dialogues.length).toBeGreaterThanOrEqual(3);
    expect(dialogues.length).toBeLessThanOrEqual(5);
    expect(dialogues).toHaveLength(evenement.etapes.length);
    for (const d of dialogues) {
      expect(d.locuteur).toBe('Prof. Chen');
      expect(spriteDe(d.locuteur, d.pose)).toMatchObject({ type: 'image' });
    }
  });

  it('dit les chiffres du jeu : 10 étapes, boss en 30 s, retour à l’étape 9, zone suivante', () => {
    const tout = dialogues.map(d => d.texte).join(' ');
    expect(tout).toContain(`${reglages.combat.etapeBoss} étapes`);
    expect(tout).toContain(`${reglages.combat.minuteurBossMs / 1000} secondes`);
    expect(tout).toContain(`étape ${reglages.combat.etapeBoss - 1}`);
    expect(tout).toContain('zone suivante');
  });

  it('se déclenche en arrivant sur le boss de la Route 1, fige le combat, puis ne revient plus', () => {
    let region = declencher(catalogue, depart(), { type: 'boss-atteint', zone: 'kanto.route-1' });
    expect(commandeCourante(catalogue, region)).toMatchObject({ evenement: evenement.id, type: 'dialogue' });
    expect(combatEnPause(catalogue, region)).toBe(true);
    const fin = jouer(region);
    expect(fin.repliques).toHaveLength(dialogues.length);
    expect(combatEnPause(catalogue, fin.region)).toBe(false);
    expect(fin.region.evenementsJoues).toContain(evenement.id);
    region = declencher(catalogue, fin.region, { type: 'boss-atteint', zone: 'kanto.route-1' });
    expect(commandeCourante(catalogue, region)).toBeNull();
  });

  it('ne se déclenche pas pour un autre boss ni quand le boss de la Route 1 est déjà battu', () => {
    const autre = declencher(catalogue, depart(), { type: 'boss-atteint', zone: 'kanto.foret-de-jade' });
    expect(commandeCourante(catalogue, autre)).toBeNull();
    const ancienne = { ...depart(), bossVaincus: ['kanto.route-1'] };
    expect(commandeCourante(catalogue, declencher(catalogue, ancienne, { type: 'boss-atteint', zone: 'kanto.route-1' }))).toBeNull();
  });

  it('ne fige pas le combat pour les autres événements', () => {
    const region = declencher(catalogue, depart(), { type: 'entree-zone', zone: 'kanto.foret-de-jade' });
    expect(commandeCourante(catalogue, region)).not.toBeNull();
    expect(combatEnPause(catalogue, region)).toBe(false);
  });
});

describe('Présentation de Blue (AI)', () => {
  const entree = { type: 'entree-zone', zone: 'kanto.foret-de-jade' } as const;

  it('précède le premier défi, dit qui est Blue et montre son sprite', () => {
    const region = declencher(catalogue, depart(), entree);
    const { repliques } = jouer(region);
    const presentation = repliques.filter(c => c.evenement === 'kanto.blue-presentation');
    expect(presentation.length).toBeGreaterThanOrEqual(1);
    expect(repliques[0]?.evenement).toBe('kanto.blue-presentation');
    const dit = presentation.map(texte).join(' ');
    expect(dit).toContain('Blue');
    expect(dit).toContain('petit-fils du Prof. Chen');
    expect(dit).toContain('rival');
    expect(repliques.findIndex(c => c.evenement === 'kanto.rival-foret'))
      .toBeGreaterThan(presentation.length - 1);
  });

  it('n’est pas rejouée aux rencontres suivantes', () => {
    const premiere = jouer(declencher(catalogue, depart(), entree)).region;
    expect(premiere.evenementsJoues).toContain('kanto.blue-presentation');
    const carmin = declencher(catalogue, premiere, { type: 'entree-zone', zone: 'kanto.arene-de-carmin' });
    expect(commandeCourante(catalogue, carmin)).toMatchObject({ evenement: 'kanto.rival-carmin' });
    const { repliques } = jouer(carmin);
    expect(repliques.some(c => c.evenement === 'kanto.blue-presentation')).toBe(false);
    const retour = declencher(catalogue, premiere, entree);
    expect(commandeCourante(catalogue, retour)).toBeNull();
  });

  it('montre le sprite de Blue dans chacune de ses répliques', () => {
    const blue = catalogue.liste.flatMap(e => e.etapes).filter(e => e.type === 'dialogue' && e.locuteur === 'Blue');
    expect(blue).toHaveLength(12);
    for (const d of blue) expect(spriteDe('Blue', d.type === 'dialogue' ? d.pose : undefined)).not.toBeNull();
  });
});

describe('sprites de personnages', () => {
  it('Chen et Blue : image du dépôt ; pose sans image : silhouette ; sans pose : rien', () => {
    expect(spriteDe('Prof. Chen', 'chen-2')).toEqual({ type: 'image', src: 'img/sprites/chen/chen-2.png' });
    expect(spriteDe('Blue', 'blue-1')).toEqual({ type: 'image', src: 'img/sprites/blue/blue-1.png' });
    expect(spriteDe('Blue', 'blue-9')).toEqual({ type: 'silhouette' });
    expect(spriteDe('Blue', undefined)).toBeNull();
  });
});
