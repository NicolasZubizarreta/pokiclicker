import { describe, expect, it } from 'vitest';
import { chargerCasino } from '../src/core/casino';

// Sabot de 6 paquets remélangé sous 25 % de cartes, blackjack naturel ×2,5, jusqu'à 4 mains après séparation.
const BLACKJACK_V2 = { paquets: 6, gainNaturel: 2.5, maxMains: 4, remelangeSous: 0.25 } as const;

describe('écart voulu avec la V1 : blackjack complet (ticket B, 11/11/2026)', () => {
  it('data/casino.json suit les règles standard du casino', () => {
    const { blackjack } = chargerCasino();
    expect(blackjack).toMatchObject(BLACKJACK_V2);
    expect(blackjack.seuilCroupier).toBe(17);
  });
});
