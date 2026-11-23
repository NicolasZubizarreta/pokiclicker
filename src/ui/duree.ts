export function formaterDuree(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "moins d'une minute";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

const secondes = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
export function formaterTempsBoss(ms: number | null): string {
  return ms === null ? '—' : `${secondes.format(ms / 1000)} s`;
}
