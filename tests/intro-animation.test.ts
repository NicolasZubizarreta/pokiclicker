import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { reglages } from '../src/core/reglages';

const lignes = (fichier: string, debut: number, fin: number, encodage: BufferEncoding = 'utf8') =>
  readFileSync(`legacy/${fichier}`, encodage).split(/\r?\n/).slice(debut - 1, fin).join('\n');
const css = readFileSync('src/styles/index.css', 'utf8');
const v1 = lignes('css/styles.css', 200, 212);
const entree = lignes('js/app/main.js', 184, 206);
const pose = lignes('js/app/main.js', 104, 106);
const choix = lignes('js/app/main.js', 263, 268);
const poses = lignes('js/app/main.js', 309, 313);
const texte = lignes('js/app/main.js', 351, 351);
const selection = lignes('js/app/main.js', 380, 382);
const transition = lignes('js/ui/controls.js', 202, 220, 'latin1');
const labo = lignes('js/game/save.js', 557, 557);
const interfaceV1 = lignes('index.html', 229, 229);
const balles = lignes('index.html', 568, 571);
const nombre = (source: string, motif: RegExp) => {
  const resultat = source.match(motif);
  expect(resultat, motif.source).not.toBeNull();
  return Number(resultat![1]);
};
const jeton = (nom: string) => css.match(new RegExp(`--${nom}:\\s*([^;]+);`))?.[1]?.trim();
const bloc = (source: string, nom: string) => source.match(new RegExp(`@keyframes ${nom}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`))?.[1] ?? '';
const etapes = (source: string) => Array.from(source.matchAll(/([\d%, ]+)%\s*\{([^}]+)\}/g), ([, pourcentage, declarations = '']) => ({
  pourcentage: pourcentage?.trim(),
  transform: declarations.match(/transform:\s*([^;]+)/)?.[1]?.trim(),
  opacity: declarations.match(/opacity:\s*([^;]+)/)?.[1]?.trim(),
}));
const resoudre = (source: string) => source.replace(/var\(--([\w-]+)\)/g, (_, nom: string) => jeton(nom) ?? 'absent');

it('centralise chaque durée et échelle de l’intro V1 dans les réglages et les jetons', () => {
  const valeurs = {
    flashMs: [nombre(v1, /flash-green-strong ([\d.]+)s/) * 1000, 'duree-intro-flash'],
    cadenasMs: [nombre(v1, /break-lock ([\d.]+)s/) * 1000, 'duree-intro-cadenas'],
    chenEntreeMs: [nombre(entree, /transform ([\d.]+)s/) * 1000, 'duree-intro-chen'],
    dialogueDelaiMs: [nombre(entree, /}, (\d+)\)/), 'delai-intro-dialogue'],
    caractereMs: [nombre(texte, /speed = (\d+)/), 'duree-intro-caractere'],
    poseDelaiMs: [nombre(poses, /Chen2\.png", (\d+)/), 'delai-intro-pose'],
    poseFonduMs: [nombre(pose, /fadeMs = (\d+)/), 'duree-intro-pose'],
    choixDelaiMs: [nombre(choix, /}, (\d+)\)/), 'delai-intro-choix'],
    voileMs: [nombre(transition, /}, (\d+)\);\s*$/), 'duree-intro-voile'],
    sceneDelaiMs: [nombre(transition, /}, (\d+)\);\s*$/), 'delai-intro-scene'],
    voileRetraitDelaiMs: [nombre(transition, /}, (\d+)\);/), 'delai-intro-voile-retrait'],
    laboDelaiMs: [nombre(labo, /startIntro, (\d+)/), 'delai-intro-labo'],
    interfaceFonduMs: [nombre(interfaceV1, /duration-(\d+)/), 'duree-intro-interface'],
    starterFonduMs: [nombre(balles, /duration-(\d+)/), 'duree-intro-starter'],
    starterSurvol: [nombre(balles, /hover:scale-(\d+)/) / 100, 'echelle-intro-starter-survol'],
    starterChoisi: [nombre(selection, /scale\(([\d.]+)\)/), 'echelle-intro-starter-choisi'],
  } as const;
  expect(reglages.intro).toEqual(Object.fromEntries(Object.entries(valeurs).map(([cle, [valeur]]) => [cle, valeur])));
  for (const [cle, [valeur, nom]] of Object.entries(valeurs)) {
    expect(jeton(nom), nom).toBe(`${valeur}${cle.endsWith('Ms') ? 'ms' : ''}`);
    expect(css).toMatch(new RegExp(`:root\\s*\\{[^}]*--${nom}:`));
  }
  expect(nombre(poses, /Chen3\.png", (\d+)/)).toBe(valeurs.poseDelaiMs[0]);
  expect(nombre(entree, /opacity (\d+)ms/)).toBe(valeurs.poseFonduMs[0]);
});

