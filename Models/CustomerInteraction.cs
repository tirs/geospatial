using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class CustomerInteraction
    {
        [Key]
        public int InteractionId { get; set; }

        [Required]
        [StringLength(20)]
        public string CustomerPhone { get; set; } = string.Empty;

        [StringLength(100)]
        public string? CustomerName { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? CustomerEmail { get; set; }

        [StringLength(50)]
        public string? InteractionType { get; set; }

        [StringLength(50)]
        public string? InteractionChannel { get; set; }

        [StringLength(100)]
        public string? ServiceType { get; set; }

        public int? AgentId { get; set; }

        public int? CallId { get; set; }

        public int? ReferralId { get; set; }

        [StringLength(1000)]
        public string? InteractionSummary { get; set; }

        public int? CustomerSatisfaction { get; set; }

        [StringLength(50)]
        public string? ResolutionStatus { get; set; }

        public DateTime? NextFollowUpDate { get; set; }

        [StringLength(500)]
        public string? Tags { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Agent? Agent { get; set; }
        public virtual CallRecord? CallRecord { get; set; }
        public virtual Referral? Referral { get; set; }

        // Computed properties
        [NotMapped]
        public string InteractionTypeIcon
        {
            get
            {
                return InteractionType switch
                {
                    "Call" => "📞",
                    "Email" => "📧",
                    "SMS" => "💬",
                    "Chat" => "💭",
                    "Referral" => "📋",
                    "Follow-up" => "🔄",
                    _ => "📝"
                };
            }
        }

        [NotMapped]
        public string ChannelIcon
        {
            get
            {
                return InteractionChannel switch
                {
                    "Phone" => "☎️",
                    "Website" => "🌐",
                    "Mobile App" => "📱",
                    "Email" => "📧",
                    "Social Media" => "📱",
                    _ => "💻"
                };
            }
        }

        [NotMapped]
        public string SatisfactionStars
        {
            get
            {
                if (CustomerSatisfaction == null) return "No rating";
                return new string('⭐', CustomerSatisfaction.Value);
            }
        }

        [NotMapped]
        public string ResolutionStatusIcon
        {
            get
            {
                return ResolutionStatus switch
                {
                    "Resolved" => "✅",
                    "Pending" => "⏳",
                    "Escalated" => "⬆️",
                    "Follow-up Required" => "🔄",
                    _ => "❓"
                };
            }
        }

        [NotMapped]
        public bool RequiresFollowUp => ResolutionStatus == "Follow-up Required" || NextFollowUpDate.HasValue;

        [NotMapped]
        public bool IsOverdue => NextFollowUpDate.HasValue && NextFollowUpDate.Value < DateTime.UtcNow;

        [NotMapped]
        public string DisplaySummary
        {
            get
            {
                if (string.IsNullOrEmpty(InteractionSummary)) return "No summary available";
                return InteractionSummary.Length > 100 
                    ? InteractionSummary.Substring(0, 100) + "..." 
                    : InteractionSummary;
            }
        }
    }
}