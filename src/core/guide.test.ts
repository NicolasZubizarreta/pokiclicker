import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import donnees from '../../data/guide.json';
import { chargerGuide, guide, remplirMarqueurs, sourcesParDefaut } from './guide';

/** Lit le guide tel que la V1 l'écrit (`legacy/index.html`, modale « GUIDE DU JEU »). */
function guideDeLaV1() {
  const html = readFileSync(fileURLToPath(new URL('../../legacy/index.html', import.meta.url)), 'utf8');
  const debut = html.indexOf('id="help-modal"');
  const bloc = html.slice(debut, html.indexOf('<script src', debut));
  const sections: { titre: string; paragraphes: string[] }[] = [];
  for (const ligne of bloc.split(/\r?\n/)) {
    const titre = ligne.match(/<h3 [^>]*>(.*)<\/h3>/);
    if (titre) { sections.push({ titre: titre[1]!, paragraphes: [] }); continue; }
    const paragraphe = ligne.match(/<p(?: class="mt-2")?>(.*)<\/p>/);
    if (paragraphe && sections.length) sections.at(-1)!.paragraphes.push(paragraphe[1]!);
  }
  return sections;
}

it('reprend toutes les sections de la V1, dans le même ordre, mot pour mot', () => {
  const v1 = guideDeLaV1();
  expect(v1).toHaveLength(13);
  expect(guide.sections.map(({ titre, paragraphes }) => ({ titre, paragraphes }))).toEqual(v1);
});

it('lit les chiffres et les zones d\'ouverture dans les données du jeu, pas dans le texte', () => {
  const brut = JSON.stringify(donnees);
  for (const marqueur of ['reglages.combat.etapeBoss', 'reglages.combat.minuteurBossMs', 'zoneObjet:leftovers',
    'zoneObjet:pokeradar', 'zoneObjet:falseSwipe', 'zoneLieu:pension', 'zoneReglage:reglages.pc.zone',
    'reglages.pension.chances.typePartage', 'reglages.pension.chances.memeEspece',
    'reglages.pension.bonheurNaissance', 'reglages.degats.pierreEternelle', 'compte:ligue.combats',
    'compte:defi.combats', 'compte:pokemon.pokemon']) {
    expect(brut, marqueur).toContain(marqueur);
  }
  expect(guide.sections.flatMap(section => section.paragraphes).join(' ')).not.toMatch(/[{}]/);
});

it('suit les données quand elles changent', () => {
  const sources = {
    ...sourcesParDefaut,
    fichiers: {
      ...sourcesParDefaut.fichiers,
      reglages: { combat: { etapeBoss: 12, minuteurBossMs: 45000 }, degats: { pierreEternelle: 1.4 },
        pension: { chances: { typePartage: 0.035 } }, pc: { zone: 'kanto.foret-de-jade' } },
    },
    objets: [{ id: 'leftovers', zone: 'kanto.mont-selenite' }],
  };
  expect(remplirMarqueurs('{nombre:reglages.combat.etapeBoss} / {moins1:reglages.combat.etapeBoss}', sources)).toBe('12 / 11');
  expect(remplirMarqueurs('{secondes:reglages.combat.minuteurBossMs}', sources)).toBe('45');
  expect(remplirMarqueurs('+{surplus:reglages.degats.pierreEternelle}%', sources)).toBe('+40%');
  expect(remplirMarqueurs('{pourcent:reglages.pension.chances.typePartage}%', sources)).toBe('3,5%');
  expect(remplirMarqueurs('zone {zoneReglage:reglages.pc.zone}', sources)).toBe('zone 2');
  expect(remplirMarqueurs('zone {zoneObjet:leftovers}', sources)).toBe('zone 4');
});

it('refuse un marqueur ou une donnée inconnus, en français', () => {
  expect(() => remplirMarqueurs('{inconnu:reglages.combat.etapeBoss}')).toThrow('marqueur « inconnu » inconnu');
  expect(() => remplirMarqueurs('{nombre:reglages.nexiste.pas}')).toThrow('n\'existe pas');
  expect(() => remplirMarqueurs('{zoneObjet:superball-fantome}')).toThrow('n\'a pas de zone');
  expect(() => chargerGuide({ version: 2, titre: 'x', sections: [] })).toThrow('Guide invalide');
  expect(() => chargerGuide({ version: 1, titre: 'x', sections: [{ id: 'a', titre: 'A', paragraphes: [] }] }))
    .toThrow('paragraphes absents');
});
