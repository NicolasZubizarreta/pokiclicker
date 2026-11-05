/** @typedef {{groupe: string, slug: string, titre: string, source: string, etat: string, statut: string, raison: string, captures: Record<number,string>, erreursJS: {largeur: number, message: string}[], largeurs?: Record<number,{statut: string, raison?: string}>, captureLe?: string}} Resultat */
/** @typedef {{genereLe: string, ecrans: Resultat[]}} Manifeste */
/** @param {unknown} valeur */
const echapper = valeur => String(valeur ?? '').replace(/[&<>"']/g, lettre => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[lettre] ?? lettre);

/** @param {Manifeste} manifeste */
export function genererPlanche(manifeste) {
  const groupes = ['compte', 'combat', 'intro', 'equipe', 'shop', 'carte', 'plus', 'fin'];
  const ecrans = manifeste.ecrans;
  const bilan = ['ok', 'inatteignable', 'erreur'].map(statut => `${ecrans.filter(e => e.statut === statut).length} ${statut}`).join(' · ');
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Audit des écrans PokiClicker</title><style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#17191d;color:#eee;font:16px/1.5 system-ui,sans-serif}a{color:#a8d4ff}nav{display:flex;gap:16px;flex-wrap:wrap}article{background:#24272d;border:1px solid #555;border-radius:8px;padding:16px;margin:20px 0}h1,h2,h3{line-height:1.2}p{overflow-wrap:anywhere}.captures{display:grid;grid-template-columns:minmax(0,390fr) minmax(0,1440fr);gap:16px;align-items:start}figure{margin:0;min-width:0}img{display:block;width:100%;height:auto}figcaption{overflow-wrap:anywhere}.raison{padding:16px;border:1px solid #cda566;background:#30291f}@media(max-width:700px){body{padding:12px}.captures{grid-template-columns:1fr}}section{scroll-margin-top:16px}
</style><header><h1>Audit des écrans PokiClicker</h1><p>Généré le ${echapper(manifeste.genereLe)} · ${echapper(bilan)}</p><nav>${groupes.map(g => `<a href="#${g}">${g}</a>`).join('')}</nav></header>
${groupes.map(g => `<section id="${g}"><h2>${g}</h2>${ecrans.filter(e => e.groupe === g).map(e => `<article id="${echapper(`${g}-${e.slug}`)}"><h3>${echapper(e.titre)}</h3><p><code>${echapper(e.source)}</code></p><p>${echapper(e.etat)}</p>${e.statut === 'ok' ? `<div class="captures">${[390, 1440].map(largeur => {
    const fichier = e.captures[largeur];
    return `<figure><a href="${echapper(fichier)}" target="_blank" rel="noopener"><img loading="lazy" src="${echapper(fichier)}" alt="${echapper(`${e.titre} — ${largeur} px — ${e.etat}`)}"></a><figcaption>${echapper(fichier)}</figcaption></figure>`;
  }).join('')}</div>` : `<p class="raison">${echapper(e.statut)} : ${echapper(e.raison)}</p>`}</article>`).join('')}</section>`).join('')}</html>`;
}
