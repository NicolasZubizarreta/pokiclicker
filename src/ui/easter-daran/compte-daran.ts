/** SHA-256 (hex) de l'e-mail du compte de Daran, normalisé (espaces retirés, minuscules). Vide = la fonctionnalité ne fait RIEN. */
export const COMPTE_DARAN: string = '35cc375a8ac794d0045271d8de7a73c180f299d5dc83546c5926ef4f347108ae';

export function normaliserEmail(email: string): string {
  return email.replace(/\s/g, '').toLowerCase();
}

export async function hasherEmail(email: string): Promise<string> {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normaliserEmail(email)));
  return Array.from(new Uint8Array(hash), octet => octet.toString(16).padStart(2, '0')).join('');
}

/** Compare le hash de l'e-mail normalisé ; toute donnée absente ou erreur refuse l'accès. */
export async function estCompteDaran(email: string | null | undefined, autorise: string = COMPTE_DARAN): Promise<boolean> {
  try {
    const compte = autorise.trim().toLowerCase();
    if (!compte || typeof email !== 'string' || !normaliserEmail(email)) return false;
    return await hasherEmail(email) === compte;
  } catch { return false; }
}

/** Reconnaît le surnom Daran sans casse ni espaces extérieurs. */
export function estSurnomDaran(surnom: string | null | undefined): boolean {
  return typeof surnom === 'string' && surnom.trim().toLowerCase() === 'daran';
}
