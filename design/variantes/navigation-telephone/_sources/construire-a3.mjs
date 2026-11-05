// Assemble a3-app.html (toutes les pages A3 dans un seul fichier) et a3-index.html (accueil A3).
// Usage : node design/variantes/navigation-telephone/_sources/construire-a3.mjs
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
<title>PokiClicker : A3</title>
<style>
${tokens}
${lire("commun.css")}
${lire("variante-a.css")}
${lire("polices.css")}
${lire("a2.css")}
${lire("a3.css")}
</style>
</head>
<body>
<div class="tel" id="tel"><header id="cles"></header><main class="ecran" id="ecran"></main><nav class="barre" id="barre" aria-label="Navigation principale"></nav><div id="couches"></div></div>
<script>
${lire("commun.js")}
${lire("a3.js")}
</script>
</body>
</html>
`;
writeFileSync(join(sortie, "a3-app.html"), app);
console.log("a3-app.html", app.length);

const jeu = [
  ["Combat", "combat", "Quatre boutons sur une ligne : Attaque auto, Arrêt auto, Réglage (de l'arrêt auto), Sac. Chiffres du haut alignés, Pokédollars en ₽."],
  ["Combat, Fauchage et Poké-Radar débloqués", "combat-debloque", "Les deux boutons apparaissent sous les quatre autres et poussent l'équipe vers le bas. Un bouton Maquette permet de revenir à l'état de base."],
  ["Fenêtre de réglage de l'arrêt auto", "reglage-auto", "L'interrupteur qui lie ou délie l'auto-clic à l'attaque auto, puis les sept raisons d'arrêt."],
  ["Fenêtre de dialogue", "dialogue", "Inchangée."],
  ["Sac", "sac", "Inchangé."],
  ["Équipe", "equipe", "Inchangée."],
  ["Équipe en mode choix", "equipe-choix", "Inchangée."],
  ["Shop", "shop", "Inchangé, prix en ₽."],
  ["Shop, accessoires", "shop-accessoires", "Inchangé, prix en ₽."],
  ["Carte", "carte", "Inchangée : liste des zones, vraie carte non cliquable en bas."],
  ["Carte, vol vers une zone", "vol", "L'animation du jeu PC : dresseur posé sur la zone de départ, bande de vent avec le Roucarnage, fermeture, puis le combat s'ouvre (3,8 s)."],
  ["Carte, Céladopole", "celadopole", "Fenêtre à trois choix ; un choix la ferme et lance l'animation de vol."],
  ["Menu de jeu", "menu", "Partie en cours et sauvegarde, Monde, Pokédex, Badges, Réglages, Menu principal. Plus de liste de parties ni de compte."],
  ["Monde Pokémon", "monde", "Inchangé (temporaire, Kanto seul)."],
  ["Réglages", "reglages", "Musique et effets sonores : interrupteur et curseur de 0 à 100. Plus d'arrêt auto."],
];
const compte = [
  ["Connexion", "c-connexion", "Point d'entrée de la zone compte : e-mail, mot de passe, liens vers Mot de passe oublié et Créer un compte."],
  ["Connexion, erreur", "c-connexion-erreur", "Message d'erreur sous le champ, annoncé aux lecteurs d'écran."],
  ["Connexion, session expirée", "c-connexion-session", "Bandeau qui explique pourquoi on revient ici."],
  ["Créer un compte", "c-inscription", "E-mail et mot de passe d'au moins 10 caractères."],
  ["Créer un compte, erreur", "c-inscription-erreur", "Mot de passe trop court."],
  ["Mot de passe oublié", "c-oubli", "Un champ e-mail."],
  ["Lien envoyé", "c-oubli-envoye", "Confirmation, puis (maquette) ouverture du lien reçu."],
  ["Nouveau mot de passe", "c-nouveau", "Arrivée par le lien reçu, ou depuis Mon compte."],
  ["Mes parties", "c-parties", "Écran d'arrivée après la connexion : une carte par partie (nom, région, temps de jeu, dernière sauvegarde, état de synchro), Renommer, Supprimer. Les trois cas : à jour, ouverte ailleurs, deux versions."],
  ["Mes parties, première partie", "c-parties-vide", "Compte neuf : le formulaire de création prend la place."],
  ["Mes parties, hors connexion", "c-parties-hors-ligne", "Bandeau et étiquette « Sur cet appareil seulement »."],
  ["Nouvelle partie", "c-nouvelle", "Un nom, puis Créer la partie."],
  ["Renommer", "c-renommer", "Fenêtre avec le nom actuel."],
  ["Supprimer, confirmation", "c-supprimer", "Texte du jeu : la progression est perdue, diamants, succès et skins restent."],
  ["Partie ouverte ailleurs", "c-ailleurs", "Explique et propose Reprendre ici."],
  ["Deux versions", "c-version", "Cet appareil ou l'autre version, côte à côte."],
  ["Partie supprimée ailleurs", "c-version-supprimee", "La garder ou l'abandonner."],
  ["Mon compte", "c-compte", "E-mail, état de synchro, diamants, succès (obtenus d'abord), skins, mot de passe, Se déconnecter en haut."],
  ["Déconnexion avec synchro en attente", "c-deconnexion", "Confirmation avant de perdre une progression non envoyée."],
  ["Réglages du compte", "c-reglages", "Mêmes réglages sonores que dans le jeu."],
];
const css = lire("commun.css") + `
.accueil { max-width: calc(var(--u) * 240); margin: 0 auto; padding: calc(var(--u) * 4); display: grid; gap: calc(var(--u) * 4); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 48rem) { .accueil { grid-template-columns: minmax(0, 1fr) var(--breakpoint-sm); align-items: start; } }
.accueil h1 { font-family: var(--font-titre); font-weight: 700; font-size: var(--text-2xl); line-height: var(--text-2xl--line-height); }
.accueil h2.groupe { font-family: var(--font-titre); font-weight: 700; font-size: var(--text-xl); line-height: var(--text-xl--line-height); margin-top: calc(var(--u) * 3); }
.accueil .liste { gap: calc(var(--u) * 3); }
.carte-v { padding: calc(var(--u) * 3) calc(var(--u) * 4); display: grid; gap: var(--u); text-decoration: none; color: var(--texte); }
.carte-v h3 { font-family: var(--font-titre); font-weight: 700; font-size: var(--text-lg); line-height: var(--text-lg--line-height); color: var(--region-accent); }
.apercu { display: none; }
@media (min-width: 48rem) { .apercu { display: block; position: sticky; top: calc(var(--u) * 4); width: var(--breakpoint-sm); height: calc(100dvh - var(--u) * 8); border: var(--trait) solid var(--bordure); background: var(--fond); } }
`;
const bloc = (liste) => liste.map(([t, h, p]) => `    <a class="carte-v cadre" href="a3-app.html#${h}" target="_top" data-apercu="a3-app.html#${h}"><h3>${t}</h3><span>${p}</span></a>`).join("\n");
const index = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PokiClicker : A3</title>
<style>
${tokens}
${css}
${lire("polices.css")}
body { background: var(--fond); }
</style>
</head>
<body>
<div class="accueil">
  <div class="liste">
    <h1>A3 : toute l'interface téléphone</h1>
    <p class="doux">Le jeu et la zone compte, reliés entre eux : « Menu principal » dans le Menu de jeu mène aux parties ; toucher une partie ouvre le Monde. Chaque entrée ouvre l'écran de départ, ensuite on navigue librement. Contenu fictif.</p>
    <a class="carte-v cadre" href="a3-polices.html" target="_top"><h3>Comparatif des polices</h3><span>Trois polices lisibles pour les chiffres et les titres, à côté de l'actuelle. Retenue : Rubik, gras.</span></a>
    <h2 class="groupe">Le jeu</h2>
${bloc(jeu)}
    <h2 class="groupe">La zone compte</h2>
${bloc(compte)}
  </div>
  <iframe class="apercu" name="apercu" title="Aperçu de A3" src="a3-app.html#combat"></iframe>
</div>
<script>
if (matchMedia("(min-width: 48rem)").matches) document.querySelectorAll("[data-apercu]").forEach((a) => { a.target = "apercu"; });
</script>
</body>
</html>
`;
writeFileSync(join(sortie, "a3-index.html"), index);
console.log("a3-index.html", index.length);
