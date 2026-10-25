import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { creerHorlogeSimulee } from './clock';
import { reglages } from './reglages';
import { compteInitial, creerGestionnaire, creerStockageMemoire, etatMondeDe, partieInitiale,
  regionInitiale, versMembreEquipe, validerDonneesRegion, validerPokemonPossede } from './sauvegarde';
import type { DonneesRegion, PokemonPossede } from './sauvegarde';
import { migrationsParDefaut } from './migrations';
import v0 from './migrations/__fixtures__/partie-v0.json';
import v1 from './migrations/__fixtures__/partie-v1.json';
import v2 from './migrations/__fixtures__/partie-v2.json';
import regionV1 from './migrations/__fixtures__/region-v1.json';
import regionV2 from './migrations/__fixtures__/region-v2.json';
import compteV1 from './migrations/__fixtures__/compte-v1.json';
import compteV2 from './migrations/__fixtures__/compte-v2.json';
import exportV1 from './migrations/__fixtures__/export-v1.json';
import { validerDonneesCompte } from './sauvegarde-validation';
import { ouvrirPartie } from '../ui/persistance';

// Les espèces des fixtures v2 (1 et 25) ne figurent dans aucune liste à sexe fixe.
const v3 = { ...v2, version: 3 };
const regionV3 = { ...regionV2, version: 3 };
const compteV3 = { ...compteV2, version: 3 };

const pokemon: PokemonPossede = { uid: 'bulbizarre', numero: 1, niveau: 5, xp: 12, shiny: true,
  bonheur: 20, pierreEternelle: true, calcium: 2, surnom: 'Forêt', sexe: 'femelle', favori: false };
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

