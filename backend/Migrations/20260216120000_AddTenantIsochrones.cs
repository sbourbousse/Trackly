using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Trackly.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantIsochrones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TenantIsochrones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Minutes = table.Column<int>(type: "integer", nullable: false),
                    CoordinatesJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantIsochrones", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TenantIsochrones_TenantId_Minutes",
                table: "TenantIsochrones",
                columns: new[] { "TenantId", "Minutes" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "TenantIsochrones");
        }
    }
}
