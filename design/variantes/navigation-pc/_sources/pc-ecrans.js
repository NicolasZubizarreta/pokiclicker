/* Maquettes PC : écrans de jeu (zone de contenu de la coquille). Chaque fonction rend du HTML ; l'état est S (voir pc-app.js). */
const retour = (go, label = "Retour") => `<button type="button" class="plaque carre" data-go="${go}" aria-label="${label}">${ic("retour")}</button>`;
const fermerBtn = `<button type="button" class="plaque carre" data-act="fermer" aria-label="Fermer">${ic("croix")}</button>`;
const kb = (t) => `<kbd>${t}</kbd>`;
const chip = (act, v, t, on, extra = "") => `<button type="button" class="plaque petite" data-act="${act}" data-v="${v}" aria-pressed="${on}" ${extra}>${t}</button>`;
const maq = (act, t, extra = "") => `<button type="button" class="maquette" data-act="${act}" ${extra}>Maquette : ${t}</button>`;
const inter = (key, titre, on) => `<button type="button" class="inter" role="switch" aria-checked="${on}" data-act="inter" data-key="${key}" aria-label="${esc(titre)}"><i></i></button>`;
const pa = (e, i) => ({ id: "eq" + i, eq: true, i, n: Number(e[0]), nom: e[1], niveau: 100, sexe: Number(e[0]) % 2 ? "m" : "f", dps: e[2], fav: !!S.favEq[i] });