it('reprend les étapes du cadenas et du flash avec les couleurs de succès du thème', () => {
  expect(etapes(resoudre(bloc(css, 'cadenas-brise')))).toEqual(etapes(bloc(v1, 'break-lock')));
  expect(etapes(bloc(v1, 'break-lock'))).toHaveLength(3);
  expect(etapes(bloc(css, 'flash-vert')).map(({ pourcentage }) => pourcentage))
    .toEqual(etapes(bloc(v1, 'flash-green-strong')).map(({ pourcentage }) => pourcentage));
  expect(bloc(css, 'flash-vert')).toContain('fill: var(--succes-fond)');
  expect(bloc(css, 'flash-vert')).toContain('fill: var(--succes-base)');
  expect(bloc(css, 'flash-vert')).toContain('stroke: var(--succes-texte)');
  expect(css).toContain('animation: flash-vert var(--duree-intro-flash) infinite;');
  expect(css).toContain('animation: cadenas-brise var(--duree-intro-cadenas) forwards;');
});

it('reprend l’entrée de Chen, les fondus et les échelles avec des utilitaires motion-safe', () => {
  expect(jeton('ease-intro-chen')).toBe(entree.match(/cubic-bezier\([^)]+\)/)?.[0]);
  const translations = Array.from(entree.matchAll(/translateX\([^)]+\)/g), ([valeur]) => valeur);
  expect(resoudre(bloc(css, 'chen-entree')).match(/translateX\([^)]+\)/g)).toEqual(translations);
  for (const nom of ['flash-vert', 'cadenas-brise', 'chen-entree', 'intro-pose-fondu', 'intro-voile', 'intro-interface-fondu', 'intro-starter-fondu', 'intro-starter-survol', 'intro-starter-choisi']) {
    expect(css).toContain(`@utility ${nom} {`);
  }
  expect(css).toContain('animation: chen-entree var(--duree-intro-chen) var(--ease-intro-chen) both;');
  for (const [duree, courbe] of [['pose', 'ease-in-out'], ['voile', 'ease-in-out'], ['interface', 'ease'], ['starter', 'ease']]) {
    expect(css).toContain(`transition: opacity var(--duree-intro-${duree}) ${courbe};`);
  }
  expect(css).toContain('scale: var(--echelle-intro-starter-survol);');
  expect(css).toContain('scale: var(--echelle-intro-starter-choisi);');
  expect(selection).toMatch(/ball-\$\{i\}.*i===id \? '0' : '1'/);
});

it('conserve le rebond V1 du titre, de la flèche et du signal Carte à une seconde', () => {
  expect(lignes('index.html', 20, 20)).toContain('animate-bounce');
  expect(lignes('index.html', 561, 561)).toContain('animate-bounce');
  expect(readFileSync('design/tokens.css', 'utf8').split(/\r?\n/).slice(99, 115).join('\n')).toContain('--duree-signal: 1s;');
  expect(css).toContain('animation: rebond-signal var(--duree-signal) var(--ease-standard) infinite;');
});
