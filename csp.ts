export function construireCsp(api?: string) {
  let origine = '';
  try { if (api) origine = ` ${new URL(api).origin}`; } catch { /* Une URL invalide n'ajoute aucune origine. */ }
  return `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob: data:; connect-src 'self'${origine}; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`;
}
