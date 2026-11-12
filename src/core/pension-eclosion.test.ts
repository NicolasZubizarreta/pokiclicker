import { describe, expect, it } from 'vitest';
import { ECARTS_ECLOSION_V1 } from '../../tests/ecarts-v1';
import { calculerDpsEquipe } from './combat';
import { detailDps, envoyerAuPc, placerDansEquipe } from './equipe';
import { evoluer } from './evolution';
import { avancerOeuf, especesEcloses, nombreEspecesEcloses, noterEclosion, pondre } from './pension';
import { appliquerVictoire } from './recompenses';
import { reglages } from './reglages';
import { compteInitial, regionInitiale, validerDonneesRegion, versMembreEquipe } from './sauvegarde';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { appliquerCapture } from './capture';
import { mesuresDe, paliersDeMesure, registreSucces, succesAccordes } from './succes';
import { calculerDps } from './stats';

const victoire = { numero: 19, niveau: 5, shiny: false, boss: false, rarete: null } as const;
const pokemon = (numero: number, extra: Partial<PokemonPossede> = {}): PokemonPossede => ({
  uid: `p${numero}`, numero, niveau: 20, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0,
  sexe: 'male', favori: false, ...extra,
});
const oeuf = (numero: number, pasRestants = 1): PokemonPossede => pokemon(numero, {
  uid: `oeuf-${numero}`, niveau: 1, oeuf: { pasRestants, pasMax: reglages.pension.pasEclosion },
});
function regionAvec(equipe: PokemonPossede[]): DonneesRegion {
  return { ...regionInitiale('kanto', 'kanto.route-1'), equipe };
}

describe('marque d’éclosion', () => {
  it('est donnée à l’éclosion, jamais avant', () => {
    expect(avancerOeuf(oeuf(4, 2)).marqueEclosion).toBeUndefined();
    const ne = avancerOeuf(oeuf(4, 1));
    expect(ne.oeuf).toBeUndefined();
    expect(ne.marqueEclosion).toBe(true);
  });

  it('n’est donnée ni par la ponte, ni par la capture, ni par l’équipe de départ', () => {
    const region = regionAvec([pokemon(25)]);
    region.bossVaincus = ['kanto.tour-pokemon'];
    region.pension.parents = [pokemon(25, { sexe: 'femelle' }), pokemon(25, { uid: 'm', sexe: 'male' })];
    const pondu = pondre(region, () => 0, () => 'oeuf-neuf');
    expect(pondu.pension.oeufs).toHaveLength(1);
    expect(pondu.pension.oeufs[0]).not.toHaveProperty('marqueEclosion');
    const capture = appliquerCapture(regionAvec([pokemon(25)]), victoire, [], () => 0.3, () => 'cap').region;
    expect(capture.equipe.find(p => p.uid === 'cap')).toBeDefined();
    expect(capture.equipe.find(p => p.uid === 'cap')).not.toHaveProperty('marqueEclosion');
  });

  it('ajoute 5 % aux dégâts propres, en facteur comme le Calcium, valeur lue dans les réglages', () => {
    expect(reglages.pension.marqueEclosion).toBe(0.05);
    const sans = calculerDps({ numero: 25, niveau: 30, calcium: 10 });
    const avec = calculerDps({ numero: 25, niveau: 30, calcium: 10, marqueEclosion: true });
    expect(avec / sans).toBeCloseTo(1.05, 10);
    expect(calculerDps({ numero: 25, niveau: 30, marqueEclosion: false })).toBe(calculerDps({ numero: 25, niveau: 30 }));
    expect(detailDps(pokemon(25, { marqueEclosion: true }), 1).marqueEclosion).toBeCloseTo(1.05, 10);
    expect(detailDps(pokemon(25), 1).marqueEclosion).toBe(1);
  });

  it('compte dans le DPS de l’équipe', () => {
    const base = calculerDpsEquipe([versMembreEquipe(pokemon(25))], { numero: 129 });
    const marque = calculerDpsEquipe([versMembreEquipe(pokemon(25, { marqueEclosion: true }))], { numero: 129 });
    expect(marque / base).toBeCloseTo(1.05, 10);
  });

  it('survit à l’évolution et au déplacement', () => {
    const region = regionAvec([pokemon(1, { marqueEclosion: true, niveau: 50 }), pokemon(4, { uid: 'autre' })]);
    const evolue = evoluer(region, 'p1');
    expect(evolue.ok).toBe(true);
    if (!evolue.ok) throw new Error(evolue.raison);
    const apres = evolue.region.equipe.find(p => p.uid === 'p1')!;
    expect(apres.numero).toBe(2);
    expect(apres.marqueEclosion).toBe(true);
    const range = envoyerAuPc(evolue.region, 'p1');
    expect(range.ok).toBe(true);
    if (!range.ok) throw new Error(range.raison);
    expect(range.region.pc.find(p => p.uid === 'p1')?.marqueEclosion).toBe(true);
    const revenu = placerDansEquipe(range.region, 'p1');
    expect(revenu.ok).toBe(true);
    if (!revenu.ok) throw new Error(revenu.raison);
    expect(revenu.region.equipe.find(p => p.uid === 'p1')?.marqueEclosion).toBe(true);
  });
});

