// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire, etatMondeDe } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import { calculerMaxXp } from '../core/recompenses';
import { reglages } from '../core/reglages';
import { creerStoreJeu } from './store';
import type { StoreJeu } from './store';
import { ERREUR_CONFLIT } from './persistance';
import { equipeDeDepart } from './equipe-de-depart';
import { cheminDecor } from './precharger';
import { kanto } from '../core/regions';
import { genererIdentifiant } from './identifiants';
import { detailDps } from '../core/equipe';

const stores: StoreJeu[] = [];
beforeEach(() => vi.useFakeTimers());
afterEach(() => { stores.forEach(store => store.getState().arreter()); stores.length = 0; vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function preparer(stockage = creerStockageMemoire(), alea = () => .1) {
  const horloge = creerHorlogeSimulee();
  const store = creerStoreJeu({ horloge, stockage, alea, genererId: () => 'test' });
  stores.push(store);
  store.getState().demarrer();
  const avancer = (ms = 100) => { horloge.avancer(ms); store.getState().tick(); };
  return { store, horloge, stockage, avancer };
}

function preparerRegion(modifier: (region: DonneesRegion) => DonneesRegion, alea = () => .1) {
  const initial = preparer();
  initial.store.getState().arreter();
  const gestionnaire = creerGestionnaire({ stockage: initial.stockage, horloge: initial.horloge, genererId: () => 'test' });
  gestionnaire.ecrireRegion('test', 'kanto', modifier(gestionnaire.chargerRegion('test', 'kanto')!.donnees));
  return preparer(initial.stockage, alea);
}

function vaincre(partie: ReturnType<typeof preparer>) {
  const etape = partie.store.getState().etape;
  for (let i = 0; i < 10000 && partie.store.getState().etape === etape; i++) {
    partie.store.getState().attaquer();
    partie.avancer();
  }
  expect(partie.store.getState().etape).not.toBe(etape);
}

it('enregistre immédiatement le surnom et le favori pour un nouveau store', () => {
  const { store, stockage } = preparer();
  const uid = store.getState().equipe[0]!.pokemon.uid;
  expect(store.getState().renommer(uid, ' Copain ')).toBeNull();
  expect(store.getState().basculerFavori(uid)).toBeNull();
  store.getState().arreter();
  expect(preparer(stockage).store.getState().equipe[0]!.pokemon).toMatchObject({ uid, surnom: 'Copain', favori: true });
});

it.each(['relacher', 'envoyerAuPc'] as const)('%s recalcule le combat et récompense les Pokémon restants', action => {
  const partie = preparerRegion(region => ({ ...region,
    equipe: ['retire', 'reste-1', 'reste-2'].map(uid => ({ ...region.equipe[0]!, uid, niveau: 10, xp: 0 })) }));
  const { store, stockage } = partie;
  const avant = store.getState();
  const contribution = avant.equipe[0]!.dps;
  expect(avant[action]('retire')).toBeNull();
  expect(store.getState().equipe.filter(Boolean).map(m => m!.pokemon.uid)).toEqual(['reste-1', 'reste-2']);
  expect(JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees.equipe).toHaveLength(2);
  const pv = store.getState().pv;
  partie.avancer();
  expect(store.getState().dps).toBeCloseTo(avant.dps - contribution);
  expect(pv - store.getState().pv).toBeCloseTo((avant.dps - contribution) / 10);
  vaincre(partie);
  for (const membre of store.getState().equipe.filter(Boolean)) {
    expect(membre!.pokemon.uid).toMatch(/^reste-/);
    expect(membre!.pokemon.xp).toBeGreaterThan(0);
  }
  store.getState().fermer();
  const region = JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees as DonneesRegion;
  expect(region.equipe.map(p => p.uid)).toEqual(['reste-1', 'reste-2']);
  expect(region.pc.find(p => p.uid === 'retire')?.xp).toBe(action === 'envoyerAuPc' ? 0 : undefined);
});

it('refuse le dernier Pokémon et les actions invalides sans sauvegarde ni changement d’équipe', () => {
  const { store, stockage } = preparerRegion(region => ({ ...region, equipe: [region.equipe[0]!] }));
  const avant = store.getState().equipe;
  const sauvegarde = stockage.lire('pokiclicker:region:test:kanto');
  const uid = avant[0]!.pokemon.uid;
  const dernier = "C'est ton dernier Pokémon : garde-le dans l'équipe.";
  expect(store.getState().relacher(uid)).toBe(dernier);
  expect(store.getState().envoyerAuPc(uid)).toBe(dernier);
  expect(store.getState().renommer(uid, '1234567890123')).toBe('Entre un nom de 1 à 12 caractères.');
  expect(store.getState().basculerFavori('absent')).toBe('Ce Pokémon est introuvable.');
  expect(store.getState().placerDansEquipe('absent')).toBe('Ce Pokémon est introuvable.');
  expect(store.getState().echanger('absent', uid)).toBe('Ce Pokémon est introuvable.');
  expect(store.getState().equipe).toBe(avant);
  expect(stockage.lire('pokiclicker:region:test:kanto')).toBe(sauvegarde);
});

it('envoie au PC puis replace dans l’équipe avec sauvegarde immédiate', () => {
  const { store, stockage } = preparerRegion(region => ({ ...region,
    equipe: ['premier', 'second'].map(uid => ({ ...region.equipe[0]!, uid })) }));
  expect(store.getState().envoyerAuPc('premier')).toBeNull();
  expect(JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees.pc[0].uid).toBe('premier');
  expect(store.getState().placerDansEquipe('premier')).toBeNull();
  expect(store.getState().echange).toBeNull();
  const region = JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees as DonneesRegion;
  expect(region.pc).toEqual([]);
  expect(region.equipe.map(p => p.uid)).toEqual(['second', 'premier']);
});

it('ouvre, annule puis termine un échange sans sauvegarder son ouverture', () => {
  const { store, stockage } = preparerRegion(region => ({ ...region,
    equipe: Array.from({ length: 6 }, (_, i) => ({ ...region.equipe[0]!, uid: `equipe-${i}` })),
    pc: [{ ...region.equipe[0]!, uid: 'pc', surnom: 'Renfort' }] }));
  const avant = store.getState().equipe;
  const sauvegarde = stockage.lire('pokiclicker:region:test:kanto');
  expect(store.getState().placerDansEquipe('pc')).toBeNull();
  expect(store.getState().echange).toEqual({ uid: 'pc', nom: 'Renfort' });
  expect(store.getState().equipe).toBe(avant);
  expect(stockage.lire('pokiclicker:region:test:kanto')).toBe(sauvegarde);
  store.getState().annulerEchange();
  expect(store.getState().echange).toBeNull();
  expect(store.getState().placerDansEquipe('pc')).toBeNull();
  expect(store.getState().echanger('pc', 'absent')).toBe('Ce Pokémon est introuvable.');
  expect(store.getState().echange).toEqual({ uid: 'pc', nom: 'Renfort' });
  expect(store.getState().echanger('pc', 'equipe-2')).toBeNull();
  expect(store.getState().echange).toBeNull();
  expect(store.getState().equipe[2]!.pokemon.uid).toBe('pc');
  const region = JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees as DonneesRegion;
  expect(region.equipe[2]!.uid).toBe('pc');
  expect(region.pc[0]!.uid).toBe('equipe-2');
});

it('expose le multiplicateur du DPS et conserve la référence d’équipe entre les ticks', () => {
  const { store, avancer } = preparer();
  const equipe = store.getState().equipe;
  for (const membre of equipe.filter(Boolean)) {
    const detail = detailDps(membre!.pokemon, membre!.multiplicateur);
    expect(membre!.dps).toBeCloseTo(Object.values(detail).reduce((produit, valeur) => produit * valeur, 1));
  }
  avancer();
  expect(store.getState().equipe).toBe(equipe);
});

it('expose les 24 formes dans l’ordre, leurs accès et les badges au démarrage', () => {
  const { store, stockage } = preparer();
  const region = JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees as DonneesRegion;
  const { carte } = store.getState();
  expect(carte.formes).toHaveLength(24);
  expect(carte.formes.map(entree => entree.forme)).toEqual(kanto.carte.formes);
  const ouvertes = kanto.zonesOuvertes(etatMondeDe(region)).map(zone => zone.id);
  for (const entree of carte.formes) {
    expect(entree.nom).toBe(entree.forme.nom);
    expect(entree.zone).toBe(entree.forme.zone);
    expect(entree.numero).toBe(entree.zone === null ? null : kanto.zone(entree.zone).ancienId);
    expect(entree.ouverte).toBe(entree.zone !== null && ouvertes.includes(entree.zone));
    expect(entree.actuelle).toBe(entree.zone === region.zoneId);
    const acces = entree.zone === null || entree.ouverte ? null : kanto.accesZone(entree.zone, etatMondeDe(region));
    expect(entree.raison).toBe(acces && !acces.ok ? acces.raison ?? null : null);
  }
  expect(carte.formes.find(entree => entree.zone === 'kanto.route-1')).toMatchObject({ ouverte: true, actuelle: true, numero: 1 });
  expect(carte.formes.find(entree => entree.zone === 'kanto.foret-de-jade')).toMatchObject({ ouverte: false, raison: expect.any(String) });
  expect(carte.formes.find(entree => entree.nom === 'Lavanville')).toMatchObject({ zone: null, ouverte: false, raison: null });
  expect(carte.badges).toEqual({ obtenus: 0, total: 8 });
  expect(carte.nouvelles).toEqual([]);
  expect(carte.tutorielRoute1).toBe(false);
});

it('signale les zones débloquées jusqu’à voirCarte, sans sauvegarder cette mémoire', () => {
  const partie = preparerRegion(region => ({ ...region, etape: 10,
    badges: ['roche'], equipe: [{ ...region.equipe[0]!, niveau: 100 }] }));
  const { store, stockage } = partie;
  expect(store.getState().carte.badges).toEqual({ obtenus: 1, total: 8 });
  vaincre(partie);
  expect(store.getState().carte.nouvelles).toContain('kanto.foret-de-jade');
  expect(store.getState().carte.formes.find(entree => entree.zone === 'kanto.foret-de-jade')).toMatchObject({ ouverte: true, raison: null });
  const ecrire = vi.spyOn(stockage, 'ecrire');
  store.getState().arreter();
  expect(preparer(stockage).store.getState().carte.nouvelles).toEqual([]);
  ecrire.mockClear();
  store.getState().voirCarte();
  expect(store.getState().carte.nouvelles).toEqual([]);
  expect(ecrire).not.toHaveBeenCalled();
  store.getState().demarrer();
  partie.avancer();
  expect(store.getState().carte.nouvelles).toEqual([]);
});

it('déduit le tutoriel du Bourg Palette et de l’absence de boss vaincu', () => {
  const partie = preparerRegion(region => ({ ...region, etape: 10,
    equipe: [{ ...region.equipe[0]!, niveau: 100 }] }));
  const { store } = partie;
  store.getState().allerVers('kanto.bourg-palette');
  expect(store.getState().carte.tutorielRoute1).toBe(true);
  store.getState().allerVers('kanto.route-1');
  expect(store.getState().carte.tutorielRoute1).toBe(false);
  for (let i = 0; i < 10; i++) vaincre(partie);
  store.getState().allerVers('kanto.bourg-palette');
  expect(store.getState().carte.tutorielRoute1).toBe(false);
});

it('garde la même référence de carte entre deux ticks sans changement de carte', () => {
  const partie = preparer();
  const carte = partie.store.getState().carte;
  expect(carte).toBeDefined();
  partie.avancer();
  expect(partie.store.getState().carte).toBe(carte);
  partie.avancer();
  expect(partie.store.getState().carte).toBe(carte);
});

it('récompense chaque victoire et recharge exactement les niveaux, XP et argent sauvegardés', () => {
  const partie = preparerRegion(region => ({ ...region,
    equipe: region.equipe.map(pokemon => ({ ...pokemon, xp: 1000000 })) }));
  const ecrire = vi.spyOn(partie.stockage, 'ecrire');
  for (let morts = 1; morts <= 4; morts++) {
    const avant = partie.store.getState().equipe;
    vaincre(partie);
    partie.store.getState().equipe.forEach((membre, i) => {
      if (membre) expect(membre.pokemon.niveau).toBe(avant[i]!.pokemon.niveau + 1);
    });
    expect(partie.store.getState().annonce).toBe(`${avant.filter(Boolean).length} Pokémon montent de niveau !`);
    expect(partie.store.getState().argent).toBeGreaterThan(0);
    expect(ecrire).not.toHaveBeenCalled();
    partie.store.getState().fermer();
    expect(ecrire).toHaveBeenCalledTimes(2);
    const region = JSON.parse(partie.stockage.lire('pokiclicker:region:test:kanto')!).donnees;
    expect(region.statistiques.eliminations).toBe(morts);
    expect(region.argent).toBe(partie.store.getState().argent);
    expect(region.equipe).toEqual(partie.store.getState().equipe.filter(Boolean).map(m => m!.pokemon));
    ecrire.mockClear();
  }
  partie.store.getState().arreter();
  const rechargee = preparer(partie.stockage).store.getState();
  expect(rechargee.equipe).toEqual(partie.store.getState().equipe);
  expect(rechargee.argent).toBe(partie.store.getState().argent);
});

it('affiche la recherche pendant les 2 000 ms suivant une victoire et garde les références stables', () => {
  const partie = preparer();
  expect(partie.store.getState().enRecherche).toBe(false);
  vaincre(partie);
  expect(partie.store.getState().enRecherche).toBe(true);
  const { equipe, zoneSuivante, ennemi, etape } = partie.store.getState();
  for (let i = 0; i < 19; i++) partie.avancer();
  expect(partie.store.getState().enRecherche).toBe(true);
  expect(partie.store.getState().equipe).toBe(equipe);
  expect(partie.store.getState().zoneSuivante).toBe(zoneSuivante);
  partie.avancer();
  expect(partie.store.getState().enRecherche).toBe(false);
  expect(partie.store.getState().ennemi).toEqual(ennemi);
  expect(partie.store.getState().etape).toBe(etape);
});

it('annonce le surnom après une montée et efface le message après 1 200 ms de jeu', () => {
  const partie = preparerRegion(region => ({ ...region, equipe: [{ ...region.equipe[0]!,
    surnom: 'Compagnon', xp: calculerMaxXp(region.equipe[0]!.numero, region.equipe[0]!.niveau) - 1 }] }));
  const niveau = partie.store.getState().equipe[0]!.pokemon.niveau;
  vaincre(partie);
  expect(partie.store.getState().annonce).toBe(`Compagnon passe au niveau ${niveau + 1} !`);
  vi.advanceTimersByTime(1200);
  expect(partie.store.getState().annonce).toContain('passe au niveau');
  for (let i = 0; i < 11; i++) partie.avancer();
  expect(partie.store.getState().annonce).toContain('passe au niveau');
  partie.avancer();
  expect(partie.store.getState().annonce).toBeNull();
});

it('remplace une annonce récente et recommence sa durée complète', () => {
  const delaiInitial = reglages.delais.ennemiSuivantMs;
  try {
    reglages.delais.ennemiSuivantMs = 0;
    const partie = preparerRegion(region => ({ ...region,
      equipe: [{ ...region.equipe[0]!, niveau: 50, xp: 1000000, surnom: 'Compagnon' }] }));
    vaincre(partie);
    expect(partie.store.getState().annonce).toBe('Compagnon passe au niveau 51 !');
    reglages.delais.ennemiSuivantMs = 2000;
    vaincre(partie);
    expect(partie.store.getState().annonce).toBe('Compagnon passe au niveau 52 !');
    for (let i = 0; i < 11; i++) partie.avancer();
    expect(partie.store.getState().annonce).toBe('Compagnon passe au niveau 52 !');
    partie.avancer();
    expect(partie.store.getState().annonce).toBeNull();
  } finally { reglages.delais.ennemiSuivantMs = delaiInitial; }
});

it('expose un maximum d’XP nul au niveau 100', () => {
  const { store } = preparerRegion(region => ({ ...region,
    equipe: [{ ...region.equipe[0]!, niveau: 100, xp: 0 }] }));
  expect(store.getState().equipe[0]!.xpMax).toBe(0);
});

it.each([false, true])('accorde cinq bonbons au shiny et joint les annonces si montée : %s', montee => {
  const partie = preparerRegion(region => ({ ...region, equipe: [{ ...region.equipe[0]!,
    surnom: 'Compagnon', xp: montee ? calculerMaxXp(region.equipe[0]!.numero, region.equipe[0]!.niveau) - 1 : 0 }] }), () => 0);
  expect(partie.store.getState().ennemi?.shiny).toBe(true);
  const niveau = partie.store.getState().equipe[0]!.pokemon.niveau;
  vaincre(partie);
  expect(partie.store.getState().annonce).toBe(montee
    ? `Compagnon passe au niveau ${niveau + 1} ! · Chromatique ! +5 Bonbons` : 'Chromatique ! +5 Bonbons');
  partie.store.getState().fermer();
  const region = JSON.parse(partie.stockage.lire('pokiclicker:region:test:kanto')!).donnees;
  expect(region.inventaire.bonbon).toBe(5);
});

it('démarre et sauvegarde une nouvelle partie sans randomUUID', () => {
  const getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  vi.stubGlobal('crypto', { getRandomValues });
  const stockage = creerStockageMemoire();
  const store = creerStoreJeu({ horloge: creerHorlogeSimulee(), stockage, alea: () => .1, genererId: genererIdentifiant });
  stores.push(store);
  store.getState().demarrer();
  expect(store.getState().erreur).toBeNull();
  expect(store.getState().ennemi).not.toBeNull();
  expect(creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(), genererId: genererIdentifiant }).listerParties()[0]?.id)
    .toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
});
it('produit aussi un UUID v4 au dernier recours sans crypto', () => {
  vi.stubGlobal('crypto', undefined);
  expect(genererIdentifiant()).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
});
it('convertit le décor des données vers son fichier local', () => {
  expect(cheminDecor(kanto.zone('kanto.route-1'))).toBe('img/decors/route-1.webp');
});
it('applique le clic immédiatement mais publie les PV au prochain pas', () => {
  const { store, avancer } = preparer();
  const pv = store.getState().pv;
  const animation = vi.fn();
  store.abonnerDegats(animation);
  store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(1);
  expect(store.getState().pv).toBe(pv);
  avancer();
  expect(store.getState().pv).toBeCloseTo(pv - 5 - store.getState().dps / 10);
});
it('accepte douze clics par seconde et refuse le treizième', () => {
  const { store, avancer } = preparer();
  const animation = vi.fn();
  store.abonnerDegats(animation);
  for (let i = 0; i < 13; i++) store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(12);
  // Laisser le DPS achever le premier ennemi avant les 2 000 ms d’attente.
  for (let i = 0; i < 1000 && store.getState().etape === 1; i++) avancer(10);
  expect(store.getState().etape).toBe(2);
  for (let i = 0; i < 200; i++) avancer(10);
  store.getState().attaquer();
  expect(animation).toHaveBeenCalledTimes(13);
});
it('ne dépasse pas 100 notifications sur 1 000 ticks en dix secondes, même avec des clics', () => {
  const { store, avancer } = preparer();
  const notification = vi.fn();
  store.subscribe(notification);
  for (let i = 0; i < 1000; i++) { store.getState().attaquer(); avancer(10); }
  expect(notification.mock.calls.length).toBeLessThanOrEqual(101);
  expect(notification.mock.calls.length).toBe(100);
});
it('annonce une seule fois la fin, inscrit le boss et sauvegarde immédiatement', () => {
  const { store, avancer, stockage } = preparer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  let annonces = 0;
  store.subscribe((etat, avant) => { if (etat.annonce === 'Zone débloquée !' && etat.annonce !== avant.annonce) annonces++; });
  for (let i = 0; i < 2000 && store.getState().annonce !== 'Zone débloquée !'; i++) avancer();
  expect(annonces).toBe(1);
  expect(store.getState().annonce).toBe('Zone débloquée !');
  expect(store.getState().zoneSuivante).toEqual({ id: 'kanto.foret-de-jade', nom: 'Forêt de Jade', ouverte: true, raison: null });
  const region = JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).donnees;
  expect(region.bossVaincus).toEqual(['kanto.route-1']);
  expect(region.etape).toBe(1);
  for (let i = 0; i < 12; i++) avancer();
  expect(store.getState().annonce).toBeNull();
  expect(annonces).toBe(1);
  expect(ecrire).toHaveBeenCalledTimes(2);
  for (let i = 0; i < 2000; i++) avancer();
  expect(annonces).toBe(1);
});

