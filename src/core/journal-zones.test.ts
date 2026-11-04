import { expect, it } from 'vitest';
import { creerHorlogeSimulee } from './clock';
import { reglages } from './reglages';
import { avancerJournal, creerJournal, debuterEssai, effacerJournal, entrerZone, exporterJournal,
  finirEssai, pauserJournal, rechargerJournal, reprendreJournal, sortirZone, ajouterAction, compterClic,
  type Instantane } from './journal-zones';

const parametres = { nom: 'Carmin', multiplicateurPv: 2, combat: reglages.combat, actifs: ['badge-roche'] };
const entrer = () => entrerZone(creerJournal('revision-test', 0), 'carmin', parametres, 0);
const instantane: Instantane = { argent: 100, argentTotalGagne: 200, badges: 2, pokedexCaptures: 30,
  pokedexTotal: 151, palierPokedex: 30, bonusActifs: ['jalon:30'], ameliorations: ['protein'],
  inventaire: { bonbon: 2 }, equipe: [{ numero: 1, niveau: 15, bonheur: 10, calcium: 1, shiny: false }] };

it('exporte la version 2, les instantanés indépendants, les actions et les mesures du boss', () => {
  let journal = entrerZone(creerJournal('test', 0), 'carmin', parametres, 0, instantane);
  journal = debuterEssai(journal, 'boss', 0, instantane, { pvBoss: 1000, dpsEquipe: 100,
    degatsClic: 10, clicParSeconde: 0, tempsAccordeMs: 30000, margeTemps: 1 / 3 });
  journal = compterClic(journal, 10);
  journal = ajouterAction(journal, { type: 'achat', objet: 'bonbon', quantite: 1, prix: 50, soldeApres: 50, tMs: 20 });
  journal = avancerJournal(journal, 100, 100);
  journal = pauserJournal(journal, 'onglet-masque', 100);
  journal = avancerJournal(journal, 500, 600, false);
  journal = finirEssai(journal, 'echec', 1000, { ...instantane, argent: 50 });
  const visite = journal.zones.carmin!.visites[0]!;
  expect(journal.version).toBe(2);
  expect(visite).toMatchObject({ entree: instantane, tempsActifMs: 100, tempsSimuleMs: 600, tempsMontreMs: 1000 });
  expect(visite.entree).not.toBe(instantane);
  expect(visite.actions).toEqual([{ type: 'achat', objet: 'bonbon', quantite: 1, prix: 50, soldeApres: 50, tMs: 20 }]);
  expect(visite.essais[0]).toMatchObject({ debut: instantane, fin: { argent: 50 }, issue: 'echec',
    nombreClics: 1, boss: { pvBoss: 1000, margeTemps: 1 / 3, clicParSeconde: 1000 / 600 } });
  expect(sortirZone(journal, 1200).zones.carmin!.visites[0]!.tempsMontreMs).toBe(1200);
});

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

it('garde un export de 100 visites, 1 000 essais et 10 000 actions sous 4 Mo', () => {
  const capture = { ...instantane, equipe: Array.from({ length: 6 }, () => instantane.equipe[0]!),
    inventaire: { xAttack: 20, xSpecial: 20, bonbon: 50, calcium: 20, pomegBerry: 20 },
    ameliorations: ['protein', 'leftovers', 'runningShoes'], bonusActifs: ['jalon:10', 'jalon:30', 'objet:protein'] };
  let journal = entrerZone(creerJournal('taille', 0), 'carmin', parametres, 0, capture);
  journal = debuterEssai(journal, 'boss', 0, capture, { pvBoss: 1000000, dpsEquipe: 10000,
    degatsClic: 1000, clicParSeconde: 7, tempsAccordeMs: 30000, margeTemps: 10 / 3 });
  journal = finirEssai(journal, 'victoire', 30000, capture);
  const visite = journal.zones.carmin!.visites[0]!;
  visite.essais = Array.from({ length: 10 }, () => visite.essais[0]!);
  visite.actions = Array.from({ length: 100 }, () => ({ type: 'achat', objet: 'bonbon', quantite: 5,
    prix: 10000, soldeApres: 100000, tMs: 123456 }));
  journal.zones = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`zone-${i}`,
    { visites: [visite], tempsActifMs: 300000, nombreEssais: 10 }]));
  journal.zoneCourante = 'zone-99';
  const octets = new TextEncoder().encode(JSON.stringify(exporterJournal(journal))).length;
  expect(octets).toBeLessThan(4_000_000);
  console.info(`Export synthétique : ${octets} octets (100 visites, 1 000 essais, 10 000 actions).`);
});
