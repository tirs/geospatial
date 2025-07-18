using System.ComponentModel.DataAnnotations;

namespace UrbanReferralNetwork.Models
{
    // Call Center Request Models
    public class IncomingCallRequest
    {
        [Required]
        [Phone]
        [StringLength(15, MinimumLength = 10)]
        public string From { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? CallerName { get; set; }
        
        [StringLength(50)]
        public string? ServiceType { get; set; }
        
        [StringLength(50)]
        public string? CallSource { get; set; }
        
        [StringLength(20)]
        public string? Priority { get; set; }
    }

    public class AcceptCallRequest
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int AgentId { get; set; }
    }

    public class CompleteCallRequest
    {
        [Required]
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? Outcome { get; set; }
        
        [StringLength(1000)]
        public string? Notes { get; set; }
        
        [Range(1, 5)]
        public int? CustomerSatisfaction { get; set; }
        
        public bool FollowUpRequired { get; set; }
        public DateTime? FollowUpDate { get; set; }
    }

    public class CallCenterCreateReferralRequest
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string CustomerName { get; set; } = string.Empty;
        
        [Required]
        [Phone]
        [StringLength(15, MinimumLength = 10)]
        public string CustomerPhone { get; set; } = string.Empty;
        
        [Required]
        [RegularExpression(@"^\d{5}(-\d{4})?$", ErrorMessage = "Invalid ZIP code format")]
        public string CustomerZipCode { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string ServiceType { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Notes { get; set; }
        
        [StringLength(50)]
        public string? Status { get; set; }
        
        [StringLength(100)]
        public string? CreatedBy { get; set; }
        
        [Range(1, int.MaxValue)]
        public int? CallId { get; set; }
    }

    // Referral Controller Request Models
    public class ContractorSearchRequest
    {
        [Required]
        [RegularExpression(@"^\d{5}(-\d{4})?$", ErrorMessage = "Invalid ZIP code format")]
        public string ZipCode { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? ServiceType { get; set; }
        
        [Range(1, 100)]
        public int? MaxDistance { get; set; }
        
        [Range(1, 50)]
        public int? MaxResults { get; set; }
    }

    public class ReferralCreateReferralRequest
    {
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string CustomerZipCode { get; set; } = string.Empty;
        public string? ServiceType { get; set; }
        public List<int> ContractorIds { get; set; } = new();
        public string? CreatedBy { get; set; }
        public string? Status { get; set; }
        public DateTime? AppointmentDate { get; set; }
        public decimal? EstimateAmount { get; set; }
        public string? EstimateNotes { get; set; }
        public DateTime? WorkStartDate { get; set; }
        public DateTime? WorkCompletedDate { get; set; }
        public string? Notes { get; set; }
    }

    public class ThreeReferralRequest
    {
        public string ZipCode { get; set; } = string.Empty;
        public string? ServiceType { get; set; }
        public int? MaxDistance { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CreatedBy { get; set; }
    }

    public class UpdateReferralStatusRequest
    {
        public int ReferralDetailId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ContactedDate { get; set; }
        public DateTime? AppointmentDate { get; set; }
        public decimal? EstimateAmount { get; set; }
        public string? EstimateNotes { get; set; }
    }

    public class SelectContractorRequest
    {
        public int ReferralId { get; set; }
        public int SelectedContractorId { get; set; }
        public DateTime? WorkStartDate { get; set; }
    }

    public class CompleteWorkRequest
    {
        public int ReferralDetailId { get; set; }
        public DateTime? WorkCompletedDate { get; set; }
    }

    // Call Transfer Request Models
    public class InitiateTransferRequest
    {
        public int CallId { get; set; }
        public int FromAgentId { get; set; }
        public int? ToAgentId { get; set; }
        public string? ToDepartment { get; set; }
        public string TransferReason { get; set; } = string.Empty;
        public string TransferType { get; set; } = "Warm"; // Warm, Cold, Conference
        public string? Notes { get; set; }
    }

    public class AcceptTransferRequest
    {
        public int TransferId { get; set; }
        public int AgentId { get; set; }
        public string? Notes { get; set; }
    }

    public class RejectTransferRequest
    {
        public int TransferId { get; set; }
        public int AgentId { get; set; }
        public string RejectionReason { get; set; } = string.Empty;
    }

    // Reports Request Models
    public class ReportsFilterRequest
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? AgentId { get; set; }
        public string? ServiceType { get; set; }
        public string? Department { get; set; }
        public string? ReportType { get; set; }
    }

    // Authentication Request Models
    public class LoginRequest
    {
        [Required]
        public string AgentCode { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }



    public class LoginResponse
    {
        public string Result { get; set; } = string.Empty;
        public string? SessionToken { get; set; }
        public int? AgentId { get; set; }
        public string? UserRole { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool MustChangePassword { get; set; }
        public string? Message { get; set; }
    }

    public class SessionValidationResponse
    {
        public string Result { get; set; } = string.Empty;
        public int? AgentId { get; set; }
        public string? UserRole { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? AgentCode { get; set; }
    }

    // Contractor Authentication Models
    public class ContractorLoginRequest
    {
        [Required]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class ContractorLoginResponse
    {
        public string Result { get; set; } = string.Empty;
        public string? SessionToken { get; set; }
        public int? ContractorId { get; set; }
        public string? CompanyName { get; set; }
        public string? ContactName { get; set; }
        public string? UserType { get; set; }
        public string? Message { get; set; }
    }

    public class ContractorValidationResponse
    {
        public string Result { get; set; } = string.Empty;
        public int? ContractorId { get; set; }
        public string? CompanyName { get; set; }
        public string? ContactName { get; set; }
        public string? UserType { get; set; }
    }

    // Agent Registration Models
    public class AgentRegistrationRequest
    {
        [Required]
        [StringLength(20)]
        public string AgentCode { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? Phone { get; set; }
        public string? Extension { get; set; }
        public string Department { get; set; } = "Customer Service";
        public string? Shift { get; set; }
        public int SkillLevel { get; set; } = 1;
        public string? ServiceTypes { get; set; }
        public int MaxConcurrentCalls { get; set; } = 1;
        public string UserRole { get; set; } = "Agent";

        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string Password { get; set; } = string.Empty;

        public bool MustChangePassword { get; set; } = true;
    }
}