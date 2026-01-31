-- La migration AddOrderDateToOrder a été appliquée alors qu'elle était vide,
-- donc la colonne OrderDate n'a jamais été créée.
-- Ce script retire la migration de l'historique pour pouvoir la réappliquer.

DELETE FROM "__EFMigrationsHistory"
WHERE "MigrationId" = '20260131000531_AddOrderDateToOrder';
