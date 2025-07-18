using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class AgentStatus
    {
        [Key]
        public int StatusId { get; set; }

        [Required]
        public int AgentId { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;

        [StringLength(100)]
        public string? StatusReason { get; set; }

        public int? CurrentCallId { get; set; }

        public DateTime StatusStartTime { get; set; } = DateTime.UtcNow;

        public DateTime? StatusEndTime { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Agent Agent { get; set; } = null!;
        public virtual CallRecord? CurrentCall { get; set; }

        // Computed properties
        [NotMapped]
        public string StatusIcon
        {
            get
            {
                return Status switch
                {
                    "Available" => "🟢",
                    "OnCall" => "🔵",
                    "Break" => "🟡",
                    "Offline" => "⚫",
                    "Training" => "📚",
                    _ => "⚪"
                };
            }
        }

        [NotMapped]
        public string StatusDisplay => $"{StatusIcon} {Status}";

        [NotMapped]
        public TimeSpan StatusDuration
        {
            get
            {
                var endTime = StatusEndTime ?? DateTime.UtcNow;
                return endTime - StatusStartTime;
            }
        }

        [NotMapped]
        public string FormattedStatusDuration
        {
            get
            {
                var duration = StatusDuration;
                if (duration.TotalHours >= 1)
                    return $"{(int)duration.TotalHours}h {duration.Minutes}m";
                else
                    return $"{duration.Minutes}m {duration.Seconds}s";
            }
        }

        [NotMapped]
        public bool IsAvailable => Status == "Available" && IsActive;

        [NotMapped]
        public bool IsOnCall => Status == "OnCall" && IsActive;

        [NotMapped]
        public bool IsOnBreak => Status == "Break" && IsActive;
    }
}