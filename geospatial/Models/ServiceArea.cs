using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class ServiceArea
    {
        [Key]
        public int ServiceAreaId { get; set; }

        [Required]
        public int ContractorId { get; set; }

        [Required]
        public int ZipCodeId { get; set; }

        public int Priority { get; set; } = 1; // 1=Primary, 2=Secondary, etc.

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ContractorId")]
        public virtual Contractor Contractor { get; set; } = null!;

        [ForeignKey("ZipCodeId")]
        public virtual ZipCode ZipCode { get; set; } = null!;
    }
}