using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class Contractor
    {
        [Key]
        public int ContractorId { get; set; }

        [Required]
        [StringLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string ContactName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [Required]
        public int ZipCodeId { get; set; }

        public int ServiceRadius { get; set; } = 25; // miles

        [StringLength(500)]
        public string? ServiceTypes { get; set; } // JSON array

        [Column(TypeName = "decimal(3,2)")]
        public decimal Rating { get; set; } = 0.00m;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Authentication fields
        public DateTime? LastLoginDate { get; set; }

        [StringLength(255)]
        public string? SessionToken { get; set; }

        public DateTime? SessionExpiry { get; set; }

        // Navigation properties
        [ForeignKey("ZipCodeId")]
        public virtual ZipCode ZipCode { get; set; } = null!;

        public virtual ICollection<ServiceArea> ServiceAreas { get; set; } = new List<ServiceArea>();
        public virtual ICollection<ReferralDetail> ReferralDetails { get; set; } = new List<ReferralDetail>();
    }
}