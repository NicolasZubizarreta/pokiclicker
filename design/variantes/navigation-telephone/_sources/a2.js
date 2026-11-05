/* A2 : variante A corrigée. Une seule page navigable (a2-app.html) ; le fragment d'adresse choisit l'écran de départ.
   Contenu fictif. Carte : image et positions du dépôt (data/regions/kanto/carte-positions.json). */
Object.assign(PK.chemins, {
  monde: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18",
  valide: "m5 12 5 5 9-10",
  compte: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0",
  disque: "M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7",
});

const BALLS = [["poke-ball", "Poké Ball", 50], ["great-ball", "Super Ball", 12], ["ultra-ball", "Hyper Ball", 3]];
/* id, nom, x, y (fractions de l'image), ouverte */
const ZONES = [
  ["bourg-palette", "Bourg Palette", 0.167, 0.668, 1], ["route-1", "Route 1", 0.172, 0.597, 1], ["arene-de-jadielle", "Arène de Jadielle", 0.169, 0.523, 1],
  ["foret-de-jade", "Forêt de Jade", 0.151, 0.398, 1], ["arene-d-argenta", "Arène d'Argenta", 0.167, 0.269, 1], ["arene-de-celadopole", "Céladopole", 0.339, 0.412, 1],
  ["mont-selenite", "Mont Sélénite", 0.328, 0.222, 0], ["arene-d-azuria", "Arène d'Azuria", 0.477, 0.231, 0], ["pont-pepite", "Pont Pépite", 0.451, 0.19, 0],
  ["arene-de-carmin", "Arène de Carmin", 0.474, 0.579, 0], ["cave-taupiqueur", "Cave Taupiqueur", 0.534, 0.585, 0], ["tunnel-rocheux", "Tunnel Rocheux", 0.615, 0.194, 0],
  ["tour-pokemon", "Tour Pokémon", 0.618, 0.37, 0], ["centrale", "Centrale", 0.654, 0.269, 0], ["arene-de-parmanie", "Arène de Parmanie", 0.404, 0.755, 0],
  ["sylphe-sarl", "Sylphe SARL", 0.482, 0.37, 0], ["arene-de-safrania", "Arène de Safrania", 0.453, 0.426, 0], ["iles-ecume", "Îles Écume", 0.307, 0.847, 0],
  ["arene-de-cramois-ile", "Arène de Cramois'Île", 0.174, 0.838, 0], ["caverne-azuree", "Caverne Azurée", 0.49, 0.093, 0], ["route-victoire", "Route Victoire", 0.099, 0.269, 0],
  ["ligue-pokemon", "Ligue Pokémon", 0.083, 0.116, 0],
].map(([id, nom, x, y, ouverte], i) => ({ id, nom, x, y, ouverte: !!ouverte, n: i + 1 }));
const Z = (id) => ZONES.find((z) => z.id === id);
const OUVERTES = ZONES.filter((z) => z.ouverte);

const SAC = [
  ["rare-candy", "Bonbon rare", 5, "+1 niveau", true], ["thunder-stone", "Pierre Foudre", 2, "Fait évoluer Pikachu", true], ["water-stone", "Pierre Eau", 1, "Fait évoluer un Pokémon d'eau", true],
  ["repel", "Repousse", 12, "Moins de rencontres, 15 s", false], ["x-attack", "Attaque +", 8, "Dégâts ×1,5 pendant 30 s", false],
];
const EQUIPE = [["1", "Florizarre", 9420], ["4", "Dracaufeu", 8910], ["16", "Roucool", 5120], ["25", "Pikachu", 8300], ["26", "Raichu", 7615], ["21", "Piafabec", 5000]];
const SHOP = {
  balls: [["poke-ball", "Poké Ball", "Une chance de capturer", 200], ["great-ball", "Super Ball", "Capture plus sûre", 600], ["ultra-ball", "Hyper Ball", "La meilleure des balles", 1200]],
  objets: [["repel", "Repousse", "Moins de rencontres, 15 s", 350], ["x-attack", "Attaque +", "Dégâts ×1,5 pendant 30 s", 800], ["rare-candy", "Bonbon rare", "+1 niveau", 4800], ["thunder-stone", "Pierre Foudre", "Fait évoluer Pikachu", 2100], ["water-stone", "Pierre Eau", "Fait évoluer un Pokémon d'eau", 2100]],
  accessoires: [["leftovers", "Restes", "Auto-clic au repos", 12000, true], ["PokeRadar", "Poké-Radar", "Repère les Pokémon rares de la zone", 25000, false]],
};
const ONGLETS = [["balls", "Poké Ball"], ["objets", "Objets"], ["accessoires", "Accessoires"]];
const REGIONS = ["Johto", "Hoenn", "Sinnoh", "Unys", "Kalos", "Alola", "Galar", "Paldea"];

