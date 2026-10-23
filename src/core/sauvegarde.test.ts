import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { creerHorlogeSimulee } from './clock';
import { reglages } from './reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, etatMondeDe, partieInitiale,
  regionInitiale, versMembreEquipe } from './sauvegarde';
import type { DonneesRegion, PokemonPossede } from './sauvegarde';
import { migrationsParDefaut } from './migrations';
import v0 from './migrations/__fixtures__/partie-v0.json';
import v1 from './migrations/__fixtures__/partie-v1.json';

const pokemon: PokemonPossede = { uid: 'bulbizarre', numero: 1, niveau: 5, xp: 12, shiny: true,
  bonheur: 20, pierreEternelle: true, calcium: 2, surnom: 'Forêt' };
function contexte() {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee(Date.UTC(2026, 9, 23));
  let sequence = 0;
  return { stockage, horloge, jeu: creerGestionnaire({ stockage, horloge, genererId: () => `partie-${++sequence}` }) };
}
function instantane(stockage: ReturnType<typeof creerStockageMemoire>) {
  return stockage.cles().map(cle => [cle, stockage.lire(cle)]);
}
const cle = 'pokiclicker:partie:partie-1';
afterEach(() => { delete migrationsParDefaut[0]; });

describe('sauvegarde à trois niveaux', () => {
  it('initialise des données indépendantes avec les réglages de départ', () => {
    expect(regionInitiale('johto', 'johto.depart')).toMatchObject({ argent: reglages.depart.argent, etape: reglages.depart.etape });
    expect(partieInitiale('Essai')).toMatchObject({ regionCourante: 'kanto', regionsDebloquees: ['kanto'] });
    const premiere = compteInitial();
    premiere.succes.push('test');
    expect(compteInitial().succes).toEqual([]);
  });
  it('retrouve strictement compte, partie et région, avec révisions 1 puis 2 et dates injectées', () => {
    const { jeu, horloge } = contexte();
    const compte = { ...compteInitial(), diamants: 18, succes: ['premier'], skins: ['rouge'], preferences: { sombre: true, sonActive: false } };
    const partie = jeu.creerPartie('Épopée', 'kanto.bourg-palette');
    const donnees = { ...partie.donnees, pcGlobal: [pokemon], pokedexNational: [1], statistiques: { victoires: 10, argentTotalGagne: 500 } };
    const region: DonneesRegion = { ...regionInitiale('kanto', 'kanto.route-1'), equipe: [pokemon], argent: 70,
      inventaire: { pokeball: 3 }, badges: ['roche'], bossVaincus: ['pierre'], objetsCles: ['carte'],
      quetes: ['chen'], drapeaux: ['intro'], evenementsJoues: ['depart'], ligueGagnee: 1 };
    expect(jeu.ecrireCompte(compte).revision).toBe(1);
    expect(partie.revision).toBe(1);
    expect(jeu.chargerRegion(partie.id, 'kanto')?.revision).toBe(1);
    horloge.avancer(1000);
    const ecrits = [jeu.ecrireCompte(compte), jeu.ecrirePartie(partie.id, donnees), jeu.ecrireRegion(partie.id, 'kanto', region)];
    expect(ecrits.map(e => e.revision)).toEqual([2, 2, 2]);
    expect(ecrits.map(e => e.ecritLe)).toEqual(Array(3).fill('2026-10-23T00:00:01.000Z'));
    expect(jeu.chargerCompte()).toEqual(ecrits[0]);
    expect(jeu.chargerPartie(partie.id)).toEqual(ecrits[1]);
    expect(jeu.chargerRegion(partie.id, 'kanto')).toEqual(ecrits[2]);
    expect(jeu.chargerCompte()?.donnees).toEqual(compte);
    expect(jeu.chargerPartie(partie.id)?.donnees).toEqual(donnees);
    expect(jeu.chargerRegion(partie.id, 'kanto')?.donnees).toEqual(region);
    expect(etatMondeDe(region)).toEqual({ badges: ['roche'], bossVaincus: ['pierre'], objets: ['carte'], quetes: ['chen'], drapeaux: ['intro'] });
    expect(versMembreEquipe(pokemon)).toEqual({ numero: 1, niveau: 5, shiny: true, bonheur: 20, pierreEternelle: true, calcium: 2 });
  });
  it('renvoie null pour un niveau absent et liste les parties par date décroissante', () => {
    const { jeu, horloge, stockage } = contexte();
    expect(jeu.chargerCompte()).toBeNull();
    expect(jeu.chargerPartie('absente')).toBeNull();
    expect(jeu.chargerRegion('absente', 'kanto')).toBeNull();
    const premiere = jeu.creerPartie('Première');
    horloge.avancer(1000);
    const seconde = jeu.creerPartie('Seconde');
    const avant = instantane(stockage);
    expect(jeu.listerParties()).toEqual([seconde, premiere].map(p => ({ id: p.id, nom: p.donnees.nom, regionCourante: 'kanto', ecritLe: p.ecritLe })));
    jeu.chargerPartie(premiere.id);
    jeu.chargerRegion(premiere.id, 'kanto');
    jeu.exporterPartie(premiere.id);
    expect(instantane(stockage)).toEqual(avant);
  });
  it.each(['partie', 'region'] as const)('refuse exactement un conflit de révision (%s), sans écrire', niveau => {
    const { jeu, stockage } = contexte();
    const p = jeu.creerPartie('Test');
    const avant = instantane(stockage);
    const ecrire = (revisionAttendue: number) => niveau === 'partie'
      ? jeu.ecrirePartie(p.id, p.donnees, { revisionAttendue })
      : jeu.ecrireRegion(p.id, 'kanto', regionInitiale('kanto', 'kanto.route-1'), { revisionAttendue });
    expect(() => ecrire(0)).toThrowError(new Error('Conflit : cette sauvegarde a changé depuis ta dernière lecture.'));
    expect(instantane(stockage)).toEqual(avant);
    expect(ecrire(1).revision).toBe(2);
  });
  it('isole les régions et supprime uniquement les clés de la partie choisie', () => {
    const { jeu, stockage } = contexte();
    const p = jeu.creerPartie('Première');
    const autre = jeu.creerPartie('Seconde');
    jeu.ecrireCompte(compteInitial());
    jeu.ecrireRegion(p.id, 'johto', regionInitiale('johto', 'johto.depart'));
    const cleJohto = `pokiclicker:region:${p.id}:johto`;
    const johto = stockage.lire(cleJohto);
    jeu.ecrireRegion(p.id, 'kanto', { ...regionInitiale('kanto', 'kanto.route-1'), argent: 35 });
    expect(stockage.lire(cleJohto)).toBe(johto);
    const autres = instantane(stockage).filter(([cle]) => !cle?.includes(`:${p.id}`));
    jeu.supprimerPartie(p.id);
    expect(instantane(stockage)).toEqual(autres);
    expect(jeu.chargerPartie(autre.id)).toEqual(autre);
  });
  it('refuse un identifiant généré déjà utilisé, sans remplacer de données', () => {
    const { stockage, horloge } = contexte();
    const jeu = creerGestionnaire({ stockage, horloge, genererId: () => 'fixe' });
    const p = jeu.creerPartie('Première');
    const avant = instantane(stockage);
    expect(() => jeu.creerPartie('Deuxième')).toThrow('Identifiant de partie déjà utilisé');
    expect(() => jeu.importerPartie(jeu.exporterPartie(p.id))).toThrow('Identifiant de partie déjà utilisé');
    expect(instantane(stockage)).toEqual(avant);
  });
});