describe('préférences de combat du compte', () => {
  it('lit un compte v3 sans les nouveaux champs sans écrire et résout les valeurs par défaut', () => {
    const { stockage, horloge, jeu } = contexte();
    jeu.creerPartie('Test');
    const compte = jeu.ecrireCompte({ ...compteInitial(), preferences: { sombre: true } });
    const avant = instantane(stockage);
    const session = ouvrirPartie({ stockage, horloge, genererId: () => 'nouvelle' });
    expect(jeu.chargerCompte()).toEqual(compte);
    expect(session.preferences).toMatchObject(reglages.depart.preferences);
    expect(instantane(stockage)).toEqual(avant);
    session.enregistrerPreferences(structuredClone(session.preferences));
    expect(instantane(stockage)).toEqual(avant);
  });
  it('exige chaque booléen du bloc arrêt et refuse les champs inconnus', () => {
    const arretAuto = reglages.depart.preferences.arretAuto;
    for (const cle of Object.keys(arretAuto)) {
      const incomplet = { ...arretAuto };
      Reflect.deleteProperty(incomplet, cle);
      expect(() => validerDonneesCompte({ ...compteInitial(), preferences: { arretAuto: incomplet } }))
        .toThrow(`Champ manquant : ${cle}`);
      expect(() => validerDonneesCompte({ ...compteInitial(), preferences: { arretAuto: { ...arretAuto, [cle]: 1 } } }))
        .toThrow('Booléen attendu');
    }
    expect(() => validerDonneesCompte({ ...compteInitial(), preferences: { autoAttaque: 1 } }))
      .toThrow('Booléen attendu');
    expect(() => validerDonneesCompte({ ...compteInitial(), preferences: { arretAuto: { ...arretAuto, inconnu: true } } }))
      .toThrow('Champ inconnu');
  });
  it.each(['autoAttaque', 'arretAuto'] as const)('résout séparément le champ facultatif %s', cle => {
    const { stockage, horloge, jeu } = contexte();
    const preferences = { autoAttaque: false, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } };
    jeu.ecrireCompte({ ...compteInitial(), preferences: { [cle]: preferences[cle] } });
    const session = ouvrirPartie({ stockage, horloge, genererId: () => 'nouvelle' });
    expect(session.preferences).toMatchObject({ ...reglages.depart.preferences, [cle]: preferences[cle] });
  });
  it.each([false, true])('enregistre puis relit les préférences sans doublon (compte présent : %s)', present => {
    const { stockage, horloge, jeu } = contexte();
    if (present) jeu.ecrireCompte({ ...compteInitial(), diamants: 18, succes: ['premier'],
      skins: ['rouge'], preferences: { sombre: true, sonActive: false } });
    const options = { stockage, horloge, genererId: () => 'nouvelle' };
    const session = ouvrirPartie(options);
    const preferences = { autoAttaque: false, arretAuto: { ...reglages.depart.preferences.arretAuto, rare: false } };
    const avant = structuredClone(preferences);
    const ecrire = vi.spyOn(stockage, 'ecrire');
    session.enregistrerPreferences(preferences);
    expect(preferences).toEqual(avant);
    expect(ecrire).toHaveBeenCalledTimes(1);
    expect(ecrire.mock.calls[0]![0]).toBe('pokiclicker:compte:local');
    const compte = jeu.chargerCompte()!;
    expect(compte.donnees).toEqual(present
      ? { ...compteInitial(), diamants: 18, succes: ['premier'], skins: ['rouge'],
        preferences: { sombre: true, sonActive: false, ...avant } }
      : { ...compteInitial(), preferences: avant });
    expect(ouvrirPartie(options).preferences).toMatchObject(avant);
    session.enregistrerPreferences(structuredClone(preferences));
    expect(ecrire).toHaveBeenCalledTimes(1);
    expect(jeu.chargerCompte()).toEqual(compte);
    preferences.arretAuto.rare = true;
    expect(ouvrirPartie(options).preferences.arretAuto.rare).toBe(false);
    expect(reglages.depart.preferences.arretAuto.rare).toBe(true);
  });
});

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
  it.each(['compte', 'partie', 'region'] as const)('lit la version 1 du niveau %s sans aucune écriture', niveau => {
    const { stockage, horloge } = contexte();
    // La fixture de migration contient volontairement un champ inconnu, interdit au chargement.
    const region = structuredClone(regionV1);
    Reflect.deleteProperty(region.donnees, 'futur');
    const attendue = structuredClone(regionV3);
    Reflect.deleteProperty(attendue.donnees, 'futur');
    const sources = { compte: compteV1, partie: v1, region };
    const attendus = { compte: compteV3, partie: v3, region: attendue };
    const cles = { compte: 'pokiclicker:compte:local', partie: `pokiclicker:partie:${v1.id}`,
      region: `pokiclicker:region:${v1.id}:kanto` };
    const texte = `  ${JSON.stringify(sources[niveau])}\n`;
    stockage.ecrire(cles[niveau], texte);
    const ecrire = vi.spyOn(stockage, 'ecrire');
    const supprimer = vi.spyOn(stockage, 'supprimer');
    const jeu = creerGestionnaire({ stockage, horloge, genererId: () => 'nouvelle' });
    const lire = () => niveau === 'compte' ? jeu.chargerCompte()
      : niveau === 'partie' ? jeu.chargerPartie(v1.id) : jeu.chargerRegion(v1.id, 'kanto');
    expect(lire()).toEqual(attendus[niveau]);
    expect(lire()).toEqual(attendus[niveau]);
    expect(stockage.lire(cles[niveau])).toBe(texte);
    expect(ecrire).not.toHaveBeenCalled();
    expect(supprimer).not.toHaveBeenCalled();
  });
  it.each(['compte', 'partie', 'region'] as const)('refuse la version 4 du niveau %s sans écriture', niveau => {
    const { stockage, horloge } = contexte();
    const source = { compte: compteV1, partie: v1, region: regionV1 }[niveau];
    const cle = niveau === 'compte' ? 'pokiclicker:compte:local'
      : niveau === 'partie' ? `pokiclicker:partie:${v1.id}` : `pokiclicker:region:${v1.id}:kanto`;
    const texte = JSON.stringify({ ...source, version: 4 });
    stockage.ecrire(cle, texte);
    const ecrire = vi.spyOn(stockage, 'ecrire');
    const supprimer = vi.spyOn(stockage, 'supprimer');
    const jeu = creerGestionnaire({ stockage, horloge, genererId: () => 'nouvelle' });
    const lire = () => niveau === 'compte' ? jeu.chargerCompte()
      : niveau === 'partie' ? jeu.chargerPartie(v1.id) : jeu.chargerRegion(v1.id, 'kanto');
    expect(lire).toThrowError(new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
    expect(stockage.lire(cle)).toBe(texte);
    expect(ecrire).not.toHaveBeenCalled();
    expect(supprimer).not.toHaveBeenCalled();
  });
  it('importe la fixture d’export en version 1 vers les données figées de version 3', () => {
    const { jeu } = contexte();
    const attendue = structuredClone(regionV3.donnees);
    Reflect.deleteProperty(attendue, 'futur');
    const { id } = jeu.importerPartie(JSON.stringify(exportV1));
    expect(jeu.chargerPartie(id)).toMatchObject({ version: 3, donnees: v3.donnees });
    expect(jeu.chargerPartie(id)?.donnees).toEqual(v3.donnees);
    expect(jeu.chargerRegion(id, 'kanto')).toMatchObject({ version: 3, donnees: attendue });
    expect(jeu.chargerRegion(id, 'kanto')?.donnees).toEqual(attendue);
  });
  it.each(['fichier', 'partie', 'region'] as const)('refuse un export v1 contenant une version 4 (%s) sans appeler le stockage en écriture', cible => {
    const { stockage, horloge } = contexte();
    const ecrire = vi.spyOn(stockage, 'ecrire');
    const supprimer = vi.spyOn(stockage, 'supprimer');
    const genererId = vi.fn(() => 'nouvelle');
    const jeu = creerGestionnaire({ stockage, horloge, genererId });
    const fichier = structuredClone(exportV1);
    if (cible === 'fichier') fichier.version = 4;
    if (cible === 'partie') fichier.partie.version = 4;
    if (cible === 'region') fichier.regions[0]!.version = 4;
    expect(() => jeu.importerPartie(JSON.stringify(fichier))).toThrowError(
      new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
    expect(ecrire).not.toHaveBeenCalled();
    expect(supprimer).not.toHaveBeenCalled();
    expect(genererId).not.toHaveBeenCalled();
  });
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
    expect(lue).toEqual(v3);
    expect(stockage.lire(ancienneCle)).toBe(texte);
    expect(jeu.ecrirePartie(v0.id, lue!.donnees)).toMatchObject({ version: 3, revision: 8 });
  });
  it('exporte et importe toutes les régions sous un nouvel identifiant sans information de compte', () => {
    const { jeu, stockage } = contexte();
    jeu.ecrireCompte({ ...compteInitial(), diamants: 42 });
    const p = jeu.creerPartie('Aventure');
    jeu.ecrirePartie(p.id, { ...p.donnees, pcGlobal: [pokemon], regionsDebloquees: ['kanto', 'johto'] });
    jeu.ecrireRegion(p.id, 'kanto', { ...regionInitiale('kanto', 'kanto.route-1'), equipe: [pokemon], argent: 99,
      pc: [{ ...pokemon, uid: 'pc', numero: 100, sexe: 'sansSexe', favori: true }], ameliorations: ['chaussures'],
      jalonsRecus: [10, 20], starterId: 1, statistiques: { eliminations: 45, argentTotalGagne: 987 },
      chronos: { finRepousse: 1000, finSuperRepousse: 2000, finBoostAttaque: 3000,
        finBoostAttaqueSpeciale: 4000, rechargeFauchage: 5000 },
      pension: { parents: [pokemon, { ...pokemon, uid: 'parent-2', sexe: 'male' }],
        oeufs: [{ ...pokemon, uid: 'oeuf', oeuf: { pasRestants: 6, pasMax: 10 } }], emplacementsOeuf: 3 },
      jetons: 53, arretAuto: { commun: true, peuCommun: true, rare: false, tresRare: false,
        legendaire: false, shiny: false, nouveau: false } });
    jeu.ecrireRegion(p.id, 'johto', regionInitiale('johto', 'johto.depart'));
    const texte = jeu.exporterPartie(p.id);
    const fichier = JSON.parse(texte);
    expect(fichier.version).toBe(3);
    expect(fichier.partie.version).toBe(3);
    expect(fichier.regions.every((r: { version: number }) => r.version === 3)).toBe(true);
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
      cible.version = 4;
      expect(() => jeu.importerPartie(JSON.stringify(fichier))).toThrowError(
        new Error("Cette sauvegarde vient d'une version plus récente du jeu."));
      cible.version = 3;
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
    expect(jeu.chargerPartie(id)?.donnees).toEqual(v3.donnees);
  });
  it('garde le module et ses voisins de production indépendants du navigateur', () => {
    const dossier = new URL('.', import.meta.url);
    const fichiers = readdirSync(dossier).filter(nom => nom.startsWith('sauvegarde') && !nom.endsWith('.test.ts'));
    for (const nom of fichiers) expect(readFileSync(new URL(nom, dossier), 'utf8')).not.toMatch(/localStorage|window/);
    expect(readFileSync(new URL('migrations/index.ts', dossier), 'utf8')).not.toMatch(/localStorage|window/);
  });
});