const nf = (n) => PK.nf(n);
let A2 = {};
function depart(h) {
  A2 = { page: "combat", dispo: 1, sac: false, outils: false, dialogue: false, choix: null, cel: false, ball: 0, auto: true, clic: false, onglet: "balls",
    zone: "route-1", depuis: "menu", sauve: "il y a 2 min", tok: 0, enVol: false };
  const m = {
    "combat-2": () => { A2.dispo = 2; }, dialogue: () => { A2.dialogue = true; }, sac: () => { A2.sac = true; }, outils: () => { A2.outils = true; },
    equipe: () => { A2.page = "equipe"; }, "equipe-choix": () => { A2.page = "equipe"; A2.choix = "Bonbon rare"; },
    shop: () => { A2.page = "shop"; }, "shop-accessoires": () => { A2.page = "shop"; A2.onglet = "accessoires"; },
    carte: () => { A2.page = "carte"; }, celadopole: () => { A2.page = "carte"; A2.cel = true; }, vol: () => { A2.page = "carte"; A2.volAuto = "arene-d-argenta"; },
    menu: () => { A2.page = "menu"; }, parties: () => { A2.page = "parties"; }, monde: () => { A2.page = "monde"; }, reglages: () => { A2.page = "reglages"; },
  };
  (m[h] || (() => {}))();
}

/* ---------- blocs ---------- */
function cles() {
  const marques = Array.from({ length: 10 }, (_, i) => `<i class="${i === 0 ? "ici" : i === 9 ? "boss" : ""}"></i>`).join("");
  const z = Z(A2.zone), i = OUVERTES.indexOf(z);
  return `<header class="cles" aria-label="Chiffres clés">
    <div class="rang">
      <div class="cle large"><small>Pièces</small><b>${nf(PK.etat.pieces)}</b></div>
      <div class="cle"><small>DPS</small><b>${nf(40365)}</b></div>
      <div class="cle zone"><small>Zone</small><b>${z.nom}</b></div>
    </div>
    <div class="zone-ligne">
      <button type="button" class="nav-zone" data-act="zone-prec" aria-label="Zone précédente" ${i <= 0 ? 'aria-disabled="true"' : ""}>${PK.ic("retour")}</button>
      <div class="etapes centre" role="img" aria-label="Étape 1 sur 10">${marques}<span>1/10</span></div>
      <button type="button" class="nav-zone droite" data-act="zone-suiv" aria-label="Zone suivante" ${i >= OUVERTES.length - 1 ? 'aria-disabled="true"' : ""}>${PK.ic("retour")}</button>
    </div>
  </header>`;
}

function barre() {
  const actif = { combat: "combat", equipe: "equipe", pc: "equipe", shop: "shop", carte: "carte", monde: A2.depuis === "carte" ? "carte" : "menu" }[A2.page] || "menu";
  return [["combat", "Combat"], ["equipe", "Équipe"], ["shop", "Shop"], ["carte", "Carte"], ["menu", "Menu"]].map(([id, t]) =>
    `<button type="button" data-go="${id}" ${actif === id ? 'aria-current="page"' : ""}>${PK.ic(id)}<span>${t}</span>${id === "equipe" && PK.etat.pcOuvert && !A2.pcVu ? '<span class="point" title="Nouveau"></span>' : ""}</button>`).join("");
}

