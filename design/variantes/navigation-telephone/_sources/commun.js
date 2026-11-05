/* Contenu fictif commun aux quatre variantes (même texte partout : on compare des navigations, pas des contenus).
   Sprites et objets : images du dépôt, par chemin relatif (design/variantes/combat-v3/img). */
const IMG = "../combat-v3/img/";
const PK = {
  etat: { pcOuvert: false, pieces: 250000, pv: 152, pvMax: 152 },
  nf: (n) => n.toLocaleString("fr-FR"),
  chemins: {
    combat: "M3 3l5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6",
    equipe: "M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z",
    shop: "M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3",
    carte: "m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17",
    pc: "M3 4h18v12H3zM9 20h6M12 16v4",
    plus: "M3 10h3v4H3zM10 10h3v4h-3zM17 10h3v4h-3z",
    menu: "M4 6h16M4 12h16M4 18h16",
    croix: "M5 5l14 14M19 5 5 19",
    retour: "M15 4 7 12l8 8",
    cadenas: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v12H5z",
    sac: "M8 6V3h8v3M6 6h12l3 15H3zM7 13h10v5H7z",
    auto: "m13 2-9 12h7l-1 8 10-13h-7z",
    outils: "M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6",
    pokedex: "M5 3h14v18H5zM9 8h6M9 12h6M9 16h3",
    badge: "m12 2 3 4 5 1-1 5 1 5-5 1-3 4-3-4-5-1 1-5-1-5 5-1z",
    reglages: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
    parties: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01",
    chevron: "m9 4 8 8-8 8",
    balle: "M3 12a9 9 0 0 1 18 0zM3 12a9 9 0 0 0 18 0zM3 12h18M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  },
  ic(nom, extra = "") { return `<svg class="ic ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${this.chemins[nom]}"/></svg>`; },

  cles() {
    const marques = Array.from({ length: 10 }, (_, i) => `<i class="${i === 0 ? "ici" : i === 9 ? "boss" : ""}"></i>`).join("");
    return `<header class="cles" aria-label="Chiffres clés">
      <div class="rang">
        <div class="cle large"><small>Pièces</small><b id="pieces">${this.nf(this.etat.pieces)}</b></div>
        <div class="cle"><small>DPS</small><b>${this.nf(40365)}</b></div>
        <div class="cle"><small>Zone</small><b>Route 1</b></div>
        ${this.suiteCles || ""}
      </div>
      <div class="etapes" role="img" aria-label="Étape 1 sur 10">${marques}<span>1/10</span></div>
    </header>`;
  },

  combat({ outils = true } = {}) {
    const team = [["1", 100], ["4", 100], ["16", 100], ["25", 100], ["26", 100], ["21", 100]]
      .map(([n, l]) => `<button type="button" data-go="equipe" aria-label="Pokémon ${n}, niveau ${l}"><img src="${IMG}${n}.png" width="96" height="96" alt=""><em>${l}</em></button>`).join("");
    return `
    <button type="button" class="scene cadre" id="scene" aria-label="Attaquer Rattata">
      <span class="info cadre"><span class="ligne"><span class="nom">Rattata</span><span>Niv. 2</span></span>
        <span class="pv" style="display:block"><i id="pv" style="--pv:100%"></i></span>
        <span class="pv-txt" id="pvtxt">PV ${this.etat.pv} / ${this.etat.pvMax}</span></span>
      <span class="socle"></span>
      <img class="rattata" src="${IMG}19.png" width="96" height="96" alt="">
      <span class="degat" id="degat">−412</span>
    </button>
    ${outils ? `<div class="outils">
      <button type="button" class="plaque vertical" data-act="capturer">${this.ic("balle")}Capturer<span class="pastille">×50</span></button>
      <button type="button" class="plaque vertical" aria-pressed="false" data-act="auto">${this.ic("auto")}Auto</button>
      <button type="button" class="plaque vertical" data-go="sac">${this.ic("sac")}Sac<span class="pastille">82</span></button>
      <button type="button" class="plaque vertical" data-go="outils">${this.ic("outils")}Outils</button>
    </div>` : ""}
    <div class="bande" aria-label="Ton équipe">${team}</div>
    <section class="chen cadre" aria-label="Prof. Chen">
      <img src="${IMG}chen-1.png" width="120" height="120" alt="">
      <div><p class="pixel">Prof. Chen</p><p>Les Rattata sont ici. Touche le Pokémon pour attaquer.</p></div>
      <div class="zones">
        <button type="button" class="plaque">Zone précédente</button>
        <button type="button" class="plaque action">Zone suivante</button>
      </div>
    </section>`;
  },

  equipe() {
    const lignes = [["1", "Florizarre", 100, 9420], ["4", "Dracaufeu", 100, 8910], ["16", "Roucool", 100, 5120], ["25", "Pikachu", 100, 8300], ["26", "Raichu", 100, 7615], ["21", "Piafabec", 100, 5000]]
      .map(([n, nom, l, d]) => `<button type="button" class="ligne-p"><img class="sp" src="${IMG}${n}.png" width="96" height="96" alt=""><span class="corps"><span class="t">${nom}</span><br><span class="s">Niv. ${l} · ${this.nf(d)} DPS</span><span class="xp" style="display:block"><i style="display:block;width:100%"></i></span></span>${this.ic("chevron")}</button>`).join("");
    return `<div class="liste">${lignes}</div>
      <button type="button" class="ligne-p" data-go="sac"><span class="corps"><span class="t">Sac</span><br><span class="s">82 objets · Bonbon rare, Repousse, Attaque +…</span></span>${this.ic("chevron")}</button>`;
  },

  shop() {
    const obj = [["poke-ball", "Poké Ball", "Une chance de capturer", "200"], ["great-ball", "Super Ball", "Capture plus sûre", "600"], ["ultra-ball", "Hyper Ball", "La meilleure des balles", "1 200"],
      ["repel", "Repousse", "Moins de rencontres, 15 s", "350"], ["x-attack", "Attaque +", "Dégâts ×1,5 pendant 30 s", "800"], ["rare-candy", "Bonbon rare", "+1 niveau", "4 800"],
      ["thunder-stone", "Pierre Foudre", "Fait évoluer Pikachu", "2 100"], ["leftovers", "Restes", "Auto-clic au repos", "12 000"]]
      .map(([i, nom, eff, prix]) => `<div class="ligne-p"><img class="obj" src="${IMG}${i}.png" width="30" height="30" alt=""><div class="corps"><div class="t">${nom}</div><div class="s">${eff}</div></div><button type="button" class="plaque" style="min-width:calc(var(--u)*24)" aria-label="Acheter ${nom}, ${prix} pièces">${prix} PO</button></div>`).join("");
    return `<div class="chips" role="group" aria-label="Catégories"><button type="button" class="plaque" aria-pressed="true">Tout</button><button type="button" class="plaque">Balles</button><button type="button" class="plaque">Soins</button><button type="button" class="plaque">Objets</button></div>
      <div class="liste">${obj}</div>`;
  },

  carte() {
    const z = [["Route 1 · Bourg Palette", "Zone 1", "actuelle"], ["Jadielle", "Zone 2", ""], ["Forêt de Jade", "Zone 3", "ferme"], ["Argenta", "Zone 4 · arène", "ferme"]];
    return `<div class="liste">${z.map(([n, s, c]) => `<button type="button" class="ligne-p ${c}"><span class="corps"><span class="t">${n}</span><br><span class="s">${s}${c === "actuelle" ? " · tu es ici" : ""}</span></span>${this.ic("chevron")}</button>`).join("")}</div>`;
  },

  /* Lignes du menu « Plus » : le PC verrouillé s'ouvre quand même pour dire pourquoi (comportement V1). */
  lignesPlus({ avecPc = true } = {}) {
    const ouvert = this.etat.pcOuvert;
    const pc = avecPc ? `<button type="button" class="ligne-p ${ouvert ? "" : "ferme"}" data-go="pc">${this.ic(ouvert ? "pc" : "cadenas")}<span class="corps"><span class="t">PC de Léo</span><br><span class="s">${ouvert ? "12 Pokémon rangés" : "Après l'arène d'Argenta"}</span></span>${this.ic("chevron")}</button>` : "";
    const l = (go, ic, t, s) => `<button type="button" class="ligne-p" data-go="${go}">${this.ic(ic)}<span class="corps"><span class="t">${t}</span><br><span class="s">${s}</span></span>${this.ic("chevron")}</button>`;
    return pc + l("pokedex", "pokedex", "Pokédex", "47 vus sur 151") + l("badges", "badge", "Badges", "0 sur 8") + l("parties", "parties", "Mes parties", "Sauvegardes et compte") + l("reglages", "reglages", "Réglages", "Son, thème, arrêt auto");
  },
  aventure() {
    return `<div class="resume cadre"><div><small class="doux">Région</small><b>Kanto</b></div><div><small class="doux">Pokédex</small><b>47/151</b></div><div><small class="doux">Badges</small><b>0/8</b></div><div><small class="doux">DPS</small><b>${this.nf(40365)}</b></div></div>`;
  },

  /* PC : verrouillé = on explique et on dit comment le débloquer ; ouvert = bande d'équipe + grille. */
  pc() {
    if (!this.etat.pcOuvert) {
      return `<div class="explique">${this.ic("cadenas")}<p><b>Le PC n'est pas encore à toi.</b> Il se débloque quand tu bats l'arène d'Argenta.</p></div>
        <button type="button" class="maquette" data-act="debloquer-pc">Maquette : simuler la victoire à l'arène d'Argenta</button>`;
    }
    const b = [["7", "Carapuce"], ["95", "Onix"], ["19", "Rattata"], ["16", "Roucool"], ["25", "Pikachu"], ["4", "Salamèche"]];
    return `<div class="grille-pc">${b.map(([n, nom]) => `<button type="button"><img src="${n === "7" || n === "95" ? "../../specimens/assets/pokemon/" + n + ".png" : IMG + n + ".png"}" width="96" height="96" alt=""><span>${nom}</span></button>`).join("")}</div>
      <button type="button" class="maquette" data-act="verrouiller-pc">Maquette : verrouiller à nouveau le PC</button>`;
  },
  page(nom) {
    const m = { equipe: () => this.equipe(), shop: () => this.shop(), carte: () => this.carte(), pc: () => this.pc(),
      plus: () => this.aventure() + `<div class="liste">${this.lignesPlus()}</div>` };
    return (m[nom] || (() => `<p class="doux">Contenu de la page « ${nom} » : hors périmètre de ce ticket.</p>`))();
  },
  titres: { combat: "Combat", equipe: "Équipe", shop: "Shop", carte: "Carte", pc: "PC de Léo", plus: "Plus", sac: "Sac", outils: "Outils", pokedex: "Pokédex", badges: "Badges", parties: "Mes parties", reglages: "Réglages", aventure: "Ton aventure" },

  /* Interactions communes : toucher la scène, toast */
  scene(racine) {
    const s = racine.querySelector("#scene"); if (!s) return;
    s.addEventListener("click", () => {
      s.classList.remove("coup"); void s.offsetWidth; s.classList.add("coup");
      this.etat.pv -= 12; if (this.etat.pv <= 0) { this.etat.pv = this.etat.pvMax; this.etat.pieces += 150; const p = document.getElementById("pieces"); if (p) p.textContent = this.nf(this.etat.pieces); }
      racine.querySelector("#pv").style.setProperty("--pv", (this.etat.pv / this.etat.pvMax * 100) + "%");
      racine.querySelector("#pvtxt").textContent = `PV ${this.etat.pv} / ${this.etat.pvMax}`;
    });
    racine.querySelectorAll("[data-act=auto]").forEach((b) => b.addEventListener("click", () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true")));
  },
  toast(texte, ms = 3000) {
    const t = document.createElement("div"); t.className = "toast cadre"; t.setAttribute("role", "status"); t.textContent = texte;
    document.getElementById("tel").appendChild(t); setTimeout(() => t.remove(), ms);
  },
};
