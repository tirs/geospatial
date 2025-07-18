using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanReferralNetwork.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceReferralTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AppointmentDate",
                table: "ReferralDetails",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimateAmount",
                table: "ReferralDetails",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EstimateNotes",
                table: "ReferralDetails",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ReferralDetails",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Referred");

            migrationBuilder.AddColumn<DateTime>(
                name: "WorkCompletedDate",
                table: "ReferralDetails",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "WorkStartDate",
                table: "ReferralDetails",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppointmentDate",
                table: "ReferralDetails");

            migrationBuilder.DropColumn(
                name: "EstimateAmount",
                table: "ReferralDetails");

            migrationBuilder.DropColumn(
                name: "EstimateNotes",
                table: "ReferralDetails");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ReferralDetails");

            migrationBuilder.DropColumn(
                name: "WorkCompletedDate",
                table: "ReferralDetails");

            migrationBuilder.DropColumn(
                name: "WorkStartDate",
                table: "ReferralDetails");
        }
    }
}