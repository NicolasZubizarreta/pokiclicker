/* Maquettes PC : données fictives de Kanto (reprises de la maquette téléphone) et petits outils.
   Contenu plausible, aucune valeur de jeu. Sprites et objets : dossier img/ voisin, chemins relatifs. */
const SPR = "img/pokemon/", OBJ = "img/objets/", DEC = "img/decors/";
const CH = {
  combat: "M3 3l5 1 12 14-3 3L4 8zM21 3l-5 1-5 6m-3 5-5 5m12-1 5-5M4 14l6 6",
  equipe: "M4 3h6v6H4zM14 3h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z",
  shop: "M4 8h16v13H4zM8 8V3h8v5M4 13h16M10 12v3h4v-3",
  carte: "m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3zM8 2v17M16 5v17",
  pc: "M3 4h18v12H3zM9 20h6M12 16v4", menu: "M4 6h16M4 12h16M4 18h16", croix: "M5 5l14 14M19 5 5 19", retour: "M15 4 7 12l8 8",
  cadenas: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v12H5z", sac: "M8 6V3h8v3M6 6h12l3 15H3zM7 13h10v5H7z", auto: "m13 2-9 12h7l-1 8 10-13h-7z",
  pokedex: "M5 3h14v18H5zM9 8h6M9 12h6M9 16h3", badge: "m12 2 3 4 5 1-1 5 1 5-5 1-3 4-3-4-5-1 1-5-1-5 5-1z",
  reglages: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
  parties: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01", chevron: "m9 4 8 8-8 8",
  balle: "M3 12a9 9 0 0 1 18 0zM3 12a9 9 0 0 0 18 0zM3 12h18M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  monde: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18",
  valide: "m5 12 5 5 9-10", compte: "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0", disque: "M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7",
  stop: "M6 6h12v12H6z", reglage: "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6h4V4zM6 14v6h4v-6z", sortie: "M10 3H4v18h6M15 7l5 5-5 5M20 12H9",
  ajout: "M12 5v14M5 12h14", crayon: "M4 20l1-4L16 5l3 3L8 19zM14 7l3 3", corbeille: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",
  oeil: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", diamant: "M6 3h12l4 6-10 12L2 9zM2 9h20M9 3 7 9l5 12 5-12-2-6",
  nuage: "M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 19 18z", alerte: "M12 3 2 21h20zM12 10v5M12 18h.01",
  etoile: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z", etincelle: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z",
  oeuf: "M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z", loupe: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 21 21",
  stats: "M4 20V10M10 20V4M16 20v-7M22 20H2", guide: "M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM8 9h8M8 13h6",
  diplome: "M4 4h16v13H4zM8 8h8M8 12h5M14 17l3 4 3-4", faux: "M4 20 15 9M13 4c4 0 7 3 7 7-3-1-6-1-9 2z", radar: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 12l6-6",
  clavier: "M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10", soin: "M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z", maison: "M3 11l9-8 9 8v10H3zM10 21v-6h4v6",
  coeur: "M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.500-8 11-8 11z", reseau: "M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.500 17a5 5 0 0 1 7 0M12 20h.01", casino: "M4 4h16v16H4zM8 8h.01M16 16h.01M12 12h.01M16 8h.01M8 16h.01",
};
const ic = (n, c = "") => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${CH[n]}"/></svg>`;
const nf = (n) => n.toLocaleString("fr-FR");
const pd = (n) => nf(n) + " ₽";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const norm = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const virg = (x) => String(x).replace(".", ",");

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
const DECOR_ZONE = { "route-1": "route-1.webp", "foret-de-jade": "foret-de-jade.webp", "arene-d-argenta": "arene-d-argenta.webp", "bourg-palette": "bourg-palette.webp" };

