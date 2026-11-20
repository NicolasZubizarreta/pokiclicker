import { expect, it } from 'vitest';
import { creerGestionnaire, creerStockageMemoire, partieInitiale, TAILLE_IMPORT_MAX } from './sauvegarde';
import { creerHorlogeSimulee } from './clock';

function contexte() {
  const stockage = creerStockageMemoire();
  const jeu = creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: () => 'test' });
  return { stockage, jeu };
}
it('B-core-01 isole les parties illisibles', () => {
  const { stockage, jeu } = contexte();
  stockage.ecrire('pokiclicker:partie:cassee', '{');
  jeu.creerPartie('Test');
  expect(jeu.listerParties()).toHaveLength(1);
  expect(jeu.partieCourante()).toBe('test');
});
it('B-core-02 conserve le brut et reprend sa révision', () => {
  const { stockage, jeu } = contexte();
  stockage.ecrire('pokiclicker:partie:test', '{"revision":7}');
  expect(jeu.ecrirePartie('test', partieInitiale('Test'), { revisionAttendue: 7 }).revision).toBe(8);
  expect(stockage.lire('pokiclicker:corrompue:pokiclicker:partie:test')).toBe('{"revision":7}');
  jeu.supprimerPartie('test');
  expect(stockage.cles()).toEqual([]);
});
it('B-core-17 incrémente la révision au renommage', () => {
  const { jeu } = contexte();
  jeu.creerPartie('Test');
  expect(jeu.renommerPartie('test', 'Suite').revision).toBe(2);
});
it('S-core-15 normalise le nom à la création', () => {
  expect(contexte().jeu.creerPartie(' Test ').donnees.nom).toBe('Test');
});
it('S-core-34 masque les détails internes', () => {
  expect(() => contexte().jeu.importerPartie('{')).toThrowError("Ce fichier n'est pas une sauvegarde de partie valide.");
});
it('B-core-09 exporte les régions illisibles et le compte absent', () => {
  const { jeu, stockage } = contexte();
  jeu.creerPartie('Test');
  stockage.ecrire('pokiclicker:region:test:kanto', '{');
  expect(JSON.parse(jeu.exporterPartie('test')).illisibles).toEqual(['kanto']);
  expect(jeu.exporterCompte()).toBe('null');
});
it('B-core-08 restaure une création interrompue', () => {
  const stockage = creerStockageMemoire();
  let n = 0;
  const jeu = creerGestionnaire({ stockage: { ...stockage, ecrire: (k, v) => {
    if (++n === 2) throw new Error('indisponible');
    stockage.ecrire(k, v);
  } }, horloge: creerHorlogeSimulee(), genererId: () => 'test' });
  expect(() => jeu.creerPartie('Test')).toThrow();
  expect(stockage.cles()).toEqual([]);
});
it.each(['import', 'installation'])('B-core-08 restaure une %s interrompue', mode => {
  const source = contexte();
  const partie = source.jeu.creerPartie('Source');
  const region = source.jeu.chargerRegion('test', 'kanto')!;
  const stockage = creerStockageMemoire();
  stockage.ecrire('pokiclicker:region:test:kanto', 'ancien');
  let n = 0;
  const cause = new Error('panne');
  const jeu = creerGestionnaire({ stockage: { ...stockage, ecrire: (k, v) => {
    if (++n === 2) throw cause;
    stockage.ecrire(k, v);
  } }, horloge: creerHorlogeSimulee(), genererId: () => 'copie' });
  expect(() => mode === 'import' ? jeu.importerPartie(source.jeu.exporterPartie('test')) :
    jeu.installerVersion({ partie, regions: [region] })).toThrow('Stockage indisponible.');
  expect(stockage.cles()).toEqual(['pokiclicker:region:test:kanto']);
  expect(stockage.lire('pokiclicker:region:test:kanto')).toBe('ancien');
});
it('S-core-28 type les erreurs de stockage', () => {
  const jeu = creerGestionnaire({ stockage: { ...creerStockageMemoire(), cles: () => { throw new Error('secret'); } },
    horloge: creerHorlogeSimulee(), genererId: () => 'test' });
  expect(() => jeu.listerParties()).toThrowError('Stockage indisponible.');
});
it('S-core-06 refuse les imports démesurés avant validation', () => {
  const { jeu } = contexte();
  expect(() => jeu.importerPartie(' '.repeat(TAILLE_IMPORT_MAX + 1))).toThrow();
  jeu.creerPartie('Test');
  const fichier = JSON.parse(jeu.exporterPartie('test'));
  fichier.partie = null;
  fichier.regions = Array(100).fill(null);
  try { jeu.importerPartie(JSON.stringify(fichier)); } catch (erreur) {
    expect((erreur as { detail: Error }).detail.message).toBe('Trop de régions');
  }
});
it('S-core-04 répare les uid partagés entre partie et région à l’installation et à l’import', () => {
  const { jeu } = contexte();
  const partie = jeu.creerPartie('Test');
  const region = jeu.chargerRegion('test', 'kanto')!;
  const p = { uid: 'unique', numero: 1, niveau: 5, xp: 0, shiny: false, bonheur: 0,
    pierreEternelle: false, calcium: 0, sexe: 'femelle' as const, favori: false };
  partie.donnees.pcGlobal = [p];
  region.donnees.equipe = [p];
  jeu.installerVersion({ partie, regions: [region] });
  const uids = [jeu.chargerPartie('test')!.donnees.pcGlobal[0]!.uid,
    jeu.chargerRegion('test', 'kanto')!.donnees.equipe[0]!.uid];
  expect(uids).toEqual(['unique', 'unique~2']);
  expect(new Set(uids).size).toBe(uids.length);
  const fichier = JSON.parse(jeu.exporterPartie('test'));
  fichier.partie = partie;
  fichier.regions = [region];
  const destination = contexte().jeu;
  const copie = destination.importerPartie(JSON.stringify(fichier));
  const importes = [destination.chargerPartie(copie.id)!.donnees.pcGlobal[0]!.uid,
    destination.chargerRegion(copie.id, 'kanto')!.donnees.equipe[0]!.uid];
  expect(importes).toEqual(['unique', 'unique~2']);
});
