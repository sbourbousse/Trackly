-- À exécuter sur la base crossover si EF dit "déjà à jour" mais les colonnes
-- HeadquartersAddress / HeadquartersLat / HeadquartersLng n'existent pas.
-- Ensuite : dotnet ef database update (sans DATABASE_URL pour utiliser appsettings).

DELETE FROM "__EFMigrationsHistory"
WHERE "MigrationId" = '20260215000000_AddHeadquartersToTenant';
