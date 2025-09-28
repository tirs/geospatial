using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class LoginSession
    {
        [Key]
        public int SessionId { get; set; }

        [Required]
        public int AgentId { get; set; }

        [Required]
        [StringLength(255)]
        public string SessionToken { get; set; } = string.Empty;

        public DateTime LoginTime { get; set; } = DateTime.UtcNow;

        public DateTime LastActivity { get; set; } = DateTime.UtcNow;

        public DateTime ExpiryTime { get; set; }

        [StringLength(45)]
        public string? IPAddress { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? LogoutTime { get; set; }

        [StringLength(50)]
        public string? LogoutReason { get; set; } // Manual, Timeout, System

        // Navigation properties
        [ForeignKey("AgentId")]
        public virtual Agent Agent { get; set; } = null!;

        // Computed properties
        [NotMapped]
        public bool IsExpired => ExpiryTime <= DateTime.UtcNow;

        [NotMapped]
        public TimeSpan SessionDuration => (LogoutTime ?? DateTime.UtcNow) - LoginTime;
    }
}