it('sauvegarde les récompenses d’un boss déjà vaincu sans annoncer de déblocage', () => {
  const partie = preparerRegion(region => ({ ...region, etape: 10, bossVaincus: ['kanto.route-1'],
    equipe: [{ ...region.equipe[0]!, niveau: 100 }] }));
  const ecrire = vi.spyOn(partie.stockage, 'ecrire');
  vaincre(partie);
  expect(partie.store.getState().annonce).not.toBe('Zone débloquée !');
  expect(ecrire).toHaveBeenCalledTimes(2);
  const region = JSON.parse(partie.stockage.lire('pokiclicker:region:test:kanto')!).donnees;
  expect(region.argent).toBe(partie.store.getState().argent);
  expect(region.statistiques.eliminations).toBe(1);
  expect(region.bossVaincus).toEqual(['kanto.route-1']);
});

it('refuse une zone fermée sans écriture puis voyage dans les deux sens après le boss', () => {
  const partie = preparerRegion(region => ({ ...region, etape: 10,
    equipe: [{ ...region.equipe[0]!, niveau: 100 }] }));
  const { store, stockage } = partie;
  const revision = () => JSON.parse(stockage.lire('pokiclicker:region:test:kanto')!).revision;
  const avant = revision();
  expect(store.getState().zoneSuivante?.ouverte).toBe(false);
  store.getState().allerVers('kanto.foret-de-jade');
  expect(store.getState().zone?.id).toBe('kanto.route-1');
  expect(store.getState().etape).toBe(10);
  expect(revision()).toBe(avant);
  vaincre(partie);
  expect(store.getState().annonce).toBe('Zone débloquée !');
  expect(store.getState().zoneSuivante?.ouverte).toBe(true);
  const apresBoss = revision();
  store.getState().allerVers('kanto.foret-de-jade');
  expect(revision()).toBe(apresBoss + 1);
  expect(store.getState().etape).toBe(1);
  expect(store.getState().ennemi?.numero).toBe(kanto.zoneDeCombat('kanto.foret-de-jade').sauvages[0]!.pokemon);
  expect(store.getState().enRecherche).toBe(false);
  expect(store.getState().minuteur).toBeNull();
  expect(store.getState().annonce).toBeNull();
  expect(store.getState().zonePrecedente).toEqual({ id: 'kanto.route-1', nom: 'Route 1', ouverte: true, raison: null });
  store.getState().arreter();
  const rechargee = preparer(stockage);
  expect(rechargee.store.getState().zone?.id).toBe('kanto.foret-de-jade');
  expect(rechargee.store.getState().etape).toBe(1);
  rechargee.store.getState().allerVers('kanto.route-1');
  expect(rechargee.store.getState().zone?.id).toBe('kanto.route-1');
  expect(rechargee.store.getState().etape).toBe(1);
});

