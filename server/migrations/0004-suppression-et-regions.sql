ALTER TABLE versions DROP CONSTRAINT IF EXISTS versions_origine_check;
ALTER TABLE versions ADD CONSTRAINT versions_origine_check CHECK (origine IN ('rotation','divergence','restauration','suppression'));
CREATE TABLE regions_supprimees (
  partie_id uuid REFERENCES parties(id) ON DELETE CASCADE,
  region_id text,
  derniere_revision integer NOT NULL,
  PRIMARY KEY(partie_id, region_id)
);
CREATE TABLE envois_reinitialisation (
  email_hash text NOT NULL,
  envoye_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON envois_reinitialisation(email_hash, envoye_le);
