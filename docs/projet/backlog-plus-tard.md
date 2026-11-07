# Backlog « plus tard » (idées validées, hors phase en cours)

Tickets décidés par Nicolas mais rattachés à aucune phase pour l'instant. Aucun code avant son feu vert sur le ticket.

## U. `feat(ui): refonte complète du casino (téléphone et PC)`

`type:feat`, `etat:a_faire`, `est:à cadrer`, `prio:4` · branche : `v2` · pas d'`agent-ok` (refonte à concevoir avec Nicolas) · hors ticket K de la phase 5

Décision du 07/11/2026 : « le casino faudra faire un ticket à part car on va faire un rework complet que ça soit PC ou téléphone donc inutile de tester l'interface maintenant ». Le centre commercial est validé tel quel. Nicolas dictera le cahier des charges du nouveau casino ; maquettes à valider avant tout code (méthode de la phase 5).

### Critères d'acceptation
- [ ] Étant donné le cahier des charges de Nicolas, quand les maquettes téléphone et PC sont validées, alors le casino est refait selon elles, sans changer les règles de jeu non décidées.

### Effort et risques
À estimer après le cahier des charges.

## T. `feat(telemetrie): envoyer le relevé de partie au serveur`

`type:feat`, `etat:a_faire`, `est:3-5`, `prio:5` · branche : `v2` · pas d'`agent-ok` (RGPD, consentement)

Décision du 07/11/2026 : en attendant, l'équilibrage se cale par requête SQL sur les sauvegardes du serveur (progression, temps de jeu, zone). L'envoi du relevé détaillé (clic par clic, gains, achats) est repoussé ici.

Exigence de Nicolas (07/11/2026) : « il faut tout ce qui est possible de tracer ». Le suivi doit pouvoir répondre à des questions comme « d'où viennent mes 47 Super Bonbons ? » : chaque gain et chaque dépense d'objet, d'argent et de bonbons est tracé avec sa source (victoire sur un chromatique, capture, achat Shop, casino, palier du Pokédex, événement, utilisation), horodaté, avec la zone et le niveau d'équipe. Le relevé de partie de la version de développement (`journal-zones.ts`, désactivé en production) sert de point de départ.

### Critères d'acceptation
- [ ] Étant donné un gain ou une dépense d'objet, d'argent ou de bonbons, quand il a lieu, alors il est tracé avec sa source, la zone, l'heure et le niveau d'équipe, et une requête SQL permet de lister les gains d'un objet par source pour un compte.
- [ ] Étant donné un joueur connecté, quand il active l'envoi dans les Réglages (désactivé de base), alors le relevé de sa partie est envoyé au serveur sans bloquer le jeu, même hors connexion (envoi différé).
- [ ] Étant donné un joueur qui désactive l'envoi, quand il demande l'effacement, alors ses relevés sont supprimés du serveur.
- [ ] Étant donné le serveur, quand on lit les relevés, alors ils sont anonymisés (aucun mail ni nom) et limités à ce que le simulateur compare (gains, temps, zone, achats).
- [ ] Étant donné la mention RGPD, quand le joueur ouvre les Réglages, alors la collecte est expliquée en une phrase claire.

### Effort et risques
3 à 5 jours. Table serveur, consentement, mention RGPD (voir `docs/projet/risques.md`).
