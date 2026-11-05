/* A4 : écrans ajoutés (PC, fiche d'un Pokémon, Pokédex, Badges, Statistiques, Guide) et couches associées.
   Chargé avant a4.js, dans le même script : il utilise S, esc, nf, pd, EQUIPE, IMG, PK, DEX et GUIDE (définis ailleurs) au moment des appels. */
Object.assign(PK.chemins, {
  etoile: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  etincelle: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z",
  oeuf: "M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z",
  loupe: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 21 21",
  stats: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  guide: "M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM8 9h8M8 13h6",
  balle: PK.chemins.balle || "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  verifie: "m5 12 5 5 9-10",
  diplome: "M4 4h16v13H4zM8 8h8M8 12h5M14 17l3 4 3-4",
});

/* ---------- données fictives ---------- */
const SPR = "img/pokemon/";
const SHINYS = [6, 25, 130];
const sprite = (n, shiny) => `${SPR}${shiny && SHINYS.includes(n) ? "shiny-" : ""}${n}.png`;
const nomEsp = (n) => DEX[n - 1][1];
const typesEsp = (n) => DEX[n - 1].slice(2);
const EVO = { 7: "niveau 16", 10: "niveau 7", 19: "niveau 20", 129: "niveau 20", 133: "Pierre Eau, Pierre Foudre ou Pierre Feu", 39: "Pierre Lune", 54: "niveau 33", 63: "niveau 16", 74: "niveau 25", 92: "niveau 25" };
const pcDepart = () => [
  { id: 1, n: 7, niveau: 34, sexe: "m", fav: true }, { id: 2, n: 10, niveau: 8, sexe: "f" }, { id: 3, n: 19, niveau: 12, sexe: "m", surnom: "Rata" },
  { id: 4, n: 129, niveau: 5, sexe: "f" }, { id: 5, n: 130, niveau: 52, sexe: "m", shiny: true }, { id: 6, n: 133, niveau: 22, sexe: "f", fav: true },
  { id: 7, n: 39, niveau: 15, sexe: "f" }, { id: 8, n: 54, niveau: 18, sexe: "m" }, { id: 9, n: 63, niveau: 10, sexe: "m" },
  { id: 10, n: 74, niveau: 20, sexe: "m" }, { id: 11, n: 92, niveau: 14, sexe: "m" }, { id: 12, oeuf: { pas: 4, max: 10 } },
];
const JALONS = [[10, "Débutant", "Dégâts Clic x2"], [20, "Amateur", "+2 500 ₽"], [30, "Collectionneur", "DPS Équipe +50%"], [40, "Dresseur", "Omni Exp (XP +100%)"], [50, "Expert", "Apparition +20%"],
  [70, "Champion", "Boutique -15%"], [90, "Maître", "Dégâts Totaux +50%"], [110, "Légende", "Jeton Shiny"], [130, "Mythique", "Master Ball + 10 Bonbons"], [151, "Maître de Kanto", "Charme Chroma (Shiny x3)"]];
const CAPT = (() => { const s = new Set([3, 6, 7, 10, 16, 19, 21, 25, 26, 39, 54, 63, 74, 92, 129, 130, 133]); for (let k = 1; s.size < 47; k++) s.add((k * 37) % 151 + 1); return s; })();
const BADGES = [
  ["roche", "Roche", "Dégâts Clic +50%", "Arène d'Argenta", "Pierre (Onix)"], ["cascade", "Cascade", "DPS Équipe +30%", "Arène d'Azuria", "Ondine (Staross)"],
  ["foudre", "Foudre", "Dégâts Totaux +20%", "Arène de Carmin", "Major Bob (Raichu)"], ["prisme", "Prisme", "Pokédollars gagnés +20%", "Arène de Céladopole", "Erika (Empiflor)"],
  ["ame", "Âme", "XP gagnée +50%", "Arène de Parmanie", "Koga (Smogogo)"], ["marais", "Marais", "Taux de capture +30%", "Arène de Safrania", "Sabrina (Alakazam)"],
  ["volcan", "Volcan", "Dégâts Totaux +50%", "Arène de Cramois'Île", "Blaine (Arcanin)"], ["terre", "Terre", "Vitesse d'apparition +20%", "Arène de Jadielle", "Giovanni (Rhinoféros)"],
];

