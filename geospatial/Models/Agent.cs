using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class Agent
    {
        [Key]
        public int AgentId { get; set; }

        [Required]
        [StringLength(20)]
        public string AgentCode { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(10)]
        public string? Extension { get; set; }

        [StringLength(50)]
        public string Department { get; set; } = "Customer Service";

        [StringLength(20)]
        public string? Shift { get; set; }

        public int SkillLevel { get; set; } = 1;

        [StringLength(500)]
        public string? ServiceTypes { get; set; }

        public int MaxConcurrentCalls { get; set; } = 1;

        public bool IsActive { get; set; } = true;

        public DateTime HireDate { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginDate { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Authentication fields
        [StringLength(255)]
        public string? PasswordHash { get; set; }

        [StringLength(255)]
        public string? PasswordSalt { get; set; }

        [StringLength(20)]
        public string UserRole { get; set; } = "Agent";

        public bool MustChangePassword { get; set; } = true;

        public DateTime? LastPasswordChange { get; set; }

        public int FailedLoginAttempts { get; set; } = 0;

        public bool AccountLocked { get; set; } = false;

        public DateTime? LockoutEndTime { get; set; }

        [StringLength(255)]
        public string? SessionToken { get; set; }

        public DateTime? SessionExpiry { get; set; }

        // Navigation properties
        public virtual ICollection<CallRecord> CallRecords { get; set; } = new List<CallRecord>();
        public virtual ICollection<AgentStatus> AgentStatuses { get; set; } = new List<AgentStatus>();
        public virtual ICollection<CallTransfer> TransfersFrom { get; set; } = new List<CallTransfer>();
        public virtual ICollection<CallTransfer> TransfersTo { get; set; } = new List<CallTransfer>();

        // Computed properties
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}";

        [NotMapped]
        public string DisplayName => $"{FullName} ({AgentCode})";

        [NotMapped]
        public bool IsSessionValid => SessionExpiry.HasValue && SessionExpiry > DateTime.UtcNow;
    }
}