using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Trackly.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneAndCommentToOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalComment",
                table: "Orders",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "PhoneNumber", table: "Orders");
            migrationBuilder.DropColumn(name: "InternalComment", table: "Orders");
        }
    }
}
