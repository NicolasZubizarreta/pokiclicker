// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { annulerChoix, choisirObjet, fermerSac, ouvrirSac, reinitialiserSac, storeSac, terminerChoix } from './sacContexte';

beforeEach(reinitialiserSac);
const objet = { type: 'bonbon', cle: 'candy', nom: 'Bonbon' } as const;

it('ouvre et ferme le Sac sans perdre le choix', () => {
  expect(storeSac.getState()).toMatchObject({ ouvert: false, objet: null });
  choisirObjet(objet);
  ouvrirSac();
  expect(storeSac.getState()).toMatchObject({ ouvert: true, objet });
  fermerSac();
  expect(storeSac.getState()).toMatchObject({ ouvert: false, objet });
});

it('ferme le Sac au choix puis termine sans le rouvrir', () => {
  ouvrirSac();
  choisirObjet(objet);
  expect(storeSac.getState()).toMatchObject({ ouvert: false, objet });
  terminerChoix();
  expect(storeSac.getState()).toMatchObject({ ouvert: false, objet: null });
});

it('rend le Sac après annulation et réinitialise tout', () => {
  choisirObjet(objet);
  annulerChoix();
  expect(storeSac.getState()).toMatchObject({ ouvert: true, objet: null });
  choisirObjet(objet);
  reinitialiserSac();
  expect(storeSac.getState()).toMatchObject({ ouvert: false, objet: null });
});
