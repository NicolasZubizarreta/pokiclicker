/* Maquettes PC : état, fenêtres, coquille, événements, raccourcis clavier. Une page navigable ; le fragment d'adresse choisit l'écran de départ.
   Contenu fictif. Rien ne sort de la page : pas de réseau, pas de stockage. */
let S = {};
let EQUIPE = [];
let uid = 0, ouvertPar = null, timers = [];
const $ = (s, r = document) => r.querySelector(s);
const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const AUTH = ["c-connexion", "c-inscription", "c-oubli", "c-oubli-envoye", "c-nouveau"];
const PAGES = { combat: ecranCombat, equipe: ecranEquipe, pc: ecranPc, shop: ecranShop, carte: ecranCarte, menu: ecranMenu, monde: ecranMonde, reglages: ecranReglages,
  pokedex: ecranPokedex, badges: ecranBadges, stats: ecranStats, guide: ecranGuide, "lieu-bourg": ecranLieuBourg, "lieu-maman": ecranMaman, "lieu-blue": ecranBlue,
  centre: ecranCentre, commercial: ecranCommercial, pension: ecranPension, casino: ecranCasino,
  "c-connexion": ecranConnexion, "c-inscription": ecranInscription, "c-oubli": ecranOubli, "c-oubli-envoye": ecranOubliEnvoye, "c-nouveau": ecranNouveau,
  "c-parties": ecranParties, "c-nouvelle": ecranNouvelle, "c-compte": ecranCompte, "c-reglages": ecranReglages };
const enCompte = () => S.page.startsWith("c-");
const enIntro = () => S.page === "titre" || S.page.startsWith("intro-");
const partie = (id) => S.parties.find((p) => p.id === id);
const val = (id) => ($("#" + id) || {}).value || "";

function etatInitial() {
  EQUIPE = EQUIPE0.map((x) => [...x]);
  return { page: "combat", zone: "route-1", etape: 1, pieces: 250000, pv: 152, pvMax: 152, ball: 0, auto: true, arret: true, deb: false, evo: false, cs: null, coup: false,
    sac: false, reglAuto: false, dialogue: false, radar: false, choix: null, cel: false, enVol: false, raccourcis: false, focusDemo: false, evoAnim: null, erreur: null, attente: null,
    pcOuvert: true, pc: pcDepart(), pcTri: "dps", pcQ: "", pcFav: false, pcShiny: false, pcOeuf: false, fiche: null, renom: false, renomErr: false, relacher: false, ficheErr: "", echange: null, echangeErr: "", favEq: {}, surEq: {}, eqTri: "ordre",
    dexQ: "", dexF: "tous", dexSel: null, dexComplet: false, diplomeOuv: false, badgesObt: ["roche"], badgeSel: null, guideOuv: "parcours",
    onglet: "balls", sync: "ajour", cx: null, ins: false, parties: partiesDepart(), modal: null, hors: false, skin: false, deco: null, depuisCompte: false, starter: null,
    mus: { on: true, v: 70 }, fx: { on: true, v: 80 }, lie: true, arrets: Object.fromEntries(ARRETS.map(([k, , on]) => [k, on])), pops: [] };
}
const PC_OUVERT_PAGES = new Set();

function depart(h) {
  timers.forEach(clearTimeout); timers = [];
  S = etatInitial();
  const m = {
    "combat-debloque": () => { S.deb = true; }, "combat-capture": () => { S.cs = "capture"; }, "combat-capture-reussie": () => { pop("Rattata capturé ! Il rejoint ton PC.", "succes", 0, SPR + "19.png"); },
    "combat-radar": () => { S.deb = true; S.radar = true; }, "combat-fauchage": () => { S.deb = true; S.cs = "fauchage"; S.coup = true; pop("Fauchage : 4 Pokémon vaincus", "info", 0); },
    "combat-evolution": () => { S.evo = true; }, "combat-evolution-anim": () => { S.evo = true; S.evoAnim = { n: 16, vers: 17, etape: "flash" }; },
    "combat-boss": () => { S.cs = "boss"; S.etape = 10; S.zone = "foret-de-jade"; }, "combat-fin-zone": () => { S.cs = "fin"; S.etape = 10; pop("Forêt de Jade débloquée.", "succes", 0); },
    "combat-arret-auto": () => { S.cs = "arret"; S.deb = true; }, "reglage-auto": () => { S.reglAuto = true; }, sac: () => { S.sac = true; }, dialogue: () => { S.dialogue = true; },
    equipe: () => { S.page = "equipe"; }, "equipe-choix": () => { S.page = "equipe"; S.choix = "Bonbon rare"; }, "equipe-fiche": () => { S.page = "equipe"; S.fiche = { src: "eq", i: 0 }; },
    "equipe-fiche-evolution": () => { S.page = "equipe"; S.evo = true; S.fiche = { src: "eq", i: 2 }; },
    "pc-verrouille": () => { S.page = "pc"; S.pcOuvert = false; }, pc: () => { S.page = "pc"; }, "pc-vide": () => { S.page = "pc"; S.pc = []; }, "pc-recherche": () => { S.page = "pc"; S.pcQ = "ra"; },
    "pc-sans-resultat": () => { S.page = "pc"; S.pcQ = "dracaufeu"; }, "pc-fiche": () => { S.page = "pc"; S.fiche = { src: "pc", id: 6 }; }, "pc-fiche-shiny": () => { S.page = "pc"; S.fiche = { src: "pc", id: 5 }; },
    "pc-fiche-oeuf": () => { S.page = "pc"; S.fiche = { src: "pc", id: 12 }; }, "pc-fiche-dernier": () => { EQUIPE.splice(1); S.page = "equipe"; S.fiche = { src: "eq", i: 0 }; },
    "pc-renommer": () => { S.page = "pc"; S.fiche = { src: "pc", id: 3 }; S.renom = true; }, "pc-relacher": () => { S.page = "pc"; S.fiche = { src: "pc", id: 3 }; S.relacher = true; },
    "pc-echange": () => { S.page = "pc"; S.echange = 6; },
    shop: () => { S.page = "shop"; }, "shop-objets": () => { S.page = "shop"; S.onglet = "objets"; }, "shop-accessoires": () => { S.page = "shop"; S.onglet = "accessoires"; },
    carte: () => { S.page = "carte"; }, celadopole: () => { S.page = "carte"; S.cel = true; }, vol: () => { S.page = "carte"; S.volAuto = "arene-d-argenta"; },
    "lieu-bourg": () => { S.page = h; }, "lieu-maman": () => { S.page = h; }, "lieu-blue": () => { S.page = h; }, centre: () => { S.page = h; }, commercial: () => { S.page = h; }, pension: () => { S.page = h; }, casino: () => { S.page = h; },
    menu: () => { S.page = "menu"; }, monde: () => { S.page = "monde"; }, reglages: () => { S.page = "reglages"; },
    pokedex: () => { S.page = "pokedex"; }, "pokedex-paliers": () => { S.page = "pokedex"; }, "pokedex-recherche": () => { S.page = "pokedex"; S.dexQ = "pi"; }, "pokedex-a-trouver": () => { S.page = "pokedex"; S.dexF = "manquants"; },
    "pokedex-detail": () => { S.page = "pokedex"; S.dexSel = 25; }, "pokedex-inconnu": () => { S.page = "pokedex"; S.dexSel = 12; }, "pokedex-complet": () => { S.page = "pokedex"; S.dexComplet = true; },
    "pokedex-diplome": () => { S.page = "pokedex"; S.dexComplet = true; S.diplomeOuv = true; },
    badges: () => { S.page = "badges"; }, "badges-detail": () => { S.page = "badges"; S.badgeSel = "roche"; }, "badges-detail-manque": () => { S.page = "badges"; S.badgeSel = "cascade"; },
    "badges-aucun": () => { S.page = "badges"; S.badgesObt = []; }, "badges-tous": () => { S.page = "badges"; S.badgesObt = BADGES.map((b) => b[0]); },
    stats: () => { S.page = "stats"; }, guide: () => { S.page = "guide"; }, "guide-pc": () => { S.page = "guide"; S.guideOuv = "pc"; },
    titre: () => { S.page = "titre"; }, "intro-maman": () => { S.page = h; }, "intro-bourg": () => { S.page = h; }, "intro-labo": () => { S.page = h; }, "intro-starter": () => { S.page = h; }, "intro-starter-choix": () => { S.page = "intro-starter"; S.starter = 4; },
    "c-connexion": () => { S.page = h; }, "c-connexion-erreur": () => { S.page = "c-connexion"; S.cx = "erreur"; }, "c-connexion-session": () => { S.page = "c-connexion"; S.cx = "session"; },
    "c-inscription": () => { S.page = h; }, "c-inscription-erreur": () => { S.page = "c-inscription"; S.ins = true; }, "c-oubli": () => { S.page = h; }, "c-oubli-envoye": () => { S.page = h; }, "c-nouveau": () => { S.page = h; },
    "c-parties": () => { S.page = h; }, "c-parties-vide": () => { S.page = "c-parties"; S.parties = []; }, "c-parties-hors-ligne": () => { S.page = "c-parties"; S.hors = true; S.sync = "hors"; }, "c-nouvelle": () => { S.page = h; },
    "c-renommer": () => { S.page = "c-parties"; S.modal = { type: "renommer", id: 1 }; }, "c-supprimer": () => { S.page = "c-parties"; S.modal = { type: "supprimer", id: 2 }; },
    "c-restaurer": () => { S.page = "c-parties"; S.modal = { type: "restaurer", id: 1, etape: 1 }; }, "c-restaurer-confirmer": () => { S.page = "c-parties"; S.modal = { type: "restaurer", id: 1, etape: 2, choix: 1 }; },
    "c-ailleurs": () => { S.page = "c-parties"; S.modal = { type: "ailleurs", id: 2 }; }, "c-supprimee": () => { S.page = "c-parties"; S.modal = { type: "supprimee", id: 3 }; },
    "c-reprise-ailleurs": () => { S.page = "monde"; pop("Partie reprise ici. L'autre appareil est fermé et tu reprends exactement là où tu t'étais arrêté.", "info", 0); },
    "c-compte": () => { S.page = h; }, "c-deconnexion": () => { S.page = "c-compte"; S.sync = "cours"; S.modal = { type: "deco" }; },
    "c-deconnexion-chargement": () => { S.page = "c-compte"; S.sync = "cours"; S.deco = "charge"; }, "c-deconnexion-echec": () => { S.page = "c-compte"; S.sync = "cours"; S.deco = "echec"; },
    "c-reglages": () => { S.page = h; },
    notifications: () => { pop("Rattata capturé ! Il rejoint ton PC.", "succes", 0, SPR + "19.png"); pop("Pierre Foudre acheté pour 2 100 ₽.", "info", 0, OBJ + "thunder-stone.png"); pop("Il te manque 400 ₽ pour cet achat.", "erreur", 0); },
    chargement: () => { S.attente = { t: "Chargement de ta partie…", s: "Récupération de ta sauvegarde en ligne.", barre: true }; },
    "erreur-reseau": () => { S.erreur = "reseau"; }, "hors-ligne": () => { S.sync = "hors"; pop("Hors connexion : ta partie reste sauvegardée sur cet appareil.", "alerte", 0); },
    "easter-daran": () => { S.page = "pc"; S.pc[2].surnom = "Daran"; S.pc[2].niveau = 45; S.fiche = { src: "pc", id: 3 }; },
    "easter-gabriel": () => { S.page = "pc"; S.pc[2].surnom = "Gabriel"; S.pc[2].niveau = 72; S.fiche = { src: "pc", id: 3 }; },
    raccourcis: () => { S.raccourcis = true; }, focus: () => { S.deb = true; S.focusDemo = true; },
  };
  (m[h] || (() => {}))();
}

