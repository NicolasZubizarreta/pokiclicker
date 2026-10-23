import { describe, expect, it } from 'vitest';
import { evaluer, valider } from './conditions';
import type { Condition, EtatMonde } from './conditions';

const vide: EtatMonde = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };
const complet: EtatMonde = {
  badges: ['roche'], bossVaincus: ['kanto.route-1'], objets: ['cle'], quetes: ['livraison'], drapeaux: ['reveil'],
};
const badge: Condition = { type: 'badge', id: 'roche', nom: 'Roche' };
const objet: Condition = { type: 'objet', id: 'cle', nom: 'Clé' };

describe('conditions de passage', () => {
  const cas: [string, Condition, string][] = [
    ['badge', badge, 'Il te faut le badge Roche.'],
    ['boss', { type: 'boss', zone: 'kanto.route-1' }, 'Bats le boss de Route 1.'],
    ['objet', objet, "Il te faut l'objet Clé."],
    ['quête', { type: 'quete', id: 'livraison', nom: 'Livraison' }, 'Termine la quête Livraison.'],
    ['drapeau', { type: 'drapeau', id: 'reveil' }, 'Il te faut le drapeau reveil.'],
    ['tous', { tous: [badge, objet] }, 'Il te faut le badge Roche.'],
    ['un parmi', { un_parmi: [badge, objet] }, "Il te faut l'une de ces conditions : Il te faut le badge Roche. ou Il te faut l'objet Clé."],
  ];
  it.each(cas)('évalue %s dans les deux états', (_, condition, raison) => {
    expect(() => valider(condition)).not.toThrow();
    const contexte = { nomZone: () => 'Route 1' };
    expect(evaluer(condition, vide, contexte)).toEqual({ ok: false, raison });
    expect(evaluer(condition, complet, contexte)).toEqual({ ok: true });
  });

  it('inverse une condition', () => {
    const condition: Condition = { non: badge };
    expect(() => valider(condition)).not.toThrow();
    expect(evaluer(condition, vide)).toEqual({ ok: true });
    expect(evaluer(condition, complet)).toEqual({ ok: false, raison: "Cette voie n'est plus ouverte." });
  });

  it.each<[Condition, string]>([
    [{ type: 'badge', id: 'roche' }, 'Il te faut le badge roche.'],
    [{ type: 'objet', id: 'cle' }, "Il te faut l'objet cle."],
    [{ type: 'quete', id: 'livraison' }, 'Termine la quête livraison.'],
    [{ type: 'boss', zone: 'kanto.route-1' }, 'Bats le boss de kanto.route-1.'],
  ])('emploie les identifiants en l’absence de noms : %j', (condition, raison) => {
    expect(evaluer(condition, vide)).toEqual({ ok: false, raison });
  });

  it('retient le premier refus et accepte une alternative satisfaite', () => {
    const etat = { ...vide, badges: ['roche'] };
    expect(evaluer({ tous: [badge, objet] }, etat)).toEqual({ ok: false, raison: "Il te faut l'objet Clé." });
    expect(evaluer({ un_parmi: [objet, badge] }, etat)).toEqual({ ok: true });
    expect(evaluer({ tous: [] }, vide)).toEqual({ ok: true });
    expect(evaluer({ un_parmi: [] }, vide).ok).toBe(false);
  });

  it.each([
    { type: 'inconnu' }, { tous: [{ type: 'inconnu' }] },
    { un_parmi: [{ type: 'inconnu' }] }, { non: { type: 'inconnu' } },
  ])('rejette récursivement un type inconnu : %j', (condition) => {
    expect(() => valider(condition)).toThrow('Condition inconnue : inconnu');
  });
});
