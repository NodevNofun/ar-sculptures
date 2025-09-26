using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AR_sculptures_API.Migrations
{
    /// <inheritdoc />
    public partial class DeletedPattUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MarkerUrl",
                table: "Sculptures");

            migrationBuilder.RenameColumn(
                name: "ModeUrl",
                table: "Sculptures",
                newName: "ModelUrl");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ModelUrl",
                table: "Sculptures",
                newName: "ModeUrl");

            migrationBuilder.AddColumn<string>(
                name: "MarkerUrl",
                table: "Sculptures",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
