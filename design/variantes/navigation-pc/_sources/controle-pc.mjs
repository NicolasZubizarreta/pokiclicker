// Contrôle automatique de la maquette PC : chaque écran à plusieurs tailles, rapport des défauts de mise en page.
// Usage : node design/variantes/navigation-pc/_sources/controle-pc.mjs <dossier de captures> [tailles 1280x800,1440x900,...] [ids séparés par des virgules]
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const sortie = process.argv[2];
const tailles = (process.argv[3] || "1280x800,1440x900,1920x1080").split(",").map((s) => s.split("x").map(Number));
const index = readFileSync(join(racine, "index.html"), "utf8");
const ids = process.argv[4] ? process.argv[4].split(",") : [...index.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
mkdirSync(sortie, { recursive: true });
const navigateur = await chromium.launch();
const url = pathToFileURL(join(racine, "pc-app.html")).href;
const bilan = [];

for (const [w, h] of tailles) {
  const ctx = await navigateur.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const externes = [], erreurs = [];
  page.on("request", (r) => { if (!/^(file|data|blob):/.test(r.url())) externes.push(r.url()); });
  page.on("pageerror", (e) => erreurs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  for (const id of ids) {
    await page.goto(url + "#" + id);
    await page.reload();
    await page.waitForTimeout(250);
    const defauts = await page.evaluate(() => {
      const d = [], vp = { w: innerWidth, h: innerHeight };
      const nom = (e) => (e.id ? "#" + e.id : "") + "." + [...e.classList].join(".") + (e.tagName === "IMG" ? "[img " + (e.getAttribute("src") || "").split("/").pop() + "]" : "") + " «" + (e.textContent || "").trim().slice(0, 30) + "»";
      const visible = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
      const app = document.querySelector(".app");
      if (document.documentElement.scrollWidth > vp.w + 1) d.push("défilement horizontal de la page");
      if (document.documentElement.scrollHeight > vp.h + 1) d.push("la page défile (" + document.documentElement.scrollHeight + " > " + vp.h + ")");
      if (app && app.scrollHeight > app.clientHeight + 1) d.push("l'application déborde en hauteur");
      document.querySelectorAll("body *").forEach((e) => {
        if (!visible(e)) return;
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        if (["IMG", "BUTTON", "INPUT", "SELECT", "SPAN", "P", "B", "H1", "H2", "H3", "SMALL", "A", "LABEL", "DD", "DT"].includes(e.tagName) || e.classList.length) {
          if (e.scrollWidth > e.clientWidth + 2 && (s.overflowX === "hidden" || s.textOverflow === "ellipsis") && e.tagName !== "BODY") d.push("texte coupé (largeur) : " + nom(e));
          if (e.scrollHeight > e.clientHeight + 2 && s.overflowY === "hidden" && e.clientHeight > 0) d.push("contenu coupé (hauteur) : " + nom(e));
        }
        if (e.tagName === "IMG" && !e.complete) d.push("image non chargée : " + nom(e));
        if (e.tagName === "IMG" && e.naturalWidth === 0 && e.complete) d.push("image cassée : " + nom(e));
        if (e.tagName === "IMG") {
          const c = e.closest(".cadre, .case, .carte-pk, .rang-eq, .portrait, .gros-sprite-c, .produit, .ligne-p, .pop, .dex-case, .tag, .miniatures, .scene, .bat, .starters button");
          if (c && c !== e) { const p = c.getBoundingClientRect(); const t = 2; if (r.left < p.left - t || r.right > p.right + t || r.top < p.top - t || r.bottom > p.bottom + t) d.push("image hors de son cadre : " + nom(e) + " dans " + nom(c)); }
        }
        const fen = e.closest(".couche, .attente-plein, .pops");
        if (r.right > vp.w + 2 || r.bottom > vp.h + 2 + (e.closest(".ecran, .corps, .compte-page, .liste-zones, nav, .liste, .produits, .pc-corps, .dex-liste, .zone-jeu") ? 100000 : 0)) {
          if (r.left < vp.w && r.top < vp.h) d.push("hors fenêtre : " + nom(e));
        }
        void fen;
      });
      // chevauchements de boutons frères
      document.querySelectorAll("button, a[href], input, select").forEach((a) => {
        if (!visible(a)) return; const ra = a.getBoundingClientRect();
        const sib = a.parentElement ? [...a.parentElement.children].filter((x) => x !== a && x.matches("button, a[href], input, select") && visible(x)) : [];
        sib.forEach((b) => { const rb = b.getBoundingClientRect(); const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top); if (ox > 3 && oy > 3 && nom(a) < nom(b)) d.push("chevauchement : " + nom(a) + " / " + nom(b)); });
      });
      return [...new Set(d)].slice(0, 12);
    });
    await page.screenshot({ path: join(sortie, `${id}-${w}.png`) });
    if (defauts.length) bilan.push({ id, taille: `${w}x${h}`, defauts });
  }
  if (externes.length) bilan.push({ id: "(réseau)", taille: `${w}x${h}`, defauts: ["requêtes externes : " + [...new Set(externes)].slice(0, 5).join(", ")] });
  if (erreurs.length) bilan.push({ id: "(console)", taille: `${w}x${h}`, defauts: [...new Set(erreurs)].slice(0, 5) });
  await ctx.close();
}
await navigateur.close();
for (const b of bilan) console.log(`${b.taille} ${b.id}\n  - ${b.defauts.join("\n  - ")}`);
console.log(`\n${ids.length} écrans × ${tailles.length} tailles : ${bilan.length} entrées à regarder`);
