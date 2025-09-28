using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class CallRecord
    {
        [Key]
        public int CallId { get; set; }

        [Required]
        [StringLength(50)]
        public string CallUniqueId { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string CallerPhone { get; set; } = string.Empty;

        [StringLength(100)]
        public string? CallerName { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? CallerEmail { get; set; }

        [StringLength(100)]
        public string? ServiceType { get; set; }

        [StringLength(10)]
        public string CallDirection { get; set; } = "Inbound";

        [StringLength(50)]
        public string? CallSource { get; set; }

        public int? AgentId { get; set; }

        public DateTime QueueStartTime { get; set; } = DateTime.UtcNow;

        public DateTime? CallStartTime { get; set; }

        public DateTime? CallEndTime { get; set; }

        public int? CallDuration { get; set; }

        public int? WaitTime { get; set; }

        [StringLength(20)]
        public string CallStatus { get; set; } = "Queued";

        [StringLength(50)]
        public string? CallOutcome { get; set; }

        [StringLength(10)]
        public string Priority { get; set; } = "Normal";

        public int? CustomerSatisfaction { get; set; }

        [StringLength(2000)]
        public string? CallNotes { get; set; }

        [StringLength(500)]
        public string? RecordingUrl { get; set; }

        public int? ReferralId { get; set; }

        public bool FollowUpRequired { get; set; } = false;

        public DateTime? FollowUpDate { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Agent? Agent { get; set; }
        public virtual Referral? Referral { get; set; }
        public virtual ICollection<CallQueue> CallQueues { get; set; } = new List<CallQueue>();
        public virtual ICollection<CallTransfer> CallTransfers { get; set; } = new List<CallTransfer>();
        public virtual ICollection<CustomerInteraction> CustomerInteractions { get; set; } = new List<CustomerInteraction>();

        // Computed properties
        [NotMapped]
        public string FormattedDuration
        {
            get
            {
                if (CallDuration == null) return "00:00";
                var minutes = CallDuration.Value / 60;
                var seconds = CallDuration.Value % 60;
                return $"{minutes:D2}:{seconds:D2}";
            }
        }

        [NotMapped]
        public string FormattedWaitTime
        {
            get
            {
                if (WaitTime == null) return "00:00";
                var minutes = WaitTime.Value / 60;
                var seconds = WaitTime.Value % 60;
                return $"{minutes:D2}:{seconds:D2}";
            }
        }

        [NotMapped]
        public bool IsActive => CallStatus == "Queued" || CallStatus == "InProgress";
    }
}