const norm = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const virg = (x) => String(x).replace(".", ",");
const nbCapt = () => (S.dexComplet ? 151 : CAPT.size);
const estCapt = (n) => S.dexComplet || CAPT.has(n);
const nomP = (p) => (p.oeuf ? "Œuf" : p.surnom || nomEsp(p.n));
const pasOeuf = (p) => `Éclosion : ${p.oeuf.pas}/${p.oeuf.max}`;
const sexeHtml = (p) => (p.sexe === "m" ? '<span class="sexe m" role="img" aria-label="Mâle">♂</span>' : p.sexe === "f" ? '<span class="sexe f" role="img" aria-label="Femelle">♀</span>' : "");
const ic = (n, c = "") => PK.ic(n, c);
const tagsTypes = (n) => typesEsp(n).map((t) => `<span class="tag neutre">${t}</span>`).join("");
const retourBtn = (go, label = "Retour") => `<button type="button" class="retour plaque" data-go="${go}" aria-label="${label}">${ic("retour")}</button>`;

/* DPS : base = niveau × 41, puis les multiplicateurs de la fiche (type ×1 au PC) */
function dpsDetail(p) {
  const base = p.niveau * 41, type = 1, shiny = p.shiny ? 2 : 1, bonheur = 1.12, stase = 1, calcium = 1.02;
  return { base, type, shiny, bonheur, stase, calcium, total: Math.round(base * type * shiny * bonheur * stase * calcium) };
}
/* Pokémon de l'équipe vu comme une fiche */
function pEquipe(i) { const [n, nom, d] = EQUIPE[i]; return { id: "eq" + i, eq: true, i, n: Number(n), niveau: 100, sexe: Number(n) % 2 ? "m" : "f", dps: d, fav: !!S.favEq[i] }; }
function pDeFiche() { const f = S.fiche; if (!f) return null; return f.src === "eq" ? (EQUIPE[f.i] ? pEquipe(f.i) : null) : S.pc.find((p) => p.id === f.id); }