/* ---------- Combat ---------- */
function rangEq(e, i) {
  const pret = S.evo && e[0] === "16";
  return `<button type="button" class="rang-eq ${pret ? "pret-evoluer" : ""}" data-act="fiche-eq" data-i="${i}" aria-label="${e[1]}, niveau 100${pret ? ", prêt à évoluer" : ""}">
    <img class="sp" src="${SPR}${e[0]}.png" width="96" height="96" alt=""><span><span class="t"><span>${e[1]}</span><span>Niv. 100</span></span>
    <span class="s"><span class="dps">${nf(e[2])} DPS</span><span>${pret ? "Prêt à évoluer" : "XP max"}</span></span></span></button>`;
}
function ecranCombat() {
  const z = Z(S.zone), b = BALLS[S.ball], boss = S.cs === "boss";
  const cible = boss ? ["95", "Onix", 24, "Boss"] : ["19", "Rattata", 2, ""];
  const etapes = Array.from({ length: 10 }, (_, i) => `<i class="${i + 1 < S.etape ? "fait" : ""} ${i + 1 === S.etape ? "ici" : ""} ${i === 9 ? "boss" : ""}"></i>`).join("");
  const pv = boss ? 62 : Math.round((S.pv / S.pvMax) * 100);
  const capt = S.cs === "capture";
  const radar = S.deb ? `<button type="button" class="plaque radar" data-act="radar" aria-label="Poké-Radar (P)"><img src="${OBJ}PokeRadar.png" width="30" height="30" alt=""></button>` : "";
  const banniere = S.cs === "arret" ? `<div class="banniere message alerte">${ic("alerte")}<span><b>Arrêt auto :</b> un Pokémon chromatique est apparu.</span><button type="button" class="plaque petite" data-act="reprendre">Reprendre l'auto</button></div>` : "";
  const fin = S.cs === "fin" ? `<div class="annonce cadre">ZONE DÉBLOQUÉE !</div>` : "";
  return `<div class="combat">
    <div class="gauche">
      <div class="ligne-zone"><button type="button" class="plaque carre" data-act="zone" data-v="-1" aria-label="Zone précédente (flèche gauche)">${ic("retour")}</button>
        <div class="centre"><span class="nom-zone">${z.nom}</span><div class="etapes" role="img" aria-label="Étape ${S.etape} sur 10">${etapes}<span>${S.etape}/10</span></div></div>
        <button type="button" class="plaque carre" data-act="zone" data-v="1" aria-label="Zone suivante (flèche droite)">${ic("chevron")}</button></div>
      <div class="scene-wrap"><button type="button" class="scene cadre ${S.coup ? "coup" : ""}" data-act="attaquer" aria-label="Attaquer ${cible[1]} (Espace ou Entrée)" style="background-image:url(${DEC}${DECOR_ZONE[S.zone] || "route-1.webp"})">
          <span class="info cadre"><span class="ligne"><span class="nom">${cible[1]}</span><span>Niv. ${cible[2]}</span></span>
            <span class="barre-pv" style="display:block"><i style="--pv:${pv}%"></i></span><span class="pv-txt">${boss ? "Boss · 4 120 / 6 600 PV" : `PV ${S.pv} / ${S.pvMax}`}</span></span>
          <span class="socle"></span>${capt ? `<img class="capture-anim" src="${OBJ}${b[0]}.png" width="30" height="30" alt="">` : `<img class="ennemi" src="${SPR}${cible[0]}.png" width="96" height="96" alt="">`}
          <span class="degat">${S.cs === "fauchage" ? "−2 460" : "−412"}</span>${boss ? `<span class="boss-temps"><i></i></span>` : ""}</button>${radar}${banniere}</div>
      <div class="ligne-capture"><button type="button" class="plaque balle" data-act="balle" aria-label="Changer de balle (B)"><img src="${OBJ}${b[0]}.png" width="30" height="30" alt=""><span><b>${b[1]}</b><small>×${b[2]} · touche B</small></span></button>
        <button type="button" class="plaque action" data-act="capturer">${ic("balle")}Capturer ${kb("C")}</button>
        ${S.deb ? `<button type="button" class="plaque carre" data-act="fauchage" aria-label="Fauchage (F)">${ic("faux")}</button>` : ""}</div>
      <div class="outils4"><button type="button" class="plaque" data-act="auto" aria-pressed="${S.auto}">${ic("auto")}Attaque auto ${kb("A")}</button>
        <button type="button" class="plaque" data-act="arret" aria-pressed="${S.arret}">${ic("stop")}Arrêt auto ${kb("T")}</button>
        <button type="button" class="plaque" data-act="regl-auto">${ic("reglage")}Réglage de l'arrêt auto ${kb("R")}</button>
        <button type="button" class="plaque" data-act="sac">${ic("sac")}Sac ${kb("S")}</button></div>
    </div>
    <div class="droite"><section class="cadre panneau" aria-label="Ton équipe"><div class="tete"><h2>Ton équipe</h2><span class="doux">6 / 6</span></div><div class="equipe-col">${EQUIPE.map(rangEq).join("")}</div></section>
      <section class="cadre panneau" aria-label="Effets actifs"><div class="tete"><h2>Effets actifs</h2></div>
        <div class="pills"><span class="tag info"><img src="${OBJ}x-attack.png" width="30" height="30" alt="" style="width:20px;height:20px"> Attaque + · 22 s</span><span class="tag neutre"><img src="${OBJ}repel.png" width="30" height="30" alt="" style="width:20px;height:20px"> Repousse · 8 s</span></div></section></div>
    </div>${fin}`;
}
function ecranEquipe() {
  const liste = EQUIPE.map((e, i) => ({ e, i })).sort((a, b) => (S.eqTri === "dps" ? b.e[2] - a.e[2] : 0));
  const carte = ({ e, i }) => {
    const pret = S.evo && e[0] === "16", p = pa(e, i);
    return `<button type="button" class="carte-pk ${S.choix ? "choix" : ""} ${pret ? "pret-evoluer" : ""}" data-act="${S.choix ? "cible" : "fiche-eq"}" data-i="${i}" aria-label="${e[1]}, niveau 100, ${nf(e[2])} DPS">
      <span class="portrait"><img src="${SPR}${e[0]}.png" width="96" height="96" alt=""></span>
      <span class="corps"><span class="nom"><span>${e[1]}</span>${sexeHtml(p)}${p.fav ? ic("etoile") : ""}</span><span class="dps">${nf(e[2])} DPS</span><span class="doux">Niv. 100 · XP max</span><span class="pills">${tagsTypes(Number(e[0]))}${pret ? `<span class="tag alerte">Prêt à évoluer</span>` : ""}</span></span></button>`;
  };
  const mini = S.pc.slice(0, 8).map((p) => (p.oeuf ? `<span class="oeuf-v">${ic("oeuf")}</span>` : `<img src="${sprite(p.n, p.shiny)}" width="96" height="96" alt="">`)).join("");
  const pc = PC_OUVERT_OK() ? `<button type="button" class="ligne-p" data-go="pc">${ic("pc")}<span class="corps"><span class="t">PC de Léo</span><span class="s">${S.pc.length} Pokémon rangés · tri par DPS</span></span><span class="miniatures">${mini}</span>${ic("chevron")}</button>`
    : `<button type="button" class="ligne-p ferme" data-go="pc">${ic("cadenas")}<span class="corps"><span class="t">PC de Léo</span><span class="s">Après l'arène d'Argenta</span></span>${ic("chevron")}</button>`;
  return `<div class="titre-page"><h1>Équipe</h1><span class="tag neutre">${EQUIPE.length} / 6</span><label class="champ"><span class="sr">Trier</span><span class="zone-saisie"><select data-cle="eqTri" aria-label="Trier l'équipe"><option value="ordre"${S.eqTri === "ordre" ? " selected" : ""}>Ordre de l'équipe</option><option value="dps"${S.eqTri === "dps" ? " selected" : ""}>DPS, du plus grand au plus petit</option></select></span></label>
      <button type="button" class="plaque" data-act="sac">${ic("sac")}Sac ${kb("S")}</button></div>
    ${S.choix ? `<div class="bandeau-choix"><span>Choisis le Pokémon qui recevra : <b>${S.choix}</b></span><button type="button" class="plaque" data-act="choix-annuler">${ic("croix")}Annuler</button></div>` : ""}
    <div class="grille-eq">${liste.map(carte).join("")}</div>`;
}
const PC_OUVERT_OK = () => S.pcOuvert;

