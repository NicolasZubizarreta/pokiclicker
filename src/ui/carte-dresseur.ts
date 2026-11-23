import { cheminSprite } from './precharger';
export type DonneesCarte = { nom: string; titre: string; equipe: { numero: number; nom: string; niveau: number; shiny: boolean }[]; chiffres: { libelle: string; valeur: string }[] };
export type JetonsCarte = { surface: string; texte: string; bordure: string; accent: string; police: string };
export function dessinerCarte(ctx: CanvasRenderingContext2D, d: DonneesCarte, j: JetonsCarte, sprites: CanvasImageSource[] = []) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = j.surface; ctx.fillRect(0, 0, 1200, 630);
  ctx.strokeStyle = j.bordure; ctx.lineWidth = 4; ctx.strokeRect(16, 16, 1168, 598);
  ctx.fillStyle = j.texte; ctx.font = `bold 40px ${j.police}`; ctx.fillText(d.nom.slice(0, 40), 40, 80, 1120);
  ctx.fillStyle = j.accent; ctx.font = `28px ${j.police}`; ctx.fillText(d.titre, 40, 125, 1120);
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * 188; const p = d.equipe[i];
    ctx.strokeRect(x, 160, 176, 270);
    if (!p) continue;
    if (sprites[i]) {
      const s = sprites[i] as HTMLImageElement;
      const facteur = Math.max(1, Math.floor(128 / Math.max(s.width, s.height)));
      ctx.drawImage(s, x + (176 - s.width * facteur) / 2, 175, s.width * facteur, s.height * facteur);
    }
    ctx.fillStyle = j.texte; ctx.font = `20px ${j.police}`;
    ctx.fillText(p.nom, x + 8, 335, 160); ctx.fillText(`Niveau ${p.niveau}`, x + 8, 370, 160);
    if (p.shiny) ctx.fillText('Chromatique', x + 8, 405, 160);
  }
  d.chiffres.forEach((c, i) => { const x = 40 + i * 288;
    ctx.font = `20px ${j.police}`; ctx.fillText(c.libelle, x, 490, 270);
    ctx.font = `bold 28px ${j.police}`; ctx.fillText(c.valeur, x, 540, 270);
  });
}
export async function genererCarte(donnees: DonneesCarte): Promise<Blob> {
  await document.fonts?.ready;
  const sprites = await Promise.all(donnees.equipe.map(p => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Sprite indisponible'));
    image.src = cheminSprite(p.numero, p.shiny);
  })));
  const style = getComputedStyle(document.documentElement);
  const lire = (nom: string) => style.getPropertyValue(nom).trim();
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image indisponible');
  dessinerCarte(ctx, donnees, { surface: lire('--surface'), texte: lire('--texte'), bordure: lire('--bordure'), accent: lire('--region-accent'), police: lire('--font-titre') }, sprites);
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Image indisponible')), 'image/png'));
}
