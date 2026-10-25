import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { calculerClic } from '../core/combat';
import * as combat from '../core/combat';
import { calculerMaxXp, delaiEnnemiSuivant } from '../core/recompenses';
import { chargerBadges, chargerJalons } from '../core/progression';
import { kanto } from '../core/regions';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { afficherProgression, formaterProchainPalier, phaseObtention } from './store-progression';

const stores: ReturnType<typeof creerStoreJeu>[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.splice(0).forEach(s => s.getState().arreter()); vi.useRealTimers(); });

function preparer(partiel: Partial<DonneesRegion> = {}, numeros: number[] = [1], niveau = 5) {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee(1000);
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  const compte = compteInitial();
  gestionnaire.ecrireCompte({ ...compte,
    preferences: { ...compte.preferences, autoAttaque: false } });
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => 0.5, genererId: () => 'test' });
    stores.push(store);
    store.getState().demarrer();
    expect(store.getState().erreur).toBeNull();
    return store;
  };
  const depart = ouvrir();
  const initial = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  numeros.forEach(numero => depart.getState().noterEspece(numero));
  depart.getState().arreter();
  const region = { ...initial, zoneId: 'kanto.route-1', etape: 1,
    equipe: [{ ...initial.equipe[0]!, uid: 'a', numero: 1, niveau }], ...partiel };
  // Le premier démarrage sert uniquement à créer la région, avant le scénario.
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, jalonsRecus: partiel.jalonsRecus ?? [],
    argent: partiel.argent ?? 0, inventaire: partiel.inventaire ?? {} });
  const store = ouvrir();
  const avancer = (ticks = 1) => {
    for (let i = 0; i < ticks; i++) { horloge.avancer(100); store.getState().tick(); }
  };
  const sauvee = () => gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  return { store, ouvrir, avancer, horloge, region: sauvee(), sauvee };
}

