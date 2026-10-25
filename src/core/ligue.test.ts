import { describe, expect, it } from 'vitest';
import donnees from '../../data/ligue.json';
import references from '../../tests/fixtures/v1-ligue.json';
import { avancerCombat, creerEnnemi, reprendreCombat } from './combat';
import { chargerLigue, dresseurDe, enregistrerVictoireLigue, estZoneDeLigue,
  etapeDeReprise, messageEnchainement, nomAdversaire, zoneDeLigue } from './ligue';
import { refusPoupee, utiliserPoupee } from './objets-actifs';
import { kanto } from './regions';
import { regionInitiale } from './sauvegarde';

const zone = kanto.zoneDeCombat(donnees.zone);
const alea = () => { throw new Error('Aléa inattendu'); };

describe('Ligue', () => {
  it('valide les données sans les modifier', () => {
    const avant = structuredClone(donnees);
    expect(chargerLigue(donnees, zone)).toEqual(donnees);
    expect(donnees).toEqual(avant);
  });

  it.each([
    { ...donnees, version: 2 },
    { ...donnees, zone: 'inconnue' },
    { ...donnees, combats: donnees.combats.slice(1) },
    { ...donnees, combats: donnees.combats.map(c => ({ ...c, minuteurMs: 1 })) },
    { ...donnees, combats: donnees.combats.map(c => ({ ...c, pokemon: 1 })) },
    { ...donnees, combats: donnees.combats.map(c => ({ ...c, niveau: 1 })) },
    { ...donnees, combats: donnees.combats.map(c => ({ ...c, nom: 'Autre' })) },
    { ...donnees, dresseurs: [] },
    { ...donnees, counter: [] },
    { ...donnees, messages: {} }, null,
  ])('refuse une configuration divergente ou malformée %#', (fichier) => {
    expect(() => chargerLigue(fichier, zone)).toThrow(/^Ligue invalide : /);
  });

  it.each(references.counter)('reproduit le counter V1 du starter $starterId', (cas) => {
    const avant = structuredClone(zone);
    const derivee = zoneDeLigue(zone, cas.starterId);
    expect(creerEnnemi(derivee, 10, alea)).toMatchObject({
      numero: cas.id, niveau: cas.level, pvMax: cas.maxHp,
    });
    expect(nomAdversaire(derivee, 10)).toBe(cas.name);
    expect({ ...derivee, boss: zone.boss }).toEqual(zone);
    expect(zone).toEqual(avant);
  });

  it('garde le boss par défaut pour un starter inconnu et les autres zones intactes', () => {
    expect(zoneDeLigue(zone, 999)).toBe(zone);
    const route = kanto.zoneDeCombat('kanto.route-1');
    expect(zoneDeLigue(route, 1)).toBe(route);
    expect(estZoneDeLigue(route)).toBe(false);
    expect(nomAdversaire(route, 1)).toBeNull();
    expect(dresseurDe(route, 1)).toBeNull();
    expect(messageEnchainement(route, 2)).toBeNull();
    expect(etapeDeReprise({ ...zone, id: 'autre' }, 6)).toBe(1);
  });

  it('reprend au premier Pokémon de chaque dresseur', () => {
    expect(Array.from({ length: 10 }, (_, i) => etapeDeReprise(zone, i + 1)))
      .toEqual([1, 1, 3, 3, 5, 5, 7, 7, 9, 9]);
    expect(dresseurDe(zone, 6)).toEqual({ id: 'agatha', nom: 'Agatha' });
    expect(nomAdversaire(zone, 1)).toBe('Olga (Lokhlass)');
    expect(estZoneDeLigue(zone.id)).toBe(true);
  });

  it.each([6, 10])('reprend après expiration de %i et conserve le counter', (etape) => {
    const derivee = zoneDeLigue(zone, 7);
    const initial = reprendreCombat(derivee, [], alea, etape);
    const avant = structuredClone({ ...initial, alea: undefined });
    const echec = avancerCombat(initial, 30000);
    expect(echec).toMatchObject({ etape: etape - 1, minuteurMs: 30000, attenteMs: 0 });
    expect(echec.ennemi).toEqual(creerEnnemi(derivee, etape - 1, alea));
    expect(echec.zone.boss.pokemon).toBe(3);
    expect(echec.evenements).toEqual([{ type: 'boss-echoue', zoneId: zone.id }]);
    expect({ ...initial, alea: undefined }).toEqual(avant);
  });

  it('annonce seulement les fins de dresseur', () => {
    expect(Array.from({ length: 10 }, (_, i) => messageEnchainement(zone, i + 1)))
      .toEqual([null, 'Victoire contre Olga ! Aldo entre en scène.',
        null, 'Victoire contre Aldo ! Agatha entre en scène.',
        null, 'Victoire contre Agatha ! Peter entre en scène.',
        null, 'Victoire contre Peter ! Maître Blue entre en scène.',
        null, 'Victoire contre Maître Blue !']);
  });

  it('ajoute une victoire sans modifier la région et refuse la poupée même après victoire', () => {
    const region = { ...regionInitiale('kanto', zone.id), ligueGagnee: 2,
      bossVaincus: [zone.id], inventaire: { pokeDoll: 1 } };
    const avant = structuredClone(region);
    expect(enregistrerVictoireLigue(region)).toEqual({ ...region, ligueGagnee: 3 });
    expect(refusPoupee(region, zone.id)).toBe('Boss non vaincu !');
    expect(utiliserPoupee(region, zone.id)).toEqual({ ok: false, raison: 'Boss non vaincu !' });
    expect(region).toEqual(avant);
  });
});