function scene() {
  return `<button type="button" class="scene cadre" id="scene" aria-label="Attaquer Rattata">
    <span class="info cadre"><span class="ligne"><span class="nom">Rattata</span><span>Niv. 2</span></span>
      <span class="pv" style="display:block"><i id="pv" style="--pv:${PK.etat.pv / PK.etat.pvMax * 100}%"></i></span>
      <span class="pv-txt" id="pvtxt">PV ${PK.etat.pv} / ${PK.etat.pvMax}</span></span>
    <span class="socle"></span><img class="rattata" src="${IMG}19.png" width="96" height="96" alt=""><span class="degat" id="degat">−412</span>
  </button>`;
}
function bande() {
  return `<div class="bande" aria-label="Ton équipe">${EQUIPE.map(([n]) => `<button type="button" data-go="equipe" aria-label="Pokémon ${n}, niveau 100"><img src="${IMG}${n}.png" width="96" height="96" alt=""><em>100</em></button>`).join("")}</div>`;
}
const plq = (ic, t, extra = "", attrs = "") => `<button type="button" class="plaque vertical ${extra}" ${attrs}>${PK.ic(ic)}${t}</button>`;

/* Disposition 1 : une ligne de capture (balle choisie + Capturer), puis quatre outils. */
function combat1() {
  const [b, nom, n] = BALLS[A2.ball];
  return `<div class="capture c1">
      <button type="button" class="plaque balle" data-act="ball" aria-label="Balle choisie : ${nom}, ${n}. Toucher pour changer"><img src="${IMG}${b}.png" width="30" height="30" alt=""><span>${nom}<br><small>×${n}</small></span></button>
      <button type="button" class="plaque action" data-act="capturer">${PK.ic("balle")}Capturer</button>
    </div>
    <div class="outils">
      ${plq("auto", "Attaque auto", "", `aria-pressed="${A2.auto}" data-act="auto"`)}
      ${plq("combat", "Clic auto", "", `aria-pressed="${A2.clic}" data-act="clic"`)}
      ${plq("sac", "Sac<span class=\"pastille\">82</span>", "", 'data-go="sac"')}
      ${plq("outils", "Outils", "", 'data-go="outils"')}
    </div>`;
}
/* Disposition 2 : les trois balles sur la ligne de capture, deux interrupteurs avec leur état, puis Sac et Outils. */
function combat2() {
  const balles = BALLS.map(([b, nom, n], i) => `<button type="button" class="plaque vertical" aria-pressed="${A2.ball === i}" data-act="ball-${i}" aria-label="${nom}, ${n}"><img src="${IMG}${b}.png" width="24" height="24" alt="">×${n}</button>`).join("");
  const tog = (ic, t, on, act) => `<button type="button" class="plaque tog" aria-pressed="${on}" data-act="${act}">${PK.ic(ic)}<span>${t}<br><small>${on ? "Activée" : "Arrêtée"}</small></span></button>`;
  return `<div class="capture c2">${balles}<button type="button" class="plaque action" data-act="capturer">${PK.ic("balle")}Capturer</button></div>
    <div class="sous-ligne deux">${tog("auto", "Attaque auto", A2.auto, "auto")}${tog("combat", "Clic auto", A2.clic, "clic")}</div>
    <div class="sous-ligne deux">
      <button type="button" class="plaque" data-go="sac">${PK.ic("sac")}Sac<span class="pastille">82</span></button>
      <button type="button" class="plaque" data-go="outils">${PK.ic("outils")}Outils</button>
    </div>`;
}
function ecranCombat() { return scene() + (A2.dispo === 1 ? combat1() : combat2()) + bande() + `<button type="button" class="maquette" data-act="dialogue">Maquette : montrer un dialogue de tuto</button>`; }

function ligneEquipe([n, nom, d]) {
  const choix = !!A2.choix;
  return `<button type="button" class="ligne-p" data-act="${choix ? "cible" : "fiche"}" data-nom="${nom}"><img class="sp" src="${IMG}${n}.png" width="96" height="96" alt=""><span class="corps"><span class="t">${nom}</span><br><span class="s">Niv. 100 · ${nf(d)} DPS</span><span class="xp" style="display:block"><i style="display:block;width:100%"></i></span></span>${choix ? '<span class="plaque action petite">Choisir</span>' : PK.ic("chevron")}</button>`;
}
function ecranEquipe() {
  const pc = PK.etat.pcOuvert;
  const ban = A2.choix ? `<div class="bandeau-choix" role="status"><p>${A2.choix} : touche un Pokémon</p><button type="button" class="plaque" data-act="annuler">${PK.ic("croix")}Annuler</button></div>` : "";
  const lignePc = `<button type="button" class="ligne-p ${pc ? "" : "ferme"}" data-go="pc">${PK.ic(pc ? "pc" : "cadenas")}<span class="corps"><span class="t">PC de Léo</span><br><span class="s">${pc ? "12 Pokémon rangés" : "Après l'arène d'Argenta"}</span></span>${PK.ic("chevron")}</button>`;
  return `${ban}<div class="titre-page"><h1>Équipe</h1></div><div class="liste ${A2.choix ? "choix" : ""}">${EQUIPE.map(ligneEquipe).join("")}</div>${A2.choix ? "" : lignePc}`;
}