/* ---------- PC ---------- */
function pcListe() {
  const q = norm(S.pcQ), num = /^(?:#|n°|n)?\s*(\d+)$/.exec(q);
  let l = S.pc.filter((p) => {
    if (S.pcFav && !p.fav) return false;
    if (S.pcShiny && !p.shiny) return false;
    if (S.pcOeuf && !p.oeuf) return false;
    if (!q) return true;
    if (num) return !p.oeuf && p.n === Number(num[1]);
    return norm(nomP(p)).includes(q) || (!p.oeuf && norm(nomEsp(p.n)).includes(q));
  });
  const cmp = {
    numero: (a, b) => (a.oeuf ? 1 : 0) - (b.oeuf ? 1 : 0) || (a.n || 0) - (b.n || 0) || (b.niveau || 0) - (a.niveau || 0),
    nom: (a, b) => nomP(a).localeCompare(nomP(b), "fr"), niveau: (a, b) => (b.niveau || 0) - (a.niveau || 0),
    favori: (a, b) => Number(!!b.fav) - Number(!!a.fav), shiny: (a, b) => Number(!!b.shiny) - Number(!!a.shiny),
  }[S.pcTri];
  return l.sort(cmp);
}
function caseP(p) {
  const nom = nomP(p), s = !!p.shiny && !p.oeuf;
  const img = p.oeuf ? `<span class="oeuf-vignette">${ic("oeuf")}</span>` : `<img class="sp" src="${sprite(p.n, p.shiny)}" width="96" height="96" alt="">`;
  const bas = p.oeuf ? `<span class="s">${pasOeuf(p)}</span>` : `<span class="s">N° ${p.n}</span><span class="s">Niv. ${p.niveau}</span>`;
  return `<button type="button" class="case ${s ? "shiny" : ""} ${p.fav ? "fav" : ""}" data-act="fiche-pc" data-id="${p.id}" aria-label="${esc(nom)}, ${p.oeuf ? pasOeuf(p) : "niveau " + p.niveau}">${img}<span class="corps"><span class="nom"><span>${esc(nom)}</span>${s ? ic("etincelle") : ""}${sexeHtml(p)}${p.fav ? ic("etoile") : ""}</span>${bas}</span></button>`;
}
function pcCorps() {
  if (!S.pc.length) return `<div class="vide-etat">${ic("pc")}<p><b>Ton PC est vide.</b></p><p class="doux">Capture des Pokémon pour les ranger ici.</p></div>`;
  const l = pcListe();
  if (!l.length) {
    const filtres = S.pcFav || S.pcShiny || S.pcOeuf;
    return `<div class="vide-etat" role="status">${ic("loupe")}<p>${S.pcQ.trim() ? `Aucun Pokémon ne correspond à « ${esc(S.pcQ.trim())} ».` : "Aucun Pokémon ne correspond à ces filtres."}</p>${filtres || S.pcQ ? `<button type="button" class="plaque" data-act="pc-effacer">Effacer la recherche et les filtres</button>` : ""}</div>`;
  }
  return `<div class="pc-grille">${l.map(caseP).join("")}</div>`;
}
const pcCompte = () => { const n = S.pc.length, l = n ? pcListe().length : 0; return l !== n ? `${l} sur ${n} Pokémon` : `${n} Pokémon`; };
function ecranPc() {
  const tete = `<div class="titre-page">${retourBtn("equipe", "Retour à l'équipe")}<h1>PC de Léo</h1></div>`;
  if (!PK.etat.pcOuvert) {
    return `${tete}<div class="verrou">${ic("cadenas")}<p><b>Le PC de Léo s'ouvre à l'Arène d'Argenta.</b></p><p class="doux">Tu y rangeras les Pokémon que ton équipe ne peut pas porter.</p></div>
      <button type="button" class="maquette" data-act="debloquer-pc">Maquette : arriver à l'Arène d'Argenta (débloque le PC)</button>`;
  }
  if (S.echange) {
    const p = S.pc.find((x) => x.id === S.echange);
    const l = EQUIPE.map(([n, nom], i) => `<button type="button" class="case" data-act="echanger" data-i="${i}" aria-label="${nom}, niveau 100"><img class="sp" src="${SPR}${n}.png" width="96" height="96" alt=""><span class="corps"><span class="nom"><span>${nom}</span></span><span class="s">Niv. 100</span></span></button>`).join("");
    return `${tete}<div class="bandeau-choix" role="status"><p>Choisis le Pokémon à remplacer par ${esc(p ? nomP(p) : "")}</p><button type="button" class="plaque" data-act="echange-annuler">${ic("croix")}Annuler</button></div>
      ${S.echangeErr ? `<p class="message erreur" role="alert">${ic("alerte")}<span>${S.echangeErr}</span></p>` : ""}
      <div class="echange"><h2 class="sous-titre">Ton équipe · ${EQUIPE.length} / 6</h2><div class="equipe-6">${l}</div></div>`;
  }
  const b = (act, v, t, on) => `<button type="button" class="plaque" data-act="${act}" data-v="${v}" aria-pressed="${on}">${t}</button>`;
  return `${tete}<div class="compteur"><span id="cpt">${pcCompte()}</span></div>
    <label class="champ recherche" for="pc-q"><span>Nom ou numéro</span><span class="zone-saisie"><input id="pc-q" type="search" data-cle="pcQ" value="${esc(S.pcQ)}" autocomplete="off" enterkeyhint="search"></span></label>
    <div><small class="doux">Trie par :</small><div class="chips tri" role="group" aria-label="Trie les Pokémon">${[["numero", "Numéro"], ["nom", "Nom"], ["niveau", "Niveau"], ["favori", "Favori"], ["shiny", "Shiny"]].map(([k, t]) => b("pc-tri", k, t, S.pcTri === k)).join("")}</div></div>
    <div><small class="doux">Montre seulement :</small><div class="chips filtres" role="group" aria-label="Filtres">${b("pc-filtre", "pcFav", "Favoris", S.pcFav)}${b("pc-filtre", "pcShiny", "Shiny", S.pcShiny)}${b("pc-filtre", "pcOeuf", "Œufs", S.pcOeuf)}</div></div>
    <div id="liste-pc">${pcCorps()}</div>
    <div class="lot-maquette"><button type="button" class="maquette" data-act="pc-vider">Maquette : ${S.pc.length ? "vider le PC" : "remplir le PC"}</button><button type="button" class="maquette" data-act="verrouiller-pc">Maquette : verrouiller le PC</button></div>`;
}

/* ---------- fiche d'un Pokémon ---------- */
function ficheCouche() {
  const p = pDeFiche(); if (!p) return "";
  const nom = nomP(p), egg = !!p.oeuf, d = egg ? null : dpsDetail(p), dps = p.eq ? p.dps : d && d.total;
  const dernier = p.eq && EQUIPE.length <= 1;
  const bloc = (k) => `<div><dt>${k[0]}</dt><dd>${k[1]}</dd></div>`;
  const evo = !egg && EVO[p.n] ? `<p>Évolution : ${EVO[p.n]}</p>` : "";
  const xp = egg ? "" : p.niveau >= 100 ? `<div class="xp-ligne"><span>XP : MAX</span><div class="barre-xp"><i style="width:100%"></i></div></div>` : `<div class="xp-ligne"><span>XP : ${nf(11250)} / ${nf(18000)}</span><div class="barre-xp"><i style="width:62%"></i></div></div>`;
  const sprite_ = egg ? `<span class="gros-sprite oeuf">${ic("oeuf")}</span>` : `<img class="gros-sprite" src="${sprite(p.n, p.shiny)}" width="96" height="96" alt="${nomEsp(p.n)}">`;
  const renom = S.renom ? `<form class="renommer-form" data-form="surnom" novalidate><label class="champ ${S.renomErr ? "en-erreur" : ""}" for="f-surnom"><span>Surnom</span><span class="zone-saisie"><input id="f-surnom" type="text" maxlength="12" value="${esc(p.surnom || nomP(p))}" autocomplete="off"></span><span class="aide" id="cpt-surnom">${(p.surnom || nomP(p)).length} / 12 caractères</span></label>${S.renomErr ? `<p class="message erreur" role="alert">${ic("alerte")}<span>Entre un nom de 1 à 12 caractères.</span></p>` : ""}<div class="rang-boutons"><button type="submit" class="plaque action">Valider</button><button type="button" class="plaque" data-act="renommer-annuler">Annuler</button></div></form>` : "";
  const ligne = egg ? pasOeuf(p) : `${nomEsp(p.n)} · N° ${p.n} · Niveau ${p.niveau}`;
  const principal = p.eq ? "Envoyer au PC" : "Placer dans l'équipe";
  const raison = dernier ? "C'est ton dernier Pokémon : garde-le dans l'équipe." : "";
  return `<div class="voile" data-act="fermer"></div><section class="fenetre fiche-pk cadre" role="dialog" aria-modal="true" aria-label="Fiche de ${esc(nom)}">
    <div class="tete"><span class="titre-nom"><h2>${esc(nom)}</h2>${p.shiny && !egg ? ic("etincelle") : ""}</span>${egg ? "" : `<button type="button" class="plaque" data-act="renommer-pk" aria-label="Renommer ${esc(nom)}">${ic("crayon")}</button>`}${fermer.replace("Fermer", "Ferme la fiche")}</div>
    <div class="corps"><p class="doux">${ligne}${p.eq ? "" : " · <b>Dans le PC</b>"}</p>${sprite_}${renom}
      <div class="rangee">${sexeHtml(p)}${p.shiny && !egg ? `<span class="tag or">${ic("etincelle")} Shiny</span>` : ""}<button type="button" class="plaque" data-act="fav" aria-pressed="${!!p.fav}" aria-label="${p.fav ? "Retire des favoris" : "Ajoute aux favoris"}"><span class="${p.fav ? "etoile-fav" : ""}">${ic("etoile")}</span>Favori</button>${egg ? "" : tagsTypes(p.n)}</div>
      ${xp}${egg ? "" : `<div class="dps-gros">${nf(dps)} DPS</div>`}
      ${egg ? `<p class="doux">Un œuf n'a ni niveau ni XP. Mets-le dans ton équipe, puis fais des combats pour l'éclore.</p>` : `<dl class="detail-dps">${[["Base", nf(d.base)], ["Type", "× " + d.type], ["Shiny", "× " + d.shiny], ["Bonheur", "× " + virg(d.bonheur)], ["Pierre Stase", "× " + d.stase], ["Calcium", "× " + virg(d.calcium)]].map(bloc).join("")}</dl>${evo}
      <div class="bonheur"><span class="jauge" style="--p:47" role="img" aria-label="Bonheur : 120/255"></span><div><p>Bonheur : 120/255</p><p class="doux">+12 % de dégâts</p></div></div>
      <p>Calcium : 2 · +2 % de dégâts</p><p>Objet tenu : aucun</p>`}
      ${S.ficheErr ? `<p class="message erreur" role="alert">${ic("alerte")}<span>${S.ficheErr}</span></p>` : ""}
      <div class="actions-fiche"><button type="button" class="plaque action large" data-act="fiche-principal" ${dernier ? "disabled" : ""}>${principal}</button>${raison ? `<p class="raison">${raison}</p>` : ""}
        <button type="button" class="plaque danger large" data-act="relacher" ${dernier ? "disabled" : ""}>Relâcher</button></div></div></section>`;
}
function relacherCouche() {
  const p = pDeFiche(); if (!p || !S.relacher) return "";
  return `<div class="voile" style="z-index:23" data-act="relacher-non"></div><div class="centre-modal" style="z-index:24"><section class="modal cadre" role="alertdialog" aria-modal="true" aria-label="Relâcher"><div class="tete"><h2>Veux-tu vraiment relâcher ${esc(nomP(p))} ?</h2></div><p>Il quittera ton aventure pour de bon.</p><button type="button" class="plaque" data-act="relacher-non">Annuler</button><button type="button" class="plaque danger" data-act="relacher-oui">Relâche définitivement</button></section></div>`;
}

/* ---------- Pokédex ---------- */
function dexListe() {
  const q = norm(S.dexQ), num = /^(?:#|n°|n)?\s*(\d+)$/.exec(q);
  return DEX.filter(([n, nom]) => {
    if (S.dexF === "captures" && !estCapt(n)) return false;
    if (S.dexF === "manquants" && estCapt(n)) return false;
    if (!q) return true;
    if (num) return n === Number(num[1]);
    return estCapt(n) && norm(nom).includes(q);
  });
}
function dexCase([n, nom]) {
  const c = estCapt(n);
  return `<button type="button" class="dex-case ${c ? "" : "inconnu"}" data-act="dex-detail" data-n="${n}" aria-label="${c ? nom + ", numéro " + n + ", déjà capturé" : "Pokémon inconnu, numéro " + n}"><img src="${sprite(n)}" width="96" height="96" alt=""><span class="n">N° ${n}</span><span class="nom">${c ? nom : "???"}</span>${c ? `<span class="capt">${ic("ball")}Capturé</span>` : ""}</button>`;
}
function dexCorps() {
  const l = dexListe();
  if (!l.length) return `<div class="vide-etat" role="status">${ic("loupe")}<p>${S.dexQ.trim() ? `Aucune espèce capturée ne correspond à « ${esc(S.dexQ.trim())} ».` : "Rien à montrer avec ce filtre."}</p><p class="doux">Les espèces non capturées restent cachées : cherche-les par leur numéro.</p></div>`;
  return `<div class="dex-grille">${l.map(dexCase).join("")}</div>`;
}
const dexCompte = () => `${dexListe().length} espèce${dexListe().length > 1 ? "s" : ""} affichée${dexListe().length > 1 ? "s" : ""}`;
function ecranPokedex() {
  const c = nbCapt(), prochain = JALONS.find(([p]) => p > c), recus = JALONS.filter(([p]) => p <= c).length;
  const ligneProchain = prochain ? `Prochain palier : ${prochain[0]} (${prochain[1]}) · Encore ${prochain[0] - c} espèce${prochain[0] - c > 1 ? "s" : ""}.` : "Pokédex complet !";
  const paliers = JALONS.map(([p, t, d]) => `<div class="palier ${p <= c ? "recu" : ""}">${ic(p <= c ? "verifie" : "cadenas")}<span><b>${p} · ${t}</b><span class="s">${d} · ${p <= c ? "reçu" : "à venir"}</span></span></div>`).join("");
  const f = (k, t) => `<button type="button" class="plaque" data-act="dex-filtre" data-v="${k}" aria-pressed="${S.dexF === k}">${t}</button>`;
  return `<div class="titre-page">${retourBtn("menu", "Retour au menu")}<h1>Pokédex</h1></div>
    <section class="resume-dex cadre" aria-label="Progression"><span class="gros">${c} / 151</span><span class="doux">espèces capturées</span>
      <div class="progres" role="progressbar" aria-valuemin="0" aria-valuemax="151" aria-valuenow="${c}" aria-label="Espèces capturées"><i style="width:${(c / 151 * 100).toFixed(1)}%"></i></div>
      <p data-prochain-palier>${ligneProchain}</p></section>
    <details class="repli" ${S.paliersOuv ? "open" : ""}><summary data-act="paliers">Paliers du Pokédex · ${recus} sur 10 reçus${ic("chevron")}</summary><div class="contenu">${paliers}</div></details>
    ${S.dexComplet ? `<button type="button" class="ligne-p" data-act="diplome">${ic("diplome")}<span class="corps"><span class="t">Diplôme du Pokédex</span><br><span class="s">Remis par le Prof. Chen</span></span>${ic("chevron")}</button>` : ""}
    <label class="champ recherche" for="dex-q"><span>Nom ou numéro</span><span class="zone-saisie"><input id="dex-q" type="search" data-cle="dexQ" value="${esc(S.dexQ)}" autocomplete="off" enterkeyhint="search"></span></label>
    <div class="chips filtres" role="group" aria-label="Filtrer le Pokédex">${f("tous", "Toutes")}${f("captures", "Capturées")}${f("manquants", "À trouver")}</div>
    <p class="doux" id="cpt-dex" role="status">${dexCompte()}</p>
    <div id="liste-dex">${dexCorps()}</div>
    <button type="button" class="maquette" data-act="dex-complet">Maquette : ${S.dexComplet ? "revenir à 47 espèces" : "Pokédex complet (151 espèces, diplôme)"}</button>`;
}
function dexCouche() {
  const n = S.dexSel; if (!n) return "";
  const c = estCapt(n), nom = nomEsp(n);
  const ou = EQUIPE.some(([x]) => Number(x) === n) ? "Dans ton équipe" : S.pc.some((p) => p.n === n) ? "Rangé dans ton PC" : "Enregistré au Pokédex";
  const corps = c
    ? `<img class="gros-sprite" src="${sprite(n)}" width="96" height="96" alt="${nom}"><div class="rangee" style="justify-content:center">${tagsTypes(n)}<span class="tag">${ic("ball")} Déjà capturé</span></div><p class="doux" style="text-align:center">${ou}</p>`
    : `<img class="gros-sprite silhouette" src="${sprite(n)}" width="96" height="96" alt="Pokémon inconnu"><p class="message info">${ic("alerte")}<span>Capture ce Pokémon pour découvrir son nom et ses types.</span></p>`;
  return `<div class="voile" data-act="fermer"></div><section class="fenetre court cadre" role="dialog" aria-modal="true" aria-label="Pokédex, numéro ${n}"><div class="tete"><h2>${c ? nom : "???"} · N° ${n}</h2>${fermer}</div><div class="corps">${corps}</div></section>`;
}
function diplomeCouche() {
  if (!S.diplomeOuv) return "";
  return `<div class="voile" data-act="fermer"></div><section class="fenetre court cadre" role="dialog" aria-modal="true" aria-label="Diplôme du Pokédex"><div class="tete"><h2>Diplôme du Pokédex</h2>${fermer}</div><div class="corps"><img class="diplome-img" src="img/diplome.webp" width="640" height="452" alt="Diplôme officiel de Kanto : le Professeur Chen certifie que tu as complété le Pokédex."><p>Léo · Obtenu le 5 novembre 2026</p><button type="button" class="plaque" data-act="imprimer">Imprimer</button></div></section>`;
}

/* ---------- Badges ---------- */
const badgeNb = () => S.badgesObt.length;
function ecranBadges() {
  const cartes = BADGES.map(([id, nom, eff, are]) => {
    const ok = S.badgesObt.includes(id);
    return `<button type="button" class="badge-carte ${ok ? "obtenu" : "manque"}" data-act="badge-detail" data-id="${id}" aria-label="${ok ? "Badge " + nom + " : " + eff : "Badge " + nom + ", à gagner : " + are}"><img src="img/badges/${id}.png" width="72" height="72" alt=""><span class="nom">${nom}</span><span class="s">${ok ? eff : "À gagner : " + are}</span></button>`;
  }).join("");
  return `<div class="titre-page">${retourBtn("menu", "Retour au menu")}<h1>Badges</h1><span class="tag ${badgeNb() ? "" : "neutre"}">${badgeNb()} / 8</span></div>
    <p class="doux" role="status">${badgeNb() ? "Touche un badge pour voir son effet." : "Aucun badge obtenu. Bats les champions d'arène !"}</p>
    <div class="badges-grille">${cartes}</div>
    <button type="button" class="maquette" data-act="badges-cycle">Maquette : changer le nombre de badges (${badgeNb()} aujourd'hui : aucun, 1, 8)</button>`;
}
function badgeCouche() {
  const id = S.badgeSel; if (!id) return "";
  const [, nom, eff, are, champ] = BADGES.find((b) => b[0] === id), ok = S.badgesObt.includes(id);
  return `<div class="voile" data-act="fermer"></div><section class="fenetre court cadre" role="dialog" aria-modal="true" aria-label="Badge ${nom}"><div class="tete"><h2>Badge ${nom}</h2>${fermer}</div><div class="corps">
    <img class="gros-badge ${ok ? "" : "manque"}" src="img/badges/${id}.png" width="128" height="128" alt="">
    <p style="text-align:center"><span class="tag ${ok ? "" : "neutre"}">${ok ? "Obtenu" : "Pas encore obtenu"}</span></p>
    <dl class="detail-dps" style="grid-template-columns:1fr"><div><dt>Effet</dt><dd>${eff}</dd></div><div><dt>Arène</dt><dd>${are}</dd></div><div><dt>Champion</dt><dd>${champ}</dd></div></dl>
    ${ok ? "" : `<p class="doux">Bats le champion de l'arène pour gagner ce badge. Son effet est permanent.</p>`}</div></section>`;
}

/* ---------- Statistiques et Guide ---------- */
function ecranStats() {
  const s = (t, valeur, lignes) => `<section class="stat fiche cadre" aria-label="${t}"><h2 class="sous-titre" style="margin:0">${t}</h2>${valeur ? `<span class="valeur">${valeur}</span>` : ""}${lignes ? `<dl>${lignes.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}</section>`;
  return `<div class="titre-page">${retourBtn("menu", "Retour au menu")}<h1>Statistiques</h1></div>
    ${s("Pokémon vaincus", nf(1284))}${s("Argent total", pd(2940000))}
    ${s("Dégâts clic", "", [["Base (5 + 0,2 % du DPS)", "86"], ["Boosts", "Badge Roche (×1,5), Débutant (×2)"], ["Total", "258"]])}
    ${s("DPS équipe", "", [["Base", nf(26912)], ["Boosts", "Collectionneur (×1,5)"], ["Total", nf(40368)]])}
    ${s("Gains d'argent", "", [["Base", "100%"], ["Boosts", "Aucun"], ["Total", "×1,00"]])}
    ${s("Gains d'XP", "", [["Base", "100%"], ["Boosts", "Dresseur (×2)"], ["Total", "×2,00"]])}
    ${s("Taux de capture", "", [["Boosts passifs", "Aucun"]])}`;
}
function ecranGuide() {
  const sec = GUIDE.map(([id, titre, ps]) => `<details class="repli guide-sec" ${S.guideOuv === id ? "open" : ""}><summary data-act="guide-sec" data-id="${id}">${titre}${ic("chevron")}</summary><div class="contenu">${ps.map((t) => `<p>${esc(t)}</p>`).join("")}</div></details>`).join("");
  return `<div class="titre-page">${retourBtn("menu", "Retour au menu")}<h1>Guide du jeu</h1></div><p class="doux">${GUIDE.length} sections. Touche un titre pour l'ouvrir.</p>${sec}`;
}

/* ---------- couches ajoutées ---------- */
function couchesA4() {
  let h = "";
  if (S.fiche) h += ficheCouche() + relacherCouche();
  if (S.dexSel) h += dexCouche();
  if (S.badgeSel) h += badgeCouche();
  if (S.diplomeOuv) h += diplomeCouche();
  return h;
}

/* ---------- actions ---------- */
function refocus(a) { if (!a || !a.dataset || !a.dataset.act) return; const k = `[data-act="${a.dataset.act}"]` + (a.dataset.v ? `[data-v="${a.dataset.v}"]` : "") + (a.dataset.id ? `[data-id="${a.dataset.id}"]` : ""); const el = document.querySelector("#ecran " + k); if (el && ["pc-tri", "pc-filtre", "dex-filtre"].includes(a.dataset.act)) el.focus(); }
function majListes() {
  const a = document.getElementById("liste-pc"); if (a) { a.innerHTML = pcCorps(); document.getElementById("cpt").textContent = pcCompte(); }
  const b = document.getElementById("liste-dex"); if (b) { b.innerHTML = dexCorps(); document.getElementById("cpt-dex").textContent = dexCompte(); }
}
function fermeFiche() { S.fiche = null; S.renom = false; S.renomErr = false; S.relacher = false; S.ficheErr = ""; }
const ACT4 = {
  "fiche-pc": (a) => { S.fiche = { src: "pc", id: Number(a.dataset.id) }; S.renom = false; S.ficheErr = ""; },
  "fiche-eq": (a) => { S.fiche = { src: "eq", i: Number(a.dataset.i) }; S.renom = false; S.ficheErr = ""; },
  "pc-tri": (a) => { S.pcTri = a.dataset.v; S.garde = true; },
  "pc-filtre": (a) => { S[a.dataset.v] = !S[a.dataset.v]; S.garde = true; },
  "pc-effacer": () => { S.pcQ = ""; S.pcFav = S.pcShiny = S.pcOeuf = false; },
  "pc-vider": () => { S.pc = S.pc.length ? [] : pcDepart(); },
  "fav": () => { const p = pDeFiche(); if (!p) return; if (p.eq) S.favEq[p.i] = !S.favEq[p.i]; else p.fav = !p.fav; PK.toast(p.fav || S.favEq[p.i] ? "Ajouté aux favoris" : "Retiré des favoris"); },
  "renommer-pk": () => { S.renom = true; S.renomErr = false; },
  "renommer-annuler": () => { S.renom = false; S.renomErr = false; },
  "relacher": () => { S.relacher = true; },
  "relacher-non": () => { S.relacher = false; },
  "relacher-oui": () => {
    const p = pDeFiche(), nom = nomP(p); if (p.eq) EQUIPE.splice(p.i, 1); else S.pc = S.pc.filter((x) => x.id !== p.id);
    fermeFiche(); PK.toast(`${nom} a été relâché`);
  },
  "fiche-principal": () => {
    const p = pDeFiche(); if (!p) return; const nom = nomP(p);
    if (p.eq) {
      if (EQUIPE.length <= 1) { S.ficheErr = "C'est ton dernier Pokémon : garde-le dans l'équipe."; return; }
      EQUIPE.splice(p.i, 1); S.pc.push({ id: Math.max(0, ...S.pc.map((x) => x.id)) + 1, n: p.n, niveau: 100, sexe: p.sexe }); fermeFiche(); PK.toast(`${nom} envoyé au PC`);
    } else if (EQUIPE.length < 6) {
      EQUIPE.push([String(p.n), nom, dpsDetail(p).total]); S.pc = S.pc.filter((x) => x.id !== p.id); fermeFiche(); PK.toast(`${nom} rejoint l'équipe`);
    } else { S.echange = p.id; S.echangeErr = ""; fermeFiche(); }
  },
  "echange-annuler": () => { S.echange = null; S.echangeErr = ""; },
  "echanger": (a) => {
    const i = Number(a.dataset.i), p = S.pc.find((x) => x.id === S.echange); if (!p) { S.echange = null; return; }
    if (p.oeuf && EQUIPE.filter((_, k) => k !== i).length === 0) { S.echangeErr = "Il faut au moins 1 Pokémon actif dans l'équipe."; return; }
    const [n, nom] = EQUIPE[i];
    EQUIPE[i] = [String(p.n || 0), nomP(p), p.oeuf ? 0 : dpsDetail(p).total];
    S.pc = S.pc.map((x) => (x.id === p.id ? { id: p.id, n: Number(n), niveau: 100, sexe: Number(n) % 2 ? "m" : "f" } : x));
    S.echange = null; S.echangeErr = ""; PK.toast(`${nomP(p)} prend la place de ${nom}`);
  },
  "dex-detail": (a) => { S.dexSel = Number(a.dataset.n); },
  "dex-filtre": (a) => { S.dexF = a.dataset.v; S.garde = true; },
  "dex-complet": () => { S.dexComplet = !S.dexComplet; S.garde = true; },
  "paliers": (a, ev) => { ev.preventDefault(); S.paliersOuv = !S.paliersOuv; S.garde = true; },
  "diplome": () => { S.diplomeOuv = true; },
  "imprimer": () => { PK.toast("Impression : hors maquette"); return "stop"; },
  "badge-detail": (a) => { S.badgeSel = a.dataset.id; },
  "badges-cycle": () => { const n = badgeNb(); S.badgesObt = n === 0 ? ["roche"] : n === 1 ? BADGES.map((b) => b[0]) : []; S.garde = true; },
  "guide-sec": (a, ev) => { ev.preventDefault(); S.guideOuv = S.guideOuv === a.dataset.id ? null : a.dataset.id; S.garde = true; },
};
