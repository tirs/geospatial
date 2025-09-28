using System.ComponentModel.DataAnnotations;

namespace UrbanReferralNetwork.Models
{
    public class UserRole
    {
        [Key]
        public int RoleId { get; set; }

        [Required]
        [StringLength(20)]
        public string RoleName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string DisplayName { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Description { get; set; }

        public string? Permissions { get; set; } // JSON array of permissions

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
    }
}