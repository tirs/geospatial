using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class CallTransfer
    {
        [Key]
        public int TransferId { get; set; }

        [Required]
        public int CallId { get; set; }

        [Required]
        public int FromAgentId { get; set; }

        public int? ToAgentId { get; set; }

        [StringLength(50)]
        public string? ToDepartment { get; set; }

        [StringLength(200)]
        public string? TransferReason { get; set; }

        [StringLength(20)]
        public string TransferType { get; set; } = "Warm";

        [StringLength(20)]
        public string TransferStatus { get; set; } = "Pending";

        public DateTime TransferTime { get; set; } = DateTime.UtcNow;

        public DateTime? AcceptedTime { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual CallRecord CallRecord { get; set; } = null!;
        public virtual Agent FromAgent { get; set; } = null!;
        public virtual Agent? ToAgent { get; set; }

        // Computed properties
        [NotMapped]
        public string TransferTypeIcon
        {
            get
            {
                return TransferType switch
                {
                    "Warm" => "🤝",
                    "Cold" => "❄️",
                    "Conference" => "👥",
                    _ => "📞"
                };
            }
        }

        [NotMapped]
        public string StatusIcon
        {
            get
            {
                return TransferStatus switch
                {
                    "Pending" => "⏳",
                    "Accepted" => "✅",
                    "Rejected" => "❌",
                    "Completed" => "🎯",
                    _ => "❓"
                };
            }
        }

        [NotMapped]
        public string TransferTarget => ToAgent?.FullName ?? ToDepartment ?? "Unknown";

        [NotMapped]
        public TimeSpan? TransferDuration
        {
            get
            {
                if (AcceptedTime == null) return null;
                return AcceptedTime.Value - TransferTime;
            }
        }

        [NotMapped]
        public bool IsPending => TransferStatus == "Pending";

        [NotMapped]
        public bool IsCompleted => TransferStatus == "Completed";
    }
}