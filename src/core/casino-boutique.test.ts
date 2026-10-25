import { describe, expect, it, vi } from 'vitest';
import fixture from '../../tests/fixtures/v1-casino.json';
import { acheterAuCasino, chargerCasino, objetsDuCasino } from './casino';
import { objetsActifs } from './boutique';
import { calculerOr } from './recompenses';
import { regionInitiale } from './sauvegarde';
import { validerPokemonPossede } from './sauvegarde-validation';
import type { PokemonPossede } from './sauvegarde-types';

const membre: PokemonPossede = {
  uid: 'existant', numero: 1, niveau: 5, xp: 0, shiny: false, sexe: 'male',
  bonheur: 0, calcium: 0, pierreEternelle: false, favori: false,
};
const region = () => ({ ...regionInitiale('kanto', 'kanto.bourg-palette'), jetons: 1000000 });

describe('boutique du casino', () => {
  it.each(fixture.boutique.achats)('reproduit $cle avec $equipeAvant membres', cas => {
    const avant = { ...region(), equipe: Array.from({ length: cas.equipeAvant }, () => ({ ...membre })) };
    const copie = structuredClone(avant);
    const alea = vi.fn(() => 0);
    const genererId = vi.fn(() => 'achat');
    const resultat = acheterAuCasino(avant, cas.cle, alea, genererId);
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) return;
    expect(resultat.region.jetons).toBe(cas.etat.casinoTokens);
    expect(resultat.region.equipe).toHaveLength(cas.etat.team.length);
    expect(resultat.region.pc).toHaveLength(cas.etat.pc.length);
    expect(resultat.region.inventaire).toEqual(Object.fromEntries(
      Object.entries(cas.etat.inv).map(([cle, n]) => [cle === 'candy' ? 'bonbon' : cle, n]),
    ));
    expect(resultat.region.ameliorations).toEqual(Object.keys(cas.etat.upgrades));
    expect(resultat.numero === undefined ? [] : [resultat.numero]).toEqual(cas.addToPokedex);
    if (resultat.numero !== undefined) {
      const pokemon = (cas.equipeAvant < 6 ? resultat.region.equipe : resultat.region.pc).at(-1)!;
      expect(() => validerPokemonPossede(pokemon)).not.toThrow();
      expect(pokemon).toEqual({ ...membre, uid: 'achat', numero: resultat.numero, niveau: 25,
        sexe: resultat.numero === 137 ? 'sansSexe' : 'male' });
      expect(genererId).toHaveBeenCalledTimes(1);
    } else expect(genererId).not.toHaveBeenCalled();
    expect(alea).toHaveBeenCalledTimes(resultat.numero !== undefined && resultat.numero !== 137 ? 1 : 0);
    const article = chargerCasino().boutique.find(o => o.key === cas.cle)!;
    const nom = article.type === 'pokemon' ? article.name
      : chargerCasino().noms[cas.cle as keyof ReturnType<typeof chargerCasino>['noms']];
    expect(resultat.message).toBe(`+${nom} !`);
    expect(avant).toEqual(copie);
  });

  it('expose les prix, la possession et les raisons, sans bloquer les achats répétables', () => {
    const avant = { ...region(), jetons: 500, ameliorations: ['ctJackpot'], inventaire: { bonbon: 2 } };
    const lignes = objetsDuCasino(avant);
    expect(lignes.map(o => [o.id, o.prix])).toEqual(fixture.constantes.boutique.map(o => [o.key, o.price]));
    expect(lignes.find(o => o.id === 'candy')).toMatchObject({ possede: true, abordable: true, raison: null });
    expect(lignes.find(o => o.id === 'ctJackpot')).toMatchObject({ possede: true, abordable: false, raison: 'Déjà acquis !' });
    expect(lignes.find(o => o.id === 'masterball')).toMatchObject({ possede: false, abordable: false, raison: 'Pas assez de jetons.' });
    const achat = acheterAuCasino(avant, 'candy', () => 0, () => 'id');
    expect(achat.ok && achat.region.inventaire.bonbon).toBe(3);
  });

  it.each(fixture.boutique.refus)('refuse $nom sans débit ni effet', cas => {
    const avant = { ...region(), jetons: cas.avant.casinoTokens, ameliorations: Object.keys(cas.avant.upgrades) };
    const copie = structuredClone(avant);
    const effet = vi.fn(() => { throw new Error('Effet interdit'); });
    expect(acheterAuCasino(avant, cas.nom === 'ct-deja-acquise' ? 'ctJackpot' : 'abra', effet, effet))
      .toEqual({ ok: false, raison: cas.nom === 'ct-deja-acquise' ? 'Déjà acquis !' : 'Pas assez de jetons.' });
    expect(avant).toEqual(copie);
    expect(effet).not.toHaveBeenCalled();
  });

  it('refuse un identifiant inconnu et rend Jackpot unique avec le bonus d’or', () => {
    const avant = region();
    const effet = vi.fn(() => { throw new Error('Effet interdit'); });
    expect(acheterAuCasino(avant, 'inconnu', effet, effet)).toEqual({ ok: false, raison: 'Objet inconnu.' });
    const achat = acheterAuCasino(avant, 'ctJackpot', effet, effet);
    expect(achat.ok).toBe(true);
    if (!achat.ok) return;
    expect(acheterAuCasino(achat.region, 'ctJackpot', effet, effet)).toEqual({ ok: false, raison: 'Déjà acquis !' });
    const victoire = { numero: 1, niveau: 25, shiny: false, boss: false, rarete: null };
    expect(calculerOr(victoire, objetsActifs(achat.region))).toBe(Math.floor(calculerOr(victoire) * 1.2));
    expect(effet).not.toHaveBeenCalled();
  });

  it.each(fixture.boutique.sexes)('reproduit les sexes de $numero, graine $graine', cas => {
    let etat = cas.graine >>> 0;
    const alea = vi.fn(() => {
      etat = (etat + 0x6D2B79F5) >>> 0;
      let n = Math.imul(etat ^ (etat >>> 15), 1 | etat);
      n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    });
    const id = chargerCasino().boutique.find(o => o.id === cas.numero)!.key;
    const sexes = cas.valeurs.map(() => {
      const achat = acheterAuCasino(region(), id, alea, () => 'achat');
      if (!achat.ok) throw new Error(achat.raison);
      return { male: 'male', femelle: 'female', sansSexe: 'genderless' }[achat.region.equipe[0]!.sexe];
    });
    expect(sexes).toEqual(cas.valeurs);
    expect(alea).toHaveBeenCalledTimes(cas.tirages);
  });
});
