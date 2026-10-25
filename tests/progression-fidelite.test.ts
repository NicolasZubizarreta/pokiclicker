import { describe, expect, it } from 'vitest';
import fixture from './fixtures/v1-badges.json';
import donneesZones from '../data/regions/kanto/zones.json';
import { actifsDe, accorderJalons, badgeDeZone, chargerBadges, chargerJalons } from '../src/core/progression';
import { calculerClic, calculerDpsEquipe } from '../src/core/combat';
import { calculerOr, calculerXp, delaiEnnemiSuivant, type Victoire } from '../src/core/recompenses';
import { chanceCapture } from '../src/core/capture';
import { chargerObjets, prixObjet } from '../src/core/boutique';
import type { DonneesRegion } from '../src/core/sauvegarde-types';

const zones = donneesZones.zones;

function region(badges: string[] = [], jalonsRecus: number[] = []): DonneesRegion {
  return {
    regionId: 'kanto', zoneId: zones[0]!.id, etape: 1, equipe: [], badges, jalonsRecus,
    bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [], evenementsJoues: [],
    argent: 123, inventaire: { bonbon: 2, omniExp: 0, shinyToken: 3, masterball: 4 },
    ligueGagnee: 0, pc: [], ameliorations: [], starterId: null,
    statistiques: { eliminations: 0, argentTotalGagne: 456 },
    chronos: { finRepousse: 0, finSuperRepousse: 0, finBoostAttaque: 0,
      finBoostAttaqueSpeciale: 0, rechargeFauchage: 0 },
    pension: { parents: [], oeufs: [], emplacementsOeuf: 0 }, jetons: 0,
    arretAuto: { commun: false, peuCommun: false, rare: false, tresRare: false,
      legendaire: false, shiny: false, nouveau: false },
  };
}

const equipe = fixture.equipe.map(p => ({ numero: p.id, niveau: p.level,
  bonheur: p.happiness, oeuf: p.isEgg, shiny: false, calcium: 0 }));
const cible = fixture.cible;
const victoire: Victoire = { numero: cible.id, niveau: cible.level,
  shiny: cible.isShiny, rarete: 'commun', boss: false };
const objet = chargerObjets().find(o => o.id === fixture.consommable)!;
const balles: Record<string, string> = { poke: 'pokeball', great: 'superball',
  ultra: 'hyperball', master: 'masterball' };
const corrections: Record<string, string> = {
  'Vitesse de spawn +20%': "Vitesse d'apparition +20%",
  'Spawn +20%': 'Apparition +20%', '+2,500 $P': '+2 500 pièces',
  'Jeton Brillant': 'Jeton Shiny', 'Kanto Master': 'Maître de Kanto',
  'Shop -15%': 'Boutique -15%',
};
const corriger = (texte: string) => corrections[texte] ?? texte;

describe('progression : fidélité V1 de bout en bout', () => {
  it.each(fixture.jeux)('rejoue badges=$badges et paliers=$paliers', jeu => {
    const entree = region(jeu.badges, jeu.paliers);
    const avant = structuredClone(entree);
    const actifs = actifsDe(entree);
    const dps = calculerDpsEquipe(equipe, { numero: cible.id }, actifs);
    expect(dps).toBe(jeu.dps);
    expect(calculerClic(dps, actifs)).toBe(jeu.clic);
    for (const [mode, boss] of [['sauvage', false], ['boss', true]] as const) {
      expect(calculerOr({ ...victoire, boss }, actifs)).toBe(jeu.or[mode]);
      expect(calculerXp({ ...victoire, boss }, actifs)).toBe(jeu.xp[mode]);
    }
    // V1 exprime la chance en pourcentage ; V2 renvoie une probabilité.
    expect(chanceCapture({ capture: cible.catchRate, pv: cible.hp,
      pvMax: cible.maxHp, niveau: cible.level }, balles[fixture.balle]!, actifs) * 100).toBe(jeu.chance);
    expect(delaiEnnemiSuivant(actifs)).toBe(jeu.delai);
    expect(prixObjet(objet, { badges: entree.badges.length,
      palier: entree.jalonsRecus.includes(70) })).toBe(jeu.prix);
    expect(entree).toEqual(avant);
  });

  it.each(fixture.attribution)('attribue les badges de la zone V1 $zoneIdx', cas => {
    const zone = zones.find(z => z.ancienId === cas.zoneIdx)!;
    const badge = badgeDeZone(zone.id);
    expect(badge ? [badge.nom] : []).toEqual(cas.badges);
    if (badge) expect(zone.type).toBe('arene');
  });

  it.each(fixture.paliers)('accorde les paliers à $nombre espèces (saut=$saut)', cas => {
    const entree = region([], cas.avant);
    const avant = structuredClone(entree);
    const resultat = accorderJalons(entree, cas.nombre);
    expect(resultat.recus.map(j => j.palier)).toEqual(cas.recus);
    expect(resultat.region.jalonsRecus).toEqual([...cas.avant, ...cas.recus]);
    expect(resultat.region.argent - entree.argent).toBe(cas.argent);
    for (const [cleV1, delta] of Object.entries(cas.inventaire)) {
      const cle = cleV1 === 'candy' ? 'bonbon' : cleV1;
      expect(resultat.region.inventaire[cle]! - entree.inventaire[cle]!).toBe(delta);
    }
    expect(resultat.region.ameliorations).toEqual(cas.recus.includes(151) ? ['shinyCharm'] : []);
    expect(resultat.region.statistiques).toEqual(entree.statistiques);
    expect(entree).toEqual(avant);
    expect(accorderJalons(resultat.region, cas.nombre).region).toBe(resultat.region);
    expect(accorderJalons(resultat.region, cas.nombre).recus).toEqual([]);
  });

  it('conserve les données V1 avec les corrections de texte prévues', () => {
    const badges = chargerBadges();
    expect(badges).toHaveLength(fixture.BADGES.length);
    fixture.BADGES.forEach((source, i) => {
      const badge = badges[i]!;
      expect(badge.id).toBe(fixture.jeux[i]!.badges[0]);
      expect(badge.nom).toBe(source.name);
      expect(badge.description).toBe(corriger(source.desc));
      expect(badge.ordre).toBe(source.id);
      expect(badge.zone).toBe(zones.find(z => z.ancienId === source.zoneIdx)!.id);
      expect(badge.image).toBe(`img/badges/${badge.id}.png`);
    });
    const jalons = chargerJalons();
    expect(jalons).toHaveLength(fixture.MILESTONES.length);
    fixture.MILESTONES.forEach((source, i) => {
      expect(jalons[i]!.palier).toBe(source.count);
      expect(jalons[i]!.titre).toBe(corriger(source.title));
      expect(jalons[i]!.description).toBe(corriger(source.desc));
    });
  });

  it('cumule la remise du palier 70 et le gain du badge Prisme', () => {
    const reference = fixture.jeux.find(j => j.badges[0] === 'prisme')!;
    const sansPalier = region(reference.badges);
    const avecPalier = region(reference.badges, [70]);
    expect(prixObjet(objet, { badges: sansPalier.badges.length, palier: false })).toBe(reference.prix);
    expect(prixObjet(objet, { badges: avecPalier.badges.length,
      palier: avecPalier.jalonsRecus.includes(70) })).toBe(Math.floor(reference.prix * 0.85));
    for (const entree of [sansPalier, avecPalier]) {
      expect(calculerOr(victoire, actifsDe(entree))).toBe(reference.or.sauvage);
      expect(calculerOr({ ...victoire, boss: true }, actifsDe(entree))).toBe(reference.or.boss);
    }
  });
});
