using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Trackly.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddHeadquartersToTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeadquartersAddress",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "HeadquartersLat",
                table: "Tenants",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "HeadquartersLng",
                table: "Tenants",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "HeadquartersAddress", table: "Tenants");
            migrationBuilder.DropColumn(name: "HeadquartersLat", table: "Tenants");
            migrationBuilder.DropColumn(name: "HeadquartersLng", table: "Tenants");
        }
    }
}
