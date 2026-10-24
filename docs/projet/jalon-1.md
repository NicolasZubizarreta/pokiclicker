# Jalon 1 — Route 1 jouable sur téléphone et PC

Essai de Nicolas le 24/10/2026, sur son téléphone (par le Wi-Fi, version de production) et sur son PC.

## Écarts relevés et traitement
| Écart relevé | Traitement |
|---|---|
| Sur PC, le dialogue et le message de fin de zone demandaient de défiler | Corrigé le 24/10 : scène 16:9 à largeur limitée par la hauteur de fenêtre, dialogue et suite fusionnés, test e2e sur trois tailles (390, 1440, 1915 px) |
| Une notification (« prêt hors connexion ») repoussait le bouton « Attaque » | Corrigé : toasts flottants, la mise en page ne bouge plus |
| Le bouton « Attaque » est inutile (V1 : on touche le Pokémon) | Décision de Nicolas : supprimé, la scène entière est la cible ; noté dans `design/DESIGN.md` |
| Sur téléphone : « Les données de cette partie ne peuvent pas être lues », impossible de recharger | Corrigé : `crypto.randomUUID` n'existe pas hors adresse sécurisée ; identifiant généré avec `getRandomValues` ; erreurs inconnues avec leur cause |

## Validé par Nicolas (« ok c'est parfait », après correction)
- Reprise à la même étape après fermeture et réouverture, DPS exact, textes en français, message de fin de zone.
- Disposition PC et mobile.

## Pas encore vu
- L'invite « Installer » sur un vrai Android et l'ajout à l'écran d'accueil sur iPhone : impossible en `http://192.168…` (contexte non sécurisé), à voir dès le premier déploiement en https ou par redirection de port USB.
- Équilibrage (phase 3) : l'équipe provisoire de trois starters à 77–79 DPS chacun vient des formules de la V1 ; à confirmer avec Nicolas au moment de l'équilibrage (la décision du 23/10 parlait de Bulbizarre seul).