function ligneShop([img, nom, eff, prix, possede]) {
  const ach = possede === true
    ? `<button type="button" class="plaque" disabled>Possédé</button>`
    : `<button type="button" class="plaque" data-act="acheter" data-nom="${nom}" aria-label="Acheter ${nom}, ${nf(prix)} pièces">${nf(prix)} PO</button>`;
  return `<div class="ligne-p ${possede === true ? "possede" : ""}"><img class="obj" src="${IMG}${img}.png" width="30" height="30" alt=""><div class="corps"><div class="t">${nom}</div><div class="s">${eff}</div></div>${ach}</div>`;
}
function ecranShop() {
  const onglets = ONGLETS.map(([id, t]) => `<button type="button" class="plaque" aria-pressed="${A2.onglet === id}" data-act="onglet-${id}">${t}</button>`).join("");
  const note = A2.onglet === "accessoires" ? `<p class="doux">Objets uniques : un seul achat, un bonus pour toujours.</p>` : A2.onglet === "objets" ? `<p class="doux">Objets à acheter autant de fois que tu veux.</p>` : "";
  return `<div class="titre-page"><h1>Shop</h1></div><div class="onglets" role="group" aria-label="Catégories">${onglets}</div>${note}<div class="liste">${SHOP[A2.onglet].map(ligneShop).join("")}</div>`;
}

function ecranCarte() {
  const liste = ZONES.map((z) => {
    const cur = z.id === A2.zone;
    return `<button type="button" class="ligne-p zone ${cur ? "actuelle" : ""} ${z.ouverte ? "" : "ferme"}" ${z.ouverte ? `data-act="zone" data-id="${z.id}"` : 'aria-disabled="true"'}>${cur ? '<span class="marque"></span>' : ""}<span class="corps"><span class="t">${z.nom}</span><br><span class="s">Zone ${z.n}${cur ? " · tu es ici" : z.id === "arene-de-celadopole" ? " · 3 lieux" : z.ouverte ? "" : " · fermée"}</span></span>${z.ouverte ? PK.ic("chevron") : ""}</button>`;
  }).join("");
  const cercles = ZONES.map((z) => `<span class="cercle ${z.ouverte ? "" : "ferme"} ${z.id === A2.zone ? "actuel" : ""}" style="left:${z.x * 100}%;top:${z.y * 100}%"></span>`).join("");
  return `<div class="titre-page"><h1>Carte</h1><button type="button" class="plaque" data-go="monde">${PK.ic("monde")}Monde Pokémon</button></div>
    <div class="carte-page"><div class="liste-zones" id="liste-zones" tabindex="0" aria-label="Zones de Kanto">${liste}</div>
    <div class="mini-carte cadre" id="mini" role="img" aria-label="Carte de Kanto. Zone actuelle en vert."><img src="img/carte-kanto.webp" alt="" width="1920" height="1080">${cercles}</div></div>`;
}

