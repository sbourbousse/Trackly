using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Trackly.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingDeletedAtToDelivery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Vérifier si la colonne existe avant de l'ajouter
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'Deliveries' 
                        AND column_name = 'DeletedAt'
                    ) THEN
                        ALTER TABLE ""Deliveries"" 
                        ADD COLUMN ""DeletedAt"" timestamp with time zone NULL;
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Vérifier si la colonne existe avant de la supprimer
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'Deliveries' 
                        AND column_name = 'DeletedAt'
                    ) THEN
                        ALTER TABLE ""Deliveries"" 
                        DROP COLUMN ""DeletedAt"";
                    END IF;
                END $$;
            ");
        }
    }
}