/* ---------- notifications ---------- */
function pop(txt, type = "", ms = 3400, img = null) {
  const id = ++uid; S.pops.push({ id, txt, type, img });
  if (S.pops.length > 3) S.pops.shift();
  majPops();
  if (ms) timers.push(setTimeout(() => { S.pops = S.pops.filter((p) => p.id !== id); majPops(); }, ms));
}
const popsHtml = () => `<div class="pops" aria-live="polite">${S.pops.map((p) => `<div class="pop cadre ${p.type}">${p.img ? `<img src="${p.img}" width="96" height="96" alt="">` : ic(p.type === "erreur" ? "alerte" : p.type === "succes" ? "valide" : "alerte")}<span>${esc(p.txt)}</span></div>`).join("")}</div>`;
function majPops() { const el = $(".pops"); if (el) el.outerHTML = popsHtml(); }

/* ---------- fenêtres ---------- */
const fen = (titre, corps, { cls = "", pied = "", haut = false, role = "dialog" } = {}) =>
  `<div class="couche ${haut ? "haut" : ""}"><section class="fenetre cadre ${cls}" role="${role}" aria-modal="true" aria-label="${esc(titre.replace(/<[^>]+>/g, ""))}"><div class="tete"><h2>${titre}</h2>${fermerBtn}</div><div class="corps">${corps}${pied ? `<div class="pied">${pied}</div>` : ""}</div></section></div>`;
