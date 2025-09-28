using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Data
{
    public class UrbanReferralContext : DbContext
    {
        public UrbanReferralContext(DbContextOptions<UrbanReferralContext> options) : base(options) { }

        public DbSet<ZipCode> ZipCodes { get; set; }
        public DbSet<Contractor> Contractors { get; set; }
        public DbSet<ServiceArea> ServiceAreas { get; set; }
        public DbSet<Referral> Referrals { get; set; }
        public DbSet<ReferralDetail> ReferralDetails { get; set; }
        public DbSet<ServiceType> ServiceTypes { get; set; }
        
        // Call Center entities
        public DbSet<Agent> Agents { get; set; }
        public DbSet<CallRecord> CallRecords { get; set; }
        public DbSet<CallQueue> CallQueue { get; set; }
        public DbSet<AgentStatus> AgentStatus { get; set; }
        public DbSet<CallTransfer> CallTransfers { get; set; }
        public DbSet<CustomerInteraction> CustomerInteractions { get; set; }
        
        // Authentication entities
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<LoginSession> LoginSessions { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure table names to match database schema
            modelBuilder.Entity<ZipCode>().ToTable("ZipCodes");
            modelBuilder.Entity<Contractor>().ToTable("Contractors");
            modelBuilder.Entity<ServiceArea>().ToTable("ServiceAreas");
            modelBuilder.Entity<Referral>().ToTable("Referrals");
            modelBuilder.Entity<ReferralDetail>().ToTable("ReferralDetails");
            modelBuilder.Entity<ServiceType>().ToTable("ServiceTypes");

            // Configure ZipCode
            modelBuilder.Entity<ZipCode>(entity =>
            {
                entity.HasKey(e => e.ZipCodeId);
                entity.Property(e => e.ZipCodeValue).HasColumnName("ZipCode");
                entity.HasIndex(e => e.ZipCodeValue).IsUnique();
                entity.HasIndex(e => new { e.Latitude, e.Longitude });
            });

            // Configure Contractor
            modelBuilder.Entity<Contractor>(entity =>
            {
                entity.HasKey(e => e.ContractorId);
                entity.HasOne(e => e.ZipCode)
                      .WithMany(z => z.Contractors)
                      .HasForeignKey(e => e.ZipCodeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure ServiceArea
            modelBuilder.Entity<ServiceArea>(entity =>
            {
                entity.HasKey(e => e.ServiceAreaId);
                entity.HasOne(e => e.Contractor)
                      .WithMany(c => c.ServiceAreas)
                      .HasForeignKey(e => e.ContractorId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.ZipCode)
                      .WithMany(z => z.ServiceAreas)
                      .HasForeignKey(e => e.ZipCodeId)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(e => new { e.ContractorId, e.ZipCodeId }).IsUnique();
            });

            // Configure Referral
            modelBuilder.Entity<Referral>(entity =>
            {
                entity.HasKey(e => e.ReferralId);
                entity.HasIndex(e => e.RequestDate);
                entity.HasIndex(e => e.CustomerZipCode);
            });

            // Configure ReferralDetail
            modelBuilder.Entity<ReferralDetail>(entity =>
            {
                entity.HasKey(e => e.ReferralDetailId);
                entity.HasOne(e => e.Referral)
                      .WithMany(r => r.ReferralDetails)
                      .HasForeignKey(e => e.ReferralId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Contractor)
                      .WithMany(c => c.ReferralDetails)
                      .HasForeignKey(e => e.ContractorId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure ServiceType
            modelBuilder.Entity<ServiceType>(entity =>
            {
                entity.HasKey(e => e.ServiceTypeId);
                entity.HasIndex(e => e.ServiceName).IsUnique();
            });

            // Configure Call Center entities
            
            // Configure Agent
            modelBuilder.Entity<Agent>(entity =>
            {
                entity.HasKey(e => e.AgentId);
                entity.ToTable("Agents");
                entity.HasIndex(e => e.AgentCode).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.Department);
            });

            // Configure CallRecord
            modelBuilder.Entity<CallRecord>(entity =>
            {
                entity.HasKey(e => e.CallId);
                entity.ToTable("CallRecords");
                entity.HasIndex(e => e.CallUniqueId).IsUnique();
                entity.HasIndex(e => e.CallerPhone);
                entity.HasIndex(e => e.CallStatus);
                entity.HasIndex(e => e.QueueStartTime);
                entity.HasIndex(e => e.ServiceType);
                
                entity.HasOne(e => e.Agent)
                      .WithMany(a => a.CallRecords)
                      .HasForeignKey(e => e.AgentId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.Referral)
                      .WithMany()
                      .HasForeignKey(e => e.ReferralId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure CallQueue
            modelBuilder.Entity<CallQueue>(entity =>
            {
                entity.HasKey(e => e.QueueId);
                entity.ToTable("CallQueue");
                entity.HasIndex(e => e.QueuePosition);
                entity.HasIndex(e => e.QueueStatus);
                entity.HasIndex(e => e.Priority);
                entity.HasIndex(e => e.ServiceType);
                
                entity.HasOne(e => e.CallRecord)
                      .WithMany(c => c.CallQueues)
                      .HasForeignKey(e => e.CallId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.PreferredAgentNavigation)
                      .WithMany()
                      .HasForeignKey(e => e.PreferredAgent)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.AssignedAgentNavigation)
                      .WithMany()
                      .HasForeignKey(e => e.AssignedAgent)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure AgentStatus
            modelBuilder.Entity<AgentStatus>(entity =>
            {
                entity.HasKey(e => e.StatusId);
                entity.ToTable("AgentStatus");
                entity.HasIndex(e => e.AgentId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.StatusStartTime);
                
                entity.HasOne(e => e.Agent)
                      .WithMany(a => a.AgentStatuses)
                      .HasForeignKey(e => e.AgentId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.CurrentCall)
                      .WithMany()
                      .HasForeignKey(e => e.CurrentCallId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure CallTransfer
            modelBuilder.Entity<CallTransfer>(entity =>
            {
                entity.HasKey(e => e.TransferId);
                entity.ToTable("CallTransfers");
                entity.HasIndex(e => e.CallId);
                entity.HasIndex(e => e.FromAgentId);
                entity.HasIndex(e => e.ToAgentId);
                entity.HasIndex(e => e.TransferStatus);
                
                entity.HasOne(e => e.CallRecord)
                      .WithMany(c => c.CallTransfers)
                      .HasForeignKey(e => e.CallId)
                      .OnDelete(DeleteBehavior.Cascade);
                      
                entity.HasOne(e => e.FromAgent)
                      .WithMany(a => a.TransfersFrom)
                      .HasForeignKey(e => e.FromAgentId)
                      .OnDelete(DeleteBehavior.Restrict);
                      
                entity.HasOne(e => e.ToAgent)
                      .WithMany(a => a.TransfersTo)
                      .HasForeignKey(e => e.ToAgentId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure CustomerInteraction
            modelBuilder.Entity<CustomerInteraction>(entity =>
            {
                entity.HasKey(e => e.InteractionId);
                entity.ToTable("CustomerInteractions");
                entity.HasIndex(e => e.CustomerPhone);
                entity.HasIndex(e => e.CustomerEmail);
                entity.HasIndex(e => e.AgentId);
                entity.HasIndex(e => e.InteractionType);
                entity.HasIndex(e => e.CreatedDate);
                
                entity.HasOne(e => e.Agent)
                      .WithMany()
                      .HasForeignKey(e => e.AgentId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.CallRecord)
                      .WithMany(c => c.CustomerInteractions)
                      .HasForeignKey(e => e.CallId)
                      .OnDelete(DeleteBehavior.SetNull);
                      
                entity.HasOne(e => e.Referral)
                      .WithMany()
                      .HasForeignKey(e => e.ReferralId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // Configure Authentication entities
            
            // Configure UserRole
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(e => e.RoleId);
                entity.ToTable("UserRoles");
                entity.HasIndex(e => e.RoleName).IsUnique();
                entity.HasIndex(e => e.IsActive);
            });

            // Configure LoginSession
            modelBuilder.Entity<LoginSession>(entity =>
            {
                entity.HasKey(e => e.SessionId);
                entity.ToTable("LoginSessions");
                entity.HasIndex(e => e.SessionToken).IsUnique();
                entity.HasIndex(e => e.AgentId);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.ExpiryTime);
                
                entity.HasOne(e => e.Agent)
                      .WithMany()
                      .HasForeignKey(e => e.AgentId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure AuditLog
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.LogId);
                entity.ToTable("AuditLog");
                entity.HasIndex(e => e.AgentId);
                entity.HasIndex(e => e.Action);
                entity.HasIndex(e => new { e.EntityType, e.EntityId });
                entity.HasIndex(e => e.Timestamp);
                
                entity.HasOne(e => e.Agent)
                      .WithMany()
                      .HasForeignKey(e => e.AgentId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}