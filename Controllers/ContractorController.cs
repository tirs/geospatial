using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;
using UrbanReferralNetwork.Models;
using UrbanReferralNetwork.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Asp.Versioning;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [EnableRateLimiting("ContractorPolicy")]
    [Authorize]
    public class ContractorController : ControllerBase
    {
        private readonly UrbanReferralContext _context;
        private readonly ICacheService _cacheService;
        private readonly ILogger<ContractorController> _logger;

        public ContractorController(UrbanReferralContext context, ICacheService cacheService, ILogger<ContractorController> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Policy = "AgentOnly")]
        public async Task<IActionResult> GetAllContractors()
        {
            try
            {
                // Try cache first
                var contractors = await _cacheService.GetOrSetAsync("all_contractors", async () =>
                {
                    return await _context.Contractors
                        .Include(c => c.ZipCode)
                        .Where(c => c.IsActive)
                        .OrderBy(c => c.CompanyName)
                        .Select(c => new
                        {
                            c.ContractorId,
                            c.CompanyName,
                            c.ContactName,
                            c.Phone,
                            c.Email,
                            c.Address,
                            City = c.ZipCode.City,
                            ZipCode = c.ZipCode.ZipCodeValue,
                            c.ServiceRadius,
                            c.ServiceTypes,
                            c.Rating,
                            c.IsActive,
                            c.CreatedDate,
                            c.UpdatedDate
                        })
                        .ToListAsync();
                }, TimeSpan.FromMinutes(15));

                return Ok(new { success = true, contractors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving contractors");
                return StatusCode(500, new { success = false, error = "Failed to retrieve contractors" });
            }
        }

        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleContractorStatus(int id)
        {
            try
            {
                var contractor = await _context.Contractors.FindAsync(id);
                if (contractor == null)
                {
                    return NotFound(new { success = false, error = "Contractor not found" });
                }

                contractor.IsActive = !contractor.IsActive;
                contractor.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    success = true, 
                    message = contractor.IsActive ? "Contractor activated" : "Contractor suspended",
                    isActive = contractor.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContractor(int id, [FromBody] UpdateContractorRequest request)
        {
            try
            {
                var contractor = await _context.Contractors.FindAsync(id);
                if (contractor == null)
                {
                    return NotFound(new { success = false, error = "Contractor not found" });
                }

                contractor.CompanyName = request.CompanyName ?? contractor.CompanyName;
                contractor.ContactName = request.ContactName ?? contractor.ContactName;
                contractor.Phone = request.Phone ?? contractor.Phone;
                contractor.Email = request.Email ?? contractor.Email;
                contractor.Address = request.Address ?? contractor.Address;
                contractor.ServiceRadius = request.ServiceRadius ?? contractor.ServiceRadius;
                contractor.ServiceTypes = request.ServiceTypes ?? contractor.ServiceTypes;
                contractor.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Contractor updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContractor(int id)
        {
            try
            {
                var contractor = await _context.Contractors.FindAsync(id);
                if (contractor == null)
                {
                    return NotFound(new { success = false, error = "Contractor not found" });
                }

                _context.Contractors.Remove(contractor);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Contractor deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterContractor([FromBody] ContractorRegistrationRequest request)
        {
            try
            {
                // Validate ZIP code exists
                var zipCode = await _context.ZipCodes
                    .FirstOrDefaultAsync(z => z.ZipCodeValue == request.ZipCode && z.IsActive);
                
                if (zipCode == null)
                {
                    return BadRequest(new { success = false, error = "Invalid ZIP code" });
                }

                // Check if contractor already exists with same phone
                var existingContractor = await _context.Contractors
                    .FirstOrDefaultAsync(c => c.Phone == request.Phone);
                
                if (existingContractor != null)
                {
                    return BadRequest(new { success = false, error = "A contractor with this phone number already exists" });
                }

                // Create new contractor (pending approval)
                var contractor = new Contractor
                {
                    CompanyName = request.CompanyName,
                    ContactName = request.ContactName,
                    Phone = request.Phone,
                    Email = request.Email,
                    Address = request.Address,
                    ZipCodeId = zipCode.ZipCodeId,
                    ServiceRadius = request.ServiceRadius,
                    ServiceTypes = request.ServiceTypes,
                    IsActive = false, // Pending approval
                    Rating = 0.00m
                };

                _context.Contractors.Add(contractor);
                await _context.SaveChangesAsync();

                // Log registration for admin review
                var auditLog = new AuditLog
                {
                    Action = "Contractor Registration",
                    EntityType = "Contractor",
                    EntityId = contractor.ContractorId,
                    NewValues = $"New contractor registration: {request.CompanyName} - {request.ContactName}"
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    success = true, 
                    message = "Registration submitted successfully! We'll review your application within 24 hours.",
                    contractorId = contractor.ContractorId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingContractors()
        {
            try
            {
                var pendingContractors = await _context.Contractors
                    .Include(c => c.ZipCode)
                    .Where(c => !c.IsActive)
                    .OrderBy(c => c.CreatedDate)
                    .Select(c => new
                    {
                        c.ContractorId,
                        c.CompanyName,
                        c.ContactName,
                        c.Phone,
                        c.Email,
                        c.Address,
                        City = c.ZipCode.City,
                        ZipCode = c.ZipCode.ZipCodeValue,
                        c.ServiceRadius,
                        c.ServiceTypes,
                        c.CreatedDate,
                        DaysWaiting = (DateTime.UtcNow - c.CreatedDate).Days
                    })
                    .ToListAsync();

                return Ok(new { success = true, contractors = pendingContractors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveContractor(int id, [FromBody] ApprovalRequest request)
        {
            try
            {
                var contractor = await _context.Contractors.FindAsync(id);
                if (contractor == null)
                {
                    return NotFound(new { success = false, error = "Contractor not found" });
                }

                contractor.IsActive = request.Approved;
                contractor.UpdatedDate = DateTime.UtcNow;

                // Log approval/rejection
                var auditLog = new AuditLog
                {
                    Action = request.Approved ? "Contractor Approved" : "Contractor Rejected",
                    EntityType = "Contractor",
                    EntityId = contractor.ContractorId,
                    NewValues = $"{contractor.CompanyName} - {(request.Approved ? "Approved" : "Rejected")}. Notes: {request.Notes}"
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();

                var message = request.Approved 
                    ? "Contractor approved successfully!" 
                    : "Contractor application rejected.";

                return Ok(new { success = true, message, isActive = contractor.IsActive });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }

    public class UpdateContractorRequest
    {
        public string? CompanyName { get; set; }
        public string? ContactName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public int? ServiceRadius { get; set; }
        public string? ServiceTypes { get; set; }
    }

    public class ContractorRegistrationRequest
    {
        public string CompanyName { get; set; } = string.Empty;
        public string ContactName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string ZipCode { get; set; } = string.Empty;
        public int ServiceRadius { get; set; }
        public string ServiceTypes { get; set; } = string.Empty;
        public string? Experience { get; set; }
        public string? License { get; set; }
        public string? Insurance { get; set; }
    }

    public class ApprovalRequest
    {
        public bool Approved { get; set; }
        public string? Notes { get; set; }
        public string? ApprovedBy { get; set; }
    }
}