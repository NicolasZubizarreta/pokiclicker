/* A5 : A4 corrigée (bandeau de zone seulement au combat, tri DPS, fiche : Favori, sexe, couleurs de types). A4 : A3 corrigée (retours de Nicolas) + PC, Pokédex, Badges, Guide, Statistiques. Une seule page navigable (a4-app.html) ; le fragment d'adresse choisit l'écran de départ.
   Contenu fictif. Carte : image et positions du dépôt (data/regions/kanto/carte-positions.json). Monnaie : Pokédollar, ₽. */
Object.assign(PK.chemins, {
  monde: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18",
  valide: "m5 12 5 5 9-10",
  compte: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0",
  disque: "M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7",
  stop: "M6 6h12v12H6z",
  reglage: "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6h4V4zM6 14v6h4v-6z",
  sortie: "M10 3H4v18h6M15 7l5 5-5 5M20 12H9",
  ajout: "M12 5v14M5 12h14",
  crayon: "M4 20l1-4L16 5l3 3L8 19zM14 7l3 3",
  corbeille: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",
  oeil: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  diamant: "M6 3h12l4 6-10 12L2 9zM2 9h20M9 3 7 9l5 12 5-12-2-6",
  nuage: "M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 19 18z",
  alerte: "M12 3 2 21h20zM12 10v5M12 18h.01",
  telephone: "M7 2h10v20H7zM11 18h2",
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
/* Équipe : numéros de Pokédex exacts (en A3, Florizarre et Dracaufeu portaient le sprite de Bulbizarre et de Salamèche) */
const EQUIPE0 = [["3", "Florizarre", 9420], ["6", "Dracaufeu", 8910], ["16", "Roucool", 5120], ["25", "Pikachu", 8300], ["26", "Raichu", 7615], ["21", "Piafabec", 5000]];
const EQUIPE = EQUIPE0.map((x) => [...x]);
const SHOP = {
  balls: [["poke-ball", "Poké Ball", "Une chance de capturer", 200], ["great-ball", "Super Ball", "Capture plus sûre", 600], ["ultra-ball", "Hyper Ball", "La meilleure des balles", 1200]],
  objets: [["repel", "Repousse", "Moins de rencontres, 15 s", 350], ["x-attack", "Attaque +", "Dégâts ×1,5 pendant 30 s", 800], ["rare-candy", "Bonbon rare", "+1 niveau", 4800], ["thunder-stone", "Pierre Foudre", "Fait évoluer Pikachu", 2100], ["water-stone", "Pierre Eau", "Fait évoluer un Pokémon d'eau", 2100]],
  accessoires: [["leftovers", "Restes", "Auto-clic au repos", 12000, true], ["PokeRadar", "Poké-Radar", "Repère les Pokémon rares de la zone", 25000, false]],
};
const ONGLETS = [["balls", "Poké Ball"], ["objets", "Objets"], ["accessoires", "Accessoires"]];
const REGIONS = ["Johto", "Hoenn", "Sinnoh", "Unys", "Kalos", "Alola", "Galar", "Paldea"];
/* Arrêt auto : les sept raisons d'arrêt de data/reglages.json (depart.preferences.arretAuto) */
const ARRETS = [["commun", "Pokémon commun", false], ["peuCommun", "Pokémon peu commun", false], ["rare", "Pokémon rare", true], ["tresRare", "Pokémon très rare", true], ["legendaire", "Pokémon légendaire", true], ["shiny", "Pokémon chromatique", true], ["nouveau", "Nouveau Pokémon (pas encore au Pokédex)", true]];
/* Plus d'état « deux versions » : une seule sauvegarde par partie (retour de Nicolas) */
const SYNCS = { ajour: ["À jour", "Sauvegardée en ligne"], cours: ["Synchronisation en cours", "Sauvegarde en cours…"], hors: ["Hors connexion", "Hors connexion : sauvegardée sur cet appareil"] };
const TAGS = { ajour: ["À jour", ""], cours: ["Synchronisation en cours", "info"], local: ["Sur cet appareil seulement", "alerte"], supprimee: ["Supprimée ailleurs", "erreur"], ailleurs: ["Ouverte ailleurs", "info"] };
const COMPTE_BARRE = [["c-parties", "Parties", "parties"], ["c-compte", "Compte", "compte"], ["c-reglages", "Réglages", "reglages"]];
const SUCCES = [["Premiers pas", "Attrape ton premier Pokémon", 5, true], ["Premier badge", "Gagne un badge d'arène", 5, true], ["Collectionneur", "Enregistre 25 Pokémon dans ton Pokédex", 10, false]];

const nf = (n) => PK.nf(n);
const pd = (n) => nf(n) + " ₽";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let S = {};
const partiesDepart = () => [
  { id: 1, nom: "Partie de Léo", lieu: "Kanto · Route 1", temps: "12 h 34", sauve: "il y a 2 min", etat: "ajour" },
  { id: 2, nom: "Partie test", lieu: "Kanto · Forêt de Jade", temps: "3 h 02", sauve: "hier, 21 h 10", etat: "ailleurs" },
  { id: 3, nom: "Partie du week-end", lieu: "Kanto · Céladopole", temps: "6 h 48", sauve: "samedi, 18 h 20", etat: "supprimee" },
];
const PC_OUVERT = ["pc", "pc-vide", "pc-recherche", "pc-sans-resultat", "pc-fiche", "pc-fiche-shiny", "pc-fiche-oeuf", "pc-fiche-dernier", "pc-renommer", "pc-relacher", "pc-echange", "equipe-pc", "equipe-fiche"];
function depart(h) {
  EQUIPE.splice(0, EQUIPE.length, ...EQUIPE0.map((x) => [...x]));
  PK.etat.pcOuvert = PC_OUVERT.includes(h);
  S = { pc: pcDepart(), pcTri: "dps", pcQ: "", pcFav: false, pcShiny: false, pcOeuf: false, fiche: null, renom: false, renomErr: false, relacher: false, ficheErr: "", echange: null, echangeErr: "", favEq: {},
    dexQ: "", dexF: "tous", dexSel: null, dexComplet: false, paliersOuv: false, diplomeOuv: false, badgesObt: ["roche"], badgeSel: null, guideOuv: "parcours", deco: null, garde: false,
    page: "combat", sac: false, reglAuto: false, dialogue: false, choix: null, cel: false, ball: 0, auto: true, arret: true, lie: true, deb: false,
    onglet: "balls", zone: "route-1", depuis: "menu", sauve: "il y a 2 min", tok: 0, enVol: false, sync: "ajour", cx: null, ins: false,
    parties: partiesDepart(), modal: null, cible: null, skin: false, hors: false,
    mus: { on: true, v: 70 }, fx: { on: true, v: 80 }, arrets: Object.fromEntries(ARRETS.map(([k, , on]) => [k, on])) };
  const m = {
    "combat-debloque": () => { S.deb = true; }, dialogue: () => { S.dialogue = true; }, "reglage-auto": () => { S.reglAuto = true; }, sac: () => { S.sac = true; },
    equipe: () => { S.page = "equipe"; }, "equipe-choix": () => { S.page = "equipe"; S.choix = "Bonbon rare"; },
    shop: () => { S.page = "shop"; }, "shop-accessoires": () => { S.page = "shop"; S.onglet = "accessoires"; },
    carte: () => { S.page = "carte"; }, celadopole: () => { S.page = "carte"; S.cel = true; }, vol: () => { S.page = "carte"; S.volAuto = "arene-d-argenta"; },
    menu: () => { S.page = "menu"; }, monde: () => { S.page = "monde"; }, reglages: () => { S.page = "reglages"; },
    "c-connexion": () => { S.page = h; }, "c-connexion-erreur": () => { S.page = "c-connexion"; S.cx = "erreur"; }, "c-connexion-session": () => { S.page = "c-connexion"; S.cx = "session"; },
    "c-inscription": () => { S.page = h; }, "c-inscription-erreur": () => { S.page = "c-inscription"; S.ins = true; },
    "c-oubli": () => { S.page = h; }, "c-oubli-envoye": () => { S.page = h; }, "c-nouveau": () => { S.page = h; },
    "c-parties": () => { S.page = h; }, "c-parties-vide": () => { S.page = "c-parties"; S.parties = []; },
    "c-parties-hors-ligne": () => { S.page = "c-parties"; S.hors = true; S.sync = "hors"; },
    "c-nouvelle": () => { S.page = h; }, "c-renommer": () => { S.page = "c-parties"; S.modal = { type: "renommer", id: 1 }; },
    "c-supprimer": () => { S.page = "c-parties"; S.modal = { type: "supprimer", id: 2 }; },
    "c-ailleurs": () => { S.page = h; S.cible = 2; }, "c-reprise-ailleurs": () => { S.page = h; S.cible = 2; }, "c-supprimee": () => { S.page = h; S.cible = 3; },
    "c-compte": () => { S.page = h; }, "c-deconnexion": () => { S.page = "c-compte"; S.sync = "cours"; S.modal = { type: "deco" }; }, "c-reglages": () => { S.page = h; },
    "c-deconnexion-chargement": () => { S.page = "c-compte"; S.sync = "cours"; S.deco = "charge"; }, "c-deconnexion-echec": () => { S.page = "c-compte"; S.sync = "cours"; S.deco = "echec"; },
    /* A4 : PC, fiche, Pokédex, Badges, Statistiques, Guide */
    "pc": () => { S.page = "pc"; }, "pc-verrouille": () => { S.page = "pc"; }, "pc-vide": () => { S.page = "pc"; S.pc = []; }, "pc-recherche": () => { S.page = "pc"; S.pcQ = "ra"; },
    "pc-sans-resultat": () => { S.page = "pc"; S.pcQ = "dracaufeu"; }, "pc-fiche": () => { S.page = "pc"; S.fiche = { src: "pc", id: 6 }; }, "pc-fiche-shiny": () => { S.page = "pc"; S.fiche = { src: "pc", id: 5 }; },
    "pc-fiche-oeuf": () => { S.page = "pc"; S.fiche = { src: "pc", id: 12 }; }, "pc-fiche-dernier": () => { EQUIPE.splice(1); S.page = "equipe"; S.fiche = { src: "eq", i: 0 }; },
    "pc-renommer": () => { S.page = "pc"; S.fiche = { src: "pc", id: 3 }; S.renom = true; }, "pc-relacher": () => { S.page = "pc"; S.fiche = { src: "pc", id: 3 }; S.relacher = true; },
    "pc-echange": () => { S.page = "pc"; S.echange = 6; }, "equipe-pc": () => { S.page = "equipe"; }, "equipe-fiche": () => { S.page = "equipe"; S.fiche = { src: "eq", i: 0 }; },
    "pokedex": () => { S.page = "pokedex"; }, "pokedex-detail": () => { S.page = "pokedex"; S.dexSel = 25; }, "pokedex-inconnu": () => { S.page = "pokedex"; S.dexSel = 12; },
    "pokedex-recherche": () => { S.page = "pokedex"; S.dexQ = "pi"; }, "pokedex-paliers": () => { S.page = "pokedex"; S.paliersOuv = true; }, "pokedex-a-trouver": () => { S.page = "pokedex"; S.dexF = "manquants"; },
    "pokedex-complet": () => { S.page = "pokedex"; S.dexComplet = true; }, "pokedex-diplome": () => { S.page = "pokedex"; S.dexComplet = true; S.diplomeOuv = true; },
    "badges": () => { S.page = "badges"; }, "badges-detail": () => { S.page = "badges"; S.badgeSel = "roche"; }, "badges-detail-manque": () => { S.page = "badges"; S.badgeSel = "cascade"; },
    "badges-aucun": () => { S.page = "badges"; S.badgesObt = []; }, "badges-tous": () => { S.page = "badges"; S.badgesObt = BADGES.map((b) => b[0]); },
    "stats": () => { S.page = "stats"; }, "guide": () => { S.page = "guide"; }, "guide-pc": () => { S.page = "guide"; S.guideOuv = "pc"; },
  };
  (m[h] || (() => {}))();
}
const enCompte = () => S.page.startsWith("c-");
const partie = (id) => S.parties.find((p) => p.id === id);

/* ---------- jeu : bandeau, barre ---------- */
function cles() {
  if (enCompte()) return "";
  const marques = Array.from({ length: 10 }, (_, i) => `<i class="${i === 0 ? "ici" : i === 9 ? "boss" : ""}"></i>`).join("");
  const z = Z(S.zone), i = OUVERTES.indexOf(z);
  return `<header class="cles" aria-label="Chiffres clés">
    <div class="rang">
      <div class="cle"><small>Pokédollars</small><b>${pd(PK.etat.pieces)}</b></div>
      <div class="cle"><small>DPS</small><b>${nf(40368)}</b></div>
      <div class="cle"><small>Zone</small><b>${z.nom}</b></div>
    </div>
    <span class="synchro ${S.sync}" role="img" aria-label="Synchronisation : ${SYNCS[S.sync][0]}"></span>
    ${S.page === "combat" ? `<div class="zone-ligne">
      <button type="button" class="nav-zone" data-act="zone-prec" aria-label="Zone précédente" ${i <= 0 ? 'aria-disabled="true"' : ""}>${PK.ic("retour")}</button>
      <div class="etapes centre" role="img" aria-label="Étape 1 sur 10">${marques}<span>1/10</span></div>
      <button type="button" class="nav-zone droite" data-act="zone-suiv" aria-label="Zone suivante" ${i >= OUVERTES.length - 1 ? 'aria-disabled="true"' : ""}>${PK.ic("retour")}</button>
    </div>` : ""}
  </header>`;
}
function barre() {
  if (enCompte()) {
    if (!COMPTE_BARRE.some(([id]) => id === S.page)) return "";
    return COMPTE_BARRE.map(([id, t, ic]) => `<button type="button" data-go="${id}" ${S.page === id ? 'aria-current="page"' : ""}>${PK.ic(ic)}<span>${t}</span></button>`).join("");
  }
  const actif = { combat: "combat", equipe: "equipe", pc: "equipe", shop: "shop", carte: "carte", monde: S.depuis === "carte" ? "carte" : "menu" }[S.page] || "menu";
  return [["combat", "Combat"], ["equipe", "Équipe"], ["shop", "Shop"], ["carte", "Carte"], ["menu", "Menu"]].map(([id, t]) =>
    `<button type="button" data-go="${id}" ${actif === id ? 'aria-current="page"' : ""}>${PK.ic(id)}<span>${t}</span>${id === "equipe" && PK.etat.pcOuvert && !S.pcVu ? '<span class="point" title="Nouveau"></span>' : ""}</button>`).join("");
}

/* ---------- combat ---------- */
function scene() {
  return `<button type="button" class="scene cadre" id="scene" aria-label="Attaquer Rattata">
    <span class="info cadre"><span class="ligne"><span class="nom">Rattata</span><span>Niv. 2</span></span>
      <span class="pv" style="display:block"><i id="pv" style="--pv:${PK.etat.pv / PK.etat.pvMax * 100}%"></i></span>
      <span class="pv-txt" id="pvtxt">PV ${PK.etat.pv} / ${PK.etat.pvMax}</span></span>
    <span class="socle"></span><img class="rattata" src="${IMG}19.png" width="96" height="96" alt=""><span class="degat" id="degat">−412</span>
  </button>`;
}
function bande() {
  return `<div class="bande" aria-label="Ton équipe">${EQUIPE.map(([n]) => `<button type="button" data-go="equipe" aria-label="Pokémon ${n}, niveau 100"><img src="${SPR}${n}.png" width="96" height="96" alt=""><em>100</em></button>`).join("")}</div>`;
}
const plq = (ic, t, attrs = "", extra = "") => `<button type="button" class="plaque vertical" ${attrs}>${PK.ic(ic)}<span class="t">${t}</span>${extra}</button>`;
function ecranCombat() {
  const [b, nom, n] = BALLS[S.ball];
  const deb = S.deb ? `<div class="debloques">
      <button type="button" class="plaque" data-act="fauchage">${PK.ic("combat")}Fauchage</button>
      <button type="button" class="plaque" data-act="radar"><img src="${IMG}PokeRadar.png" width="30" height="30" alt="">Poké-Radar</button></div>` : "";
  return scene() + `<div class="capture c1">
      <button type="button" class="plaque balle" data-act="ball" aria-label="Balle choisie : ${nom}, ${n}. Toucher pour changer"><img src="${IMG}${b}.png" width="30" height="30" alt=""><span>${nom}<br><small>×${n}</small></span></button>
      <button type="button" class="plaque action" data-act="capturer">${PK.ic("balle")}Capturer</button>
    </div>
    <div class="outils4">
      ${plq("auto", "Attaque auto", `aria-pressed="${S.auto}" data-act="auto"`)}
      ${plq("stop", "Arrêt auto", `aria-pressed="${S.arret}" data-act="arret"`)}
      ${plq("reglage", "Réglage", 'data-go="reglAuto" aria-label="Réglage arrêt auto"')}
      ${plq("sac", "Sac", 'data-go="sac"', '<span class="pastille">82</span>')}
    </div>${deb}${bande()}
    <div class="lot-maquette">
      <button type="button" class="maquette" data-act="deb">${S.deb ? "Maquette : revenir à l'état de base (Fauchage et Poké-Radar cachés)" : "Maquette : débloquer Fauchage et Poké-Radar"}</button>
      <button type="button" class="maquette" data-act="dialogue">Maquette : montrer un dialogue de tuto</button>
    </div>`;
}

function ligneEquipe([n, nom, d], i) {
  const choix = !!S.choix;
  return `<button type="button" class="ligne-p" data-act="${choix ? "cible" : "fiche-eq"}" data-nom="${nom}" data-i="${i}"><img class="sp" src="${SPR}${n}.png" width="96" height="96" alt=""><span class="corps"><span class="t">${nom}</span><br><span class="s">Niv. 100 · ${nf(d)} DPS</span><span class="xp" style="display:block"><i style="display:block;width:100%"></i></span></span>${choix ? '<span class="plaque action petite">Choisir</span>' : PK.ic("chevron")}</button>`;
}
function ecranEquipe() {
  const pc = PK.etat.pcOuvert;
  const ban = S.choix ? `<div class="bandeau-choix" role="status"><p>${S.choix} : touche un Pokémon</p><button type="button" class="plaque" data-act="annuler">${PK.ic("croix")}Annuler</button></div>` : "";
  const lignePc = `<button type="button" class="ligne-p ${pc ? "" : "ferme"}" data-go="pc">${PK.ic(pc ? "pc" : "cadenas")}<span class="corps"><span class="t">PC de Léo</span><br><span class="s">${pc ? S.pc.length + " Pokémon rangés" : "Après l'arène d'Argenta"}</span></span>${PK.ic("chevron")}</button>`;
  return `${ban}<div class="titre-page"><h1>Équipe</h1></div><div class="liste ${S.choix ? "choix" : ""}">${EQUIPE.map(ligneEquipe).join("")}</div>${S.choix ? "" : lignePc}`;
}

function ligneShop([img, nom, eff, prix, possede]) {
  const ach = possede === true
    ? `<button type="button" class="plaque" disabled>Possédé</button>`
    : `<button type="button" class="plaque" data-act="acheter" data-nom="${nom}" aria-label="Acheter ${nom}, ${nf(prix)} Pokédollars">${pd(prix)}</button>`;
  return `<div class="ligne-p ${possede === true ? "possede" : ""}"><img class="obj" src="${IMG}${img}.png" width="30" height="30" alt=""><div class="corps"><div class="t">${nom}</div><div class="s">${eff}</div></div>${ach}</div>`;
}
function ecranShop() {
  const onglets = ONGLETS.map(([id, t]) => `<button type="button" class="plaque" aria-pressed="${S.onglet === id}" data-act="onglet-${id}">${t}</button>`).join("");
  const note = S.onglet === "accessoires" ? `<p class="doux">Objets uniques : un seul achat, un bonus pour toujours.</p>` : S.onglet === "objets" ? `<p class="doux">Objets à acheter autant de fois que tu veux.</p>` : "";
  return `<div class="titre-page"><h1>Shop</h1></div><div class="onglets" role="group" aria-label="Catégories">${onglets}</div>${note}<div class="liste">${SHOP[S.onglet].map(ligneShop).join("")}</div>`;
}

function ecranCarte() {
  const liste = ZONES.map((z) => {
    const cur = z.id === S.zone;
    return `<button type="button" class="ligne-p zone ${cur ? "actuelle" : ""} ${z.ouverte ? "" : "ferme"}" ${z.ouverte ? `data-act="zone" data-id="${z.id}"` : 'aria-disabled="true"'}>${cur ? '<span class="marque"></span>' : ""}<span class="corps"><span class="t">${z.nom}</span><br><span class="s">Zone ${z.n}${cur ? " · tu es ici" : z.id === "arene-de-celadopole" ? " · 3 lieux" : z.ouverte ? "" : " · fermée"}</span></span>${z.ouverte ? PK.ic("chevron") : ""}</button>`;
  }).join("");
  const cercles = ZONES.map((z) => `<span class="cercle ${z.ouverte ? "" : "ferme"} ${z.id === S.zone ? "actuel" : ""}" data-z="${z.id}" style="left:${z.x * 100}%;top:${z.y * 100}%"></span>`).join("");
  return `<div class="titre-page"><h1>Carte</h1><button type="button" class="plaque" data-go="monde">${PK.ic("monde")}Monde Pokémon</button></div>
    <div class="carte-page"><div class="liste-zones" id="liste-zones" tabindex="0" aria-label="Zones de Kanto">${liste}</div>
    <div class="mini-carte cadre" id="mini" role="img" aria-label="Carte de Kanto. Zone actuelle en vert."><img src="img/carte-kanto.webp" alt="" width="1920" height="1080">${cercles}</div></div>`;
}

/* ---------- menu de jeu, monde, réglages ---------- */
function ecranMenu() {
  const row = (go, ic, t, s, c = "") => `<button type="button" class="ligne-p ${c}" data-go="${go}">${PK.ic(ic)}<span class="corps"><span class="t">${t}</span><br><span class="s">${s}</span></span>${PK.ic("chevron")}</button>`;
  return `<div class="titre-page"><h1>Menu</h1></div>
    <section class="partie-active cadre" aria-label="Partie en cours">
      <small class="doux">Partie en cours</small><p class="nom">Partie de Léo</p>
      <dl class="infos"><dt>Temps de jeu</dt><dd>12 h 34</dd><dt>Dernière sauvegarde</dt><dd>${S.sauve}</dd></dl>
      <p class="sync-ligne"><span class="synchro ${S.sync}" aria-hidden="true"></span><span>${SYNCS[S.sync][1]}</span></p>
      <button type="button" class="plaque action" data-act="sauver">${PK.ic("disque")}Sauvegarder maintenant</button>
    </section>
    <div class="liste">${row("monde", "monde", "Monde Pokémon", "Kanto jouable")}</div>
    <h2 class="sous-titre">Ton aventure</h2>
    <div class="liste">
      ${row("pokedex", "pokedex", "Pokédex", `${nbCapt()} capturés sur 151`)}
      ${row("badges", "badge", "Badges", `${badgeNb()} sur 8`)}
      ${row("stats", "stats", "Statistiques", "Dégâts, DPS et gains")}
    </div>
    <h2 class="sous-titre">Aide et réglages</h2>
    <div class="liste">
      ${row("guide", "guide", "Guide du jeu", `${GUIDE.length} sections : parcours, PC, Pokédex…`)}
      ${row("reglages", "reglages", "Réglages", "Son, auto-clic et thème")}
      ${row("menu-principal", "sortie", "Menu principal", "Sauvegarde, puis retour à tes parties", "sortie")}
    </div>
    <div class="lot-maquette"><button type="button" class="maquette" data-act="cycle-sync">Maquette : changer l'état de synchronisation (point en haut à droite)</button>
    <button type="button" class="maquette" data-go="c-reprise-ailleurs">Maquette : l'autre appareil reprend la partie</button></div>`;
}
function ecranMonde() {
  const retour = S.depuis === "compte" ? "c-parties" : S.depuis;
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="${retour}" aria-label="Retour">${PK.ic("retour")}</button><h1>Monde Pokémon</h1></div>
    <p class="doux">${S.depuis === "compte" ? `${esc((partie(S.ouverte) || { nom: "Ta partie" }).nom)} : c` : "C"}hoisis la région où tu veux jouer.</p>
    <button type="button" class="monde-kanto cadre" data-act="region-kanto" aria-label="Jouer à Kanto"><img src="img/carte-kanto.webp" alt="" width="1920" height="1080">
      <span class="legende"><b>Kanto</b><span class="tag">Jouable</span></span></button>
    <div class="regions">${REGIONS.map((r) => `<div class="region">${PK.ic("cadenas")}<p><b>${r}</b><small>Bientôt</small></p></div>`).join("")}</div>`;
}
const inter = (key, titre, on) => `<button type="button" class="inter" role="switch" aria-checked="${on}" data-act="inter" data-key="${key}" aria-label="${esc(titre)}"><i></i></button>`;
const etatTxt = (on) => (on ? "Activé" : "Désactivé");
function reglageSon(cle, titre, o) {
  return `<div class="reglage son"><div class="haut"><span><b>${titre}</b><small class="etat">${etatTxt(o.on)}</small></span>${inter(cle, titre, o.on)}</div>
    <div class="curseur"><input type="range" min="0" max="100" step="1" value="${o.v}" data-cle="${cle}" style="--p:${o.v}%" aria-label="Volume : ${titre.toLowerCase()}" ${o.on ? "" : "disabled"}><output>${o.v}</output></div></div>`;
}
function ecranReglages() {
  const tete = enCompte()
    ? `<div class="titre-page"><h1>Réglages</h1></div>`
    : `<div class="titre-page"><button type="button" class="retour plaque" data-go="menu" aria-label="Retour">${PK.ic("retour")}</button><h1>Réglages</h1></div>`;
  const lieTxt = S.lie ? "Lié : l'auto-clic s'active et s'arrête avec Attaque auto" : "Délié : l'auto-clic est désactivé";
  return `${tete}<div class="liste">${reglageSon("mus", "Musique", S.mus)}${reglageSon("fx", "Effets sonores", S.fx)}
    <div class="reglage"><span class="corps-r"><b>Auto-clic lié à l'attaque auto</b><small class="etat">${lieTxt}</small><small>Sans effet tant que tu n'as pas acheté les Restes (Shop, Sylphe SARL).</small></span>${inter("lie", "Auto-clic lié à l'attaque auto", S.lie)}</div>
    <div class="reglage"><span class="corps-r"><b>Thème</b><small>Sombre</small></span><button type="button" class="plaque" aria-pressed="true" data-act="regl">Sombre</button></div></div>`;
}

/* ---------- zone compte ---------- */
const champ = (id, titre, type, val = "", aide = "", err = "", extra = "") => `<label class="champ ${err ? "en-erreur" : ""}" for="${id}"><span>${titre}</span>
  <span class="zone-saisie"><input id="${id}" type="${type}" value="${esc(val)}" autocomplete="${type === "password" ? "current-password" : "email"}" ${err ? `aria-invalid="true" aria-describedby="${id}-m"` : ""}>${extra}</span>
  ${aide ? `<span class="aide">${aide}</span>` : ""}${err ? `<p class="message erreur" id="${id}-m" role="alert">${PK.ic("alerte")}<span>${err}</span></p>` : ""}</label>`;
const oeil = `<button type="button" class="plaque" data-act="oeil" aria-label="Afficher le mot de passe" aria-pressed="false">${PK.ic("oeil")}</button>`;
const marqueJeu = `<div class="marque-jeu"><b>PokiClicker</b><span>Ton aventure Pokémon, sur tous tes appareils</span></div>`;

function ecranConnexion() {
  const msg = { erreur: "", session: `<p class="message alerte" role="status">${PK.ic("alerte")}<span>Ta session a expiré. Reconnecte-toi pour retrouver tes parties.</span></p>` }[S.cx] || "";
  const err = S.cx === "erreur" ? "E-mail ou mot de passe incorrect." : "";
  return `${marqueJeu}<form class="formulaire cadre" data-form="connexion" novalidate><h1>Connexion</h1>${msg}
    ${champ("f-mail", "E-mail", "email", "leo@exemple.fr")}${champ("f-mdp", "Mot de passe", "password", err ? "motdepasse" : "", "", err, oeil)}
    <button type="submit" class="plaque action large">Se connecter</button></form>
    <div class="liens"><button type="button" class="lien" data-go="c-oubli">Mot de passe oublié</button><button type="button" class="lien" data-go="c-inscription">Créer un compte</button></div>
    <button type="button" class="maquette" data-act="hors-reseau">Maquette : se connecter sans réseau</button>`;
}
function ecranInscription() {
  const err = S.ins ? "Le mot de passe doit faire au moins 10 caractères." : "";
  return `${marqueJeu}<form class="formulaire cadre" data-form="inscription" novalidate><h1>Créer un compte</h1>
    ${champ("f-mail", "E-mail", "email", "leo@exemple.fr")}${champ("f-mdp", "Mot de passe", "password", S.ins ? "court" : "", "Au moins 10 caractères.", err, oeil)}
    <button type="submit" class="plaque action large">Créer mon compte</button></form>
    <div class="liens"><button type="button" class="lien" data-go="c-connexion">Retour à la connexion</button></div>`;
}
function ecranOubli() {
  return `${marqueJeu}<form class="formulaire cadre" data-form="oubli" novalidate><h1>Mot de passe oublié</h1>
    <p>Écris ton e-mail : tu recevras un lien pour choisir un nouveau mot de passe.</p>${champ("f-mail", "E-mail", "email", "leo@exemple.fr")}
    <button type="submit" class="plaque action large">Envoyer le lien</button></form>
    <div class="liens"><button type="button" class="lien" data-go="c-connexion">Retour à la connexion</button></div>`;
}
function ecranOubliEnvoye() {
  return `${marqueJeu}<section class="formulaire cadre"><h1>Lien envoyé</h1><p class="message succes" role="status">${PK.ic("valide")}<span>Si un compte existe pour leo@exemple.fr, un lien vient d'être envoyé. Regarde aussi dans tes courriers indésirables.</span></p>
    <button type="button" class="plaque large" data-go="c-nouveau">Maquette : ouvrir le lien reçu</button></section>
    <div class="liens"><button type="button" class="lien" data-go="c-connexion">Retour à la connexion</button></div>`;
}
function ecranNouveau() {
  return `${marqueJeu}<form class="formulaire cadre" data-form="nouveau" novalidate><h1>Nouveau mot de passe</h1>
    ${champ("f-mdp", "Nouveau mot de passe", "password", "", "Au moins 10 caractères.", "", oeil)}
    <button type="submit" class="plaque action large">Enregistrer le mot de passe</button></form>
    <div class="liens"><button type="button" class="lien" data-go="${S.depuisCompte ? "c-compte" : "c-connexion"}">${S.depuisCompte ? "Annuler" : "Retour à la connexion"}</button></div>`;
}

function carteP(p) {
  const [tag, cls] = TAGS[S.hors ? "local" : p.etat];
  return `<article class="carte-partie cadre" aria-label="${esc(p.nom)}">
    <button type="button" class="ouvrir" data-act="ouvrir" data-id="${p.id}"><span class="nom">${esc(p.nom)} <span class="tag ${cls}">${tag}</span></span>
      <dl><dt>Région</dt><dd>${p.lieu}</dd><dt>Temps de jeu</dt><dd>${p.temps}</dd><dt>Dernière sauvegarde</dt><dd>${p.sauve}</dd></dl></button>
    <div class="actions"><button type="button" class="plaque" data-act="renommer" data-id="${p.id}" aria-label="Renommer ${esc(p.nom)}">${PK.ic("crayon")}Renommer</button>
      <button type="button" class="plaque" data-act="supprimer" data-id="${p.id}" aria-label="Supprimer ${esc(p.nom)}">${PK.ic("corbeille")}Supprimer</button></div></article>`;
}
const formNom = (val = "") => `<label class="champ" for="f-nom"><span>Nom de la partie</span><span class="zone-saisie"><input id="f-nom" type="text" value="${esc(val)}" maxlength="30" autocomplete="off"></span></label>`;
function ecranParties() {
  const hors = S.hors ? `<p class="message alerte" role="status">${PK.ic("alerte")}<span>Hors connexion : tu vois seulement les parties de cet appareil.</span></p>` : "";
  if (!S.parties.length) {
    return `<div class="entete-compte"><h1>Mes parties</h1></div>${hors}<form class="formulaire cadre" data-form="creer" novalidate><h1>Crée ta première partie</h1><p>Une partie garde ta progression. Tu pourras en créer d'autres plus tard.</p>${formNom("Partie de Léo")}
      <button type="submit" class="plaque action large">Créer la partie</button></form>`;
  }
  return `<div class="entete-compte"><h1>Mes parties</h1></div>${hors}<p class="doux">Touche une partie pour arriver sur le monde.</p>
    ${S.parties.map(carteP).join("")}
    <button type="button" class="plaque large" data-go="c-nouvelle">${PK.ic("ajout")}Nouvelle partie</button>`;
}
function ecranNouvelle() {
  return `<div class="titre-page"><button type="button" class="retour plaque" data-go="c-parties" aria-label="Retour">${PK.ic("retour")}</button><h1>Nouvelle partie</h1></div>
    <form class="formulaire cadre" data-form="creer" novalidate>${formNom("")}<p class="doux">Tu commences à Bourg Palette, dans la région de Kanto.</p>
    <button type="submit" class="plaque action large">Créer la partie</button></form>`;
}
function ecranCompte() {
  const sk = S.skin ? `<div class="succes obtenu"><span class="corps"><span class="t">Casquette rouge</span><br><span class="s">Skin d'exemple · équipé</span></span></div>` : `<p class="doux">Aucun skin débloqué pour l'instant.</p>`;
  const tri = [...SUCCES].sort((a, b) => Number(b[3]) - Number(a[3]));
  return `<div class="entete-compte"><h1>Mon compte</h1><button type="button" class="plaque" data-act="deco">${PK.ic("sortie")}Se déconnecter</button></div>
    <section class="fiche cadre"><span class="doux">Connecté</span><b>leo@exemple.fr</b>
      <p class="sync-ligne"><span class="synchro ${S.sync}" aria-hidden="true"></span><span>${SYNCS[S.sync][0]}</span></p>
      <button type="button" class="plaque" data-act="mdp">Changer mon mot de passe</button></section>
    <section class="fiche cadre" aria-label="Diamants"><span class="doux">Diamants</span><span class="gros">${PK.ic("diamant")} 5</span><span class="doux">Gagnés avec les succès. Ils restent sur ton compte, quelle que soit la partie.</span></section>
    <h2 class="sous-titre">Succès</h2>
    <div class="liste">${tri.map(([t, d, n, ok]) => `<div class="succes ${ok ? "obtenu" : ""}">${PK.ic("badge")}<span class="corps"><span class="t">${t}</span><br><span class="s">${d} · +${n} diamants</span></span><span class="etat">${ok ? "✓ Obtenu" : "À obtenir"}</span></div>`).join("")}</div>
    <h2 class="sous-titre">Skins</h2>${sk}
    <div class="lot-maquette"><button type="button" class="maquette" data-act="skin">Maquette : ${S.skin ? "retirer le skin d'exemple" : "montrer un skin débloqué"}</button>
    <button type="button" class="maquette" data-act="cycle-sync">Maquette : changer l'état de synchronisation</button></div>`;
}

/* ---------- couches ---------- */
const fermer = `<button type="button" class="plaque" data-act="fermer" aria-label="Fermer">${PK.ic("croix")}</button>`;
function couches() {
  let h = "";
  if (S.sac) {
    const l = SAC.map(([i, nom, n, eff, cible]) => `<div class="ligne-p"><img class="obj" src="${IMG}${i}.png" width="30" height="30" alt=""><div class="corps"><div class="t">${nom} <span class="doux">×${n}</span></div><div class="s">${eff}${cible ? " · sur un Pokémon" : ""}</div></div><button type="button" class="plaque" data-act="utiliser" data-nom="${nom}" data-cible="${cible ? 1 : 0}">Utiliser</button></div>`).join("");
    h += `<div class="voile" data-act="fermer"></div><section class="fenetre sac cadre" role="dialog" aria-modal="true" aria-label="Sac"><div class="tete"><h2>Sac</h2>${fermer}</div><div class="corps"><div class="liste">${l}</div></div></section>`;
  }
  if (S.reglAuto) {
    const r = (k, t, on) => `<div class="reglage"><span class="corps-r"><b>${t}</b><small class="etat">${etatTxt(on)}</small></span>${inter("ar:" + k, t, on)}</div>`;
    h += `<div class="voile" data-act="fermer"></div><section class="fenetre cadre" role="dialog" aria-modal="true" aria-label="Réglage de l'arrêt auto"><div class="tete"><h2>Réglage de l'arrêt auto</h2>${fermer}</div>
      <div class="corps"><p class="doux intro">Le lien avec l'auto-clic se règle dans Menu, puis Réglages.</p>
      <h3 class="sous-titre">L'attaque auto s'arrête quand apparaît</h3>
      <div class="liste">${ARRETS.map(([k, t]) => r(k, t, S.arrets[k])).join("")}</div></div></section>`;
  }
  if (S.dialogue) {
    h += `<div class="voile" data-act="fermer"></div><section class="dialogue cadre" role="dialog" aria-modal="true" aria-label="Prof. Chen"><img src="${IMG}chen-1.png" width="120" height="120" alt="">
      <div><p class="pixel">Prof. Chen</p><p>Un Pokémon sauvage ! Touche-le pour l'attaquer. Quand il est affaibli, lance une Poké Ball.</p></div>
      <button type="button" class="plaque action" data-act="fermer">Compris <span class="fleche" aria-hidden="true">▸</span></button></section>`;
  }
  if (S.cel) {
    const l = ["Arène", "Centre commercial", "Casino"].map((t) => `<button type="button" class="plaque" data-act="lieu" data-lieu="${t}">${t}${PK.ic("chevron")}</button>`).join("");
    h += `<div class="voile" data-act="fermer"></div><div class="centre-modal"><section class="modal cadre" role="dialog" aria-modal="true" aria-label="Céladopole"><div class="tete"><h2>Céladopole</h2>${fermer}</div><p class="doux">Où veux-tu aller ?</p>${l}</section></div>`;
  }
  if (S.modal) {
    const p = partie(S.modal.id);
    let corps = "";
    if (S.modal.type === "renommer") corps = `<div class="tete"><h2>Renommer la partie</h2>${fermer}</div>${formNom(p ? p.nom : "")}<button type="button" class="plaque action" data-act="renommer-ok">Enregistrer</button><button type="button" class="plaque" data-act="fermer">Annuler</button>`;
    else if (S.modal.type === "supprimer") corps = `<div class="tete"><h2>Supprimer « ${esc(p ? p.nom : "")} » ?</h2></div><p>Sa progression sera perdue pour de bon. Tes diamants, tes succès et tes skins restent sur ton compte.</p><button type="button" class="plaque danger" data-act="supprimer-ok">Oui, supprimer</button><button type="button" class="plaque" data-act="fermer">Annuler</button>`;
    else corps = `<div class="tete"><h2>Se déconnecter ?</h2></div><p>Ta dernière progression n'est pas encore envoyée en ligne. Elle sera sauvegardée avant la déconnexion.</p><button type="button" class="plaque action" data-act="deco-sauver">Sauvegarder et se déconnecter</button><button type="button" class="plaque" data-act="fermer">Rester connecté</button>`;
    h += `<div class="voile" data-act="fermer"></div><div class="centre-modal"><section class="modal cadre" role="dialog" aria-modal="true" aria-label="Confirmation">${corps}</section></div>`;
  }
  if (S.deco === "charge") {
    h += `<div class="attente-plein" role="alertdialog" aria-modal="true" aria-label="Sauvegarde en cours"><span class="rond-charge" aria-hidden="true"></span><h1>Sauvegarde en cours…</h1>
      <p>Ne ferme pas la page et ne quitte pas l'application. Tu seras déconnecté dès que ta partie sera sauvegardée.</p><div class="barre-ind" aria-hidden="true"><i></i></div>
      <div class="actions-bas"><button type="button" class="maquette" data-act="deco-echec">Maquette : simuler un échec de la sauvegarde</button></div></div>`;
  } else if (S.deco === "echec") {
    h += `<div class="attente-plein" role="alertdialog" aria-modal="true" aria-label="Échec de la sauvegarde">${PK.ic("alerte", "gros")}<h1>La sauvegarde n'a pas abouti</h1>
      <p>Ta progression n'a pas été envoyée en ligne. Vérifie ta connexion, puis réessaie. Tant que ce n'est pas fait, tu restes connecté et ta partie reste sur cet appareil.</p>
      <div class="actions-bas"><button type="button" class="plaque action large" data-act="deco-sauver">Réessayer</button><button type="button" class="plaque large" data-act="deco-rester">Rester connecté</button></div></div>`;
  }
  return h + couchesA4();
}

/* ---------- rendu ---------- */
const PAGES = { combat: ecranCombat, equipe: ecranEquipe, pc: ecranPc, shop: ecranShop, carte: ecranCarte, menu: ecranMenu, monde: ecranMonde, reglages: ecranReglages,
  "c-connexion": ecranConnexion, "c-inscription": ecranInscription, "c-oubli": ecranOubli, "c-oubli-envoye": ecranOubliEnvoye, "c-nouveau": ecranNouveau,
  "c-parties": ecranParties, "c-nouvelle": ecranNouvelle, "c-ailleurs": ecranAilleurs, "c-reprise-ailleurs": ecranRepriseAilleurs, "c-supprimee": ecranSupprimee, "c-compte": ecranCompte, "c-reglages": ecranReglages,
  pokedex: ecranPokedex, badges: ecranBadges, stats: ecranStats, guide: ecranGuide };
const AUTH = ["c-connexion", "c-inscription", "c-oubli", "c-oubli-envoye", "c-nouveau"];
function rendre() {
  const hc = document.getElementById("cles"), hb = document.getElementById("barre");
  hc.innerHTML = cles(); hb.innerHTML = barre(); hb.hidden = !hb.innerHTML;
  const e = document.getElementById("ecran"), haut = e.scrollTop;
  e.innerHTML = PAGES[S.page]();
  e.classList.toggle("plein", S.page === "carte");
  e.classList.toggle("auth", AUTH.includes(S.page));
  e.scrollTop = S.garde ? haut : 0; S.garde = false;
  document.getElementById("couches").innerHTML = couches();
  const s = e.querySelector("#scene");
  if (s) s.addEventListener("click", () => {
    s.classList.remove("coup"); void s.offsetWidth; s.classList.add("coup");
    PK.etat.pv -= 12; if (PK.etat.pv <= 0) PK.etat.pv = PK.etat.pvMax;
    e.querySelector("#pv").style.setProperty("--pv", (PK.etat.pv / PK.etat.pvMax * 100) + "%");
    e.querySelector("#pvtxt").textContent = `PV ${PK.etat.pv} / ${PK.etat.pvMax}`;
  });
}

/* Vol : reprise de l'animation du jeu (reglages.interface.vol : pose 800, ouverture 50, vol 2500, fermeture 500, image 150 ms, 5 images). */
const VOL = { poseMs: 800, delaiOuvertureMs: 50, volMs: 2500, fermetureMs: 500, imageMs: 150, images: 5, pisteMs: 400, traitsMs: 200, fonduReduitMs: 300, changerReduitMs: 150 };
const TRAITS = `<svg viewBox="0 0 400 180" preserveAspectRatio="none"><path stroke="currentColor" stroke-width="2" fill="none" d="M25 15h8 M150 30h12 M80 100h10 M300 80h8 M350 20h9 M220 90h11 M20 70h7 M250 50h9 M120 5h8 M380 110h10 M50 85h9 M180 60h12 M100 140h10 M320 160h8 M200 130h12"/></svg>`;
function lancerVol(id, lieu) {
  const carte = document.getElementById("mini"); if (!carte || S.enVol) return;
  S.enVol = true; const tok = S.tok, a = Z(S.zone), b = Z(id);
  document.getElementById("liste-zones").classList.add("vole");
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fini = () => { S.enVol = false; if (tok !== S.tok) return; S.zone = id; S.page = "combat"; rendre(); PK.toast(`Zone : ${b.nom}${lieu ? " · " + lieu : ""}`); };
  const changer = () => { carte.querySelectorAll(".cercle.actuel").forEach((c) => c.classList.remove("actuel")); const c = carte.querySelector(`[data-z="${id}"]`); if (c) c.classList.add("actuel"); };
  if (reduit) {
    carte.classList.add("fondu");
    setTimeout(changer, VOL.changerReduitMs); setTimeout(fini, VOL.fonduReduitMs); return;
  }
  const d = document.createElement("img"); d.className = "dresseur"; d.alt = ""; d.setAttribute("aria-hidden", "true");
  d.style.left = a.x * 100 + "%"; d.style.top = a.y * 100 + "%"; d.src = "img/dresseur/vol-1.png"; carte.appendChild(d);
  const T = (f, ms) => setTimeout(() => { if (carte.isConnected) f(); }, ms);
  for (let i = 1; i < VOL.images; i++) T(() => { d.src = `img/dresseur/vol-${i + 1}.png`; }, i * VOL.imageMs);
  T(() => {
    const o = document.createElement("div"); o.className = "vol-overlay"; o.dataset.phase = "vol"; o.setAttribute("aria-hidden", "true");
    o.innerHTML = `<div class="vol-attente" style="--vol-ms:${VOL.delaiOuvertureMs}"><div class="vol-piste" style="--vol-ms:${VOL.pisteMs}"><div class="vol-traits" style="--vol-ms:${VOL.traitsMs}">${TRAITS}${TRAITS}</div><div class="vol-trajet" style="--vol-ms:${VOL.volMs}"><img class="vol-oiseau" src="img/animes/roucarnage-vol.gif" alt=""></div></div></div>`;
    carte.appendChild(o);
  }, VOL.poseMs);
  T(() => { changer(); const o = carte.querySelector(".vol-overlay"); if (o) o.dataset.phase = "fermeture"; }, VOL.poseMs + VOL.volMs);
  setTimeout(fini, VOL.poseMs + VOL.volMs + VOL.fermetureMs);
}
function voisine(sens) { const i = OUVERTES.indexOf(Z(S.zone)) + sens; if (OUVERTES[i]) { S.zone = OUVERTES[i].id; rendre(); } }

const val = (id) => (document.getElementById(id) || {}).value || "";
function ouvrirPartie(id) {
  const p = partie(id); S.ouverte = id; S.depuis = "compte"; S.page = "monde";
  S.sync = S.hors ? "hors" : p && p.etat === "cours" ? "cours" : "ajour";
}
document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]"), a = ev.target.closest("[data-act]");
  if (a && !a.closest("[aria-disabled=true]")) {
    const act = a.dataset.act; S.tok++;
    if (act === "fermer") { S.sac = S.reglAuto = S.dialogue = S.cel = false; S.modal = null; S.dexSel = null; S.badgeSel = null; S.diplomeOuv = false; fermeFiche(); }
    else if (ACT4[act]) { if (ACT4[act](a, ev) === "stop") return; }
    else if (act === "ball") S.ball = (S.ball + 1) % BALLS.length;
    else if (act === "capturer") { PK.toast(`${BALLS[S.ball][1]} lancée !`); return; }
    else if (act === "auto") S.auto = !S.auto;
    else if (act === "arret") S.arret = !S.arret;
    else if (act === "deb") S.deb = !S.deb;
    else if (act === "fauchage") { PK.toast("Fauchage lancé"); return; }
    else if (act === "radar") { PK.toast("Poké-Radar activé"); return; }
    else if (act === "dialogue") S.dialogue = true;
    else if (act === "regl") { a.setAttribute("aria-pressed", a.getAttribute("aria-pressed") !== "true"); return; }
    else if (act === "inter") {
      const k = a.dataset.key, on = a.getAttribute("aria-checked") !== "true";
      if (k === "lie") S.lie = on; else if (k.startsWith("ar:")) S.arrets[k.slice(3)] = on; else S[k].on = on;
      a.setAttribute("aria-checked", on);
      const r = a.closest(".reglage"), et = r.querySelector(".etat");
      if (et) et.textContent = k === "lie" ? (on ? "Lié : l'auto-clic s'active et s'arrête avec Attaque auto" : "Délié : l'auto-clic est désactivé") : etatTxt(on);
      const rg = r.querySelector("input[type=range]"); if (rg) rg.disabled = !on;
      return;
    }
    else if (act === "oeil") { const i = a.closest(".zone-saisie").querySelector("input"); const v = i.type === "password"; i.type = v ? "text" : "password"; a.setAttribute("aria-pressed", v); a.setAttribute("aria-label", v ? "Masquer le mot de passe" : "Afficher le mot de passe"); return; }
    else if (act === "utiliser") {
      S.sac = false;
      if (a.dataset.cible === "1") { S.choix = a.dataset.nom; S.page = "equipe"; } else PK.toast(`${a.dataset.nom} utilisé`);
    }
    else if (act === "annuler") { S.choix = null; S.page = "combat"; S.sac = true; }
    else if (act === "cible") { PK.toast(`${S.choix} utilisé sur ${a.dataset.nom}`); S.choix = null; S.page = "combat"; }
    else if (act.startsWith("onglet-")) S.onglet = act.slice(7);
    else if (act === "acheter") { PK.toast(`${a.dataset.nom} acheté`); return; }
    else if (act === "zone-prec") return voisine(-1);
    else if (act === "zone-suiv") return voisine(1);
    else if (act === "zone") {
      if (S.enVol) return;
      if (a.dataset.id === "arene-de-celadopole") { S.cel = true; } else { return lancerVol(a.dataset.id); }
    }
    else if (act === "lieu") { const lieu = a.dataset.lieu; S.cel = false; rendre(); return lancerVol("arene-de-celadopole", lieu === "Arène" ? "" : lieu); }
    else if (act === "sauver") { S.sauve = "à l'instant"; if (S.sync === "cours") S.sync = "ajour"; PK.toast("Partie sauvegardée"); }
    else if (act === "cycle-sync") { const o = Object.keys(SYNCS); S.sync = o[(o.indexOf(S.sync) + 1) % o.length]; }
    else if (act === "region-kanto") { S.page = "combat"; S.choix = null; rendre(); PK.toast("Kanto : retour à Route 1"); return; }
    else if (act === "debloquer-pc") { PK.etat.pcOuvert = true; S.pcVu = false; PK.toast("PC débloqué ! Il est dans l'écran Équipe."); }
    else if (act === "verrouiller-pc") PK.etat.pcOuvert = false;
    /* compte */
    else if (act === "hors-reseau") { S.cx = "reseau"; PK.toast("Pas de connexion : réessaie quand tu auras du réseau."); S.cx = null; return; }
    else if (act === "ouvrir") {
      const p = partie(Number(a.dataset.id));
      if (p.etat === "ailleurs" && !S.hors) { S.cible = p.id; S.page = "c-ailleurs"; }
      else if (p.etat === "supprimee" && !S.hors) { S.cible = p.id; S.page = "c-supprimee"; }
      else ouvrirPartie(p.id);
    }
    else if (act === "renommer") S.modal = { type: "renommer", id: Number(a.dataset.id) };
    else if (act === "supprimer") S.modal = { type: "supprimer", id: Number(a.dataset.id) };
    else if (act === "renommer-ok") { const n = val("f-nom").trim(); if (n) partie(S.modal.id).nom = n; S.modal = null; PK.toast("Partie renommée"); }
    else if (act === "supprimer-ok") { S.parties = S.parties.filter((p) => p.id !== S.modal.id); S.modal = null; PK.toast("Partie supprimée"); }
    else if (act === "reprendre") {
      /* L'autre appareil est fermé ; ici on repart exactement où la partie en était (même zone, même étape), sans passer par le Monde. */
      const p = partie(S.cible); if (p) { p.etat = "ajour"; p.sauve = "à l'instant"; }
      S.ouverte = S.cible; S.depuis = "menu"; S.sync = "ajour"; S.zone = "foret-de-jade"; S.page = "combat"; PK.toast("Partie reprise ici : tu repars de Forêt de Jade, là où tu en étais");
    }
    else if (act === "garder") { const p = partie(S.cible); if (p) { p.etat = "ajour"; } PK.toast("Partie gardée sur cet appareil"); S.page = "c-parties"; }
    else if (act === "abandonner") { S.parties = S.parties.filter((p) => p.id !== S.cible); PK.toast("Partie abandonnée"); S.page = "c-parties"; }
    else if (act === "mdp") { S.depuisCompte = true; S.page = "c-nouveau"; }
    else if (act === "skin") S.skin = !S.skin;
    else if (act === "deco") { if (S.sync === "cours") S.modal = { type: "deco" }; else { S.page = "c-connexion"; S.cx = null; PK.toast("Tu es déconnecté"); } }
    else if (act === "deco-sauver") {
      /* Page de chargement plein écran, puis déconnexion une fois la sauvegarde faite (2,6 s en maquette) */
      S.modal = null; S.deco = "charge"; const t = S.tok;
      setTimeout(() => { if (S.deco === "charge" && t === S.tok) { S.deco = null; S.sync = "ajour"; S.page = "c-connexion"; S.cx = null; PK.toast("Partie sauvegardée. Tu es déconnecté."); rendre(); } }, 2600);
    }
    else if (act === "deco-echec") S.deco = "echec";
    else if (act === "deco-rester") S.deco = null;
    rendre(); return refocus(a);
  }
  if (!g) return;
  const go = g.dataset.go; S.tok++; S.choix = null;
  if (go === "sac") S.sac = true;
  else if (go === "reglAuto") S.reglAuto = true;
  else if (go === "a-venir") { PK.toast("Cet écran n'est pas dans cette maquette"); return; }
  else if (go === "menu-principal") { S.sauve = "à l'instant"; if (S.sync === "cours") S.sync = "ajour"; PK.toast("Partie sauvegardée"); S.page = "c-parties"; S.hors = S.sync === "hors"; S.sac = S.reglAuto = S.dialogue = S.cel = false; }
  else {
    if (go === "monde") S.depuis = S.page === "carte" ? "carte" : "menu";
    if (go === "pc") S.pcVu = true;
    if (go === "c-connexion") S.cx = null;
    if (go === "c-inscription") S.ins = false;
    if (go === "c-parties" && S.page === "monde") S.hors = S.sync === "hors";
    S.depuisCompte = false; fermeFiche(); S.echange = null; S.dexSel = null; S.badgeSel = null; S.diplomeOuv = false;
    S.page = go; S.sac = S.reglAuto = S.dialogue = S.cel = false; S.modal = null;
  }
  rendre();
});
document.addEventListener("submit", (ev) => {
  ev.preventDefault(); const f = ev.target.dataset.form; S.tok++;
  if (f === "connexion") { if (S.cx === "erreur") { S.cx = null; } S.hors = false; S.page = "c-parties"; }
  else if (f === "inscription") { if (val("f-mdp").length < 10) { S.ins = true; } else { S.parties = []; S.page = "c-parties"; S.ins = false; PK.toast("Compte créé"); } }
  else if (f === "surnom") {
    const v = val("f-surnom").trim(), p = pDeFiche();
    if (v.length < 1 || v.length > 12) S.renomErr = true;
    else { if (p) { if (p.eq) EQUIPE[p.i][1] = v; else p.surnom = v; } S.renom = false; S.renomErr = false; PK.toast("Surnom enregistré"); }
  }
  else if (f === "oubli") S.page = "c-oubli-envoye";
  else if (f === "nouveau") { PK.toast("Mot de passe enregistré"); S.page = S.depuisCompte ? "c-compte" : "c-connexion"; S.depuisCompte = false; }
  else if (f === "creer") {
    const n = val("f-nom").trim() || "Ma partie"; const id = Math.max(0, ...S.parties.map((p) => p.id)) + 1;
    S.parties.push({ id, nom: n, lieu: "Kanto · Bourg Palette", temps: "0 h 00", sauve: "à l'instant", etat: "ajour" }); S.page = "c-parties"; PK.toast("Partie créée");
  }
  rendre();
});
document.addEventListener("change", (ev) => {
  const i = ev.target;
  if (i.tagName === "SELECT" && i.dataset.cle === "pcTri") { S.pcTri = i.value; S.garde = true; rendre(); const n = document.getElementById("pc-tri"); if (n) n.focus(); }
});
document.addEventListener("input", (ev) => {
  const i = ev.target;
  if (i.dataset.cle === "pcQ" || i.dataset.cle === "dexQ") { S[i.dataset.cle] = i.value; majListes(); return; }
  if (i.id === "f-surnom") { const c = document.getElementById("cpt-surnom"); if (c) c.textContent = `${i.value.length} / 12 caractères`; return; }
  if (i.type !== "range") return;
  S[i.dataset.cle].v = Number(i.value); i.style.setProperty("--p", i.value + "%"); i.nextElementSibling.textContent = i.value;
});

function demarrer() {
  depart(location.hash.slice(1)); rendre();
  if (S.volAuto) setTimeout(() => lancerVol(S.volAuto), 400);
}
window.addEventListener("hashchange", demarrer);
demarrer();