function ecranMenu() {
  const row = (go, ic, t, s) => `<button type="button" class="ligne-p" data-go="${go}">${PK.ic(ic)}<span class="corps"><span class="t">${t}</span><br><span class="s">${s}</span></span>${PK.ic("chevron")}</button>`;
  return `<div class="titre-page"><h1>Menu</h1></div>
    <section class="partie-active cadre" aria-label="Partie en cours">
      <small class="doux">Partie en cours</small><p class="nom">Partie de Léo</p>
      <dl class="infos"><dt>Temps de jeu</dt><dd>12 h 34</dd><dt>Dernière sauvegarde</dt><dd>${A2.sauve}</dd></dl>
      <p class="etat-sauve">${PK.ic("valide")}Sauvegardée en ligne</p>
      <button type="button" class="plaque action" data-act="sauver">${PK.ic("disque")}Sauvegarder maintenant</button>
    </section>
    <div class="liste">
      ${row("parties", "parties", "Mes parties", "2 parties")}
      ${row("monde", "monde", "Monde Pokémon", "Kanto jouable")}
      ${row("a-venir", "pokedex", "Pokédex", "47 vus sur 151")}
      ${row("a-venir", "badge", "Badges", "0 sur 8")}
      ${row("reglages", "reglages", "Réglages", "Son, thème, arrêt auto")}
    </div>
    <section class="compte cadre" aria-label="Compte"><div class="ligne-compte">${PK.ic("compte")}<span class="corps"><b>leo@exemple.fr</b><br><span class="doux">Compte connecté · synchro en ligne</span></span></div>
      <button type="button" class="plaque" data-act="deco">Se déconnecter</button></section>`;
}
function ecranParties() {
  const p = (nom, reg, temps, sauve, dex, cur) => `<button type="button" class="partie cadre ${cur ? "en-cours" : ""}" data-go="monde"><span class="nom">${nom}${cur ? ' <span class="tag">En cours</span>' : ""}</span>
    <dl><dt>Région</dt><dd>${reg}</dd><dt>Temps de jeu</dt><dd>${temps}</dd><dt>Dernière sauvegarde</dt><dd>${sauve}</dd><dt>Pokédex</dt><dd>${dex}</dd></dl></button>`;
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="menu" aria-label="Retour">${PK.ic("retour")}</button><h1>Mes parties</h1></div>
    <p class="doux">Touche une partie pour arriver sur le monde.</p>
    ${p("Partie de Léo", "Kanto · Route 1", "12 h 34", A2.sauve, "47/151", true)}${p("Partie test", "Kanto · Forêt de Jade", "3 h 02", "hier, 21 h 10", "18/151", false)}
    <button type="button" class="partie nouvelle cadre" data-act="nouvelle">${PK.ic("parties")}Nouvelle partie</button>`;
}
function ecranMonde() {
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="${A2.depuis}" aria-label="Retour">${PK.ic("retour")}</button><h1>Monde Pokémon</h1></div>
    <p class="doux">Choisis la région où tu veux jouer.</p>
    <button type="button" class="monde-kanto cadre" data-act="region-kanto" aria-label="Jouer à Kanto"><img src="img/carte-kanto.webp" alt="" width="1920" height="1080">
      <span class="legende"><b>Kanto</b><span class="tag">Jouable</span></span></button>
    <div class="regions">${REGIONS.map((r) => `<div class="region">${PK.ic("cadenas")}<p><b>${r}</b><small>Bientôt</small></p></div>`).join("")}</div>`;
}
function ecranReglages() {
  const r = (t, v, on) => `<div class="reglage"><span>${t}</span><button type="button" class="plaque" aria-pressed="${on}" data-act="regl">${v}</button></div>`;
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="menu" aria-label="Retour">${PK.ic("retour")}</button><h1>Réglages</h1></div>
    <div class="liste">${r("Effets sonores", "Activés", true)}${r("Musique", "Activée", true)}${r("Thème", "Sombre", true)}${r("Arrêt auto", "Activé", true)}</div>`;
}

function ecranPc() {
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="equipe" aria-label="Retour">${PK.ic("retour")}</button><h1>PC de Léo</h1></div>${PK.pc()}`;
}

