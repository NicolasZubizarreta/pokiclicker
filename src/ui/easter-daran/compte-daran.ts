/** À RENSEIGNER : identifiant du compte de Daran (valeur de localStorage['pokiclicker.proprietaire'] = colonne "user".id de la base). Vide = la fonctionnalité ne fait RIEN. */
export const COMPTE_DARAN: string = '';

/** Compare les comptes sans casse ni espaces extérieurs ; une autorisation vide refuse tout. */
export function estCompteDaran(identifiant: string | null | undefined, autorise: string = COMPTE_DARAN): boolean {
  const compte = autorise.trim().toLowerCase();
  return compte !== '' && typeof identifiant === 'string' && identifiant.trim().toLowerCase() === compte;
}

/** Reconnaît le surnom Daran sans casse ni espaces extérieurs. */
export function estSurnomDaran(surnom: string | null | undefined): boolean {
  return typeof surnom === 'string' && surnom.trim().toLowerCase() === 'daran';
}