function pDeFiche() { const f = S.fiche; if (!f) return null; return f.src === "eq" ? (EQUIPE[f.i] ? pa(EQUIPE[f.i], f.i) : null) : S.pc.find((p) => p.id === f.id); }
function ficheCouche() {
  const p = pDeFiche(); if (!p) return "";
  const egg = !!p.oeuf, nom = nomP(p), d = egg ? null : dpsDetail(p), dps = p.eq ? p.dps : d && d.total;
  const dernier = p.eq && EQUIPE.length <= 1, pretEvo = p.eq && S.evo && p.n === 16, photo = !egg && imgFiche(p);
  const bloc = (k) => `<div><dt>${k[0]}</dt><dd>${k[1]}</dd></div>`;
  const sp = egg ? `<span class="oeuf-g">${ic("oeuf")}</span>` : photo ? `<span class="cadre-egg"><img src="${photo}" alt="Photo de ${esc(nom)}"></span>` : `<img class="${p.shiny ? "shiny" : ""}" src="${sprite(p.n, p.shiny)}" width="96" height="96" alt="${nomEsp(p.n)}">`;
  const renom = S.renom ? `<form data-form="surnom" novalidate style="display:grid;gap:var(--ecart)"><label class="champ ${S.renomErr ? "en-erreur" : ""}" for="f-surnom"><span>Surnom</span><span class="zone-saisie"><input id="f-surnom" type="text" maxlength="12" value="${esc(p.surnom || nomP(p))}" autocomplete="off" data-autofocus></span><span class="aide">12 caractères au plus</span></label>${S.renomErr ? `<p class="message erreur" role="alert">${ic("alerte")}<span>Entre un nom de 1 à 12 caractères.</span></p>` : ""}<div class="rangee"><button type="submit" class="plaque action">Valider</button><button type="button" class="plaque" data-act="renommer-annuler">Annuler</button></div></form>` : "";
  const xp = egg ? "" : `<div class="xp-ligne"><span>XP : MAX</span><div class="xp"><i style="width:100%"></i></div></div>`.replace("MAX", p.niveau >= 100 ? "MAX" : "11 250 / 18 000").replace('width:100%', p.niveau >= 100 ? 'width:100%' : 'width:62%');
  const ligne = egg ? pasOeuf(p) : `${nomEsp(p.n)} · N° ${p.n} · Niveau ${p.niveau}${p.eq ? "" : " · Dans le PC"}`;
  const titre = `${esc(nom)} ${p.shiny && !egg ? ic("etincelle") : ""}`;
  const corps = `<div class="fiche-grille"><div class="gauche"><div class="gros-sprite-c">${sp}</div><div class="rangee" style="justify-content:center">${sexeHtml(p)}${p.shiny && !egg ? `<span class="tag or">${ic("etincelle")} Shiny</span>` : ""}</div>${egg ? "" : `<div class="rangee" style="justify-content:center">${tagsTypes(p.n)}</div>`}</div>
    <div style="display:grid;gap:var(--ecart);align-content:start"><p class="doux">${ligne}</p>${renom}
      <div class="rangee"><button type="button" class="tag ${p.fav ? "fav-on" : "neutre"}" data-act="fav" aria-pressed="${!!p.fav}" aria-label="${p.fav ? "Retire des favoris" : "Ajoute aux favoris"}" style="min-height:36px">${ic("etoile")}Favori</button>${egg ? "" : `<button type="button" class="tag neutre" data-act="renommer-pk" style="min-height:36px">${ic("crayon")}Renommer</button>`}</div>
      ${xp}${egg ? `<p class="doux">Un œuf n'a ni niveau ni XP. Mets-le dans ton équipe, puis fais des combats pour l'éclore.</p>` : `<div class="dps-gros">${nf(dps)} DPS</div>
      <dl class="detail-dps">${[["Base", nf(d.base)], ["Type", "× " + d.type], ["Shiny", "× " + d.shiny], ["Bonheur", "× " + virg(d.bonheur)], ["Pierre Stase", "× " + d.stase], ["Calcium", "× " + virg(d.calcium)]].map(bloc).join("")}</dl>
      ${EVO[p.n] ? `<p>Évolution : ${EVO[p.n]}</p>` : ""}<div class="bonheur"><span class="jauge" style="--p:47" role="img" aria-label="Bonheur : 120/255"></span><div><p>Bonheur : 120/255</p><p class="doux">+12 % de dégâts</p></div></div><p>Calcium : 2 · +2 % de dégâts · Objet tenu : aucun</p>`}
      ${S.ficheErr ? `<p class="message erreur" role="alert">${ic("alerte")}<span>${S.ficheErr}</span></p>` : ""}
      ${pretEvo ? `<button type="button" class="plaque action large pret-evoluer" data-act="evoluer" style="position:relative">${ic("etincelle")}Évoluer en ${nomEsp(17)}</button>` : ""}
      <div class="rangee"><button type="button" class="plaque action" data-act="fiche-principal" ${dernier ? "disabled" : ""}>${p.eq ? "Envoyer au PC" : "Placer dans l'équipe"}</button><button type="button" class="plaque danger" data-act="relacher" ${dernier ? "disabled" : ""}>Relâcher</button></div>
      ${dernier ? `<p class="raison">C'est ton dernier Pokémon : garde-le dans l'équipe.</p>` : ""}</div></div>`;
  return fen(titre, corps, { cls: "large" });
}
const relacherCouche = () => { const p = pDeFiche(); if (!p || !S.relacher) return ""; return `<div class="couche haut"><section class="fenetre etroite cadre" role="alertdialog" aria-modal="true" aria-label="Relâcher"><div class="tete"><h2>Veux-tu vraiment relâcher ${esc(nomP(p))} ?</h2></div><div class="corps"><p>Il quittera ton aventure pour de bon.</p><div class="pied"><button type="button" class="plaque" data-act="relacher-non" data-autofocus>Annuler</button><button type="button" class="plaque danger" data-act="relacher-oui">Relâche définitivement</button></div></div></section></div>`; };
function sacCouche() {
  const l = SAC.map(([i, nom, n, eff, cible]) => `<div class="ligne-p"><img class="obj" src="${OBJ}${i}.png" width="30" height="30" alt=""><div class="corps"><span class="t">${nom} <span class="doux">×${n}</span></span><span class="s">${eff}${cible ? " · sur un Pokémon" : ""}</span></div><button type="button" class="plaque" data-act="utiliser" data-nom="${esc(nom)}" data-cible="${cible ? 1 : 0}">Utiliser</button></div>`).join("");
  return fen(`${ic("sac")} Sac`, `<p class="doux">82 objets. Les objets « sur un Pokémon » ouvrent ton équipe pour choisir.</p><div class="liste">${l}</div>`);
}
function reglAutoCouche() {
  return fen("Arrêt auto", `<p class="doux">Choisis quand l'attaque auto s'arrête.</p><div class="liste">${ARRETS.map(([k, t]) => `<div class="ligne-p"><span class="corps"><span class="t">${t}</span></span>${inter("arret-" + k, t, S.arrets[k])}</div>`).join("")}</div>`);
}
function radarCouche() {
  const l = [["19", "Rattata", "Commun", "info"], ["16", "Roucool", "Commun", "info"], ["29", "Nidoran ♀", "Peu commun", "neutre"], ["63", "Abra", "Rare", "alerte"], ["132", "Métamorph", "Très rare", "erreur"]]
    .map(([n, nom, r, c]) => `<div class="ligne-p"><img class="obj" src="${SPR}${n}.png" width="96" height="96" alt="" style="width:56px;height:56px"><div class="corps"><span class="t">${nom}</span></div><span class="tag ${c}">${r}</span></div>`).join("");
  return fen(`<img src="${OBJ}PokeRadar.png" width="30" height="30" alt="" style="width:24px;height:24px;display:inline-block;vertical-align:middle"> Poké-Radar · ${Z(S.zone).nom}`, `<p class="doux">Les Pokémon qui peuvent apparaître dans cette zone.</p><div class="liste">${l}</div>`, { cls: "etroite" });
}
function celCouche() {
  const b = (v, t, ico, k) => `<button type="button" class="plaque" data-act="cel-choix" data-v="${v}">${ic(ico)}${t} ${kb(k)}</button>`;
  return `<div class="couche"><section class="modal cadre" role="dialog" aria-modal="true" aria-label="Céladopole"><div class="tete"><h2>Céladopole</h2>${fermerBtn}</div><p class="doux">Où veux-tu aller ?</p>${b("combat", "Arène de Céladopole", "badge", "1")}${b("commercial", "Centre commercial", "shop", "2")}${b("casino", "Casino", "casino", "3")}</section></div>`;
}
function raccourcisCouche() {
  const g = (t, l) => `<div><h3 class="sous-titre">${t}</h3><dl>${l.map(([k, d]) => `<dt>${k.split(" ").map(kb).join("")}</dt><dd>${d}</dd>`).join("")}</dl></div>`;
  return fen(`${ic("clavier")} Raccourcis clavier`, `<div class="raccourcis">${g("Combat", [["Espace", "Attaquer"], ["Entrée", "Attaquer"], ["C", "Capturer"], ["B", "Changer de balle"], ["A", "Attaque auto"], ["T", "Arrêt auto"], ["R", "Réglage de l'arrêt auto"], ["S", "Sac"], ["F", "Fauchage"], ["P", "Poké-Radar"], ["Flèche gauche", "Zone précédente"], ["Flèche droite", "Zone suivante"]])}
    ${g("Partout", [["1", "Combat"], ["2", "Équipe"], ["3", "Shop"], ["4", "Carte"], ["5", "Menu"], ["Échap", "Fermer la fenêtre"], ["Tab", "Élément suivant"], ["Maj Tab", "Élément précédent"], ["/", "Chercher (PC, Pokédex)"], ["?", "Cette liste"]])}</div>
    <p class="doux">Les raccourcis n'existent que sur ordinateur. Ils sont ignorés quand tu écris dans un champ.</p>`);
}
function evoCouche() {
  const e = S.evoAnim; if (!e) return "";
  const fin = e.etape === "fin";
  return `<div class="couche haut"><section class="fenetre etroite cadre" role="dialog" aria-modal="true" aria-label="Évolution"><div class="corps" style="align-items:center;text-align:center"><div class="gros-sprite-c"><img class="${fin ? "" : "evo-flash"}" src="${SPR}${fin ? e.vers : e.n}.png" width="96" height="96" alt="" style="width:192px;height:192px"></div>
    <h2>${fin ? `${nomEsp(e.n)} a évolué en ${nomEsp(e.vers)} !` : `Quoi ? ${nomEsp(e.n)} évolue !`}</h2>${fin ? `<button type="button" class="plaque action" data-act="evo-ok" data-autofocus>Super</button>` : `<p class="doux">Le Pokémon brille…</p>`}</div></section></div>`;
}
function dexCouche() { if (!S.diplomeOuv) return ""; return fen("Diplôme du Pokédex", `<img src="img/diplome.webp" width="640" height="452" alt="Diplôme officiel de Kanto : le Professeur Chen certifie que tu as complété le Pokédex." style="width:100%;height:auto;image-rendering:auto"><p>Léo · Obtenu le 5 novembre 2026</p>`, { cls: "large", pied: `<button type="button" class="plaque" data-act="imprimer">Imprimer</button>` }); }
function badgeCouche() {
  const id = S.badgeSel; if (!id) return "";
  const [, nom, eff, are, champ_] = BADGES.find((b) => b[0] === id), ok = S.badgesObt.includes(id);
  return fen(`Badge ${nom}`, `<img class="gros-badge ${ok ? "" : "manque"}" src="img/badges/${id}.png" width="128" height="128" alt="">
    <p style="text-align:center"><span class="tag ${ok ? "" : "neutre"}">${ok ? "Obtenu" : "Pas encore obtenu"}</span></p>
    <dl class="infos"><dt>Effet</dt><dd>${eff}</dd><dt>Arène</dt><dd>${are}</dd><dt>Champion</dt><dd>${champ_}</dd></dl>${ok ? "" : `<p class="doux">Bats le champion de l'arène pour gagner ce badge. Son effet est permanent.</p>`}`, { cls: "etroite" });
}
function dialogueCouche() {
  return `<div class="couche" style="align-items:end"><section class="cadre dialogue" role="dialog" aria-modal="true" aria-label="Prof. Chen"><img src="img/chen/SpriteChen2.png" width="120" height="120" alt=""><div><p class="titre">Prof. Chen</p><p>Bravo, Léo ! Tu viens d'attraper ton premier Pokémon. Ouvre ton équipe pour le voir.</p></div><button type="button" class="plaque action" data-act="fermer" data-autofocus>Compris <span class="fleche">${ic("chevron")}</span></button></section></div>`;
}
function modalCompte() {
  const m = S.modal; if (!m) return "";
  const p = partie(m.id);
  if (m.type === "renommer") return fen("Renommer la partie", `<form data-form="renommer" novalidate style="display:grid;gap:var(--ecart)">${formNom(p ? p.nom : "")}<div class="pied"><button type="button" class="plaque" data-act="fermer">Annuler</button><button type="submit" class="plaque action">Renommer</button></div></form>`, { cls: "etroite" });
  if (m.type === "supprimer") return fen("Supprimer cette partie ?", `<p>« ${esc(p ? p.nom : "")} » sera supprimée de tous tes appareils. Tu ne pourras pas la récupérer.</p>`, { cls: "etroite", pied: `<button type="button" class="plaque" data-act="fermer" data-autofocus>Annuler</button><button type="button" class="plaque danger" data-act="supprimer-oui">Supprimer définitivement</button>` });
  if (m.type === "restaurer") {
    if (m.etape === 1) return fen("Restaurer une sauvegarde précédente", `<p class="doux">Choisis la sauvegarde de « ${esc(p ? p.nom : "")} » à retrouver.</p><div class="liste">${RESTAURER.map(([q, l, t], i) => `<button type="button" class="ligne-p" data-act="restaurer-choix" data-v="${i}"><span class="corps"><span class="t">${q}</span><span class="s">${l} · ${t} de jeu</span></span>${ic("chevron")}</button>`).join("")}</div>`, { cls: "etroite" });
    const c = RESTAURER[m.choix];
    return fen("Confirmer la restauration", `<p class="message alerte">${ic("alerte")}<span>La partie reviendra à « ${c[0]} » (${c[1]}, ${c[2]} de jeu). La sauvegarde actuelle sera remplacée et les autres appareils seront fermés.</span></p>`, { cls: "etroite", pied: `<button type="button" class="plaque" data-act="restaurer-retour">Retour</button><button type="button" class="plaque danger" data-act="restaurer-oui" data-autofocus>Restaurer</button>` });
  }
  if (m.type === "ailleurs") return fen("Partie ouverte ailleurs", `<p>« ${esc(p ? p.nom : "")} » est ouverte sur un autre appareil. Si tu la reprends ici, l'autre appareil sera fermé et tu reprendras exactement au même endroit.</p>`, { cls: "etroite", pied: `<button type="button" class="plaque" data-act="fermer">Annuler</button><button type="button" class="plaque action" data-act="reprendre-ici" data-autofocus>Reprendre ici</button>` });
  if (m.type === "supprimee") return fen("Partie supprimée ailleurs", `<p>« ${esc(p ? p.nom : "")} » a été supprimée depuis un autre appareil. Elle n'existe plus.</p>`, { cls: "etroite", pied: `<button type="button" class="plaque action" data-act="oublier-partie" data-autofocus>Compris</button>` });
  if (m.type === "deco") return fen("Se déconnecter ?", `<p>${S.sync === "cours" ? "Ta partie se synchronise encore. Elle sera sauvegardée avant la déconnexion." : "Tu retrouveras tes parties en te reconnectant."}</p>`, { cls: "etroite", pied: `<button type="button" class="plaque" data-act="fermer" data-autofocus>Annuler</button><button type="button" class="plaque action" data-act="deco-oui">${S.sync === "cours" ? "Sauvegarder et se déconnecter" : "Se déconnecter"}</button>` });
  return "";
}
function attenteCouche() {
  const a = S.attente || (S.deco === "charge" ? { t: "Sauvegarde avant la déconnexion…", s: "Ne ferme pas la page : ta partie se synchronise.", barre: true } : S.deco === "echec" ? { t: "La sauvegarde a échoué", s: "Ta partie n'a pas pu être synchronisée. Tes dernières actions ne sont pas encore en ligne.", echec: true } : null);
  if (!a) return "";
  return `<div class="attente-plein" role="alertdialog" aria-modal="true" aria-label="${esc(a.t)}"><div class="rond-charge" ${a.echec ? 'style="display:none"' : ""}></div><h1>${a.t}</h1><p>${a.s || ""}</p>${a.barre ? `<div class="barre-ind"><i></i></div>` : ""}
    ${a.echec ? `<p class="message erreur">${ic("alerte")}<span>Réessaie, ou reste connecté pour ne rien perdre.</span></p><div class="rangee"><button type="button" class="plaque action" data-act="deco-oui" data-autofocus>Réessayer</button><button type="button" class="plaque" data-act="deco-rester">Rester connecté</button></div>` : ""}</div>`;
}
function erreurCouche() {
  if (S.erreur !== "reseau") return "";
  return fen("Connexion impossible", `<p class="message erreur">${ic("reseau")}<span>Le serveur ne répond pas. Ta partie reste sauvegardée sur cet appareil et sera envoyée dès que la connexion revient.</span></p>`, { cls: "etroite", role: "alertdialog", pied: `<button type="button" class="plaque" data-act="fermer">Continuer hors connexion</button><button type="button" class="plaque action" data-act="reessayer" data-autofocus>Réessayer</button>` });
}
function couchesHtml() {
  return [S.dialogue && dialogueCouche(), S.sac && sacCouche(), S.reglAuto && reglAutoCouche(), S.radar && radarCouche(), S.fiche && ficheCouche(), S.relacher && relacherCouche(), S.cel && celCouche(),
    dexCouche(), S.badgeSel && badgeCouche(), S.raccourcis && raccourcisCouche(), S.evoAnim && evoCouche(), modalCompte(), erreurCouche(), attenteCouche()].filter(Boolean).join("");
}
const aUneCouche = () => S.dialogue || S.sac || S.reglAuto || S.radar || S.fiche || S.cel || S.diplomeOuv || S.badgeSel || S.raccourcis || S.evoAnim || S.modal || S.erreur || S.attente || S.deco;

/* ---------- coquille ---------- */
function legende() {
  const l = S.page === "combat"
    ? [["Espace", "Attaquer"], ["C", "Capturer"], ["B", "Balle"], ["A", "Auto"], ["T", "Arrêt"], ["S", "Sac"], ...(S.deb ? [["F", "Fauchage"], ["P", "Radar"]] : []), ["Flèches", "Zone"], ["1–5", "Onglets"], ["?", "Tous"]]
    : [["1–5", "Onglets"], ["Tab", "Naviguer"], ["Échap", "Fermer"], ["?", "Raccourcis"]];
  return `<footer class="legende" aria-label="Raccourcis clavier">${l.map(([k, t]) => `<span>${k.split(" ").map(kb).join("")} ${t}</span>`).join("")}</footer>`;
}
function coque() {
  const p = S.page, contenu = couchesHtml(), cote = popsHtml();
  if (enIntro()) return `<div class="app sans-lateral"><main class="zone-jeu">${p === "titre" ? ecranTitre() : ecranIntro()}</main>${contenu}${cote}</div>`;
  if (AUTH.includes(p)) return `<div class="app sans-lateral"><main class="zone-jeu">${PAGES[p]()}</main>${contenu}${cote}</div>`;
  const sync = `<span class="synchro-barre"><span class="sync ${S.sync === "hors" ? "hors" : S.sync === "cours" ? "cours" : ""}"></span>${SYNCS[S.sync][0]}</span>`;
  if (enCompte()) {
    return `<div class="app sans-lateral"><div class="zone-jeu"><header class="compte-haut"><div class="marque"><b>PokiClicker</b></div><nav class="onglets-compte" aria-label="Zone compte">${ONG_COMPTE.map(([id, t, ico]) => `<button type="button" data-go="${id}" aria-current="${p === id || (p === "c-nouvelle" && id === "c-parties") ? "page" : "false"}">${ic(ico)}${t}</button>`).join("")}</nav>${sync}</header><main class="compte-page">${PAGES[p]()}</main></div>${contenu}${cote}</div>`;
  }
  const act = entreeNav(p);
  const nav = NAV.map(([id, t, ico], i) => `<button type="button" class="cle-nav" data-go="${id}" aria-current="${act === id ? "page" : "false"}">${ic(ico)}<span class="t">${t}</span>${kb(String(i + 1))}${id === "equipe" && S.evo ? '<span class="point"></span>' : ""}</button>`).join("");
  const plein = ["combat", "equipe", "pc"].includes(p);
  return `<div class="app"><aside class="lateral ${S.page === "monde" && false ? "inerte" : ""}"><div class="marque"><b>PokiClicker</b><span>Kanto</span></div><nav aria-label="Navigation principale" style="display:grid;gap:var(--u)">${nav}</nav>
    <div class="bas"><b>Partie de Léo</b><span class="ligne-s">${sync}</span></div></aside>
    <div class="zone-jeu"><header class="cles" aria-label="Chiffres clés"><div class="cle"><small>Pokédollars</small><b id="pieces">${pd(S.pieces)}</b></div><div class="cle"><small>DPS</small><b>${nf(40365)}</b></div><div class="cle"><small>Zone</small><b>${Z(S.zone).nom}</b></div>
      <div class="fin">${sync}<button type="button" class="plaque petite" data-act="raccourcis">${ic("clavier")}Raccourcis ${kb("?")}</button></div></header>
      <main class="ecran ${plein ? "plein" : ""}" id="ecran">${PAGES[p]()}</main>${legende()}</div>${contenu}${cote}</div>`;
}

const cleEl = (el) => (!el || !el.closest ? null : el.id ? "#" + el.id : el.dataset && (el.dataset.act || el.dataset.go || el.dataset.key || el.dataset.zone) ? ["act", "go", "key", "id", "v", "i", "zone"].reduce((s, k) => (el.dataset[k] !== undefined ? s + `[data-${k}="${el.dataset[k]}"]` : s), "") : null);
function rendre() {
  const racine = $("#racine"), avant = document.activeElement, cle = cleEl(avant);
  const ecran = $("#ecran"), sc = ecran ? ecran.scrollTop : 0, lz = $(".liste-zones"), sz = lz ? lz.scrollTop : 0, etaitCouche = !!$(".couche, .attente-plein");
  if (aUneCouche() && !etaitCouche && cle) ouvertPar = cle;
  racine.innerHTML = coque();
  const e2 = $("#ecran"); if (e2) e2.scrollTop = sc; const l2 = $(".liste-zones"); if (l2) l2.scrollTop = sz;
  const dlg_ = $(".couche [role=dialog], .couche [role=alertdialog], .attente-plein");
  if (cle) { const el = (dlg_ || document).querySelector(cle); if (el && (!dlg_ || dlg_.contains(el))) el.focus({ preventScroll: true }); }
  if (dlg_ && !dlg_.contains(document.activeElement)) { const f = dlg_.querySelector("[data-autofocus]") || dlg_.querySelector("button, input, select"); if (f) f.focus({ preventScroll: true }); }
  if (!dlg_ && etaitCouche && ouvertPar) { const el = $(ouvertPar); if (el) el.focus({ preventScroll: true }); ouvertPar = null; }
  if (!dlg_ && S.focusDemo) { const f = $("[data-act=capturer]"); if (f) { f.focus(); f.classList.add("montre-focus"); } }
  document.title = "PokiClicker · maquette PC";
}
function aller(go) {
  S.sac = S.reglAuto = S.radar = S.fiche = S.cel = S.diplomeOuv = S.raccourcis = S.dialogue = false; S.badgeSel = null; S.modal = null; S.renom = S.relacher = false; S.echange = null; S.dexSel = go === "pokedex" ? S.dexSel : null;
  if (go !== "equipe") S.choix = go === "equipe" ? S.choix : null;
  S.page = go; rendre(); const e = $("#ecran"); if (e) e.scrollTop = 0;
}
function fermerCouche() {
  if (S.attente || S.deco) return;
  if (S.relacher) { S.relacher = false; return; }
  if (S.renom) { S.renom = false; S.renomErr = false; return; }
  S.sac = S.reglAuto = S.radar = S.fiche = S.cel = S.diplomeOuv = S.raccourcis = S.dialogue = false; S.badgeSel = null; S.modal = null; S.erreur = null; S.ficheErr = ""; S.evoAnim = null;
}
function majPv() {
  const i = $(".scene .barre-pv i"), t = $(".scene .pv-txt"), pc = $("#pieces");
  if (i) i.style.setProperty("--pv", (S.pv / S.pvMax) * 100 + "%"); if (t && S.cs !== "boss") t.textContent = `PV ${S.pv} / ${S.pvMax}`; if (pc) pc.textContent = pd(S.pieces);
}
function attaquer() {
  const sc = $(".scene"); if (!sc) return;
  sc.classList.remove("coup"); void sc.offsetWidth; sc.classList.add("coup");
  S.pv -= 12; if (S.pv <= 0) { S.pv = S.pvMax; S.pieces += 150; }
  majPv();
}
function lancerVol(id, apres) {
  const from = Z(S.zone), dest = Z(id), c = $("#mini-carte"); if (S.enVol || !c) return;
  const fini = () => { S.enVol = false; S.zone = id; S.cs = null; S.etape = 1; S.page = apres || (id === "bourg-palette" ? "lieu-bourg" : "combat"); rendre(); pop(`Arrivée : ${dest.nom}`, "info", 2600); };
  S.enVol = true;
  if (reduit()) { c.classList.add("fondu"); timers.push(setTimeout(fini, 300)); return; }
  const d = $(".dresseur", c) || Object.assign(document.createElement("img"), { className: "dresseur" }); d.style.left = from.x * 100 + "%"; d.style.top = from.y * 100 + "%"; if (!d.parentNode) c.appendChild(d);
  let k = 0; const anim = setInterval(() => { k = (k + 1) % 5; d.src = `img/dresseur/vol-${k + 1}.png`; }, VOL.imageMs); timers.push(anim);
  const lz = $(".liste-zones"); if (lz) lz.classList.add("vole");
  timers.push(setTimeout(() => {
    clearInterval(anim); d.remove();
    const o = document.createElement("div"); o.className = "vol-overlay"; o.dataset.phase = "vol"; o.setAttribute("aria-hidden", "true"); o.style.cssText = `--ouv:${VOL.pisteMs}ms;--traits:${VOL.traitsMs}ms;--trajet:${VOL.volMs}ms;--ferm:${VOL.fermetureMs}ms`;
    o.innerHTML = `<div class="vol-attente"><div class="vol-piste"><div class="vol-traits">${TRAITS}${TRAITS}</div><div class="vol-trajet"><img class="vol-oiseau" src="img/animes/roucarnage-vol.gif" width="96" height="96" alt=""></div></div></div>`;
    c.appendChild(o);
    timers.push(setTimeout(() => { o.dataset.phase = "fermeture"; }, VOL.volMs));
    timers.push(setTimeout(() => { c.classList.add("fondu"); }, VOL.volMs + VOL.fermetureMs - 100));
    timers.push(setTimeout(fini, VOL.volMs + VOL.fermetureMs + VOL.fonduReduitMs));
  }, VOL.poseMs + VOL.delaiOuvertureMs));
}
const VOL = { poseMs: 800, delaiOuvertureMs: 50, volMs: 2500, fermetureMs: 500, imageMs: 150, pisteMs: 400, traitsMs: 200, fonduReduitMs: 300 };
const TRAITS = `<svg viewBox="0 0 400 180" preserveAspectRatio="none"><path stroke="currentColor" stroke-width="2" fill="none" d="M25 15h8 M150 30h12 M80 100h10 M300 80h8 M350 20h9 M220 90h11 M20 70h7 M250 50h9 M120 5h8 M380 110h10 M50 85h9 M180 60h12 M100 140h10 M320 160h8 M200 130h12"/></svg>`;
function attente(t, s, ms, fin) { S.attente = { t, s, barre: true }; rendre(); timers.push(setTimeout(() => { S.attente = null; fin(); }, ms)); }
function quitterFiche() { S.fiche = null; S.renom = false; S.renomErr = false; S.relacher = false; S.ficheErr = ""; }

/* ---------- actions ---------- */
const ACT = {
  fermer: () => { fermerCouche(); rendre(); },
  attaquer: () => attaquer(),
  zone: (el) => { const i = OUVERTES.indexOf(Z(S.zone)) + Number(el.dataset.v); if (OUVERTES[i]) { S.zone = OUVERTES[i].id; S.etape = 1; S.cs = null; rendre(); } },
  balle: () => { S.ball = (S.ball + 1) % BALLS.length; rendre(); },
  capturer: () => { if (S.cs === "capture") return; S.cs = "capture"; rendre(); timers.push(setTimeout(() => { S.cs = null; rendre(); pop("Rattata capturé ! Il rejoint ton PC.", "succes", 3200, SPR + "19.png"); }, 2600)); },
  auto: () => { S.auto = !S.auto; rendre(); }, arret: () => { S.arret = !S.arret; rendre(); },
  "regl-auto": () => { S.reglAuto = true; rendre(); }, sac: () => { S.sac = true; rendre(); },
  fauchage: () => { if (!S.deb) return; pop("Fauchage : 4 Pokémon vaincus", "info", 2600); S.pieces += 600; majPv(); }, radar: () => { if (!S.deb) return; S.radar = true; rendre(); },
  reprendre: () => { S.cs = null; rendre(); },
  raccourcis: () => { S.raccourcis = true; rendre(); },
  utiliser: (el) => { if (el.dataset.cible === "1") { S.choix = el.dataset.nom; S.sac = false; S.page = "equipe"; rendre(); } else { S.sac = false; rendre(); pop(`${el.dataset.nom} utilisé.`, "succes", 2600); } },
  "choix-annuler": () => { S.choix = null; rendre(); },
  cible: (el) => { const e = EQUIPE[Number(el.dataset.i)], nom = S.choix; S.choix = null; rendre(); pop(`${e[1]} est déjà au niveau maximum.`, "erreur", 3200); void nom; },
  "fiche-eq": (el) => { S.fiche = { src: "eq", i: Number(el.dataset.i) }; rendre(); },
  "fiche-pc": (el) => { S.fiche = { src: "pc", id: Number(el.dataset.id) }; rendre(); },
  fav: () => { const p = pDeFiche(); if (!p) return; if (p.eq) S.favEq[p.i] = !S.favEq[p.i]; else p.fav = !p.fav; rendre(); },
  "renommer-pk": () => { S.renom = true; rendre(); }, "renommer-annuler": () => { S.renom = false; S.renomErr = false; rendre(); },
  relacher: () => { S.relacher = true; rendre(); }, "relacher-non": () => { S.relacher = false; rendre(); },
  "relacher-oui": () => { const p = pDeFiche(); if (!p) return; const nom = nomP(p); if (p.eq) EQUIPE.splice(p.i, 1); else S.pc = S.pc.filter((x) => x.id !== p.id); quitterFiche(); rendre(); pop(`${nom} a quitté ton aventure.`, "info", 2800); },
  "fiche-principal": () => {
    const p = pDeFiche(); if (!p) return;
    if (p.eq) { if (EQUIPE.length <= 1) return; const e = EQUIPE.splice(p.i, 1)[0]; S.pc.push({ id: 100 + S.pc.length, n: Number(e[0]), niveau: 100, sexe: Number(e[0]) % 2 ? "m" : "f" }); quitterFiche(); rendre(); pop(`${e[1]} est parti au PC.`, "info", 2600); }
    else if (EQUIPE.length < 6) { S.pc = S.pc.filter((x) => x.id !== p.id); EQUIPE.push([String(p.n), nomEsp(p.n), dpsPc(p)]); quitterFiche(); rendre(); pop(`${nomP(p)} rejoint ton équipe.`, "succes", 2600); }
    else { S.echange = p.id; quitterFiche(); rendre(); }
  },
  echanger: (el) => { const i = Number(el.dataset.i), p = S.pc.find((x) => x.id === S.echange); if (!p) return; const e = EQUIPE[i]; EQUIPE[i] = [String(p.n), nomEsp(p.n), dpsPc(p)]; S.pc = S.pc.filter((x) => x.id !== p.id); S.pc.push({ id: 200 + S.pc.length, n: Number(e[0]), niveau: 100, sexe: "m" }); S.echange = null; rendre(); pop(`${nomP(p)} remplace ${e[1]}.`, "succes", 2600); },
  "echange-annuler": () => { S.echange = null; rendre(); },
  evoluer: () => { quitterFiche(); S.evoAnim = { n: 16, vers: 17, etape: "flash" }; rendre(); timers.push(setTimeout(() => { if (S.evoAnim) { S.evoAnim.etape = "fin"; rendre(); } }, 2400)); },
  "evo-ok": () => { EQUIPE[2] = ["17", nomEsp(17), 5600]; S.evo = false; S.evoAnim = null; rendre(); pop("Roucool a évolué en Roucoups !", "succes", 3200, SPR + "17.png"); },
  "pc-filtre": (el) => { S[el.dataset.v] = !S[el.dataset.v]; rendre(); }, "pc-effacer": () => { S.pcQ = ""; S.pcFav = S.pcShiny = S.pcOeuf = false; rendre(); },
  "pc-vider": () => { S.pc = S.pc.length ? [] : pcDepart(); rendre(); }, "verrouiller-pc": () => { S.pcOuvert = false; rendre(); }, "debloquer-pc": () => { S.pcOuvert = true; rendre(); pop("PC de Léo débloqué.", "succes", 2800); },
  onglet: (el) => { S.onglet = el.dataset.v; rendre(); },
  acheter: (el) => { const prix = Number(el.dataset.prix); if (S.pieces < prix) { pop(`Il te manque ${pd(prix - S.pieces)} pour cet achat.`, "erreur", 3000); return; } S.pieces -= prix; rendre(); pop(`${el.dataset.nom} acheté pour ${pd(prix)}.`, "succes", 2800); },
  aller: (el) => { const z = Z(el.dataset.id); if (!z.ouverte || S.enVol) return; if (z.id === "arene-de-celadopole") { S.cel = true; rendre(); return; } if (z.id === S.zone) { S.page = z.id === "bourg-palette" ? "lieu-bourg" : "combat"; rendre(); return; } lancerVol(z.id); },
  "cel-choix": (el) => { S.cel = false; rendre(); lancerVol("arene-de-celadopole", el.dataset.v === "combat" ? "combat" : el.dataset.v); },
  "lieu-maman": () => aller("lieu-maman"), "lieu-blue": () => aller("lieu-blue"), "lieu-labo": () => pop("Le Prof. Chen n'a rien de nouveau pour toi.", "info", 2800), "lieu-pension": () => aller("pension"), "lieu-bateau": () => pop("Le bateau vers Johto n'est pas encore là.", "alerte", 2800),
  "egg-daran": () => pop("La télé s'allume : une vidéo de Daran, sans le son.", "info", 3200), soigner: () => pop("Ton équipe est en pleine forme.", "succes", 2600),
  "pension-reprendre": () => pop("Pokémon repris de la Pension.", "info", 2600), "pension-oeuf": () => pop("Un œuf rejoint ton PC.", "succes", 2800),
  sauvegarder: () => { S.sync = "cours"; rendre(); timers.push(setTimeout(() => { S.sync = "ajour"; rendre(); pop("Partie sauvegardée.", "succes", 2400); }, 1400)); },
  "menu-principal": () => attente("Sauvegarde de ta partie…", "Tu vas retrouver tes parties.", 1500, () => { S.page = "c-parties"; rendre(); }),
  inter: (el) => { const k = el.dataset.key; if (k === "lie") S.lie = !S.lie; else if (k.startsWith("arret-")) S.arrets[k.slice(6)] = !S.arrets[k.slice(6)]; else S[k].on = !S[k].on; rendre(); },
  "dex-detail": (el) => { S.dexSel = Number(el.dataset.id); majDex(); }, "dex-fermer": () => { S.dexSel = null; majDex(); }, "dex-filtre": (el) => { S.dexF = el.dataset.v; rendre(); },
  "dex-complet": () => { S.dexComplet = !S.dexComplet; rendre(); }, diplome: () => { S.diplomeOuv = true; rendre(); }, imprimer: () => pop("Impression : maquette sans effet.", "info", 2400),
  "badge-detail": (el) => { S.badgeSel = el.dataset.id; rendre(); }, "badges-cycle": () => { const n = S.badgesObt.length; S.badgesObt = n === 0 ? ["roche"] : n === 1 ? BADGES.map((b) => b[0]) : []; rendre(); },
  "guide-sec": (el) => { S.guideOuv = el.dataset.id; rendre(); },
  starter: (el) => { const n = Number(el.dataset.id); if (S.starter === n) { S.starter = null; EQUIPE.splice(0, EQUIPE.length, [String(n), nomEsp(n), 600]); attente("Direction la Route 1…", "Ton aventure commence.", 1200, () => { S.zone = "route-1"; S.page = "combat"; S.dialogue = true; rendre(); }); } else { S.starter = n; rendre(); } },
  oeil: (el) => { const i = el.parentNode.querySelector("input"); const on = i.type === "password"; i.type = on ? "text" : "password"; el.setAttribute("aria-pressed", String(on)); },
  "hors-reseau": () => { S.hors = true; S.sync = "hors"; aller("c-parties"); },
  ouvrir: (el) => { const p = partie(Number(el.dataset.id)); if (!p) return; if (!S.hors && p.etat === "ailleurs") { S.modal = { type: "ailleurs", id: p.id }; rendre(); } else if (!S.hors && p.etat === "supprimee") { S.modal = { type: "supprimee", id: p.id }; rendre(); } else attente("Chargement de ta partie…", "Récupération de ta sauvegarde.", 1200, () => { S.page = "monde"; rendre(); }); },
  renommer: (el) => { S.modal = { type: "renommer", id: Number(el.dataset.id) }; rendre(); }, supprimer: (el) => { S.modal = { type: "supprimer", id: Number(el.dataset.id) }; rendre(); },
  restaurer: (el) => { S.modal = { type: "restaurer", id: Number(el.dataset.id), etape: 1 }; rendre(); }, "restaurer-choix": (el) => { S.modal.etape = 2; S.modal.choix = Number(el.dataset.v); rendre(); }, "restaurer-retour": () => { S.modal.etape = 1; rendre(); },
  "restaurer-oui": () => { const p = partie(S.modal.id); if (p) p.sauve = "à l'instant"; S.modal = null; rendre(); pop("Sauvegarde précédente restaurée. Les autres appareils sont fermés.", "succes", 3600); },
  "supprimer-oui": () => { S.parties = S.parties.filter((p) => p.id !== S.modal.id); S.modal = null; rendre(); pop("Partie supprimée.", "info", 2600); },
  "reprendre-ici": () => { const p = partie(S.modal.id); if (p) p.etat = "ajour"; S.modal = null; attente("Reprise de ta partie…", "L'autre appareil est en train de se fermer.", 1300, () => { S.page = "monde"; rendre(); pop("Partie reprise ici, exactement là où tu t'étais arrêté.", "info", 3600); }); },
  "oublier-partie": () => { S.parties = S.parties.filter((p) => p.id !== S.modal.id); S.modal = null; rendre(); },
  deco: () => { S.modal = { type: "deco" }; rendre(); },
  "deco-oui": () => { S.modal = null; S.deco = null; S.attente = { t: "Sauvegarde avant la déconnexion…", s: "Ne ferme pas la page : ta partie se synchronise.", barre: true }; rendre(); timers.push(setTimeout(() => { S.attente = null; S.sync = "ajour"; S.page = "c-connexion"; rendre(); }, 1800)); },
  "deco-rester": () => { S.deco = null; S.attente = null; S.sync = "ajour"; rendre(); },
  mdp: () => { S.depuisCompte = true; aller("c-nouveau"); },
  skin: () => { S.skin = !S.skin; rendre(); }, "cycle-sync": () => { S.sync = { ajour: "cours", cours: "hors", hors: "ajour" }[S.sync]; rendre(); },
  reessayer: () => { S.erreur = null; rendre(); pop("Connexion rétablie.", "succes", 2400); },
};
function majDex() { const p = $("#dex-panneau"); if (p) p.innerHTML = dexPanneau(); document.querySelectorAll(".dex-case").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.id) === S.dexSel))); }

