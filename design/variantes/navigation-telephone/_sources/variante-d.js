/* Variante D : bouton du pouce. Pas de barre. Une bande d'actions en bas (Capturer, Auto, Sac, Menu) ; « Menu » déplie
   la liste des destinations juste au-dessus du pouce. Les destinations s'ouvrent en pages, la bande reste. */
const etat = { page: "combat", ouvert: false, nouveau: false };
const dest = [["combat", "Combat"], ["equipe", "Équipe"], ["pc", "PC"], ["shop", "Shop"], ["carte", "Carte"], ["plus", "Plus"]];

function bande() {
  const fab = `<button type="button" class="plaque vertical fab" data-go="bascule" aria-expanded="${etat.ouvert}" aria-haspopup="true">${PK.ic(etat.ouvert ? "croix" : "menu")}Menu${etat.nouveau && !etat.ouvert ? '<span class="point"></span>' : ""}</button>`;
  if (etat.page === "combat") {
    return `<button type="button" class="plaque vertical" data-act="capturer">${PK.ic("balle")}Capturer<span class="pastille">×50</span></button>
      <button type="button" class="plaque vertical" aria-pressed="false" data-act="auto">${PK.ic("auto")}Auto</button>
      <button type="button" class="plaque vertical" data-go="sac">${PK.ic("sac")}Sac<span class="pastille">82</span></button>${fab}`;
  }
  return `<button type="button" class="plaque vertical large" data-go="combat">${PK.ic("combat")}Retour au combat</button>${fab}`;
}

function rendre() {
  const c = document.getElementById("couches"); c.innerHTML = "";
  document.getElementById("cles").innerHTML = PK.cles();
  const e = document.getElementById("ecran");
  if (etat.page === "combat") { e.innerHTML = PK.combat({ outils: false }); PK.scene(e); }
  else e.innerHTML = `<div class="titre-page"><h1>${PK.titres[etat.page]}</h1></div>` + PK.page(etat.page);
  e.scrollTop = 0;
  document.getElementById("bas").innerHTML = bande();
  if (etat.ouvert) {
    c.innerHTML = `<div class="voile" data-go="bascule"></div>
      <div class="pile" role="menu" aria-label="Destinations">${dest.map(([id, t]) => {
        const ferme = id === "pc" && !PK.etat.pcOuvert;
        return `<button type="button" role="menuitem" class="plaque ${ferme ? "ferme" : ""}" data-go="${id}" ${etat.page === id ? 'aria-current="page" aria-pressed="true"' : ""}><span>${t}${ferme ? '<small class="doux">Après Argenta</small>' : ""}</span>${PK.ic(ferme ? "cadenas" : id)}${id === "pc" && etat.nouveau ? '<span class="point"></span>' : ""}</button>`;
      }).join("")}</div>`;
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
  if (go === "bascule") etat.ouvert = !etat.ouvert;
  else { etat.ouvert = false; etat.page = go; if (go === "pc") etat.nouveau = false; }
  rendre();
});
rendre();
