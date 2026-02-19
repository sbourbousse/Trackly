-- Ajoute les colonnes siège social à la table Tenants.
-- Exécuter si la migration EF n'a pas été appliquée (ex. : base déjà existante).
-- Avec psql : psql -f add_headquarters_columns.sql <connection_string>
-- Ou dans un client PostgreSQL (DBeaver, pgAdmin, etc.) :

ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "HeadquartersAddress" text NULL;
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "HeadquartersLat" double precision NULL;
ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS "HeadquartersLng" double precision NULL;