/* ---------- couches ---------- */
function couches() {
  let h = "";
  if (A2.sac) {
    const l = SAC.map(([i, nom, n, eff, cible]) => `<div class="ligne-p"><img class="obj" src="${IMG}${i}.png" width="30" height="30" alt=""><div class="corps"><div class="t">${nom} <span class="doux">×${n}</span></div><div class="s">${eff}${cible ? " · sur un Pokémon" : ""}</div></div><button type="button" class="plaque" data-act="utiliser" data-nom="${nom}" data-cible="${cible ? 1 : 0}">Utiliser</button></div>`).join("");
    h += `<div class="voile" data-act="fermer"></div><section class="fenetre sac cadre" role="dialog" aria-modal="true" aria-label="Sac"><div class="tete"><h2>Sac</h2><button type="button" class="plaque" data-act="fermer" aria-label="Fermer">${PK.ic("croix")}</button></div><div class="corps"><div class="liste">${l}</div></div></section>`;
  }
  if (A2.outils) {
    const r = (t, s, v, on) => `<div class="reglage"><span><b>${t}</b><br><span class="doux">${s}</span></span><button type="button" class="plaque" aria-pressed="${on}" data-act="regl">${v}</button></div>`;
    h += `<div class="voile" data-act="fermer"></div><section class="feuille cadre" role="dialog" aria-modal="true" aria-label="Outils"><div class="tete"><h2>Outils</h2><button type="button" class="plaque" data-act="fermer" aria-label="Fermer">${PK.ic("croix")}</button></div>
      <div class="liste">${r("Arrêt auto", "Coupe l'auto si le Pokémon est trop faible", "Activé", true)}${r("Arrêter après", "Durée sans capture", "10 min", false)}
      <div class="ligne-p ferme"><img class="obj" src="${IMG}PokeRadar.png" width="30" height="30" alt=""><span class="corps"><span class="t">Poké-Radar</span><br><span class="s">Bientôt</span></span></div>
      <div class="ligne-p ferme">${PK.ic("combat")}<span class="corps"><span class="t">Fauchage</span><br><span class="s">Bientôt</span></span></div></div></section>`;
  }
  if (A2.dialogue) {
    h += `<div class="voile" data-act="fermer"></div><section class="dialogue cadre" role="dialog" aria-modal="true" aria-label="Prof. Chen"><img src="${IMG}chen-1.png" width="120" height="120" alt="">
      <div><p class="pixel">Prof. Chen</p><p>Un Pokémon sauvage ! Touche-le pour l'attaquer. Quand il est affaibli, lance une Poké Ball.</p></div>
      <button type="button" class="plaque action" data-act="fermer">Compris <span class="fleche" aria-hidden="true">▸</span></button></section>`;
  }
  if (A2.cel) {
    const l = ["Arène", "Centre commercial", "Casino"].map((t) => `<button type="button" class="plaque" data-act="lieu" data-lieu="${t}">${t}${PK.ic("chevron")}</button>`).join("");
    h += `<div class="voile" data-act="fermer"></div><div class="centre-modal"><section class="modal cadre" role="dialog" aria-modal="true" aria-label="Céladopole"><div class="tete"><h2>Céladopole</h2><button type="button" class="plaque" data-act="fermer" aria-label="Fermer">${PK.ic("croix")}</button></div><p class="doux">Où veux-tu aller ?</p>${l}</section></div>`;
  }
  return h;
}

/* ---------- rendu ---------- */
function rendre() {
  document.getElementById("cles").innerHTML = cles();
  document.getElementById("barre").innerHTML = barre();
  const e = document.getElementById("ecran");
  const f = { combat: ecranCombat, equipe: ecranEquipe, pc: ecranPc, shop: ecranShop, carte: ecranCarte, menu: ecranMenu, parties: ecranParties, monde: ecranMonde, reglages: ecranReglages }[A2.page];
  e.innerHTML = f();
  e.classList.toggle("plein", A2.page === "carte");
  e.scrollTop = 0;
  document.getElementById("couches").innerHTML = couches();
  const s = e.querySelector("#scene");
  if (s) s.addEventListener("click", () => {
    s.classList.remove("coup"); void s.offsetWidth; s.classList.add("coup");
    PK.etat.pv -= 12; if (PK.etat.pv <= 0) PK.etat.pv = PK.etat.pvMax;
    e.querySelector("#pv").style.setProperty("--pv", (PK.etat.pv / PK.etat.pvMax * 100) + "%");
    e.querySelector("#pvtxt").textContent = `PV ${PK.etat.pv} / ${PK.etat.pvMax}`;
  });
}

