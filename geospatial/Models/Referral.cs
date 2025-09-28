using System.ComponentModel.DataAnnotations;

namespace UrbanReferralNetwork.Models
{
    public class Referral
    {
        [Key]
        public int ReferralId { get; set; }

        [StringLength(100)]
        public string? CustomerName { get; set; }

        [StringLength(20)]
        public string? CustomerPhone { get; set; }

        [Required]
        [StringLength(10)]
        public string CustomerZipCode { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ServiceType { get; set; }

        public DateTime RequestDate { get; set; } = DateTime.UtcNow;

        [StringLength(50)]
        public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled

        [StringLength(1000)]
        public string? Notes { get; set; }

        [StringLength(100)]
        public string CreatedBy { get; set; } = "System";

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<ReferralDetail> ReferralDetails { get; set; } = new List<ReferralDetail>();
    }
}