describe('chargement sûr et import', () => {
  it('refuse une version future avec le message exact et préserve chaque octet', () => {
    const { jeu, stockage } = contexte();
    const p = jeu.creerPartie('Test');
    const texte = `  ${JSON.stringify({ ...p, version: 99 })}\n`;
    stockage.ecrire(cle, texte);
    expect(() => jeu.chargerPartie(p.id)).toThrowError(new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
    expect(() => jeu.ecrirePartie(p.id, p.donnees)).toThrowError(new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
    expect(stockage.lire(cle)).toBe(texte);
  });
  it.each(['tronque', 'sans-donnees', 'niveau', 'version', 'date', 'identifiant', 'donnees'])('refuse une sauvegarde corrompue (%s) sans la modifier', cas => {
    const { jeu, stockage } = contexte();
    const p = jeu.creerPartie('Test');
    const sansDonnees: Partial<typeof p> = { ...p };
    delete sansDonnees.donnees;
    const valeurs = { tronque: '{"version":', 'sans-donnees': JSON.stringify(sansDonnees),
      niveau: JSON.stringify({ ...p, niveau: 'region' }), version: JSON.stringify({ ...p, version: 1.5 }),
      date: JSON.stringify({ ...p, ecritLe: 'hier' }), identifiant: JSON.stringify({ ...p, id: 'autre' }),
      donnees: JSON.stringify({ ...p, donnees: { ...p.donnees, argent: 4 } }) };
    stockage.ecrire(cle, valeurs[cas as keyof typeof valeurs]);
    const avant = instantane(stockage);
    expect(() => jeu.chargerPartie(p.id)).toThrow(/^Cette sauvegarde est illisible : .+\.$/);
    expect(instantane(stockage)).toEqual(avant);
  });
  it('migre au chargement sans écrire, puis écrit la version courante explicitement', () => {
    const { jeu, stockage } = contexte();
    migrationsParDefaut[0] = donnees => {
      const { nomPartie, ...reste } = donnees as Record<string, unknown>;
      return { ...reste, nom: nomPartie };
    };
    const texte = JSON.stringify(v0);
    const ancienneCle = `pokiclicker:partie:${v0.id}`;
    stockage.ecrire(ancienneCle, texte);
    const lue = jeu.chargerPartie(v0.id);
    expect(lue).toEqual(v1);
    expect(stockage.lire(ancienneCle)).toBe(texte);
    expect(jeu.ecrirePartie(v0.id, lue!.donnees)).toMatchObject({ version: 1, revision: 8 });
  });
  it('exporte et importe toutes les régions sous un nouvel identifiant sans information de compte', () => {
    const { jeu, stockage } = contexte();
    jeu.ecrireCompte({ ...compteInitial(), diamants: 42 });
    const p = jeu.creerPartie('Aventure');
    jeu.ecrirePartie(p.id, { ...p.donnees, pcGlobal: [pokemon], regionsDebloquees: ['kanto', 'johto'] });
    jeu.ecrireRegion(p.id, 'kanto', { ...regionInitiale('kanto', 'kanto.route-1'), equipe: [pokemon], argent: 99 });
    jeu.ecrireRegion(p.id, 'johto', regionInitiale('johto', 'johto.depart'));
    const texte = jeu.exporterPartie(p.id);
    const fichier = JSON.parse(texte);
    function verifier(v: unknown) {
      if (typeof v === 'string') {
        expect(v).not.toMatch(/mail|compte|local/i);
      } else if (v && typeof v === 'object') {
        for (const [cle, valeur] of Object.entries(v)) { verifier(cle); verifier(valeur); }
      }
    }
    verifier(fichier);
    expect(texte).not.toMatch(/mail|compte|local/i);
    const avant = instantane(stockage);
    const importe = jeu.importerPartie(texte);
    expect(importe.id).not.toBe(p.id);
    expect(jeu.chargerPartie(importe.id)?.donnees).toEqual(jeu.chargerPartie(p.id)?.donnees);
    expect(jeu.chargerPartie(importe.id)?.revision).toBe(1);
    for (const region of ['kanto', 'johto']) {
      expect(jeu.chargerRegion(importe.id, region)?.donnees).toEqual(jeu.chargerRegion(p.id, region)?.donnees);
      expect(jeu.chargerRegion(importe.id, region)?.revision).toBe(1);
    }
    for (const [cle, valeur] of avant) expect(stockage.lire(cle!)).toBe(valeur);
  });
  it.each(['tronque', 'partie', 'region', 'doublon', 'absente', 'format', 'version'])('valide tout un import corrompu (%s) avant toute écriture', cas => {
    const { jeu, stockage } = contexte();
    const p = jeu.creerPartie('Partie en cours');
    const fichier = JSON.parse(jeu.exporterPartie(p.id));
    if (cas === 'partie') delete fichier.partie.donnees;
    if (cas === 'region') fichier.regions.push({ ...fichier.regions[0], donnees: { argent: -1 } });
    if (cas === 'doublon') fichier.regions.push(fichier.regions[0]);
    if (cas === 'absente') fichier.regions = [];
    if (cas === 'format') fichier.format = 'ancien-jeu';
    if (cas === 'version') fichier.version = 0.5;
    const avant = instantane(stockage);
    expect(() => jeu.importerPartie(cas === 'tronque' ? '{' : JSON.stringify(fichier)))
      .toThrow(/^Ce fichier n'est pas une sauvegarde de partie valide : .+\.$/);
    expect(instantane(stockage)).toEqual(avant);
  });
  it('refuse exactement un fichier futur et ne change rien', () => {
    const { jeu, stockage } = contexte();
    const p = jeu.creerPartie('Test');
    const fichier = JSON.parse(jeu.exporterPartie(p.id));
    const avant = instantane(stockage);
    for (const cible of [fichier, fichier.partie, fichier.regions[0]]) {
      cible.version = 99;
      expect(() => jeu.importerPartie(JSON.stringify(fichier))).toThrowError(
        new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
      cible.version = 1;
    }
    expect(instantane(stockage)).toEqual(avant);
  });
  it('importe une version fictive ancienne quand une migration est disponible', () => {
    const { jeu } = contexte();
    const p = jeu.creerPartie('Test');
    const fichier = JSON.parse(jeu.exporterPartie(p.id));
    fichier.version = 0;
    fichier.partie = v0;
    migrationsParDefaut[0] = donnees => {
      const { nomPartie, ...reste } = donnees as Record<string, unknown>;
      return { ...reste, nom: nomPartie };
    };
    const { id } = jeu.importerPartie(JSON.stringify(fichier));
    expect(jeu.chargerPartie(id)?.donnees).toEqual(v1.donnees);
  });
  it('garde le module et ses voisins de production indépendants du navigateur', () => {
    const dossier = new URL('.', import.meta.url);
    const fichiers = readdirSync(dossier).filter(nom => nom.startsWith('sauvegarde') && !nom.endsWith('.test.ts'));
    for (const nom of fichiers) expect(readFileSync(new URL(nom, dossier), 'utf8')).not.toMatch(/localStorage|window/);
    expect(readFileSync(new URL('migrations/index.ts', dossier), 'utf8')).not.toMatch(/localStorage|window/);
  });
});
