let resultat: string | null | undefined;

export function extraireJetonUrl(): string | null {
  if (resultat !== undefined) return resultat;
  const adresse = new URL(window.location.href);
  resultat = adresse.searchParams.get('token') ?? (adresse.searchParams.get('error') === 'INVALID_TOKEN' ? '' : null);
  if (adresse.searchParams.has('token')) {
    adresse.searchParams.delete('token');
    window.history.replaceState(window.history.state, '', adresse.pathname + adresse.search + adresse.hash);
  }
  return resultat;
}

export function reinitialiserPourTest() { resultat = undefined; }
