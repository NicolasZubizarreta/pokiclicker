// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { extraireJetonUrl, reinitialiserPourTest } from './jeton-url';

beforeEach(() => { reinitialiserPourTest(); history.replaceState(null, '', '/'); });
it('retire immédiatement le jeton et le conserve pour StrictMode', () => {
  history.replaceState(null, '', '/?token=abc&x=1#suite');
  expect(extraireJetonUrl()).toBe('abc');
  expect(location.search).toBe('?x=1');
  expect(location.hash).toBe('#suite');
  expect(extraireJetonUrl()).toBe('abc');
});
it('reconnaît un jeton invalide', () => {
  history.replaceState(null, '', '/?error=INVALID_TOKEN');
  expect(extraireJetonUrl()).toBe('');
});
it('renvoie null sans paramètre', () => { expect(extraireJetonUrl()).toBeNull(); });
