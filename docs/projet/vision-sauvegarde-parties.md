# Vision : le système de parties (à refaire après les lots d'audit)

Dit par Nicolas le 20/11/2026. Rien n'est codé : c'est un chantier à cadrer en ticket plus tard, après les lots de l'audit.

## Ce qu'il veut
- Un vrai système de partie, comme Minecraft, Mario ou les derniers Spider-Man : on lance une partie, on joue ; « Menu principal » sauvegarde la partie et la quitte. Dans le menu principal, aucune partie ne tourne.
- Une sauvegarde automatique de temps en temps, bien sûr, mais pas un écrit par seconde dans le `localStorage`, et pas en clair.
- Pas de statuts de partie (« en cours », « hors ligne », etc.). Une partie est ouverte ou elle ne l'est pas, rien d'autre.
- Seule règle conservée : une partie ouverte sur un appareil ne peut pas être lancée sur un autre. Menu principal ou onglet fermé : aucune partie ne tourne, donc aucun blocage.

## Ce que ça touche (repéré, pas encore étudié)
- Le verrou « appareil actif » du serveur (`appareil_actif`) et ses battements.
- Les écritures locales fréquentes dans `localStorage` (`src/ui/persistance`, `store.ts`).
- Les statuts de synchro du client (`src/ui/synchro.ts`).
- Les décisions déjà prises dans l'audit qui deviennent caduques : jeton en cookie HttpOnly (S-uib-01) et envoi compressé à la fermeture (B-uib-01), non faits.
