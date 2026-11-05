/* Variante C : fenêtres. Pas de barre : le combat prend tout l'écran. Un bouton « Menu » en bas ouvre une feuille de
   six tuiles ; chaque tuile ouvre une fenêtre par-dessus le jeu (croix pour fermer), comme les menus d'Egg Inc. */
const etat = { menu: false, fenetre: null, nouveau: false };
const tuiles = [["equipe", "equipe", "Équipe"], ["pc", "pc", "PC"], ["shop", "shop", "Shop"], ["carte", "carte", "Carte"], ["aventure", "pokedex", "Aventure"], ["reglages", "reglages", "Réglages"]];

function rendre() {
  const c = document.getElementById("couches"); c.innerHTML = "";
  document.getElementById("cles").innerHTML = PK.cles();
  const e = document.getElementById("ecran");
  if (!e.dataset.pret) { e.innerHTML = PK.combat(); PK.scene(e); e.dataset.pret = "1"; }
  document.getElementById("bas").innerHTML = `<button type="button" class="plaque menu-bouton" data-go="menu" aria-haspopup="dialog">${PK.ic("menu")}<span>Menu</span>${etat.nouveau ? '<span class="point"></span>' : ""}</button>`;
  if (etat.menu) {
    c.innerHTML = `<div class="voile" data-go="fermer"></div>
      <section class="feuille cadre" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="tete"><h2>Menu</h2><button type="button" class="plaque" data-go="fermer" aria-label="Fermer le menu">${PK.ic("croix")}</button></div>
        <div class="tuiles">${tuiles.map(([id, ic, t]) => {
          const ferme = id === "pc" && !PK.etat.pcOuvert;
          const sous = ferme ? "Argenta" : id === "pc" ? "12 rangés" : "";
          return `<button type="button" class="plaque tuile ${ferme ? "ferme" : ""}" data-go="${id}">${PK.ic(ferme ? "cadenas" : ic)}<span>${t}</span>${sous ? `<small class="doux">${sous}</small>` : ""}${id === "pc" && etat.nouveau ? '<span class="point"></span>' : ""}</button>`;
        }).join("")}</div>
      </section>`;
  }
  if (etat.fenetre) {
    const f = etat.fenetre;
    const corps = f === "aventure" ? PK.aventure() + `<div class="liste">${PK.lignesPlus({ avecPc: false }).replace(/<button[^>]*data-go="reglages"[\s\S]*$/, "")}</div>` : PK.page(f);
    c.innerHTML = `<div class="voile" data-go="fermer"></div>
      <section class="fenetre cadre" role="dialog" aria-modal="true" aria-label="${PK.titres[f]}">
        <div class="tete"><h2>${PK.titres[f]}</h2><button type="button" class="plaque" data-go="fermer" aria-label="Fermer la fenêtre">${PK.ic("croix")}</button></div>
        <div class="corps">${corps}</div>
      </section>`;
  }
}

document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]"), a = ev.target.closest("[data-act]");
  if (a) {
    if (a.dataset.act === "debloquer-pc") { PK.etat.pcOuvert = true; etat.nouveau = true; PK.toast("PC débloqué ! Il est dans le menu."); }
    if (a.dataset.act === "verrouiller-pc") { PK.etat.pcOuvert = false; etat.nouveau = false; }
    return rendre();
  }
  if (!g) return;
  const go = g.dataset.go;
  if (go === "menu") { etat.menu = true; etat.fenetre = null; }
  else if (go === "fermer") { etat.menu = false; etat.fenetre = null; }
  else { etat.menu = false; etat.fenetre = go; if (go === "pc") etat.nouveau = false; }
  rendre();
});
rendre();
