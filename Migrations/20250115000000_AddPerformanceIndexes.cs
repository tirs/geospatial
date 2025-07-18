using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanReferralNetwork.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Agent indexes
            migrationBuilder.CreateIndex(
                name: "IX_Agents_AgentCode",
                table: "Agents",
                column: "AgentCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Agents_Email",
                table: "Agents",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Agents_IsActive",
                table: "Agents",
                column: "IsActive");

            // Contractor indexes
            migrationBuilder.CreateIndex(
                name: "IX_Contractors_Phone",
                table: "Contractors",
                column: "Phone");

            migrationBuilder.CreateIndex(
                name: "IX_Contractors_IsActive",
                table: "Contractors",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Contractors_ServiceTypes",
                table: "Contractors",
                column: "ServiceTypes");

            // Referral indexes
            migrationBuilder.CreateIndex(
                name: "IX_Referrals_Status",
                table: "Referrals",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Referrals_CreatedDate",
                table: "Referrals",
                column: "CreatedDate");

            migrationBuilder.CreateIndex(
                name: "IX_Referrals_AgentId_CreatedDate",
                table: "Referrals",
                columns: new[] { "AgentId", "CreatedDate" });

            // LoginSession indexes
            migrationBuilder.CreateIndex(
                name: "IX_LoginSessions_SessionToken",
                table: "LoginSessions",
                column: "SessionToken");

            migrationBuilder.CreateIndex(
                name: "IX_LoginSessions_IsActive",
                table: "LoginSessions",
                column: "IsActive");

            // AuditLog indexes
            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Action",
                table: "AuditLogs",
                column: "Action");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_CreatedDate",
                table: "AuditLogs",
                column: "CreatedDate");

            // ZipCode indexes
            migrationBuilder.CreateIndex(
                name: "IX_ZipCodes_ZipCodeValue",
                table: "ZipCodes",
                column: "ZipCodeValue",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ZipCodes_City",
                table: "ZipCodes",
                column: "City");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Agents_AgentCode", table: "Agents");
            migrationBuilder.DropIndex(name: "IX_Agents_Email", table: "Agents");
            migrationBuilder.DropIndex(name: "IX_Agents_IsActive", table: "Agents");
            migrationBuilder.DropIndex(name: "IX_Contractors_Phone", table: "Contractors");
            migrationBuilder.DropIndex(name: "IX_Contractors_IsActive", table: "Contractors");
            migrationBuilder.DropIndex(name: "IX_Contractors_ServiceTypes", table: "Contractors");
            migrationBuilder.DropIndex(name: "IX_Referrals_Status", table: "Referrals");
            migrationBuilder.DropIndex(name: "IX_Referrals_CreatedDate", table: "Referrals");
            migrationBuilder.DropIndex(name: "IX_Referrals_AgentId_CreatedDate", table: "Referrals");
            migrationBuilder.DropIndex(name: "IX_LoginSessions_SessionToken", table: "LoginSessions");
            migrationBuilder.DropIndex(name: "IX_LoginSessions_IsActive", table: "LoginSessions");
            migrationBuilder.DropIndex(name: "IX_AuditLogs_Action", table: "AuditLogs");
            migrationBuilder.DropIndex(name: "IX_AuditLogs_CreatedDate", table: "AuditLogs");
            migrationBuilder.DropIndex(name: "IX_ZipCodes_ZipCodeValue", table: "ZipCodes");
            migrationBuilder.DropIndex(name: "IX_ZipCodes_City", table: "ZipCodes");
        }
    }
}