it('compte les 30 secondes du boss sans DPS et annonce son échec à l’expiration', () => {
  const partie = preparerRegion(region => ({ ...region, etape: 10, equipe: [] }));
  expect(partie.store.getState().minuteur).toEqual({ restantMs: 30000, totalMs: 30000 });
  for (let i = 1; i < 300; i++) {
    partie.avancer();
    expect(partie.store.getState().minuteur?.restantMs).toBe(30000 - i * 100);
  }
  partie.avancer();
  expect(partie.store.getState().minuteur).toBeNull();
  expect(partie.store.getState().etape).toBe(9);
  expect(partie.store.getState().annonce).toBe('Temps écoulé !');
  for (let i = 0; i < 12; i++) partie.avancer();
  expect(partie.store.getState().annonce).toBeNull();
});

it('reprend un boss neuf et masque son minuteur pendant la recherche', () => {
  const partie = preparerRegion(region => ({ ...region, etape: 10, equipe: [] }));
  partie.avancer(1000);
  partie.store.getState().fermer();
  partie.store.getState().arreter();
  expect(preparer(partie.stockage).store.getState().minuteur?.restantMs).toBe(30000);
  const recherche = preparerRegion(region => ({ ...region, etape: 9 }));
  vaincre(recherche);
  expect(recherche.store.getState().etape).toBe(10);
  expect(recherche.store.getState().minuteur).toBeNull();
  for (let i = 0; i < 20; i++) recherche.avancer();
  expect(recherche.store.getState().minuteur?.restantMs).toBe(30000);
});

