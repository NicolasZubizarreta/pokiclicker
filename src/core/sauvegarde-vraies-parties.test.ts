import { describe, expect, it } from 'vitest';
import { kanto } from './regions';
import { compteInitial, creerGestionnaire, creerStockageMemoire, partieInitiale, regionInitiale, VERSION_ACTUELLE } from './sauvegarde';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { validerEnveloppe } from './sauvegarde-validation';
import { sexeEspece } from './sexe';
import { reglages } from './reglages';

// Incident de production du 20/11 : une vraie sauvegarde (35 h de jeu, Pokédex shiny/éclos complet à la pension)
// n'est jamais refusée pour une règle « douce ». Chaque cas part d'un état légitime ou d'un défaut réparable.
const enveloppe = <D>(niveau: 'compte' | 'partie' | 'region', id: string, donnees: D, version = VERSION_ACTUELLE) =>
  ({ version, niveau, id, revision: 7, ecritLe: '2026-11-18T10:00:00.000Z', donnees });
const pokemon = (uid: string, numero = 25, extra: Partial<PokemonPossede> = {}): PokemonPossede => {
  const sexe = sexeEspece(numero);
  return { uid, numero, niveau: 50, xp: 10, shiny: false, bonheur: 100, pierreEternelle: false, calcium: 5, favori: false,
    sexe: sexe === 'aleatoire' ? 'male' : sexe, ...extra };
};
const horloge = { maintenant: () => 0, dateUtc: () => '2026-11-18T10:00:00.000Z' } as unknown as Parameters<typeof creerGestionnaire>[0]['horloge'];
const base = (): DonneesRegion => ({ ...regionInitiale('kanto', kanto.depart), equipe: [pokemon('e1'), pokemon('e2', 6)] });
const toutes = (): number[] => Array.from({ length: reglages.pension.especesTirees }, (_, i) => i + 1);

const cas: [string, (r: DonneesRegion) => void][] = [
  ['PC de 12 000 Pokémon (pension à répétition)', r => { r.pc = Array.from({ length: 12_000 }, (_, i) => pokemon(`pc${i}`, (i % 151) + 1)); }],
  ['Pokédex shiny et éclos complet (151 espèces)', r => { r.especesShiny = toutes(); r.especesEcloses = toutes(); r.especesEclosesShiny = toutes(); }],
  ['espèces chromatiques en double', r => { r.especesShiny = [1, 2, 2, 3]; r.especesEclosesShiny = [4, 4]; }],
  ['espèces écloses en double', r => { r.especesEcloses = [1, 1, 2]; }],
  ['espèce éclose hors catalogue', r => { r.especesEcloses = [1, 2, 500]; r.especesShiny = [0, 3]; }],
  ['niveau, calcium, bonheur au-delà du maximum', r => { r.equipe[0]!.niveau = 9999; r.equipe[0]!.calcium = 9999; r.equipe[0]!.bonheur = 9999; }],
  ['sexe incompatible avec l\'espèce', r => { r.pc = [pokemon('x', 29, { sexe: 'male' }), pokemon('y', 32, { sexe: 'femelle' })]; }],
  ['surnom trop long', r => { r.equipe[0]!.surnom = 'N'.repeat(80); }],
  ['surnom vide', r => { r.equipe[0]!.surnom = '   '; }],
  ['starter hors des trois de départ', r => { r.starterId = 25; }],
  ['pension : plus d\'œufs que d\'emplacements', r => {
    r.pension = { parents: [], emplacementsOeuf: 1, oeufs: [1, 2, 3].map(n => pokemon(`o${n}`, n, { oeuf: { pasRestants: 5, pasMax: 50 } })) };
  }],
  ['pension : trop d\'emplacements', r => { r.pension.emplacementsOeuf = 40; }],
  ['pension : trois parents', r => { r.pension.parents = [pokemon('p1'), pokemon('p2'), pokemon('p3')]; }],
  ['œuf : pas restants au-dessus du maximum', r => { r.pc = [pokemon('o', 1, { oeuf: { pasRestants: 80, pasMax: 50 } })]; }],
  ['champ inconnu laissé par une autre version', r => { (r as unknown as Record<string, unknown>).ancienChamp = 3; (r.equipe[0] as unknown as Record<string, unknown>).truc = true; }],
  ['listes de tutoriels et d\'annonces longues', r => { r.tutosVus = Array.from({ length: 200 }, (_, i) => `t${i}`); r.annoncesVues = Array.from({ length: 300 }, (_, i) => `a${i}`); }],
  ['identifiant de plus de 64 caractères', r => { r.inventaire = { ['x'.repeat(80)]: 3, 'a:b': 1 }; }],
  ['texte de plus de 200 caractères', r => { r.drapeaux = ['d'.repeat(300)]; r.quetes = ['q'.repeat(250)]; }],
  ['blackjack en cours incohérent', r => { r.blackjackEnCours = { phase: 'jeu', mains: [], active: 4, croupier: ['A-S'], assurance: 0 }; }],
  ['sabot de blackjack incohérent', r => { r.sabotBlackjack = ['A-S', 'ZZ', '1-X']; }],
  ['plus ou moins : carte hors rang', r => { r.plusOuMoinsCarte = 99; }],
  ['événement en cours inconnu, étape négative', r => { r.evenementEnCours = { id: 'inconnu', etape: -1, file: ['a'.repeat(100)] }; }],
  ['date de diplôme invalide', r => { r.diplomeLe = '12/11/2026'; }],
  ['étape et zone inconnues', r => { r.zoneId = 'kanto.zone-supprimee'; r.etape = 9999; }],
  ['argent et jetons au-delà des plafonds, décimaux', r => { r.argent = 1e15 + 0.5; r.jetons = 1e12; r.statistiques.argentTotalGagne = 12.7; }],
  ['durées négatives ou décimales', r => { r.chronos.finRepousse = -5; r.chronos.rechargeFauchage = 1.5; }],
  ['uid dupliqué dans la région', r => { r.pc = [pokemon('e1'), pokemon('e1')]; }],
  ['bossVaincus, badges, objets clés en double ou trop nombreux', r => {
    r.bossVaincus = Array.from({ length: 200 }, (_, i) => `b${i % 70}`); r.badges = Array.from({ length: 50 }, (_, i) => `badge${i}`);
  }],
  ['starter nul', r => { r.starterId = null; }],
  ['pokémon avec xp décimale et niveau nul', r => { r.equipe[0]!.xp = 12.5; r.equipe[0]!.niveau = 0; }],
];

