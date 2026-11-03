import { expect, it } from 'vitest';
import { creerHorlogeSimulee } from './clock';
import { reglages } from './reglages';
import { avancerJournal, creerJournal, debuterEssai, effacerJournal, entrerZone, exporterJournal,
  finirEssai, pauserJournal, rechargerJournal, reprendreJournal, sortirZone } from './journal-zones';

const parametres = { nom: 'Carmin', multiplicateurPv: 2, combat: reglages.combat, actifs: ['badge-roche'] };
const entrer = () => entrerZone(creerJournal('revision-test', 0), 'carmin', parametres, 0);

it('conserve les entrées, retours, paramètres et cumuls par visite et zone sans mutation', () => {
  const debut = entrer();
  let journal = avancerJournal(debut, 100, 100);
  journal = entrerZone(journal, 'tour', { ...parametres, nom: 'Tour Pokémon' }, 100);
  journal = avancerJournal(journal, 200, 300);
  journal = entrerZone(journal, 'carmin', parametres, 300);
  journal = avancerJournal(journal, 50, 350);
  expect(debut.zones.carmin!.tempsActifMs).toBe(0);
  expect(journal.zones.carmin).toMatchObject({ tempsActifMs: 150, visites: [
    { entreeMs: 0, sortieMs: 100, tempsActifMs: 100, parametres },
    { entreeMs: 300, sortieMs: null, tempsActifMs: 50 },
  ] });
  expect(journal.zones.tour!.tempsActifMs).toBe(200);
});

it('compte une seule fois chaque essai et ses issues, y compris les abandons à la sortie', () => {
  let journal = debuterEssai(entrer(), 'boss', 10);
  journal = debuterEssai(journal, 'boss', 20);
  journal = finirEssai(journal, 'echec', 30);
  journal = finirEssai(journal, 'victoire', 40);
  journal = debuterEssai(journal, 'boss', 50);
  journal = finirEssai(journal, 'victoire', 60);
  journal = debuterEssai(journal, 'boss', 70);
  journal = sortirZone(journal, 80);
  expect(journal.zones.carmin!.nombreEssais).toBe(3);
  expect(journal.zones.carmin!.visites[0]!.essais.map(essai => essai.issue)).toEqual(['echec', 'victoire', 'abandon']);
});

it('sépare masquage, pause et rechargement et conserve la visite et le boss ouverts', () => {
  let journal = debuterEssai(entrer(), 'boss', 0);
  journal = avancerJournal(journal, 100, 100);
  journal = pauserJournal(journal, 'onglet-masque', 100);
  journal = pauserJournal(journal, 'onglet-masque', 150);
  journal = avancerJournal(journal, 5000, 5100);
  journal = reprendreJournal(journal, 6100);
  journal = avancerJournal(journal, 50, 6150);
  journal = pauserJournal(journal, 'pause', 6150);
  journal = reprendreJournal(journal, 7000);
  journal = rechargerJournal(JSON.parse(JSON.stringify(journal)), 10000);
  journal = entrerZone(journal, 'carmin', parametres, 10000);
  journal = debuterEssai(journal, 'boss', 10000);
  journal = avancerJournal(journal, 25, 10025);
  journal = finirEssai(journal, 'victoire', 10025);
  expect(journal.zones.carmin).toMatchObject({ nombreEssais: 1, tempsActifMs: 175 });
  expect(journal.zones.carmin!.visites).toHaveLength(1);
  expect(journal.zones.carmin!.visites[0]!.interruptions).toEqual([
    { motif: 'onglet-masque', debutMs: 100, finMs: 6100 },
    { motif: 'pause', debutMs: 6150, finMs: 7000 },
    { motif: 'rechargement', debutMs: 7000, finMs: 10000 },
  ]);
});

it('ne superpose pas une interruption ouverte et le temps hors session', () => {
  const journal = rechargerJournal(pauserJournal(entrer(), 'onglet-masque', 10), 1000);
  expect(journal.zones.carmin!.visites[0]!.interruptions).toEqual([
    { motif: 'onglet-masque', debutMs: 10, finMs: 10 },
    { motif: 'rechargement', debutMs: 10, finMs: 1000 },
  ]);
  expect(journal.zones.carmin!.tempsActifMs).toBe(0);
});

it('exporte un objet JSON indépendant et efface les relevés', () => {
  const journal = entrer();
  const objet = exporterJournal(journal)!;
  expect(JSON.parse(JSON.stringify(objet))).toEqual(journal);
  objet.zones.carmin!.visites.length = 0;
  expect(journal.zones.carmin!.visites).toHaveLength(1);
  expect(effacerJournal(journal, creerHorlogeSimulee(42))).toEqual(creerJournal('revision-test', 42));
  expect(exporterJournal(null)).toBeNull();
});