function lancerVol(id, lieu) {
  const carte = document.getElementById("mini"); if (!carte || A2.enVol) return;
  A2.enVol = true; const tok = A2.tok;
  const w = carte.clientWidth, h = carte.clientHeight, a = Z(A2.zone), b = Z(id);
  const act = carte.querySelector(".cercle.actuel"); if (act) act.style.opacity = "0";
  const v = document.createElement("span"); v.className = "vol"; v.style.transform = `translate(${a.x * w}px, ${a.y * h}px)`;
  carte.appendChild(v); document.getElementById("liste-zones").classList.add("vole");
  void v.offsetWidth; v.style.transform = `translate(${b.x * w}px, ${b.y * h}px)`;
  setTimeout(() => {
    A2.enVol = false; if (tok !== A2.tok) return;
    A2.zone = id; A2.page = "combat"; rendre(); PK.toast(`Zone : ${b.nom}${lieu ? " · " + lieu : ""}`);
  }, 1150);
}
function voisine(sens) { const i = OUVERTES.indexOf(Z(A2.zone)) + sens; if (OUVERTES[i]) { A2.zone = OUVERTES[i].id; rendre(); } }

document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]"), a = ev.target.closest("[data-act]");
  if (a && !a.closest("[aria-disabled=true]")) {
    const act = a.dataset.act; A2.tok++;
    if (act === "fermer") { A2.sac = A2.outils = A2.dialogue = A2.cel = false; }
    else if (act === "ball") A2.ball = (A2.ball + 1) % BALLS.length;
    else if (act.startsWith("ball-")) A2.ball = Number(act.slice(5));
    else if (act === "capturer") { PK.toast(`${BALLS[A2.ball][1]} lancée !`); return; }
    else if (act === "auto") A2.auto = !A2.auto;
    else if (act === "clic") A2.clic = !A2.clic;
    else if (act === "dialogue") A2.dialogue = true;
    else if (act === "regl") { a.setAttribute("aria-pressed", a.getAttribute("aria-pressed") !== "true"); return; }
    else if (act === "utiliser") {
      A2.sac = false;
      if (a.dataset.cible === "1") { A2.choix = a.dataset.nom; A2.page = "equipe"; } else PK.toast(`${a.dataset.nom} utilisé`);
    }
    else if (act === "annuler") { A2.choix = null; A2.page = "combat"; A2.sac = true; }
    else if (act === "cible") { PK.toast(`${A2.choix} utilisé sur ${a.dataset.nom}`); A2.choix = null; A2.page = "combat"; }
    else if (act === "fiche") { PK.toast(`Fiche de ${a.dataset.nom} : hors périmètre`); return; }
    else if (act.startsWith("onglet-")) A2.onglet = act.slice(7);
    else if (act === "acheter") { PK.toast(`${a.dataset.nom} acheté`); return; }
    else if (act === "zone-prec") return voisine(-1);
    else if (act === "zone-suiv") return voisine(1);
    else if (act === "zone") {
      if (A2.enVol) return;
      if (a.dataset.id === "arene-de-celadopole") { A2.cel = true; } else { return lancerVol(a.dataset.id); }
    }
    else if (act === "lieu") { const lieu = a.dataset.lieu; A2.cel = false; rendre(); return lancerVol("arene-de-celadopole", lieu); }
    else if (act === "sauver") { A2.sauve = "à l'instant"; PK.toast("Partie sauvegardée"); }
    else if (act === "deco") { PK.toast("Déconnexion : hors périmètre"); return; }
    else if (act === "nouvelle") { PK.toast("Nouvelle partie : hors périmètre"); return; }
    else if (act === "region-kanto") { A2.page = "combat"; A2.choix = null; rendre(); PK.toast("Kanto : retour à Route 1"); return; }
    else if (act === "debloquer-pc") { PK.etat.pcOuvert = true; A2.pcVu = false; PK.toast("PC débloqué ! Il est dans Équipe."); }
    else if (act === "verrouiller-pc") PK.etat.pcOuvert = false;
    return rendre();
  }
  if (!g) return;
  const go = g.dataset.go; A2.tok++; A2.choix = null;
  if (go === "sac") A2.sac = true;
  else if (go === "outils") A2.outils = true;
  else if (go === "a-venir") { PK.toast("Cet écran n'est pas dans cette maquette"); return; }
  else {
    if (go === "monde") A2.depuis = A2.page === "carte" ? "carte" : "menu";
    if (go === "pc") A2.pcVu = true;
    A2.page = go; A2.sac = A2.outils = A2.dialogue = A2.cel = false;
  }
  rendre();
});

function demarrer() {
  depart(location.hash.slice(1)); rendre();
  if (A2.volAuto) setTimeout(() => lancerVol(A2.volAuto), 400);
}
window.addEventListener("hashchange", demarrer);
demarrer();
