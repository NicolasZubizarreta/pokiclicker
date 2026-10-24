import { describe, expect, it } from 'vitest';
import { creerGestionnaire, creerStockageMemoire } from '../src/core/sauvegarde';
import { creerHorlogeSimulee } from '../src/core/clock';

function monde() {
  const base = creerStockageMemoire();
  const journal: string[] = [];
  const stockage = {
    lire: (c: string) => base.lire(c),
    ecrire: (c: string, v: string) => { journal.push(`E ${c}`); base.ecrire(c, v); },
    supprimer: (c: string) => { journal.push(`S ${c}`); base.supprimer(c); },
    cles: () => base.cles(),
  };
  let n = 0;
  const g = creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(1_760_000_000_000), genererId: () => `p${++n}` });
  const instantane = () => JSON.stringify(base.cles().sort().map(c => [c, base.lire(c)]));
  return { g, base, journal, instantane };
}

describe('sauvegarde : essais abusifs (lecture, version future, JSON cassé, import)', () => {
  it('lire ne modifie jamais le stockage', () => {
    const { g, journal } = monde();
    const p = g.creerPartie('A');
    journal.length = 0;
    g.chargerPartie(p.id); g.chargerRegion(p.id, 'kanto'); g.listerParties(); g.exporterPartie(p.id); g.chargerCompte();
    expect(journal).toEqual([]);
  });

  it('version 99 : refus exact et chaîne inchangée, en lecture comme en écriture', () => {
    const { g, base, instantane } = monde();
    const p = g.creerPartie('A');
    const cle = `pokiclicker:partie:${p.id}`;
    const faux = JSON.stringify({ ...JSON.parse(base.lire(cle)!), version: 99 });
    base.ecrire(cle, faux);
    const avant = instantane();
    expect(() => g.chargerPartie(p.id)).toThrow('Cette sauvegarde vient d\'une version plus récente du jeu.');
    expect(() => g.ecrirePartie(p.id, JSON.parse(faux).donnees)).toThrow('Cette sauvegarde vient d\'une version plus récente du jeu.');
    expect(instantane()).toBe(avant);
  });

  it('JSON tronqué : message français, rien ne change', () => {
    const { g, base, instantane } = monde();
    const p = g.creerPartie('A');
    const cle = `pokiclicker:partie:${p.id}`;
    base.ecrire(cle, base.lire(cle)!.slice(0, 40));
    const avant = instantane();
    expect(() => g.chargerPartie(p.id)).toThrow(/illisible/);
    expect(instantane()).toBe(avant);
  });

  it('import corrompu ou à moitié valide : aucune écriture', () => {
    const { g, journal, instantane } = monde();
    const p = g.creerPartie('A');
    const bon = JSON.parse(g.exporterPartie(p.id));
    const avant = instantane();
    journal.length = 0;
    const casse = JSON.parse(JSON.stringify(bon));
    casse.regions[0].donnees.argent = -5;
    for (const texte of ['{"format":', '', 'null', '[]', JSON.stringify(casse), JSON.stringify({ ...bon, version: 99 }),
      JSON.stringify({ ...bon, regions: [...bon.regions, { nimporte: 'quoi' }] })]) {
      expect(() => g.importerPartie(texte)).toThrow(/sauvegarde de partie valide|plus récente/);
    }
    expect(journal).toEqual([]);
    expect(instantane()).toBe(avant);
  });

  it('aller-retour complet avec équipe et inventaire, nouvel id', () => {
    const { g } = monde();
    const p = g.creerPartie('A');
    const r = g.chargerRegion(p.id, 'kanto')!;
    const donnees = { ...r.donnees, argent: 1234.5, inventaire: { pokeball: 12 },
      equipe: [{ uid: 'u1', numero: 25, niveau: 12, xp: 30, shiny: true, bonheur: 40, pierreEternelle: false, calcium: 2, surnom: 'Éclair', sexe: 'male' as const, favori: false }] };
    g.ecrireRegion(p.id, 'kanto', donnees);
    const { id } = g.importerPartie(g.exporterPartie(p.id));
    expect(id).not.toBe(p.id);
    expect(g.chargerRegion(id, 'kanto')!.donnees).toEqual(donnees);
    expect(g.exporterPartie(id)).not.toMatch(/mail|"compte"|local/i);
  });

  it('supprimer une partie ne touche pas les autres', () => {
    const { g } = monde();
    const a = g.creerPartie('A'); const b = g.creerPartie('B');
    g.supprimerPartie(a.id);
    expect(g.listerParties().map(x => x.id)).toEqual([b.id]);
    expect(g.chargerRegion(b.id, 'kanto')).not.toBeNull();
  });
});
