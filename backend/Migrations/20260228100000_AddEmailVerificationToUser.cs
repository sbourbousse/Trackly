using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Trackly.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailVerificationToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationCode",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EmailVerificationSentAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "EmailVerificationCode", table: "Users");
            migrationBuilder.DropColumn(name: "EmailVerificationSentAt", table: "Users");
        }
    }
}