describe('progression du store', () => {
  it('évite de recalculer les arènes lorsque seuls les autres champs de région changent', () => {
    const observer = vi.spyOn(kanto, 'zone');
    try {
      const region = { badges: ['terre'], jalonsRecus: [10] };
      const affichage = afficherProgression(region, [1, 4, 7, 25]);
      expect(observer).toHaveBeenCalledTimes(8);
      observer.mockClear();
      expect(afficherProgression({ ...region, badges: [...region.badges] }, [1, 4, 7, 25])).toBe(affichage);
      expect(observer).not.toHaveBeenCalled();
      expect(afficherProgression({ ...region, badges: [] }, [1, 4, 7, 25])).not.toBe(affichage);
      expect(observer).toHaveBeenCalledTimes(8);
    } finally { observer.mockRestore(); }
  });

  it('réduit dès la victoire sur Jadielle le premier délai avec le badge Terre', () => {
    const observer = vi.spyOn(combat, 'viderEvenements');
    try {
      const membre = preparer().region.equipe[0]!;
      const { store, avancer } = preparer({ zoneId: 'kanto.arene-de-jadielle', etape: 10,
        badges: ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan'], jalonsRecus: [10, 30, 90],
        equipe: Array.from({ length: 6 }, (_, i) => ({ ...membre, uid: `terre-${i}`, numero: 150, sexe: 'sansSexe', niveau: 100 })) }, [1], 100);
      store.getState().basculerAutoAttaque();
      for (let i = 0; i < 200 && store.getState().obtentionBadge === null; i++) {
        store.getState().attaquer();
        avancer();
      }
      expect(store.getState().obtentionBadge?.id).toBe('terre');
      const victoire = observer.mock.calls.map(([etat]) => etat)
        .find(etat => etat.evenements.some(e => e.type === 'boss-vaincu'))!;
      expect(victoire.attenteCapture).toBe(false);
      expect(victoire.attenteMs).toBe(delaiEnnemiSuivant(['badge:terre']));
      expect(victoire.attenteMs).toBe(Math.floor(delaiEnnemiSuivant() / 1.2));
      expect(victoire.attenteMs).toBe(1666);
    } finally { observer.mockRestore(); }
  });

  it('joint la montée de niveau, le badge et la zone débloquée dans une même annonce', () => {
    const membre = preparer().region.equipe[0]!;
    const { store, avancer } = preparer({ zoneId: 'kanto.arene-d-argenta', etape: 10,
      equipe: [{ ...membre, surnom: 'Bulbizarre', niveau: 99, xp: calculerMaxXp(1, 99) - 1 }] });
    store.getState().basculerAutoAttaque();
    for (let i = 0; i < 200 && store.getState().obtentionBadge === null; i++) avancer();
    expect(store.getState().annonce).toBe('Bulbizarre passe au niveau 100 ! · Badge Roche obtenu ! · Zone débloquée !');
  });

  it('formate le prochain palier au singulier, au pluriel et le Pokédex complet', () => {
    expect(formaterProchainPalier({ palier: 10, titre: 'Débutant', restantes: 1 }))
      .toBe('Prochain palier : 10 (Débutant) · Encore 1 espèce.');
    expect(formaterProchainPalier({ palier: 10, titre: 'Débutant', restantes: 7 }))
      .toBe('Prochain palier : 10 (Débutant) · Encore 7 espèces.');
    expect(formaterProchainPalier(null)).toBe('Pokédex complet !');
  });

  it('affiche les badges, les paliers et le prochain, sans mutation et avec une référence stable', () => {
    const { region } = preparer({ badges: ['roche'] });
    const avant = structuredClone(region);
    const pokedex = [1, 1, 2, 999];
    const affichage = afficherProgression(region, pokedex);
    expect(affichage).toMatchObject({ obtenus: 1, total: 8, pokedex: { nombre: 2, total: 151 },
      prochain: { palier: 10, titre: 'Débutant', restantes: 8 } });
    expect(affichage.badges[0]).toMatchObject({ id: 'roche', obtenu: true,
      arene: kanto.zone(chargerBadges()[0]!.zone).nom });
    expect(affichage.paliers).toHaveLength(10);
    const enrichie = { ...region, argent: region.argent + 1 };
    expect(afficherProgression(enrichie, [...pokedex])).toBe(affichage);
    expect(afficherProgression(region, Array.from({ length: 151 }, (_, i) => i + 1)).prochain).toBeNull();
    expect(region).toEqual(avant);
    expect(pokedex).toEqual([1, 1, 2, 999]);
  });

  it('respecte les quatre bornes de la séquence', () => {
    expect([0, 1199, 1200, 1999, 2000, 3199, 3200, 9000]
      .map(ms => phaseObtention(500, ms + 500)))
      .toEqual(['message', 'message', 'boite', 'boite', 'claque', 'claque', 'fin', 'fin']);
  });

  it('accorde Roche, sauvegarde et garde la boîte ouverte, sans nouvelle récompense au second combat', () => {
    const { store, avancer, ouvrir, sauvee, horloge } = preparer({ zoneId: 'kanto.arene-d-argenta', etape: 10,
      bossVaincus: kanto.zones.map(z => z.id) }, [1], 100);
    store.getState().basculerAutoAttaque();
    for (let i = 0; i < 200 && store.getState().obtentionBadge === null; i++) avancer();
    expect(store.getState().annonce).toContain('Badge Roche obtenu !');
    expect(sauvee().badges).toEqual(['roche']);
    expect(store.getState().obtentionBadge).toEqual({ id: 'roche', phase: 'message' });
    store.getState().basculerAutoAttaque();
    avancer(12);
    expect(store.getState().obtentionBadge?.phase).toBe('boite');
    avancer(8);
    expect(store.getState().obtentionBadge?.phase).toBe('claque');
    avancer(12);
    expect(store.getState().obtentionBadge?.phase).toBe('fin');
    avancer(1);
    expect(store.getState().obtentionBadge?.phase).toBe('fin');
    store.getState().fermerBoiteBadges();
    expect(store.getState().obtentionBadge).toBeNull();
    store.getState().arreter();
    const recharge = ouvrir();
    expect(recharge.getState().obtentionBadge).toBeNull();
    recharge.getState().allerVers('kanto.arene-d-argenta');
    recharge.getState().basculerAutoAttaque();
    for (let i = 0; i < 200; i++) {
      // Le store rechargé possède sa propre boucle.
      horloge.avancer(100);
      recharge.getState().tick();
    }
    expect(sauvee().badges).toEqual(['roche']);
    expect(recharge.getState().obtentionBadge).toBeNull();
  });

  it('applique le clic Roche arrondi dès la reprise, avec les chronos', () => {
    const { store } = preparer({ badges: ['roche'], chronos: { finRepousse: 0, finSuperRepousse: 0,
      finBoostAttaque: 31000, finBoostAttaqueSpeciale: 0, rechargeFauchage: 0 } });
    const coups: number[] = [];
    store.abonnerDegats(coup => coups.push(coup.valeur));
    store.getState().attaquer();
    expect(coups[0]).toBe(Math.floor(calculerClic(store.getState().dps) * 1.5) * 1.5);
  });

  it('rattrape 151 espèces une seule fois, expose Omni Exp non utilisable dans le Sac', () => {
    const { store, sauvee, ouvrir } = preparer({}, Array.from({ length: 151 }, (_, i) => i + 1));
    expect(sauvee().jalonsRecus).toEqual(chargerJalons().map(j => j.palier));
    expect(sauvee().argent).toBe(2500);
    expect(sauvee().inventaire.omniExp).toBe(1);
    expect(store.getState().sac.entrees.find(e => e.id === 'omniExp')).toMatchObject({ quantite: 1, utilisable: null });
    expect(store.getState().annonce).toContain('Palier 10 : Débutant');
    const avant = sauvee();
    store.getState().arreter();
    const recharge = ouvrir();
    expect(sauvee()).toEqual(avant);
    expect(recharge.getState().annonce).toBeNull();
  });

  it('accorde le palier à la capture de la dixième espèce et double immédiatement le clic', () => {
    const { store, avancer } = preparer({ inventaire: { masterball: 1 } }, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(store.getState().ennemi!.numero).not.toBe(1);
    // Neuf espèces connues qui excluent le sauvage rencontré.
    const numero = store.getState().ennemi!.numero;
    expect(store.getState().pokedex).not.toContain(numero);
    store.getState().capturer('masterball');
    for (let i = 0; i < 100 && !store.getState().pokedex.includes(numero); i++) avancer();
    expect(store.getState().annonce).toContain('Palier 10 : Débutant');
    expect(store.getState().progression.pokedex.nombre).toBe(10);
    avancer(30);
    const coups: number[] = [];
    store.abonnerDegats(coup => coups.push(coup.valeur));
    store.getState().attaquer();
    expect(coups[0]).toBe(calculerClic(store.getState().dps) * 2);
  });

  it('accorde les paliers via noterEspece et une évolution sans perdre les récompenses', () => {
    const { store, sauvee } = preparer({}, [1, 3, 4, 5, 6, 7, 8, 9, 10], 16);
    expect(store.getState().evoluer('a')).toBeNull();
    expect(store.getState().annonce).toBe('Évolution ! · Palier 10 : Débutant');
    expect(sauvee().jalonsRecus).toEqual([10]);
    for (let n = 11; n <= 20; n++) store.getState().noterEspece(n);
    expect(sauvee().argent).toBe(2500);
    expect(sauvee().jalonsRecus).toEqual([10, 20]);
    store.getState().noterEspece(20);
    expect(sauvee().argent).toBe(2500);
  });
});
