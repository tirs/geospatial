using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class ZipCode
    {
        [Key]
        public int ZipCodeId { get; set; }

        [Required]
        [StringLength(10)]
        [Column("ZipCode")]
        public string ZipCodeValue { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        [StringLength(50)]
        public string County { get; set; } = "Los Angeles";

        [StringLength(2)]
        public string State { get; set; } = "CA";

        [Required]
        [Column(TypeName = "decimal(10,8)")]
        public decimal Latitude { get; set; }

        [Required]
        [Column(TypeName = "decimal(11,8)")]
        public decimal Longitude { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Contractor> Contractors { get; set; } = new List<Contractor>();
        public virtual ICollection<ServiceArea> ServiceAreas { get; set; } = new List<ServiceArea>();
    }
}