describe('une vraie région n\'est jamais refusée pour une règle douce', () => {
  it.each(cas)('%s', (_nom, modifier) => {
    const region = base();
    modifier(region);
    expect(() => validerEnveloppe(enveloppe('region', 'kanto', region), 'region')).not.toThrow();
  });
  it('les versions antérieures des fixtures restent lisibles', () => {
    for (const version of [1, 2, 3, 4]) expect(() => validerEnveloppe(enveloppe('region', 'kanto', base(), version), 'region')).not.toThrow();
  });
});

describe('partie et compte', () => {
  const partie = () => partieInitiale('Nuzlocke');
  const casPartie: [string, (p: ReturnType<typeof partie>) => void][] = [
    ['nom de partie trop long ou vide', p => { p.nom = 'N'.repeat(300); }],
    ['nom blanc', p => { p.nom = '   '; }],
    ['région courante non débloquée', p => { p.regionCourante = 'johto'; }],
    ['région débloquée inconnue', p => { p.regionsDebloquees = [...p.regionsDebloquees, 'atlantide']; }],
    ['PC global de 12 000 Pokémon', p => { p.pcGlobal = Array.from({ length: 12_000 }, (_, i) => pokemon(`g${i}`, (i % 151) + 1)); }],
    ['Pokédex national en double ou hors catalogue', p => { p.pokedexNational = [...toutes(), ...toutes(), 400]; p.vus = [...toutes(), 0.5 as number]; }],
    ['champ inconnu dans les statistiques', p => { (p.statistiques as Record<string, unknown>).autre = 1; }],
    ['uid en double dans le PC global', p => { p.pcGlobal = [pokemon('u'), pokemon('u')]; }],
  ];
  it.each(casPartie)('%s', (_nom, modifier) => {
    const p = partie();
    modifier(p);
    expect(() => validerEnveloppe(enveloppe('partie', 'p1', p), 'partie')).not.toThrow();
  });
  it('compte : champs inconnus, listes en double, préférences partielles', () => {
    const c = { ...compteInitial(), succes: ['a', 'a', 'b'], autre: 1 } as unknown as Record<string, unknown>;
    (c.preferences as Record<string, unknown>) = { sombre: true, ancienneOption: 3, arretAuto: undefined };
    expect(() => validerEnveloppe(enveloppe('compte', 'local', c), 'compte')).not.toThrow();
  });
});

describe('installation d\'une version du serveur', () => {
  const installer = (modifier: (r: DonneesRegion, p: ReturnType<typeof partieInitiale>) => void, versionRegion = VERSION_ACTUELLE) => {
    const stockage = creerStockageMemoire();
    const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'x' });
    const region = base();
    const partie = partieInitiale('Nuzlocke');
    modifier(region, partie);
    gestionnaire.installerVersion({ compte: enveloppe('compte', 'local', compteInitial()),
      partie: enveloppe('partie', 'p1', partie), regions: [enveloppe('region', 'kanto', region, versionRegion)] });
    return gestionnaire;
  };
  it('uid partagé entre la région et le PC global', () => {
    expect(() => installer((r, p) => { p.pcGlobal = [pokemon('e1')]; })).not.toThrow();
  });
  it('uid partagé dans la même région', () => {
    expect(() => installer(r => { r.pc = [pokemon('e1')]; })).not.toThrow();
  });
  it('les uid sont distincts après relecture', () => {
    const g = installer((r, p) => { r.pc = [pokemon('e1')]; p.pcGlobal = [pokemon('e1')]; });
    const partie = g.chargerPartie('p1')!;
    const region = g.chargerRegion('p1', 'kanto')!;
    const uids = [...partie.donnees.pcGlobal, ...region.donnees.equipe, ...region.donnees.pc].map(x => x.uid);
    expect(new Set(uids).size).toBe(uids.length);
  });
  it('région d\'une ancienne version (champs plus récents absents)', () => {
    const g = creerGestionnaire({ stockage: creerStockageMemoire(), horloge, genererId: () => 'x' });
    const ancienne = { ...base() } as Record<string, unknown>;
    for (const cle of ['pc', 'ameliorations', 'jalonsRecus', 'starterId', 'statistiques', 'chronos', 'pension', 'jetons', 'arretAuto']) delete ancienne[cle];
    expect(() => g.installerVersion({ partie: enveloppe('partie', 'p1', partieInitiale('A')),
      regions: [enveloppe('region', 'kanto', ancienne as unknown as DonneesRegion, 1)] })).not.toThrow();
  });
  it('PC de 12 000 Pokémon : installation puis lecture', () => {
    const g = installer(r => { r.pc = Array.from({ length: 12_000 }, (_, i) => pokemon(`pc${i}`, (i % 151) + 1)); });
    expect(g.chargerRegion('p1', 'kanto')!.donnees.pc).toHaveLength(12_000);
  });
});
