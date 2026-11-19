export function messageNettoye(error: unknown): string {
  return (error instanceof Error ? error.message : 'Erreur inconnue.')
    .replace(/[^\s<>"'@]+@[^\s<>"'@]+/g, '[adresse]');
}

export function journal(evt: string, champs: Record<string, unknown> = {}) {
  const ligne = JSON.stringify({ ...champs, t: new Date().toISOString(), evt });
  if (champs.niveau === 'erreur') console.error(ligne);
  else console.info(ligne);
}
