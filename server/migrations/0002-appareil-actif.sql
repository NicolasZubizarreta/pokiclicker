
  CREATE TABLE appareil_actif (partie_id uuid PRIMARY KEY REFERENCES parties(id) ON DELETE CASCADE, appareil_id text NOT NULL, battement_le timestamptz NOT NULL);
