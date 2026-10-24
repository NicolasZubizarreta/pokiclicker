import { describe, expect, it } from 'vitest';
import donnees from '../../data/regions/kanto/zones.json';
import { kanto } from './regions';
import { chargerMonde } from './monde';
import type { FichierZones } from './monde';
import type { EtatMonde } from './conditions';
import { creerGestionnaire, creerStockageMemoire } from './sauvegarde';
import { reglages } from './reglages';

const vide: EtatMonde = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };
const route = 'kanto.route-1';
const foret = 'kanto.foret-de-jade';

describe('accès aux zones et départ', () => {
  it('autorise une zone déjà ouverte', () => {
    expect(kanto.accesZone(route, vide)).toEqual({ ok: true });
  });

  it('explique la condition de la Forêt de Jade fermée au départ', () => {
    const resultat = kanto.accesZone(foret, vide);
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.raison).toMatch(/boss/i);
  });

  it('ouvre la forêt après le boss et permet le retour sur la Route 1', () => {
    const etat = { ...vide, bossVaincus: [route] };
    expect(kanto.zonesOuvertes(etat).map(zone => zone.id)).toContain(foret);
    expect(kanto.accesZone(foret, etat)).toEqual({ ok: true });
    expect(kanto.accesZone(route, etat)).toEqual({ ok: true });
  });

  it('retrouve la première zone menant à une destination', () => {
    expect(kanto.zonePrecedente(foret)).toBe(kanto.zone(route));
    expect(kanto.zonePrecedente(kanto.depart)).toBeUndefined();
  });

  it('démarre une partie sur la Route 1', () => {
    const stockage = creerStockageMemoire();
    const gestionnaire = creerGestionnaire({ stockage, horloge: { maintenant: () => 0 }, genererId: () => 'essai' });
    const partie = gestionnaire.creerPartie('Essai');
    expect(gestionnaire.chargerRegion(partie.id, 'kanto')?.donnees.zoneId).toBe(route);
  });

  it('réserve le message de Bourg Palette à la zone sans combat', () => {
    const bourg = kanto.zone(kanto.depart);
    expect(bourg.sansCombat && bourg.message).toBe('Pas de Pokémon sauvage ici. Va sur la Route 1 pour combattre.');
    expect(kanto.zone(route)).not.toHaveProperty('message');
  });

  it.each(['', '   ', 42])('refuse un message invalide : %s', message => {
    const fichier = structuredClone(donnees);
    Object.assign(fichier.zones[0]!, { message });
    expect(() => chargerMonde(fichier as FichierZones)).toThrow(/message/i);
  });

  it('expose le minuteur de boss en millisecondes', () => {
    expect(reglages.combat.minuteurBossMs).toBe(30000);
  });
});
