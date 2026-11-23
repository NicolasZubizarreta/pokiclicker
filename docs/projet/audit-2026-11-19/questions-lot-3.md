# Lot 3 (ticket C) : points à valider ou non couverts

Ces points ne sont pas codés, ou demandent une décision de Nicolas.

## Décisions de produit ou de serveur

**Décision de Nicolas (20/11) : S-uib-01 (cookie HttpOnly) et B-uib-01 (envoi compressé à la fermeture) ne sont pas faits.** Le système de sauvegarde sera repensé en entier plus tard (voir `docs/projet/vision-sauvegarde-parties.md`) : inutile de renforcer l'actuel.

- **S-uib-01, jeton de session dans `localStorage`.** Le correctif de l'audit est un cookie `HttpOnly` posé par le serveur : il touche `server/` (CORS avec identifiants, CSRF, domaine commun du jeu et de l'API). Rien n'est codé côté jeu. À décider : on garde le jeton Bearer actuel (ce qui est protégé aujourd'hui : la CSP du lot 3 limite les scripts à ceux du jeu), ou on ouvre un ticket serveur pour le cookie.
- **B-uib-01, sauvegarde de fermeture au-delà de 60 000 octets.** Le navigateur limite à 64 Ko les envois en `keepalive` au moment de la fermeture. Le jeu envoie déjà quand l'onglet passe en arrière-plan (`visibilitychange` « hidden », `store.ts`), ce qui couvre la plupart des fermetures. Reste le cas où seul `pagehide` se déclenche avec une partie de plus de 60 Ko : le serveur n'accepte pas de corps compressé. Il faudrait un envoi compressé côté serveur, donc un ticket serveur. Perte maximale dans ce cas : le temps écoulé depuis le dernier envoi périodique.
- **S-uib-03, parties locales d'un autre compte.** Choix fait : quand un compte différent se connecte sur un appareil, les clés `pokiclicker:*` de l'ancien compte sont déplacées sans perte sous `pokiclicker.archive.<ancienId>.<clé>`, et le nouveau compte part d'un stockage local vide (son serveur remet ses parties). Rien n'est supprimé, mais **aucun écran ne permet de retrouver ces archives** : si l'ancien compte se reconnecte, il récupère ses parties depuis le serveur, pas depuis l'archive. À décider : afficher un message au changement de compte, et/ou un écran de restauration depuis l'archive.

## Réglages hors du dépôt du jeu

- **CSP.** Posée par balise `<meta>` dans le build. Les directives `frame-ancestors`, `report-uri` et `sandbox` ne sont pas prises en compte dans une balise `<meta>` : pour interdire l'affichage du jeu dans un cadre, il faut l'en-tête `Content-Security-Policy` (ou `X-Frame-Options`) côté hébergement (Coolify / Caddy). À régler hors du dépôt.

## Notes de design et de dev

- Écran « Parties abîmées » (nouvelle section de l'écran Parties) : composée avec les classes `cadre`, `plaque` et `compte-message erreur` de l'écran voisin. `design/DESIGN.md` ne décrit pas ce cas : à confirmer au prochain passage de Nicolas.
- Écran de secours de `ErreurRendu` et écran « stockage plein ou inaccessible » : même gabarit que l'écran « Vérification de la sauvegarde… » de `App.tsx`. Non décrits dans `DESIGN.md`.
- Journal de zones (`pokiclicker-dev:journal-actif`, `pokiclicker-dev:journal-zones`, `src/ui/journal-zones.ts`) : ses clés portent le préfixe `-dev` mais le code reste actif en production si la clé est posée. Non modifié (hors ticket C). À décider : le mettre derrière `modeDeveloppeur()` comme l'équipe de départ.
- Les tests e2e tournent maintenant sur un build en mode `e2e` (`vite build --mode e2e`), seul mode de build qui garde les clés `pokiclicker-dev:*` actives. `scripts/partie-test.mjs` utilise le serveur de dev (inchangé) ; `scripts/audit/ecrans.mjs` vise le port 4175 de `tests-e2e/compte.config.ts`, donc le build `e2e`.