describe('espèces écloses', () => {
  it('une éclosion note l’espèce, deux éclosions de la même la comptent une fois', () => {
    const r1 = appliquerVictoire(regionAvec([pokemon(25), oeuf(4), oeuf(4)]), victoire).region;
    expect(r1.especesEcloses).toEqual([4]);
    const r2 = appliquerVictoire(regionAvec([pokemon(25), oeuf(7)]), victoire).region;
    const r3 = appliquerVictoire({ ...r2, equipe: [...r2.equipe, oeuf(4)] }, victoire).region;
    expect(r3.especesEcloses).toEqual([7, 4]);
    expect(nombreEspecesEcloses(noterEclosion(r3, 4))).toBe(2);
    expect(especesEcloses(r3)).toEqual([7, 4]);
  });

  it('un œuf pas encore éclos ou un Pokémon capturé ne compte pas', () => {
    const region = appliquerVictoire(regionAvec([pokemon(25), oeuf(4, 3)]), victoire).region;
    expect(region.especesEcloses).toBeUndefined();
    expect(nombreEspecesEcloses(region)).toBe(0);
  });

  it('ne touche pas la région sans éclosion et ne mute rien', () => {
    const region = regionAvec([pokemon(25), oeuf(4)]);
    const avant = structuredClone(region);
    appliquerVictoire(region, victoire);
    expect(region).toEqual(avant);
  });

  it('les paliers 10, 50, 100 et 151 se débloquent aux seuils exacts, une fois par compte', () => {
    const seuils = [10, 50, 100, 151];
    let compte = compteInitial();
    const diamants: number[] = [];
    for (const seuil of seuils) {
      const juste = Array.from({ length: seuil - 1 }, (_, i) => i + 1);
      const region = { ...regionInitiale('kanto', 'kanto.route-1'), especesEcloses: juste };
      const avant = succesAccordes(registreSucces, compte, mesuresDe(region, []));
      expect(avant.nouveaux.filter(s => s.id === `eclosions-${seuil}`)).toEqual([]);
      const pile = { ...region, especesEcloses: [...juste, seuil] };
      const apres = succesAccordes(registreSucces, avant.compte, mesuresDe(pile, []));
      expect(apres.nouveaux.map(s => s.id)).toContain(`eclosions-${seuil}`);
      const encore = succesAccordes(registreSucces, apres.compte, mesuresDe(pile, []));
      expect(encore.nouveaux).toEqual([]);
      diamants.push(registreSucces.find(s => s.id === `eclosions-${seuil}`)!.diamants);
      compte = apres.compte;
    }
    expect(diamants).toEqual([...diamants].sort((a, b) => a - b));
    expect(new Set(diamants).size).toBe(4);
  });

  it('expose l’état des paliers pour l’interface', () => {
    const region = { ...regionInitiale('kanto', 'kanto.route-1'), especesEcloses: Array.from({ length: 60 }, (_, i) => i + 1) };
    const compte = { ...compteInitial(), succes: ['eclosions-10'] };
    const paliers = paliersDeMesure(registreSucces, 'eclosions', mesuresDe(region, []), compte);
    expect(paliers.map(p => [p.seuil, p.atteint, p.obtenu])).toEqual([
      [10, true, true], [50, true, false], [100, false, false], [151, false, false],
    ]);
  });
});

describe('sauvegarde', () => {
  it('charge une ancienne région sans marque ni liste d’espèces', () => {
    const ancienne = regionInitiale('kanto', 'kanto.route-1');
    expect(ancienne.especesEcloses).toBeUndefined();
    expect(() => validerDonneesRegion(JSON.parse(JSON.stringify(ancienne)))).not.toThrow();
    expect(mesuresDe(ancienne, []).eclosions).toBe(0);
    expect(() => validerDonneesRegion({ ...ancienne, equipe: [pokemon(25)] })).not.toThrow();
  });

  it('accepte et relit la marque et la liste, refuse les valeurs invalides', () => {
    const region = { ...regionInitiale('kanto', 'kanto.route-1'), equipe: [pokemon(25, { marqueEclosion: true })],
      especesEcloses: [4, 25] };
    const relue = JSON.parse(JSON.stringify(region));
    expect(() => validerDonneesRegion(relue)).not.toThrow();
    expect(relue.equipe[0].marqueEclosion).toBe(true);
    expect(() => validerDonneesRegion({ ...region, especesEcloses: [4, 4] })).toThrow();
    expect(() => validerDonneesRegion({ ...region, especesEcloses: [152] })).toThrow();
    expect(() => validerDonneesRegion({ ...region, equipe: [pokemon(25, { marqueEclosion: 'oui' as never })] })).toThrow();
  });

  it('note l’écart avec la V1', () => {
    expect(ECARTS_ECLOSION_V1.marqueDegats).toBe(reglages.pension.marqueEclosion);
    expect(ECARTS_ECLOSION_V1.paliers).toEqual(registreSucces.filter(s => s.mesure === 'eclosions').map(s => s.seuil));
  });
});
