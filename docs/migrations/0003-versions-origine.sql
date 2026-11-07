-- Archives conservées (suites du lot 8) : migration additive, compatible avec l'ancien code serveur.
-- Procédure : sauvegarder la base avant ; elle s'applique toute seule au démarrage du nouveau serveur
-- (tableau `migrations` de server/src/schema.ts) ; rien n'est à lancer à la main.
-- Retour en arrière possible : l'ancien serveur ignore les colonnes, mais sa rotation (5 par objet) peut effacer les lots archivés.
ALTER TABLE versions
  ADD COLUMN origine text NOT NULL DEFAULT 'rotation' CHECK (origine IN ('rotation', 'divergence', 'restauration')),
  ADD COLUMN lot uuid;
CREATE INDEX ON versions(compte_id, lot) WHERE lot IS NOT NULL;