const SAC = [
  ["rare-candy", "Bonbon rare", 5, "+1 niveau", true], ["thunder-stone", "Pierre Foudre", 2, "Fait évoluer Pikachu", true], ["water-stone", "Pierre Eau", 1, "Fait évoluer un Pokémon d'eau", true],
  ["repel", "Repousse", 12, "Moins de rencontres, 15 s", false], ["x-attack", "Attaque +", 8, "Dégâts ×1,5 pendant 30 s", false],
];
const EQUIPE0 = [["3", "Florizarre", 9420], ["6", "Dracaufeu", 8910], ["16", "Roucool", 5120], ["25", "Pikachu", 8300], ["26", "Raichu", 7615], ["21", "Piafabec", 5000]];
const SHOP = {
  balls: [["poke-ball", "Poké Ball", "Une chance de capturer", 200], ["great-ball", "Super Ball", "Capture plus sûre", 600], ["ultra-ball", "Hyper Ball", "La meilleure des balles", 1200]],
  objets: [["repel", "Repousse", "Moins de rencontres, 15 s", 350], ["x-attack", "Attaque +", "Dégâts ×1,5 pendant 30 s", 800], ["rare-candy", "Bonbon rare", "+1 niveau", 4800], ["thunder-stone", "Pierre Foudre", "Fait évoluer Pikachu", 2100], ["water-stone", "Pierre Eau", "Fait évoluer un Pokémon d'eau", 2100]],
  accessoires: [["leftovers", "Restes", "Auto-clic au repos", 12000, true], ["PokeRadar", "Poké-Radar", "Repère les Pokémon rares de la zone", 25000, false]],
};
const ONGLETS = [["balls", "Poké Ball"], ["objets", "Objets"], ["accessoires", "Accessoires"]];
const REGIONS = ["Johto", "Hoenn", "Sinnoh", "Unys", "Kalos", "Alola", "Galar", "Paldea"];
const ARRETS = [["commun", "Pokémon commun", false], ["peuCommun", "Pokémon peu commun", false], ["rare", "Pokémon rare", true], ["tresRare", "Pokémon très rare", true], ["legendaire", "Pokémon légendaire", true], ["shiny", "Pokémon chromatique", true], ["nouveau", "Nouveau Pokémon (pas encore au Pokédex)", true]];
const SYNCS = { ajour: ["À jour", "Sauvegardée en ligne"], cours: ["Synchronisation en cours", "Sauvegarde en cours…"], hors: ["Hors connexion", "Hors connexion : sauvegardée sur cet appareil"] };
const TAGS = { ajour: ["À jour", ""], cours: ["Synchronisation en cours", "info"], local: ["Sur cet appareil seulement", "alerte"], supprimee: ["Supprimée ailleurs", "erreur"], ailleurs: ["Ouverte ailleurs", "info"] };
const SUCCES = [["Premiers pas", "Attrape ton premier Pokémon", 5, true], ["Premier badge", "Gagne un badge d'arène", 5, true], ["Collectionneur", "Enregistre 25 Pokémon dans ton Pokédex", 10, false]];
const NAV = [["combat", "Combat", "combat"], ["equipe", "Équipe", "equipe"], ["pc", "PC", "pc"], ["shop", "Shop", "shop"], ["carte", "Carte", "carte"], ["menu", "Menu", "menu"]];
/* Pages qui allument chaque entrée de navigation */
const SOUS = { equipe: ["equipe"], pc: ["pc"], menu: ["menu", "pokedex", "badges", "stats", "guide", "reglages", "monde"], carte: ["carte", "lieu-bourg", "lieu-maman", "lieu-blue", "commercial", "casino", "pension"], combat: ["combat"], shop: ["shop"] };
const entreeNav = (p) => (Object.entries(SOUS).find(([, l]) => l.includes(p)) || ["combat"])[0];
const RESTAURER = [["il y a 2 min", "Route 1", "12 h 34"], ["hier, 21 h 10", "Route 1", "11 h 57"], ["samedi, 18 h 20", "Bourg Palette", "10 h 02"]];

