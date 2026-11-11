import { expect, it } from 'vitest';
import donnees from '../../data/casino.json';
import { chargerCasino, entrerAuCasino, messageBienvenue } from './casino';
import { creerHorlogeSimulee } from './clock';
import { creerGestionnaire, creerStockageMemoire, regionInitiale, validerDonneesRegion } from './sauvegarde';

const depart = (jetons = 7) => ({ ...regionInitiale('kanto', 'kanto.route-1'), jetons });

it('offre les jetons de data/casino.json une seule fois et pose casinoVu', () => {
  expect(donnees.premiereEntree.jetons).toBe(100);
  const premiere = entrerAuCasino(depart());
  expect(premiere.offerts).toBe(100);
  expect(premiere.region).toMatchObject({ casinoVu: true, jetons: 107 });
  const seconde = entrerAuCasino(premiere.region);
  expect(seconde.offerts).toBe(0);
  expect(seconde.region).toBe(premiere.region);
});

it('ne modifie pas la région reçue', () => {
  const region = depart();
  entrerAuCasino(region);
  expect(region.jetons).toBe(7);
  expect(region).not.toHaveProperty('casinoVu');
});

it('écrit le message de bienvenue avec le nombre de jetons', () => {
  expect(messageBienvenue(100)).toBe('100 jetons offerts pour ta première visite !');
  expect(messageBienvenue(1500)).toBe('1 500 jetons offerts pour ta première visite !');
});

it('refuse un nombre de jetons offerts invalide dans les données', () => {
  for (const jetons of [0, -5, 1.5, '100']) {
    expect(() => chargerCasino({ ...donnees, premiereEntree: { ...donnees.premiereEntree, jetons } })).toThrow();
  }
  expect(() => chargerCasino({ ...donnees, premiereEntree: { jetons: 100, message: ' ' } })).toThrow();
});

it('valide casinoVu : booléen accepté, absent accepté (ancienne sauvegarde), texte refusé', () => {
  expect(() => validerDonneesRegion(depart())).not.toThrow();
  expect(() => validerDonneesRegion({ ...depart(), casinoVu: true })).not.toThrow();
  expect(() => validerDonneesRegion({ ...depart(), casinoVu: false })).not.toThrow();
  expect(() => validerDonneesRegion({ ...depart(), casinoVu: 'oui' })).toThrowError('Booléen attendu');
});

it('garde casinoVu à l’écriture, la lecture, l’export et l’import : le cadeau ne se rejoue pas', () => {
  const stockage = creerStockageMemoire();
  let sequence = 0;
  const jeu = creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: () => `partie-${++sequence}` });
  const partie = jeu.creerPartie('Casino');
  const { region, offerts } = entrerAuCasino({ ...jeu.chargerRegion(partie.id, 'kanto')!.donnees, jetons: 40 });
  expect(offerts).toBe(100);
  jeu.ecrireRegion(partie.id, 'kanto', region);
  expect(jeu.chargerRegion(partie.id, 'kanto')!.donnees).toMatchObject({ casinoVu: true, jetons: 140 });
  const copie = jeu.importerPartie(jeu.exporterPartie(partie.id));
  const reprise = jeu.chargerRegion(copie.id, 'kanto')!.donnees;
  expect(reprise).toMatchObject({ casinoVu: true, jetons: 140 });
  expect(entrerAuCasino(reprise).offerts).toBe(0);
});

it('charge une ancienne sauvegarde sans casinoVu : jamais entré, le cadeau sera donné à la première entrée', () => {
  const jeu = creerGestionnaire({ stockage: creerStockageMemoire(), horloge: creerHorlogeSimulee(), genererId: () => 'ancienne' });
  const partie = jeu.creerPartie('Ancienne');
  const ancienne = { ...jeu.chargerRegion(partie.id, 'kanto')!.donnees, jetons: 1234 };
  expect(ancienne).not.toHaveProperty('casinoVu');
  jeu.ecrireRegion(partie.id, 'kanto', ancienne);
  const chargee = jeu.chargerRegion(partie.id, 'kanto')!.donnees;
  expect(chargee).not.toHaveProperty('casinoVu');
  expect(entrerAuCasino(chargee)).toMatchObject({ offerts: 100, region: { jetons: 1334, casinoVu: true } });
});