it('séjourne à Bourg Palette sans combat et reprend sans réinitialiser le store', () => {
  const partie = preparer();
  partie.store.getState().allerVers('kanto.bourg-palette');
  const etat = partie.store.getState();
  expect(etat.lieu?.id).toBe('kanto.bourg-palette');
  expect(etat.lieu?.sansCombat && etat.lieu.message).toBeTruthy();
  expect(etat.zone).toBeNull();
  expect(etat.ennemi).toBeNull();
  expect(etat.minuteur).toBeNull();
  partie.avancer(7200000);
  expect(partie.store.getState().etape).toBe(1);
  expect(partie.store.getState().argent).toBe(etat.argent);
  partie.store.getState().arreter();
  const lire = vi.spyOn(partie.stockage, 'lire');
  partie.store.getState().demarrer();
  expect(lire).not.toHaveBeenCalled();
  partie.store.getState().arreter();
  const rechargee = preparer(partie.stockage);
  expect(rechargee.store.getState().lieu?.id).toBe('kanto.bourg-palette');
  expect(rechargee.store.getState().etape).toBe(1);
  expect(rechargee.store.getState().ennemi).toBeNull();
  expect(rechargee.store.getState().minuteur).toBeNull();
  rechargee.store.getState().allerVers('kanto.route-1');
  expect(rechargee.store.getState().ennemi).not.toBeNull();
});