document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("couche") && !S.attente) { fermerCouche(); rendre(); return; }
  const a = e.target.closest("[data-act]");
  if (a && ACT[a.dataset.act]) { ACT[a.dataset.act](a, e); return; }
  const g = e.target.closest("[data-go]"); if (g) aller(g.dataset.go);
});
document.addEventListener("input", (e) => {
  const t = e.target, k = t.dataset && t.dataset.cle; if (!k) return;
  if (t.type === "range") { S[k].v = Number(t.value); t.style.setProperty("--p", t.value + "%"); const o = t.parentNode.querySelector("output"); if (o) o.textContent = t.value; return; }
  S[k] = t.value;
  if (k === "pcQ") { const l = $("#liste-pc"); if (l) l.innerHTML = pcCorps(); const c = $("#cpt"); if (c) c.textContent = pcCompte(); }
  if (k === "dexQ") { const l = dexListe(), el = $("#dex-liste"); if (el) el.innerHTML = l.length ? `<div class="dex-grille">${l.map(dexCase).join("")}</div>` : `<div class="vide-etat">${ic("loupe")}<p>Aucune espèce ne correspond.</p></div>`; }
});
document.addEventListener("change", (e) => { const t = e.target; if (t.tagName === "SELECT" && t.dataset.cle) { S[t.dataset.cle] = t.value; rendre(); } });
document.addEventListener("submit", (e) => {
  e.preventDefault(); const f = e.target.dataset.form;
  if (f === "connexion") { S.cx = null; attente("Connexion…", "Un instant.", 900, () => { S.page = "c-parties"; rendre(); }); }
  else if (f === "inscription") { if (val("f-mdp").length < 10) { S.ins = true; rendre(); } else { S.ins = false; attente("Création du compte…", "Un instant.", 900, () => { S.page = "c-parties"; S.parties = []; rendre(); }); } }
  else if (f === "oubli") aller("c-oubli-envoye");
  else if (f === "nouveau") { const d = S.depuisCompte; S.depuisCompte = false; aller(d ? "c-compte" : "c-connexion"); pop("Mot de passe enregistré.", "succes", 2600); }
  else if (f === "creer") { const nom = val("f-nom").trim() || "Nouvelle partie"; S.parties.push({ id: Date.now() % 100000, nom, lieu: "Kanto · Bourg Palette", temps: "0 h 00", sauve: "à l'instant", etat: "ajour" }); S.page = "intro-maman"; rendre(); }
  else if (f === "renommer") { const nom = val("f-nom").trim(); const p = partie(S.modal.id); if (nom && p) p.nom = nom; S.modal = null; rendre(); }
  else if (f === "surnom") { const v = val("f-surnom").trim(), p = pDeFiche(); if (!v || v.length > 12) { S.renomErr = true; rendre(); return; } if (p.eq) S.surEq[p.i] = v; else p.surnom = v; S.renom = false; S.renomErr = false; rendre(); }
});
document.addEventListener("keydown", (e) => {
  const t = e.target, saisie = t.matches && t.matches("input:not([type=range]), textarea, select");
  const dlg_ = $(".couche [role=dialog], .couche [role=alertdialog], .attente-plein");
  if (e.key === "Tab" && dlg_) {
    const f = [...dlg_.querySelectorAll("button:not([disabled]), input:not([disabled]), select, [href]")].filter((x) => x.offsetParent !== null);
    if (f.length) { const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); } }
    return;
  }
  if (e.key === "Escape") { if (aUneCouche() && !S.attente && !S.deco) { fermerCouche(); rendre(); } else if (S.choix) { ACT["choix-annuler"](); } return; }
  if (e.ctrlKey || e.metaKey || e.altKey || saisie) return;
  if (e.key === "?") { e.preventDefault(); S.raccourcis = !S.raccourcis; rendre(); return; }
  if (dlg_) { if (S.cel && "123".includes(e.key)) ACT["cel-choix"]({ dataset: { v: ["combat", "commercial", "casino"][Number(e.key) - 1] } }); return; }
  if (enCompte() || enIntro()) return;
  if ("12345".includes(e.key) && e.key.length === 1) {
    if (S.page === "shop" && false) return; const id = NAV[Number(e.key) - 1][0]; aller(id); return;
  }
  if (e.key === "/" && ["pc", "pokedex"].includes(S.page)) { e.preventDefault(); const i = $("#pc-q") || $("#dex-q"); if (i) i.focus(); return; }
  if (S.page === "shop" && false) return;
  if (S.page !== "combat") return;
  const k = e.key.toLowerCase(), sur = t.closest && t.closest("button:not(.scene)");
  if ((e.key === " " || e.key === "Enter") && !sur) { e.preventDefault(); attaquer(); return; }
  const m = { c: "capturer", b: "balle", a: "auto", t: "arret", r: "regl-auto", s: "sac", f: "fauchage", p: "radar" }[k];
  if (m) { e.preventDefault(); ACT[m](); return; }
  if (e.key === "ArrowLeft") { e.preventDefault(); ACT.zone({ dataset: { v: "-1" } }); } if (e.key === "ArrowRight") { e.preventDefault(); ACT.zone({ dataset: { v: "1" } }); }
});
document.addEventListener("mouseover", (e) => { const z = e.target.closest && e.target.closest("[data-zone]"); document.querySelectorAll(".survol,.focus-l").forEach((x) => x.classList.remove("survol", "focus-l")); if (z) document.querySelectorAll(`[data-zone="${z.dataset.zone}"]`).forEach((x) => x.classList.add(x.classList.contains("cercle") ? "survol" : "focus-l")); });
document.addEventListener("focusin", (e) => { const z = e.target.closest && e.target.closest(".zone-l"); document.querySelectorAll(".cercle.survol").forEach((x) => x.classList.remove("survol")); if (z) { const c = document.querySelector(`.cercle[data-zone="${z.dataset.zone}"]`); if (c) c.classList.add("survol"); } });

function demarrer() {
  depart(location.hash.slice(1));
  rendre();
  if (S.volAuto) timers.push(setTimeout(() => lancerVol(S.volAuto), 400));
  timers.push(setInterval(() => { if (S.page === "combat" && S.auto && !S.cs && !aUneCouche() && !document.hidden) attaquer(); }, 1100));
}
window.addEventListener("hashchange", demarrer);
demarrer();
