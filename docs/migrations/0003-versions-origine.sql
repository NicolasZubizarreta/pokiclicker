-- Archives conservées : migration additive, compatible avec l'ancien code serveur.
-- Sauvegarder la base avant ; application automatique au démarrage du nouveau serveur.
-- Retour en arrière possible sans perte en ignorant les nouvelles colonnes.
ALTER TABLE versions
  ADD COLUMN origine text NOT NULL DEFAULT 'rotation' CHECK (origine IN ('rotation', 'divergence', 'restauration')),
  ADD COLUMN lot uuid;
CREATE INDEX ON versions(compte_id, lot) WHERE lot IS NOT NULL;