const partiesDepart = () => [
  { id: 1, nom: "Partie de Léo", lieu: "Kanto · Route 1", temps: "12 h 34", sauve: "il y a 2 min", etat: "ajour" },
  { id: 2, nom: "Partie test", lieu: "Kanto · Forêt de Jade", temps: "3 h 02", sauve: "hier, 21 h 10", etat: "ailleurs" },
  { id: 3, nom: "Partie du week-end", lieu: "Kanto · Céladopole", temps: "6 h 48", sauve: "samedi, 18 h 20", etat: "supprimee" },
];
const SHINYS = [6, 25, 130];
const sprite = (n, shiny) => `${SPR}${shiny && SHINYS.includes(n) ? "shiny-" : ""}${n}.png`;
const nomEsp = (n) => DEX[n - 1][1];
const typesEsp = (n) => DEX[n - 1].slice(2);
const EVO = { 7: "niveau 16", 10: "niveau 7", 19: "niveau 20", 129: "niveau 20", 133: "Pierre Eau, Pierre Foudre ou Pierre Feu", 39: "Pierre Lune", 54: "niveau 33", 63: "niveau 16", 74: "niveau 25", 92: "niveau 25", 16: "niveau 18" };
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
const SEXE_SVG = {
  m: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9.5" cy="14.5" r="6"/><path d="M14 10L21 3M15 3h6v6"/></svg>',
  f: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8.5" r="6"/><path d="M12 14.5V22M8.5 18.5h7"/></svg>',
};
const sexeHtml = (p) => (p.sexe === "m" ? `<span class="sexe m" role="img" aria-label="Mâle">${SEXE_SVG.m}</span>` : p.sexe === "f" ? `<span class="sexe f" role="img" aria-label="Femelle">${SEXE_SVG.f}</span>` : "");
/* Couleurs des types : celles du jeu (TYPE_COLORS). Texte sombre sur fond clair, clair sur fond foncé. */
const TYPE_HEX = { Normal: "#A8A77A", Feu: "#EE8130", Eau: "#6390F0", "Électrik": "#F7D02C", Plante: "#7AC74C", Glace: "#96D9D6", Combat: "#C22E28", Poison: "#A33EA1", Sol: "#E2BF65", Vol: "#A98FF3", Psy: "#F95587", Insecte: "#A6B91A", Roche: "#B6A136", Spectre: "#735797", Dragon: "#6F35FC", Acier: "#B7B7CE", "Ténèbres": "#705746", "Fée": "#D685AD" };
function typeStyle(nom) {
  const h = TYPE_HEX[nom]; if (!h) return "";
  const lin = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return `--t:${h};--tt:${lum > 0.3 ? "var(--fond)" : "var(--texte)"}`;
}
const typeTag = (t) => `<span class="tag type" style="${typeStyle(t)}">${t}</span>`;
const tagsTypes = (n) => typesEsp(n).map(typeTag).join("");
const nomP = (p) => (p.oeuf ? "Œuf" : p.surnom || nomEsp(p.n));
const pasOeuf = (p) => `Éclosion : ${p.oeuf.pas}/${p.oeuf.max}`;
function dpsDetail(p) {
  const base = p.niveau * 41, type = 1, shiny = p.shiny ? 2 : 1, bonheur = 1.12, stase = 1, calcium = 1.02;
  return { base, type, shiny, bonheur, stase, calcium, total: Math.round(base * type * shiny * bonheur * stase * calcium) };
}
const dpsPc = (p) => (p.oeuf ? 0 : dpsDetail(p).total);
/* Dégâts de base du clicker pour une espèce (valeur fictive mais stable) */
const degatsBase = (n) => 40 + ((n * 7) % 160);
/* Easter eggs de renommage : photos selon le stade (V1) */
const EGG_NOMS = { daran: "daran", gabriel: "gabriel" };
const stade = (niveau) => (niveau < 30 ? 1 : niveau < 60 ? 2 : 3);
const imgFiche = (p) => { const k = EGG_NOMS[norm(p.surnom || "")]; return k ? `img/easter-eggs/${k}-stade-${stade(p.niveau || 1)}.webp` : null; };
const ARTWORK = { 1: "img/artworks/1.png", 4: "img/artworks/4.png", 7: "img/artworks/7.png" };
const STARTERS = [[1, "Bulbizarre", "Plante", "Une graine sur le dos, calme et solide."], [4, "Salamèche", "Feu", "Une flamme au bout de la queue."], [7, "Carapuce", "Eau", "Une carapace épaisse, il garde le rythme."]];
