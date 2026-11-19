import { describe, expect, it } from 'vitest';
import { bloque, envoiEnEchec, suivant } from './etat-synchro';
import type { EtatSynchro, EvenementSynchro } from './etat-synchro';

describe('transitions de la synchro', () => {
  it.each<[EtatSynchro, EvenementSynchro, EtatSynchro]>([
    ['inactif', 'envoi-accepte', 'ok'],
    ['hors-ligne', 'envoi-accepte', 'ok'],
    ['ok', 'reseau-coupe', 'hors-ligne'],
    ['refuse', 'reseau-coupe', 'hors-ligne'],
    ['divergence', 'reseau-coupe', 'divergence'],
    ['ok', 'serveur-ailleurs', 'ailleurs'],
    ['ok', 'conflit', 'divergence'],
    ['ok', 'client-trop-ancien', 'refuse'],
    ['ok', 'refus', 'refuse'],
    ['divergence', 'resolu', 'inactif'],
    ['refuse', 'ouverture', 'inactif'],
    ['ailleurs', 'ouverture', 'inactif'],
    ['divergence', 'ouverture', 'divergence'],
    ['refuse', 'redemarrage', 'inactif'],
    ['ailleurs', 'redemarrage', 'ailleurs'],
    ['divergence', 'redemarrage', 'divergence'],
    ['ok', 'redemarrage', 'ok'],
    ['hors-ligne', 'redemarrage', 'hors-ligne'],
  ])('%s + %s donne %s', (etat, evenement, attendu) => {
    expect(suivant(etat, evenement)).toBe(attendu);
  });

  it('bloque les envois dans refuse, ailleurs et divergence seulement', () => {
    const etats: EtatSynchro[] = ['inactif', 'ok', 'hors-ligne', 'refuse', 'ailleurs', 'divergence'];
    expect(etats.filter(bloque)).toEqual(['refuse', 'ailleurs', 'divergence']);
  });

  it('signale un envoi en échec dans hors-ligne, refuse et divergence', () => {
    const etats: EtatSynchro[] = ['inactif', 'ok', 'hors-ligne', 'refuse', 'ailleurs', 'divergence'];
    expect(etats.filter(envoiEnEchec)).toEqual(['hors-ligne', 'refuse', 'divergence']);
  });
});
