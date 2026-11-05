# Captures de l’existant

Lancer `npm run audit:captures` depuis la racine (Chromium Playwright doit être installé). Le script construit deux versions de production et les sert sur les ports 4175 et 4176. Aucun serveur de développement ni API réelle n’est utilisé.

- `npm run audit:captures -- --sans-build` réutilise `dist-audit/` et `dist-audit-compte/`.
- `npm run audit:captures -- --seulement intro` ne reprend que les identifiants contenant `intro` ; les autres PNG et entrées du manifeste sont conservés.
- L’index est toujours régénéré ; `--no-index` n’a aucun effet.

Chaque écran produit deux PNG (390 × 844 et 1440 × 900, pleine page), nommés `<groupe>-<slug>-<largeur>.png`. `captures.json` contient les états, raisons, erreurs JavaScript et fichiers de chaque capture. `index.html` est la planche autonome à ouvrir dans un navigateur. Une erreur de capture laisse le traitement continuer et entraîne un code de sortie 1.

## Git

Les 84 images (42 écrans) pèsent ≈ 14 Mo au total et sont versionnées avec la planche, pour que `index.html` s'ouvre tel quel. Chaque régénération ajoute ≈ 14 Mo à l'historique : ne relance le script complet que pour une nouvelle série de captures, et passe plutôt `--seulement` pour retoucher un écran. Si le dossier grossit, ajoute `design/audit/*.png` au `.gitignore`. Les deux dossiers de build (`dist-audit*`) sont ignorés. Le script ne supprime pas les anciennes images.

## Accès utilisés (aucun accès de test ajouté dans `src/`)

- Partie de départ : clé `pokiclicker-dev:equipe-de-depart`, puis sauvegarde réécrite dans `localStorage` (équipe de six niveau 100, huit badges, 250 000 pièces, sac rempli, compte local avec 120 diamants). Horloge figée au 5 novembre 2026, `Math.random` fixe.
- Écrans de compte : second build avec `VITE_API_URL=http://api.test`, API entièrement simulée par interception réseau.
- Panthéon : technique de `tests-e2e/pantheon.spec.ts` (un seul PV au dernier adversaire dans le bundle chargé par le navigateur du script, le reste du combat est réel).
- « Mon compte », « Diamants », « Succès », « Skins » sont les sections d'un seul écran : leurs captures à 1440 px sont proches.
- À 1440 px, l'en-tête de l'écran de combat recouvre les boutons « Mon compte » et « Mes parties » : un clic de souris réel est intercepté (constat de l'audit, défaut de l'interface actuelle). Le script déclenche le clic par le DOM.