describe('validation du schéma de version 3', () => {
  it.each([
    [{ sexe: 'inconnu' }, 'Sexe invalide : inconnu'],
    [{ oeuf: { pasRestants: 11, pasMax: 10 } }, 'Œuf invalide : les pas restants dépassent le maximum'],
    [{ oeuf: { pasRestants: 0, pasMax: 0 } }, 'Œuf invalide : Entier strictement positif attendu'],
    [{ oeuf: { pasRestants: -1, pasMax: 10 } }, 'Œuf invalide : Nombre positif ou nul attendu'],
    [{ oeuf: { pasRestants: 0.5, pasMax: 10 } }, 'Œuf invalide : Entier attendu'],
    [{ oeuf: { pasRestants: 0, pasMax: 1.5 } }, 'Œuf invalide : Entier attendu'],
    [{ oeuf: { pasRestants: 0, pasMax: 1, inconnu: true } }, 'Œuf invalide : Champ inconnu'],
    [{ oeuf: { pasRestants: 0 } }, 'Œuf invalide : Champ manquant : pasMax'],
    [{ favori: 'oui' }, 'Booléen attendu'],
    [{ inconnu: true }, 'Champ inconnu'],
  ])('refuse un Pokémon invalide (%j)', (modification, message) => {
    expect(() => validerPokemonPossede({ ...pokemon, ...modification })).toThrowError(new Error(message));
  });
  it.each(['male', 'femelle', 'sansSexe'])('accepte le sexe %s et les bornes des pas d’œuf', sexe => {
    for (const pasRestants of [0, 10]) {
      expect(() => validerPokemonPossede({ ...pokemon, numero: sexe === 'sansSexe' ? 100 : pokemon.numero,
        sexe, oeuf: { pasRestants, pasMax: 10 } })).not.toThrow();
    }
  });
  it.each([
    [{ jetons: -1 }, 'Nombre positif ou nul attendu'],
    [{ jetons: 0.5 }, 'Entier attendu'],
    [{ starterId: '1' }, 'Nombre positif ou nul attendu'],
    [{ starterId: 0 }, 'Entier strictement positif attendu'],
    [{ starterId: 1.5 }, 'Entier attendu'],
    [{ pc: [null] }, 'Objet attendu'],
    [{ ameliorations: [1] }, 'Texte attendu'],
    [{ jalonsRecus: [0] }, 'Entier strictement positif attendu'],
    [{ statistiques: { eliminations: -1, argentTotalGagne: 0 } }, 'Nombre positif ou nul attendu'],
    [{ statistiques: { eliminations: 0, argentTotalGagne: Infinity } }, 'Nombre positif ou nul attendu'],
    [{ pension: { parents: [pokemon, pokemon, pokemon], oeufs: [], emplacementsOeuf: 1 } }, 'Pension invalide : au plus deux parents'],
    [{ pension: { parents: [], oeufs: [pokemon], emplacementsOeuf: 1 } }, 'Œuf invalide : état d’œuf manquant dans la pension'],
    [{ pension: { parents: [], oeufs: [], emplacementsOeuf: 0 } }, 'Entier strictement positif attendu'],
    [{ pension: { parents: [], oeufs: [], emplacementsOeuf: 1.5 } }, 'Entier attendu'],
    [{ inconnu: true }, 'Champ inconnu'],
    [{ arretAuto: {} }, 'Champ manquant : commun'],
    [{ chronos: {} }, 'Champ manquant : finRepousse'],
  ])('refuse une région invalide (%j)', (modification, message) => {
    expect(() => validerDonneesRegion({ ...regionInitiale('kanto', 'kanto.route-1'), ...modification }))
      .toThrowError(new Error(message));
  });
  it('exige tous les champs du schéma et isole profondément les valeurs de départ', () => {
    const region = regionInitiale('kanto', 'kanto.route-1');
    for (const cle of Object.keys(region)) {
      const incomplet = { ...region };
      Reflect.deleteProperty(incomplet, cle);
      expect(() => validerDonneesRegion(incomplet)).toThrow(`Champ manquant : ${cle}`);
    }
    for (const cle of ['sexe', 'favori']) {
      const incomplet = { ...pokemon };
      Reflect.deleteProperty(incomplet, cle);
      expect(() => validerPokemonPossede(incomplet)).toThrow(`Champ manquant : ${cle}`);
    }
    region.pc.push(pokemon);
    region.pension.parents.push(pokemon);
    region.chronos.finRepousse = 123;
    region.arretAuto.rare = false;
    const autre = regionInitiale('kanto', 'kanto.route-1');
    expect(autre).toMatchObject(reglages.depart.region);
    expect(autre.pension.emplacementsOeuf).toBe(1);
  });
  it('valide chaque chrono et chaque critère d’arrêt, sans accepter de champ supplémentaire', () => {
    const region = regionInitiale('kanto', 'kanto.route-1');
    for (const cle of Object.keys(region.chronos)) {
      for (const valeur of [-1, 0.5, Infinity, '0']) {
        expect(() => validerDonneesRegion({ ...region, chronos: { ...region.chronos, [cle]: valeur } })).toThrow(/attendu/);
      }
    }
    for (const cle of Object.keys(region.arretAuto)) {
      expect(() => validerDonneesRegion({ ...region, arretAuto: { ...region.arretAuto, [cle]: 1 } })).toThrow('Booléen attendu');
    }
    for (const cle of ['chronos', 'arretAuto', 'pension', 'statistiques'] as const) {
      expect(() => validerDonneesRegion({ ...region, [cle]: { ...region[cle], inconnu: true } })).toThrow('Champ inconnu');
    }
    expect(() => validerDonneesRegion({ ...region, starterId: 1 })).not.toThrow();
  });
});
