using System.ComponentModel.DataAnnotations;

namespace UrbanReferralNetwork.Models
{
    // Call Center Request Models
    public class IncomingCallRequest
    {
        public string From { get; set; } = string.Empty;
        public string? CallerName { get; set; }
        public string? ServiceType { get; set; }
        public string? CallSource { get; set; }
        public string? Priority { get; set; }
    }

    public class AcceptCallRequest
    {
        public int AgentId { get; set; }
    }

    public class CompleteCallRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Outcome { get; set; }
        public string? Notes { get; set; }
        public int? CustomerSatisfaction { get; set; }
        public bool FollowUpRequired { get; set; }
        public DateTime? FollowUpDate { get; set; }
    }

    public class CallCenterCreateReferralRequest
    {
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CustomerZipCode { get; set; } = string.Empty;
        public string ServiceType { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? Status { get; set; }
        public string? CreatedBy { get; set; }
        public int? CallId { get; set; }
    }

    // Referral Controller Request Models
    public class ContractorSearchRequest
    {
        public string ZipCode { get; set; } = string.Empty;
        public string? ServiceType { get; set; }
        public int? MaxDistance { get; set; }
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

    public class UpdateReferralRequest
    {
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? ServiceType { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
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

    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; } = string.Empty;
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