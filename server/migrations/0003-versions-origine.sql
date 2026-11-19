
  ALTER TABLE versions
    ADD COLUMN origine text NOT NULL DEFAULT 'rotation' CHECK (origine IN ('rotation', 'divergence', 'restauration')),
    ADD COLUMN lot uuid;
  CREATE INDEX ON versions(compte_id, lot) WHERE lot IS NOT NULL;
