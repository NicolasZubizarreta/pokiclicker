/* Variante B : barre dévoilée. 4 entrées au départ ; le PC s'ajoute à la barre quand il se débloque.
   Le reste (Pokédex, Badges, Mes parties, Réglages) est dans une fenêtre « Menu » ouverte depuis les chiffres clés. */
PK.suiteCles = `<button type="button" class="plaque" data-go="menu" aria-label="Menu">${PK.ic("menu")}</button>`;
const etat = { page: "combat", menu: false, nouveau: false };

function barre() {
  const e = [["combat", "Combat"], ["equipe", "Équipe"]];
  if (PK.etat.pcOuvert) e.push(["pc", "PC"]);
  e.push(["shop", "Shop"], ["carte", "Carte"]);
  return e.map(([id, t]) => `<button type="button" data-go="${id}" ${!etat.menu && etat.page === id ? 'aria-current="page"' : ""} class="${id === "pc" && etat.nouveau ? "rebond" : ""}">${PK.ic(id)}<span>${t}</span></button>`).join("");
}

function rendre() {
  const c = document.getElementById("couches"); c.innerHTML = "";
  document.getElementById("cles").innerHTML = PK.cles();
  document.getElementById("barre").innerHTML = barre();
  const e = document.getElementById("ecran");
  if (etat.page === "combat") { e.innerHTML = PK.combat(); PK.scene(e); }
  else e.innerHTML = `<div class="titre-page"><h1>${PK.titres[etat.page]}</h1></div>` + PK.page(etat.page);
  e.scrollTop = 0;
  if (etat.menu) {
    const bientot = PK.etat.pcOuvert ? "" : `<div class="explique">${PK.ic("cadenas")}<p><b>Bientôt : le PC de Léo.</b> Il apparaîtra dans la barre du bas après l'arène d'Argenta.</p></div>
      <button type="button" class="maquette" data-act="debloquer-pc">Maquette : simuler la victoire à l'arène d'Argenta</button>`;
    c.innerHTML = `<div class="voile" data-go="fermer"></div>
      <section class="fenetre cadre" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="tete"><h2>Menu</h2><button type="button" class="plaque" data-go="fermer" aria-label="Fermer">${PK.ic("croix")}</button></div>
        <div class="corps">${PK.aventure()}<div class="liste">${PK.lignesPlus({ avecPc: false })}</div>${bientot}</div>
      </section>`;
  }
}

document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]"), a = ev.target.closest("[data-act]");
  if (a) {
    if (a.dataset.act === "debloquer-pc") { PK.etat.pcOuvert = true; etat.nouveau = true; etat.menu = false; PK.toast("PC débloqué ! Il est dans la barre du bas."); }
    if (a.dataset.act === "verrouiller-pc") { PK.etat.pcOuvert = false; etat.nouveau = false; if (etat.page === "pc") etat.page = "combat"; }
    return rendre();
  }
  if (!g) return;
  const go = g.dataset.go;
  if (go === "menu") etat.menu = true;
  else if (go === "fermer") etat.menu = false;
  else if (["combat", "equipe", "shop", "carte", "pc"].includes(go)) { etat.page = go; etat.menu = false; if (go === "pc") etat.nouveau = false; }
  else { etat.menu = false; etat.page = go; }
  rendre();
});
rendre();
