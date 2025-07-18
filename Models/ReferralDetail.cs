using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UrbanReferralNetwork.Models
{
    public class ReferralDetail
    {
        [Key]
        public int ReferralDetailId { get; set; }

        [Required]
        public int ReferralId { get; set; }

        [Required]
        public int ContractorId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Distance { get; set; } // miles

        [Required]
        public int Position { get; set; } // 1st, 2nd, 3rd referral

        public DateTime? ContactedDate { get; set; }
        
        public DateTime? AppointmentDate { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal? EstimateAmount { get; set; }
        
        [StringLength(500)]
        public string? EstimateNotes { get; set; }

        public bool SelectedByCustomer { get; set; } = false;
        
        public DateTime? WorkStartDate { get; set; }
        
        public DateTime? WorkCompletedDate { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "Referred"; // Referred, Contacted, Scheduled, Estimated, Selected, InProgress, Completed

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ReferralId")]
        public virtual Referral Referral { get; set; } = null!;

        [ForeignKey("ContractorId")]
        public virtual Contractor Contractor { get; set; } = null!;
    }
}