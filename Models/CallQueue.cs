using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class CallQueue
    {
        [Key]
        public int QueueId { get; set; }

        [Required]
        public int CallId { get; set; }

        public int QueuePosition { get; set; }

        public int? EstimatedWaitTime { get; set; }

        [StringLength(10)]
        public string Priority { get; set; } = "Normal";

        [StringLength(100)]
        public string? ServiceType { get; set; }

        public int? PreferredAgent { get; set; }

        public int? SkillRequired { get; set; }

        [StringLength(20)]
        public string QueueStatus { get; set; } = "Waiting";

        public int? AssignedAgent { get; set; }

        public DateTime? AssignedTime { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual CallRecord CallRecord { get; set; } = null!;
        public virtual Agent? PreferredAgentNavigation { get; set; }
        public virtual Agent? AssignedAgentNavigation { get; set; }

        // Computed properties
        [NotMapped]
        public string FormattedEstimatedWaitTime
        {
            get
            {
                if (EstimatedWaitTime == null) return "Unknown";
                var minutes = EstimatedWaitTime.Value / 60;
                var seconds = EstimatedWaitTime.Value % 60;
                return $"{minutes:D2}:{seconds:D2}";
            }
        }

        [NotMapped]
        public string PriorityIcon
        {
            get
            {
                return Priority switch
                {
                    "Low" => "🟢",
                    "Normal" => "🟡",
                    "High" => "🟠",
                    "Emergency" => "🔴",
                    _ => "⚪"
                };
            }
        }

        [NotMapped]
        public bool IsWaiting => QueueStatus == "Waiting";

        [NotMapped]
        public bool IsAssigned => QueueStatus == "Assigned";
    }
}