/* ---------- PC ---------- */
function pcListe() {
  const q = norm(S.pcQ), num = /^(?:#|n°|n)?\s*(\d+)$/.exec(q);
  const l = S.pc.filter((p) => {
    if (S.pcFav && !p.fav) return false; if (S.pcShiny && !p.shiny) return false; if (S.pcOeuf && !p.oeuf) return false;
    if (!q) return true; if (num) return !p.oeuf && p.n === Number(num[1]);
    return norm(nomP(p)).includes(q) || (!p.oeuf && norm(nomEsp(p.n)).includes(q));
  });
  const cmp = {
    dps: (a, b) => (a.oeuf ? 1 : 0) - (b.oeuf ? 1 : 0) || dpsPc(b) - dpsPc(a) || (a.n || 0) - (b.n || 0),
    numero: (a, b) => (a.oeuf ? 1 : 0) - (b.oeuf ? 1 : 0) || (a.n || 0) - (b.n || 0),
    nom: (a, b) => nomP(a).localeCompare(nomP(b), "fr"), niveau: (a, b) => (b.niveau || 0) - (a.niveau || 0),
    favori: (a, b) => Number(!!b.fav) - Number(!!a.fav), shiny: (a, b) => Number(!!b.shiny) - Number(!!a.shiny),
  }[S.pcTri];
  return l.sort(cmp);
}
function caseP(p) {
  const nom = nomP(p), s = !!p.shiny && !p.oeuf;
  const img = p.oeuf ? `<span class="oeuf-v">${ic("oeuf")}</span>` : `<img class="sp" src="${sprite(p.n, p.shiny)}" width="96" height="96" alt="">`;
  const bas = p.oeuf ? `<span class="s">${pasOeuf(p)}</span>` : `${S.pcTri === "dps" ? `<span class="s dps-l">${nf(dpsPc(p))} DPS</span>` : ""}<span class="s">N° ${p.n} · Niv. ${p.niveau}</span>`;
  return `<button type="button" class="case ${s ? "shiny" : ""} ${p.fav ? "fav" : ""}" data-act="fiche-pc" data-id="${p.id}" aria-label="${esc(nom)}, ${p.oeuf ? pasOeuf(p) : (S.pcTri === "dps" ? nf(dpsPc(p)) + " DPS, " : "") + "niveau " + p.niveau}">${img}<span class="corps"><span class="nom"><span>${esc(nom)}</span>${s ? ic("etincelle") : ""}${sexeHtml(p)}${p.fav ? ic("etoile") : ""}</span>${bas}</span></button>`;
}
function pcCorps() {
  if (!S.pc.length) return `<div class="vide-etat">${ic("pc")}<p><b>Ton PC est vide.</b></p><p class="doux">Capture des Pokémon pour les ranger ici.</p></div>`;
  const l = pcListe();
  if (!l.length) {
    const f = S.pcFav || S.pcShiny || S.pcOeuf;
    return `<div class="vide-etat">${ic("loupe")}<p>${S.pcQ.trim() ? `Aucun Pokémon ne correspond à « ${esc(S.pcQ.trim())} ».` : "Aucun Pokémon ne correspond à ces filtres."}</p>${f || S.pcQ ? `<button type="button" class="plaque" data-act="pc-effacer">Effacer la recherche et les filtres</button>` : ""}</div>`;
  }
  return `<div class="pc-grille">${l.map(caseP).join("")}</div>`;
}
const pcCompte = () => { const n = S.pc.length, l = n ? pcListe().length : 0; return l !== n ? `${l} sur ${n} Pokémon` : `${n} Pokémon`; };
function ecranPc() {
  const tete = `<div class="titre-page"><h1>PC de Léo</h1><span class="tag neutre" id="cpt">${S.pcOuvert ? pcCompte() : "Verrouillé"}</span></div>`;
  if (!S.pcOuvert) return `${tete}<div class="verrou">${ic("cadenas")}<p><b>Le PC de Léo s'ouvre à l'Arène d'Argenta.</b></p><p class="doux">Tu y rangeras les Pokémon que ton équipe ne peut pas porter.</p></div><div class="lot-maquette">${maq("debloquer-pc", "arriver à l'Arène d'Argenta (débloque le PC)")}</div>`;
  const eq = EQUIPE.map((e, i) => `<button type="button" class="case" data-act="${S.echange ? "echanger" : "fiche-eq"}" data-i="${i}" aria-label="${e[1]}, niveau 100"><img class="sp" src="${SPR}${e[0]}.png" width="96" height="96" alt=""><span class="corps"><span class="nom"><span>${e[1]}</span></span><span class="s">Niv. 100</span></span></button>`).join("");
  const colEq = `<aside class="equipe-col" aria-label="Ton équipe"><h2 class="sous-titre">Ton équipe · ${EQUIPE.length} / 6</h2>${eq}</aside>`;
  if (S.echange) {
    const p = S.pc.find((x) => x.id === S.echange);
    return `${tete}<div class="bandeau-choix"><span>Choisis le Pokémon à remplacer par <b>${esc(p ? nomP(p) : "")}</b></span><button type="button" class="plaque" data-act="echange-annuler">${ic("croix")}Annuler</button></div>
      ${S.echangeErr ? `<p class="message erreur">${ic("alerte")}<span>${S.echangeErr}</span></p>` : ""}<div class="pc-corps"><div class="pc-grille">${S.pc.length ? pcListe().map(caseP).join("") : ""}</div>${colEq}</div>`;
  }
  const tris = [["dps", "DPS, du plus grand au plus petit"], ["numero", "Numéro du Pokédex"], ["nom", "Nom, de A à Z"], ["niveau", "Niveau, du plus haut au plus bas"], ["favori", "Favoris d'abord"], ["shiny", "Shiny d'abord"]];
  return `${tete}<div class="outil-barre"><label class="champ grand" for="pc-q"><span>Nom ou numéro ${kb("/")}</span><span class="zone-saisie"><input id="pc-q" type="search" data-cle="pcQ" value="${esc(S.pcQ)}" autocomplete="off"></span></label>
      <label class="champ" for="pc-tri"><span>Trie par</span><span class="zone-saisie"><select id="pc-tri" data-cle="pcTri">${tris.map(([k, t]) => `<option value="${k}"${S.pcTri === k ? " selected" : ""}>${t}</option>`).join("")}</select></span></label>
      <div class="champ"><span>Montre seulement</span><div class="pills">${chip("pc-filtre", "pcFav", "Favoris", S.pcFav)}${chip("pc-filtre", "pcShiny", "Shiny", S.pcShiny)}${chip("pc-filtre", "pcOeuf", "Œufs", S.pcOeuf)}</div></div></div>
    <div class="pc-corps"><div id="liste-pc">${pcCorps()}</div>${colEq}</div>
    <div class="lot-maquette">${maq("pc-vider", S.pc.length ? "vider le PC" : "remplir le PC")}${maq("verrouiller-pc", "verrouiller le PC")}</div>`;
}

/* ---------- Shop ---------- */
function ecranShop() {
  const l = SHOP[S.onglet].map(([img, nom, eff, prix, poss]) => `<div class="produit ${poss ? "possede" : ""}"><img src="${OBJ}${img}.png" width="30" height="30" alt=""><div class="corps"><span class="t">${nom}</span><span class="s">${eff}</span></div>
    ${poss ? `<span class="tag">${ic("valide")} Possédé</span>` : `<button type="button" class="plaque action" data-act="acheter" data-nom="${esc(nom)}" data-prix="${prix}" aria-label="Acheter ${nom}, ${pd(prix)}" ${S.pieces < prix ? "disabled" : ""}>${pd(prix)}</button>`}</div>`).join("");
  return `<div class="titre-page"><h1>Shop</h1><span class="doux">Tu as ${pd(S.pieces)}</span></div>
    <div class="onglets" role="tablist" aria-label="Rayons">${ONGLETS.map(([k, t], i) => `<button type="button" role="tab" class="plaque" aria-selected="${S.onglet === k}" aria-pressed="${S.onglet === k}" data-act="onglet" data-v="${k}">${t} ${kb(i + 1 + "")}</button>`).join("")}</div>
    <div class="produits">${l}</div>`;
}

/* ---------- Carte ---------- */
function ecranCarte() {
  const cercles = ZONES.map((z) => `<span class="cercle ${z.ouverte ? "" : "ferme"} ${z.id === S.zone ? "actuel" : ""}" data-zone="${z.id}" style="left:${z.x * 100}%;top:${z.y * 100}%"><span class="etiq">${z.nom}</span></span>`).join("");
  const liste = ZONES.map((z) => `<button type="button" class="zone-l ${z.ouverte ? "" : "ferme"} ${z.id === S.zone ? "actuelle" : ""}" data-act="aller" data-id="${z.id}" data-zone="${z.id}" ${z.ouverte ? "" : 'aria-disabled="true"'}>
    <span class="corps"><span class="t">${z.nom}</span><span class="s">Zone ${z.n}${z.id === S.zone ? " · tu es ici" : z.ouverte ? "" : " · verrouillée"}</span></span>${z.ouverte ? ic("chevron") : ic("cadenas")}</button>`).join("");
  return `<div class="titre-page"><h1>Carte de Kanto</h1><span class="doux">Choisis une zone dans la liste : Dracaufeu t'y emmène. Tu es dans la zone qui clignote en vert.</span></div>
    <div class="carte-page"><div class="cadre mini-carte" id="mini-carte"><img src="img/carte-kanto.webp" alt="Carte de Kanto, région de Kanto" style="object-fit:cover">${cercles}</div>
      <div class="liste-w"><div class="liste-zones ${S.enVol ? "vole" : ""}" role="list">${liste}</div></div></div>
    <div class="lot-maquette">${maq("go-lieu", "aller à Bourg Palette (Chez Maman, Chez Blue, Pension, Labo)", 'data-go="lieu-bourg"')}${maq("go-casino", "ouvrir le Casino", 'data-go="casino"')}</div>`;
}

/* ---------- Lieux ---------- */
/* Bourg Palette, Maman, Blue, labo, début de partie : INCHANGÉS, captures du jeu actuel (design/audit, 1440 px) */
const NOTE_INCHANGE = `<p class="bandeau-inchange">${ic("valide")}<span><b>Inchangé : rendu actuel du jeu.</b> Capture du jeu actuel à 1440 px. Le PC garde exactement cette disposition, cet image mapping et ces dialogues.</span></p>`;
const inchange = (img, alt, suite = "") => `<div class="inchange">${NOTE_INCHANGE}<img src="img/jeu-actuel/${img}.png" alt="${alt}">${suite ? `<div class="lot-maquette">${suite}</div>` : ""}</div>`;
function ecranLieuBourg() {
  return `<div class="titre-page">${retour("carte", "Retour à la carte")}<h1>Bourg Palette</h1></div>
    ${inchange("lieu-bourg", "Bourg Palette dans le jeu actuel : scène avec image mapping, bâtiments cliquables", `${maq("lieu-maman", "image mapping : clic sur Chez Maman")}${maq("lieu-blue", "clic sur Chez Blue")}${maq("lieu-pension", "clic sur la Pension")}${maq("lieu-labo", "clic sur le labo du Prof. Chen")}`)}`;
}
function ecranMaman() {
  return `<div class="titre-page">${retour("lieu-bourg", "Sortir")}<h1>Chez Maman</h1></div>
    ${inchange("intro-maman", "Chez Maman dans le jeu actuel", maq("egg-daran", "cliquer la télé (easter egg Daran)"))}`;
}
function ecranBlue() {
  return `<div class="titre-page">${retour("lieu-bourg", "Sortir")}<h1>Chez Blue</h1></div>
    <div class="inchange">${NOTE_INCHANGE}<p class="message info">${ic("alerte")}<span>Chez Blue garde le rendu du jeu actuel (même gabarit que chez Maman : décor, dialogue de Blue). Voir le jeu actuel.</span></p></div>`;
}
function ecranCommercial() {
  const items = [["leftovers", "Restes", "Auto-clic au repos", 12000, true], ["PokeRadar", "Poké-Radar", "Repère les Pokémon rares de la zone", 25000, false], ["JetonShiny", "Jeton Shiny", "Relance l'apparition d'un chromatique", 8000, false], ["amulet-coin", "Pièce Rune", "Gains d'argent +10 %", 18000, false]];
  return `<div class="titre-page">${retour("carte", "Retour à la carte")}<h1>Centre commercial</h1><span class="doux">Tu as ${pd(S.pieces)}</span></div>
    <div class="decor-page" style="background-image:url(${DEC}centre-commercial.webp)"><div class="bulle cadre">Bienvenue à Sylphe SARL. Les accessoires sont ici.</div></div>
    <div class="produits">${items.map(([img, nom, eff, prix, poss]) => `<div class="produit ${poss ? "possede" : ""}"><img src="${OBJ}${img}.png" width="30" height="30" alt=""><div class="corps"><span class="t">${nom}</span><span class="s">${eff}</span></div>
      ${poss ? `<span class="tag">${ic("valide")} Possédé</span>` : `<button type="button" class="plaque action" data-act="acheter" data-nom="${esc(nom)}" data-prix="${prix}">${pd(prix)}</button>`}</div>`).join("")}</div>`;
}
function ecranPension() {
  const parent = (n, nom, niv) => `<div class="parent"><div class="gros-sprite-c"><img src="${SPR}${n}.png" width="96" height="96" alt="" style="width:192px;height:192px"></div><b>${nom}</b><span class="doux">Niv. ${niv}</span><button type="button" class="plaque petite" data-act="pension-reprendre">Reprendre</button></div>`;
  return `<div class="titre-page">${retour("lieu-bourg", "Retour à Bourg Palette")}<h1>Pension</h1></div>
    <div class="pension-grille"><section class="cadre panneau" aria-label="Parents"><div class="tete"><h2>Pokémon déposés</h2><span class="tag erreur">${ic("coeur")} Complices</span></div>
        <div class="parents">${parent(25, "Pikachu", 100)}${parent(133, "Évoli", 22)}</div><p class="doux">Les deux Pokémon s'entendent bien : un œuf arrive tous les 10 combats.</p></section>
      <section class="cadre panneau" aria-label="Œufs"><div class="tete"><h2>Œufs</h2><span class="doux">2 / 5</span></div>
        <ul class="oeufs"><li>${ic("oeuf")}</li><li>${ic("oeuf")}</li><li>Vide</li><li>Vide</li><li>Vide</li></ul><button type="button" class="plaque action" data-act="pension-oeuf">Récupérer un œuf</button></section></div>
    <p class="message info">${ic("alerte")}<span>Cœur pulsant et œufs qui rebondissent à porter depuis la V1 (ticket T) : montrés ici en version fixe.</span></p>`;
}
function ecranCasino() {
  return `<div class="titre-page">${retour("carte", "Retour à la carte")}<h1>Casino</h1></div>
    <div class="decor-page" style="background-image:url(${DEC}casino.webp);min-height:22rem"><div class="bulle cadre"><b>À venir</b><p>Le Casino est en cours de refonte. Reviens bientôt.</p></div></div>`;
}

/* ---------- Menu et sous-pages ---------- */
function ecranMenu() {
  const p = S.parties.find((x) => x.id === 1) || S.parties[0] || { nom: "Partie de Léo", temps: "12 h 34" };
  const t = (go, ico, titre, sous, cls = "") => `<button type="button" class="tuile ${cls}" data-go="${go}">${ic(ico)}<span class="t">${titre}</span><span class="s">${sous}</span></button>`;
  return `<div class="titre-page"><h1>Menu</h1></div>
    <div class="menu-grille"><section class="cadre fiche" aria-label="Partie en cours"><span class="doux">Partie en cours</span><b style="font-size:var(--text-xl)">${esc(p.nom)}</b>
        <p class="sync-ligne synchro-barre"><span class="sync ${S.sync === "hors" ? "hors" : S.sync === "cours" ? "cours" : ""}"></span><span>${SYNCS[S.sync][1]}</span></p>
        <dl class="infos"><dt>Région</dt><dd>Kanto</dd><dt>Zone</dt><dd>${Z(S.zone).nom}</dd><dt>Temps de jeu</dt><dd>${p.temps}</dd><dt>Pokédex</dt><dd>${CAPT.size}/151</dd><dt>Badges</dt><dd>${S.badgesObt.length}/8</dd></dl>
        <button type="button" class="plaque action large" data-act="sauvegarder">${ic("disque")}Sauvegarder</button>
        <button type="button" class="plaque large" data-act="menu-principal">${ic("sortie")}Menu principal</button></section>
      <div class="tuiles">${t("monde", "monde", "Monde", "Choisir une région")}${t("pokedex", "pokedex", "Pokédex", `${CAPT.size} capturés sur 151`)}${t("badges", "badge", "Badges", `${S.badgesObt.length} sur 8`)}${t("stats", "stats", "Statistiques", "DPS, gains, taux de capture")}${t("guide", "guide", "Guide du jeu", "11 sections")}${t("reglages", "reglages", "Réglages", "Son, auto-clic, raccourcis")}</div></div>`;
}
function ecranMonde() {
  return `<div class="titre-page">${retour("menu", "Retour au menu")}<h1>Monde</h1></div>
    <div class="monde-corps"><button type="button" class="cadre monde-kanto" data-go="combat" aria-label="Kanto, reprendre à ${Z(S.zone).nom}"><img src="img/carte-kanto.webp" alt=""><span class="leg">Kanto <span class="doux">· reprendre à ${Z(S.zone).nom}</span></span></button>
      <section class="cadre panneau"><div class="tete"><h2>Autres régions</h2></div><div class="regions">${REGIONS.map((r) => `<div class="region">${ic("cadenas")}<span><b>${r}</b><small>Bientôt</small></span></div>`).join("")}</div></section></div>`;
}
const sonR = (cle, titre, o) => `<div class="reglage"><div class="haut"><span><b>${titre}</b><small class="etat">${o.on ? "Activé" : "Désactivé"}</small></span>${inter(cle, titre, o.on)}</div><div class="curseur"><input type="range" min="0" max="100" step="1" value="${o.v}" data-cle="${cle}" style="--p:${o.v}%" aria-label="Volume : ${titre.toLowerCase()}" ${o.on ? "" : "disabled"}><output>${o.v}</output></div></div>`;
function ecranReglages() {
  const lie = S.lie ? "Lié : l'auto-clic s'active et s'arrête avec Attaque auto" : "Délié : l'auto-clic est désactivé";
  return `<div class="titre-page">${S.page === "c-reglages" ? "" : retour("menu", "Retour au menu")}<h1>Réglages</h1></div>
    <div class="reglages-grille"><section class="cadre panneau"><div class="tete"><h2>Son</h2></div>${sonR("mus", "Musique", S.mus)}${sonR("fx", "Effets sonores", S.fx)}</section>
      <section class="cadre panneau"><div class="tete"><h2>Jeu</h2></div>
        <div class="reglage"><div class="haut"><span><b>Auto-clic lié à l'attaque auto</b><small class="etat">${lie}</small><small>Sans effet tant que tu n'as pas acheté les Restes (Shop, Sylphe SARL).</small></span>${inter("lie", "Auto-clic lié à l'attaque auto", S.lie)}</div></div>
        <div class="reglage"><div class="haut"><span><b>Thème</b><small>Sombre</small></span><button type="button" class="plaque" aria-pressed="true">Sombre</button></div></div>
        <div class="reglage"><div class="haut"><span><b>Raccourcis clavier</b><small>Ordinateur seulement</small></span><button type="button" class="plaque" data-act="raccourcis">${ic("clavier")}Voir la liste ${kb("?")}</button></div></div></section></div>`;
}

/* ---------- Pokédex, badges, stats, guide ---------- */
const nbCapt = () => (S.dexComplet ? 151 : CAPT.size);
const estCapt = (n) => S.dexComplet || CAPT.has(n);
function dexListe() {
  const q = norm(S.dexQ);
  return DEX.filter(([n, nom]) => {
    if (S.dexF === "captures" && !estCapt(n)) return false; if (S.dexF === "manquants" && estCapt(n)) return false;
    if (!q) return true; return String(n) === q || (estCapt(n) && norm(nom).includes(q));
  });
}
const dexCase = ([n, nom]) => { const c = estCapt(n); return `<button type="button" class="dex-case ${c ? "" : "inconnu"}" data-act="dex-detail" data-id="${n}" aria-pressed="${S.dexSel === n}" aria-label="${c ? nom : "Inconnu"}, numéro ${n}"><img src="${sprite(n)}" width="96" height="96" alt="">${c ? `<span class="capt">${ic("valide")}</span>` : ""}<span class="n">N° ${n}</span><span class="nom">${c ? nom : "???"}</span></button>`; };
function dexPanneau() {
  const n = S.dexSel;
  if (n) {
    const c = estCapt(n), nom = nomEsp(n);
    const ou = EQUIPE.some(([x]) => Number(x) === n) ? "Dans ton équipe" : S.pc.some((p) => p.n === n) ? "Rangé dans ton PC" : "Enregistré au Pokédex";
    return `<section class="cadre panneau" aria-label="Fiche du Pokédex"><div class="tete"><h2>${c ? nom : "???"} · N° ${n}</h2><button type="button" class="plaque carre" data-act="dex-fermer" aria-label="Revenir aux paliers">${ic("croix")}</button></div>
      <div class="gros-sprite-c" style="margin-inline:auto"><img class="${c ? "" : "silhouette"}" src="${sprite(n)}" width="96" height="96" alt="${c ? nom : "Pokémon inconnu"}" style="width:192px;height:192px"></div>
      ${c ? `<div class="pills" style="justify-content:center">${tagsTypes(n)}<span class="tag">${ic("balle")} Déjà capturé</span></div><dl class="infos"><dt>Dégâts de base du clicker</dt><dd>${nf(degatsBase(n))}</dd><dt>Où est-il ?</dt><dd>${ou}</dd>${EVO[n] ? `<dt>Évolution</dt><dd>${EVO[n]}</dd>` : ""}</dl>`
        : `<p class="message info">${ic("alerte")}<span>Capture ce Pokémon pour découvrir son nom, ses types et ses dégâts de base.</span></p>`}</section>`;
  }
  const k = nbCapt();
  return `<section class="cadre panneau" aria-label="Paliers"><div class="tete"><h2>Paliers</h2><span class="tag neutre">${k} / 151</span></div><div class="progres" role="img" aria-label="${k} sur 151"><i style="width:${(k / 151) * 100}%"></i></div>
    ${JALONS.map(([s, t, r]) => `<div class="palier ${k >= s ? "recu" : ""}">${k >= s ? ic("valide") : ic("cadenas")}<span><b>${t} · ${s}</b><span class="s">${r}</span></span></div>`).join("")}
    ${S.dexComplet ? `<button type="button" class="plaque action large" data-act="diplome">${ic("diplome")}Voir le diplôme</button>` : ""}</section>`;
}
function ecranPokedex() {
  const l = dexListe();
  return `<div class="titre-page">${retour("menu", "Retour au menu")}<h1>Pokédex</h1><span class="tag neutre">${nbCapt()} / 151</span></div>
    <div class="outil-barre"><label class="champ grand" for="dex-q"><span>Nom ou numéro ${kb("/")}</span><span class="zone-saisie"><input id="dex-q" type="search" data-cle="dexQ" value="${esc(S.dexQ)}" autocomplete="off"></span></label>
      <div class="champ"><span>Montre</span><div class="pills">${[["tous", "Tous"], ["captures", "Capturés"], ["manquants", "À trouver"]].map(([k, t]) => chip("dex-filtre", k, t, S.dexF === k)).join("")}</div></div></div>
    <div class="dex-corps"><div id="dex-liste">${l.length ? `<div class="dex-grille">${l.map(dexCase).join("")}</div>` : `<div class="vide-etat">${ic("loupe")}<p>Aucune espèce ne correspond.</p></div>`}</div><aside id="dex-panneau">${dexPanneau()}</aside></div>
    <div class="lot-maquette">${maq("dex-complet", S.dexComplet ? "revenir à 47 capturés" : "compléter le Pokédex (151/151)")}</div>`;
}
function ecranBadges() {
  const n = S.badgesObt.length;
  const cartes = BADGES.map(([id, nom, eff, are]) => { const ok = S.badgesObt.includes(id); return `<button type="button" class="badge-carte ${ok ? "obtenu" : "manque"}" data-act="badge-detail" data-id="${id}" aria-label="${ok ? "Badge " + nom + " : " + eff : "Badge " + nom + ", à gagner : " + are}"><img src="img/badges/${id}.png" width="72" height="72" alt=""><span class="nom">${nom}</span><span class="s">${ok ? eff : "À gagner : " + are}</span></button>`; }).join("");
  return `<div class="titre-page">${retour("menu", "Retour au menu")}<h1>Badges</h1><span class="tag ${n ? "" : "neutre"}">${n} / 8</span></div>
    <p class="doux">${n ? "Clique un badge pour voir son effet." : "Aucun badge obtenu. Bats les champions d'arène !"}</p><div class="badges-grille">${cartes}</div><div class="lot-maquette">${maq("badges-cycle", `changer le nombre de badges (${n} aujourd'hui : aucun, 1, 8)`)}</div>`;
}
function ecranStats() {
  const s = (t, valeur, lignes) => `<section class="stat cadre" aria-label="${t}"><h2 class="sous-titre">${t}</h2>${valeur ? `<span class="valeur">${valeur}</span>` : ""}${lignes ? `<dl>${lignes.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}</section>`;
  return `<div class="titre-page">${retour("menu", "Retour au menu")}<h1>Statistiques</h1></div><div class="stats-grille">
    ${s("Pokémon vaincus", nf(1284))}${s("Argent total", pd(2940000))}${s("Taux de capture", "", [["Boosts passifs", "Aucun"]])}
    ${s("Dégâts clic", "", [["Base (5 + 0,2 % du DPS)", "86"], ["Boosts", "Badge Roche (×1,5), Débutant (×2)"], ["Total", "258"]])}
    ${s("DPS équipe", "", [["Base", nf(26912)], ["Boosts", "Collectionneur (×1,5)"], ["Total", nf(40368)]])}
    ${s("Gains d'argent", "", [["Base", "100 %"], ["Boosts", "Aucun"], ["Total", "×1,00"]])}${s("Gains d'XP", "", [["Base", "100 %"], ["Boosts", "Dresseur (×2)"], ["Total", "×2,00"]])}</div>`;
}
function ecranGuide() {
  const g = GUIDE.find((x) => x[0] === S.guideOuv) || GUIDE[0];
  return `<div class="titre-page">${retour("menu", "Retour au menu")}<h1>Guide du jeu</h1></div>
    <div class="guide"><nav aria-label="Sections du guide">${GUIDE.map(([id, t]) => `<button type="button" data-act="guide-sec" data-id="${id}" aria-current="${id === g[0]}">${t}</button>`).join("")}</nav>
      <article class="cadre"><h2>${g[1]}</h2>${g[2].map((t) => `<p>${esc(t)}</p>`).join("")}</article></div>`;
}