it('rattrape le minuteur au même rythme que les DPS', () => {
  const modifier = (region: DonneesRegion) => ({ ...region, etape: 10, equipe: [] });
  const groupe = preparerRegion(modifier);
  const pas = preparerRegion(modifier);
  groupe.avancer(30000);
  for (let i = 0; i < 300; i++) pas.avancer();
  expect(groupe.store.getState().etape).toBe(pas.store.getState().etape);
  expect(groupe.store.getState().annonce).toBe(pas.store.getState().annonce);
  expect(groupe.store.getState().minuteur).toEqual(pas.store.getState().minuteur);
});
it('restaure la zone, l’étape et toute l’équipe avec un nouvel ennemi', () => {
  const premier = preparer();
  while (premier.store.getState().etape < 4) premier.avancer();
  premier.avancer();
  premier.store.getState().fermer();
  premier.store.getState().arreter();
  const second = preparer(premier.stockage);
  expect(second.store.getState().zone?.id).toBe(premier.store.getState().zone?.id);
  expect(second.store.getState().etape).toBe(4);
  expect(second.store.getState().equipe).toEqual(premier.store.getState().equipe);
  expect(second.store.getState().equipe.filter(Boolean).map(m => m!.pokemon)).toEqual(equipeDeDepart().map((pokemon, i) => {
    const actuel = premier.store.getState().equipe[i]!.pokemon;
    return { ...pokemon, niveau: actuel.niveau, xp: actuel.xp, bonheur: actuel.bonheur };
  }));
  expect(second.store.getState().argent).toBe(premier.store.getState().argent);
  expect(second.store.getState().pv).toBe(second.store.getState().ennemi?.pvMax);
});
it('n’écrit rien pour les seuls PV modifiés et sauvegarde un changement après trente secondes', () => {
  const { store, stockage, avancer } = preparer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  store.getState().attaquer();
  store.getState().fermer();
  expect(ecrire).not.toHaveBeenCalled();
  while (store.getState().etape < 2) avancer();
  vi.advanceTimersByTime(29999);
  expect(ecrire).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(ecrire).toHaveBeenCalledTimes(2);
  store.getState().fermer();
  expect(ecrire).toHaveBeenCalledTimes(2);
});
it.each(['pagehide', 'visibilitychange'])('enregistre à %s et retire les écouteurs à l’arrêt', evenement => {
  const { store, stockage, avancer } = preparer();
  while (store.getState().etape < 2) avancer();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  if (evenement === 'pagehide') window.dispatchEvent(new Event(evenement));
  else {
    const visible = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event(evenement));
    visible.mockRestore();
  }
  expect(ecrire).toHaveBeenCalledTimes(2);
  while (store.getState().etape < 3) avancer();
  store.getState().arreter();
  window.dispatchEvent(new Event('pagehide'));
  vi.advanceTimersByTime(60000);
  expect(ecrire).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
it('bloque toute écriture après un conflit avec une autre fenêtre', () => {
  const { store, stockage, horloge, avancer } = preparer();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'autre' });
  const region = gestionnaire.chargerRegion('test', 'kanto')!;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region.donnees, etape: 5 });
  const intact = stockage.lire('pokiclicker:region:test:kanto');
  const ecrire = vi.spyOn(stockage, 'ecrire');
  while (store.getState().etape < 2) avancer();
  store.getState().fermer();
  avancer();
  expect(store.getState().erreur).toBe(ERREUR_CONFLIT);
  store.getState().fermer();
  vi.advanceTimersByTime(30000);
  expect(ecrire).not.toHaveBeenCalled();
  expect(stockage.lire('pokiclicker:region:test:kanto')).toBe(intact);
});
it.each(['corrompue', 'récente', 'bloquée'])('préserve une sauvegarde %s', cas => {
  const premier = preparer();
  premier.store.getState().arreter();
  const cle = 'pokiclicker:region:test:kanto';
  if (cas === 'corrompue') premier.stockage.ecrire(cle, '{ sauvegarde abîmée');
  if (cas === 'récente') {
    const enveloppe = JSON.parse(premier.stockage.lire(cle)!);
    premier.stockage.ecrire(cle, JSON.stringify({ ...enveloppe, version: 999 }));
  }
  const avant = premier.stockage.lire(cle);
  const ecrire = vi.spyOn(premier.stockage, 'ecrire');
  const lire = cas === 'bloquée' ? vi.spyOn(premier.stockage, 'lire').mockImplementation(() => { throw new Error('stockage bloqué'); }) : null;
  const second = preparer(premier.stockage);
  expect(second.store.getState().erreurChargement).toBe(true);
  second.store.getState().fermer();
  expect(ecrire).not.toHaveBeenCalled();
  lire?.mockRestore();
  expect(premier.stockage.lire(cle)).toBe(avant);
});
