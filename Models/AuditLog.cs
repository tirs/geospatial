using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class AuditLog
    {
        [Key]
        public int LogId { get; set; }

        public int? AgentId { get; set; }

        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;

        [StringLength(50)]
        public string? EntityType { get; set; } // Agent, Call, Referral, etc.

        public int? EntityId { get; set; }

        public string? OldValues { get; set; } // JSON of old values

        public string? NewValues { get; set; } // JSON of new values

        [StringLength(45)]
        public string? IPAddress { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("AgentId")]
        public virtual Agent? Agent { get; set; }
    }
}