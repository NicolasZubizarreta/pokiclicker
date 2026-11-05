// Assemble a2-app.html (toutes les pages A2 dans un seul fichier) et a2-index.html (accueil A2).
// Usage : node design/variantes/navigation-telephone/_sources/construire-a2.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const sortie = join(ici, "..");
const lire = (f) => readFileSync(join(ici, f), "utf8");
const tokens = readFileSync(join(ici, "../../../tokens.css"), "utf8");

const app = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PokiClicker : A2</title>
<style>
${tokens}
${lire("commun.css")}
${lire("variante-a.css")}
${lire("a2.css")}
</style>
</head>
<body>
<div class="tel" id="tel"><header id="cles"></header><main class="ecran" id="ecran"></main><nav class="barre" id="barre" aria-label="Navigation principale"></nav><div id="couches"></div></div>
<script>
${lire("commun.js")}
${lire("a2.js")}
</script>
</body>
</html>
`;
writeFileSync(join(sortie, "a2-app.html"), app);
console.log("a2-app.html", app.length);

const ecrans = [
  ["Combat, disposition 1", "combat-1", "Une ligne de capture : la balle choisie (on la change en la touchant) et Capturer. Dessous, quatre boutons : Attaque auto, Clic auto, Sac, Outils."],
  ["Combat, disposition 2", "combat-2", "Une ligne de capture avec les trois balles visibles et Capturer. Dessous, deux interrupteurs qui disent leur état, puis Sac et Outils."],
  ["Fenêtre de dialogue", "dialogue", "Exemple de dialogue de tuto, ouvert une fois par-dessus le combat."],
  ["Outils (fenêtre du bas)", "outils", "Arrêt auto et ses paramètres ; Poké-Radar et Fauchage grisés « Bientôt »."],
  ["Sac", "sac", "Fenêtre ouverte depuis le combat. « Utiliser » sur un bonbon ou une pierre ouvre l'équipe en mode choix."],
  ["Équipe", "equipe", "Six Pokémon, sans ligne Sac. Le PC est en bas (accès à confirmer)."],
  ["Équipe en mode choix", "equipe-choix", "Bandeau « Annuler » collé en haut ; on touche un Pokémon, on revient au combat."],
  ["Shop", "shop", "Trois catégories : Poké Ball, Objets, Accessoires."],
  ["Shop, accessoires", "shop-accessoires", "Restes déjà acheté (« Possédé », grisé), Poké-Radar à acheter."],
  ["Carte", "carte", "Liste des zones (défile dans son cadre), vraie carte non cliquable en bas, cercle vert = zone actuelle."],
  ["Carte, vol vers une zone", "vol", "Au toucher d'une zone, le point vole jusqu'à elle (1 s), puis le combat s'ouvre."],
  ["Carte, Céladopole", "celadopole", "Fenêtre à trois choix (Arène, Centre commercial, Casino) ; un choix la ferme et lance le vol."],
  ["Menu", "menu", "Partie en cours, sauvegarde, parties, monde, réglages, compte."],
  ["Mes parties", "parties", "Une carte par partie : nom, temps de jeu, dernière sauvegarde. Toucher une partie ouvre le monde."],
  ["Monde Pokémon", "monde", "Kanto jouable, les autres régions verrouillées."],
  ["Réglages", "reglages", "Quatre réglages d'exemple."],
];
const css = lire("commun.css") + `
.accueil { max-width: calc(var(--u) * 240); margin: 0 auto; padding: calc(var(--u) * 4); display: grid; gap: calc(var(--u) * 4); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 48rem) { .accueil { grid-template-columns: minmax(0, 1fr) var(--breakpoint-sm); align-items: start; } }
.accueil h1 { font-family: var(--font-titre); font-weight: 600; font-size: var(--text-2xl); line-height: var(--text-2xl--line-height); }
.accueil .liste { gap: calc(var(--u) * 3); }
.carte-v { padding: calc(var(--u) * 3) calc(var(--u) * 4); display: grid; gap: var(--u); text-decoration: none; color: var(--texte); }
.carte-v h2 { font-family: var(--font-titre); font-weight: 600; font-size: var(--text-lg); line-height: var(--text-lg--line-height); color: var(--region-accent); }
.apercu { display: none; }
@media (min-width: 48rem) { .apercu { display: block; position: sticky; top: calc(var(--u) * 4); width: var(--breakpoint-sm); height: calc(100dvh - var(--u) * 8); border: var(--trait) solid var(--bordure); background: var(--fond); } }
`;
const index = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PokiClicker : A2</title>
<style>
${tokens}
${css}
body { background: var(--fond); }
</style>
</head>
<body>
<div class="accueil">
  <div class="liste">
    <h1>A2 : barre à cinq, corrigée</h1>
    <p class="doux">Tous les écrans, reliés entre eux (barre du bas, boutons, fenêtres). Chaque entrée ouvre l'écran de départ ; ensuite on navigue librement. Contenu fictif.</p>
${ecrans.map(([t, h, p]) => `    <a class="carte-v cadre" href="a2-app.html#${h}" target="_top" data-apercu="a2-app.html#${h}"><h2>${t}</h2><span>${p}</span></a>`).join("\n")}
  </div>
  <iframe class="apercu" name="apercu" title="Aperçu de A2" src="a2-app.html#combat-1"></iframe>
</div>
<script>
if (matchMedia("(min-width: 48rem)").matches) document.querySelectorAll("[data-apercu]").forEach((a) => { a.target = "apercu"; });
</script>
</body>
</html>
`;
writeFileSync(join(sortie, "a2-index.html"), index);
console.log("a2-index.html", index.length);
