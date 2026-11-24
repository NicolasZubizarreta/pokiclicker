export const formateurArgent = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
export const formaterNombre = (nombre: number) => formateurArgent.format(nombre);

export const formaterDps = (dps: number) => formaterNombre(Math.round(dps));

/** « 0 jeton », « 1 jeton », « 2 jetons » : le pluriel commence à 2 (valeur absolue). */
export const accorder = (n: number, singulier: string, pluriel: string) => `${formaterNombre(n)} ${Math.abs(n) >= 2 ? pluriel : singulier}`;
export const jetonsTexte = (n: number) => accorder(n, 'jeton', 'jetons');
