import { describe, expect, it } from 'vitest';
import { chargerCasino } from '../src/core/casino';
import { BLACKJACK_V2 } from './ecarts-v1';

describe('écart voulu avec la V1 : blackjack complet (ticket B, 11/11/2026)', () => {
  it('data/casino.json suit les règles standard notées dans ecarts-v1', () => {
    const { blackjack } = chargerCasino();
    expect(blackjack).toMatchObject(BLACKJACK_V2);
    expect(blackjack.seuilCroupier).toBe(17);
  });
});
