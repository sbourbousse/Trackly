using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Trackly.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRouteGeometryToRoute : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RouteGeometry",
                table: "Routes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RouteGeometry",
                table: "Routes");
        }
    }
}
