-- Colonnes ajoutées par la migration AddPhoneAndCommentToOrder
-- À exécuter si la migration est marquée appliquée mais les colonnes n'existent pas (ex. base Railway).

ALTER TABLE "Orders"
ADD COLUMN IF NOT EXISTS "PhoneNumber" text NULL;

ALTER TABLE "Orders"
ADD COLUMN IF NOT EXISTS "InternalComment" text NULL;
