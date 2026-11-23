import { expect, it } from 'vitest';
import { apercuBoss } from './apercu-boss';
import { calculerDpsEquipe } from './combat';
import { creerEnnemi } from './ennemis';
import { kanto } from './regions';
import { reglages } from './reglages';

it.each(['kanto.route-1', 'kanto.ligue-pokemon'])('utilise le boss réel de %s et son efficacité de type', id => {
  const zone = kanto.zoneDeCombat(id), equipe = [{ numero: 6, niveau: 30 }];
  const boss = creerEnnemi(zone, zone.etapes, () => .5);
  const dps = calculerDpsEquipe(equipe, boss);
  const secondes = Math.ceil(boss.pvMax / dps);
  expect(apercuBoss(zone, equipe, [], () => .5)).toMatchObject({ numero: boss.numero,
    niveau: boss.niveau, pvMax: boss.pvMax, dps, secondesPourVaincre: secondes,
    chronoMs: reglages.combat.minuteurBossMs, assezRapide: secondes * 1000 <= reglages.combat.minuteurBossMs });
});

it('gère une équipe sans DPS et les zones sans boss final, le labo et les événements', () => {
  const zone = kanto.zoneDeCombat('kanto.route-1');
  expect(apercuBoss(zone, [], [], () => .5)).toMatchObject({ dps: 0, secondesPourVaincre: null, assezRapide: false });
  for (const autre of [{ ...zone, etapes: 5 }, { ...zone, id: 'kanto.labo' }, { ...zone, id: 'evenement:essai' }]) {
    expect(apercuBoss(autre, [], [], () => .5)).toBeNull();
  }
});
