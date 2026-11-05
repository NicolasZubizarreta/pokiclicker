/* Variante A : barre à cinq. Plus = feuille du bas (PC, Pokédex, Badges, Mes parties, Réglages). */
const pagesBarre = ["combat", "equipe", "shop", "carte"];
const etat = { page: "combat", sous: null, feuille: false };

function barre() {
  const entrees = [["combat", "Combat"], ["equipe", "Équipe"], ["shop", "Shop"], ["carte", "Carte"], ["plus", "Plus"]];
  return entrees.map(([id, t]) => {
    const sousPlus = ["pc", "pokedex", "badges", "parties", "reglages"].includes(etat.sous);
    const actif = id === "plus" ? (etat.feuille || sousPlus) : (!etat.feuille && !sousPlus && etat.page === id);
    const point = id === "plus" && PK.etat.pcOuvert && !PK.vu ? '<span class="point" title="Nouveau"></span>' : "";
    return `<button type="button" data-go="${id === "plus" ? "feuille" : id}" ${actif ? 'aria-current="page"' : ""}>${PK.ic(id)}<span>${t}</span>${point}</button>`;
  }).join("");
}

function rendre() {
  const c = document.getElementById("couches"); c.innerHTML = "";
  document.getElementById("cles").innerHTML = PK.cles();
  document.getElementById("barre").innerHTML = barre();
  const e = document.getElementById("ecran");
  if (etat.sous) {
    e.innerHTML = `<div class="titre-page"><button type="button" class="retour plaque" data-go="${["pc", "pokedex", "badges", "parties", "reglages"].includes(etat.sous) ? "feuille" : "retour"}" aria-label="Retour">${PK.ic("retour")}</button><h1>${PK.titres[etat.sous]}</h1></div>` + PK.page(etat.sous === "pc" ? "pc" : etat.sous);
  } else if (etat.page === "combat") {
    e.innerHTML = PK.combat(); PK.scene(e);
  } else {
    e.innerHTML = `<div class="titre-page"><h1>${PK.titres[etat.page]}</h1></div>` + PK.page(etat.page);
  }
  e.scrollTop = 0;
  if (etat.feuille) {
    c.innerHTML = `<div class="voile" data-go="fermer"></div>
      <section class="feuille cadre" role="dialog" aria-modal="true" aria-label="Plus">
        <div class="tete"><h2>Plus</h2><button type="button" class="plaque" data-go="fermer" aria-label="Fermer">${PK.ic("croix")}</button></div>
        <div class="liste">${PK.lignesPlus()}</div>
      </section>`;
  }
}

document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]"), a = ev.target.closest("[data-act]");
  if (a) {
    if (a.dataset.act === "debloquer-pc") { PK.etat.pcOuvert = true; PK.vu = false; PK.toast("PC débloqué ! Il est dans Plus."); rendre(); }
    if (a.dataset.act === "verrouiller-pc") { PK.etat.pcOuvert = false; rendre(); }
    return;
  }
  if (!g) return;
  const go = g.dataset.go;
  if (go === "fermer") { etat.feuille = false; }
  else if (go === "retour") { etat.sous = null; }
  else if (go === "feuille") { etat.feuille = true; etat.sous = null; }
  else if (pagesBarre.includes(go)) { etat.page = go; etat.sous = null; etat.feuille = false; }
  else if (go === "pc") { etat.sous = "pc"; etat.feuille = false; PK.vu = true; }
  else if (go === "equipe") { etat.page = "equipe"; etat.sous = null; }
  else { etat.sous = go; etat.feuille = false; }
  rendre();
});
rendre();
