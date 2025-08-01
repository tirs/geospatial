using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Services;
using UrbanReferralNetwork.Models;
using UrbanReferralNetwork.Data;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReferralController : ControllerBase
    {
        private readonly IGeospatialService _geospatialService;
        private readonly UrbanReferralContext _context;

        public ReferralController(IGeospatialService geospatialService, UrbanReferralContext context)
        {
            _geospatialService = geospatialService;
            _context = context;
        }

        [HttpPost("find-contractors")]
        public async Task<IActionResult> FindContractors([FromBody] ContractorSearchRequest request)
        {
            try
            {
                if (!await _geospatialService.ValidateZipCodeAsync(request.ZipCode))
                {
                    return BadRequest(new { error = "Invalid or unsupported ZIP code" });
                }

                var contractors = await _geospatialService.FindContractorsInRadiusAsync(
                    request.ZipCode,
                    request.ServiceType,
                    request.MaxDistance ?? 25,
                    request.MaxResults ?? 3
                );

                return Ok(new
                {
                    success = true,
                    zipCode = request.ZipCode,
                    serviceType = request.ServiceType,
                    contractorsFound = contractors.Count,
                    contractors = contractors
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("create-referral")]
        public async Task<IActionResult> CreateReferral([FromBody] ReferralCreateReferralRequest request)
        {
            try
            {
                Console.WriteLine($"Received referral request: CustomerZipCode={request.CustomerZipCode}, ContractorIds={string.Join(",", request.ContractorIds ?? new List<int>())}");
                if (!await _geospatialService.ValidateZipCodeAsync(request.CustomerZipCode))
                {
                    return BadRequest(new { error = "Invalid customer ZIP code" });
                }

                if (request.ContractorIds == null || !request.ContractorIds.Any())
                {
                    return BadRequest(new { error = "At least one contractor must be selected" });
                }

                var referralId = await _geospatialService.LogReferralAsync(
                    request.CustomerName ?? "",
                    request.CustomerPhone ?? "",
                    request.CustomerZipCode,
                    request.ServiceType ?? "",
                    request.ContractorIds,
                    request.CreatedBy ?? "System",
                    request.Notes,
                    request.Status,
                    request.AppointmentDate,
                    request.EstimateAmount,
                    request.EstimateNotes,
                    request.WorkStartDate,
                    request.WorkCompletedDate
                );

                return Ok(new
                {
                    success = true,
                    referralId = referralId,
                    message = "Referral created successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("validate-zipcode/{zipCode}")]
        public async Task<IActionResult> ValidateZipCode(string zipCode)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(zipCode))
                {
                    return BadRequest(new { error = "ZIP code is required", zipCode = zipCode, isValid = false });
                }

                var isValid = await _geospatialService.ValidateZipCodeAsync(zipCode);
                
                return Ok(new { 
                    zipCode = zipCode, 
                    isValid = isValid,
                    message = isValid ? "ZIP code is valid" : "ZIP code not found in coverage area"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    error = "Internal server error", 
                    details = ex.Message,
                    zipCode = zipCode,
                    isValid = false 
                });
            }
        }

        [HttpGet("test-db-connection")]
        public async Task<IActionResult> TestDatabaseConnection()
        {
            try
            {
                var connectionString = _context.Database.GetConnectionString();
                var zipCount = await _context.ZipCodes.CountAsync();
                var activeZipCount = await _context.ZipCodes.CountAsync(z => z.IsActive);
                
                // Get sample ZIP codes for verification
                var sampleZips = await _context.ZipCodes
                    .Where(z => z.IsActive)
                    .Take(5)
                    .Select(z => new { z.ZipCodeValue, z.City })
                    .ToListAsync();
                
                return Ok(new { 
                    success = true,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                    connectionString = connectionString?.Substring(0, Math.Min(50, connectionString.Length)) + "...",
                    totalZipCodes = zipCount,
                    activeZipCodes = activeZipCount,
                    sampleZipCodes = sampleZips,
                    message = "Database connection successful"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                    error = "Database connection failed", 
                    details = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("debug-zip/{zipCode}")]
        public async Task<IActionResult> DebugZipCode(string zipCode)
        {
            try
            {
                // Step 1: Format validation
                var formatValid = !string.IsNullOrWhiteSpace(zipCode) && 
                    (zipCode.Length == 5 && zipCode.All(char.IsDigit) ||
                     zipCode.Length == 10 && zipCode[5] == '-' && 
                     zipCode.Take(5).All(char.IsDigit) && zipCode.Skip(6).All(char.IsDigit));

                // Step 2: Database lookup
                var dbRecord = await _context.ZipCodes
                    .Where(z => z.ZipCodeValue == zipCode)
                    .Select(z => new { z.ZipCodeValue, z.City, z.IsActive, z.Latitude, z.Longitude })
                    .FirstOrDefaultAsync();

                // Step 3: Active check
                var isActive = dbRecord?.IsActive ?? false;

                return Ok(new {
                    zipCode = zipCode,
                    formatValid = formatValid,
                    foundInDatabase = dbRecord != null,
                    isActive = isActive,
                    record = dbRecord,
                    finalResult = formatValid && dbRecord != null && isActive,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new {
                    zipCode = zipCode,
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("quick-search/{zipCode}")]
        public async Task<IActionResult> QuickSearch(string zipCode, [FromQuery] string? serviceType = null)
        {
            try
            {
                if (!await _geospatialService.ValidateZipCodeAsync(zipCode))
                {
                    return BadRequest(new { error = "Invalid ZIP code" });
                }

                var contractors = await _geospatialService.FindContractorsInRadiusAsync(zipCode, serviceType);

                return Ok(new
                {
                    success = true,
                    zipCode = zipCode,
                    contractors = contractors.Select(c => new
                    {
                        c.ContractorId,
                        c.CompanyName,
                        c.Phone,
                        c.Distance,
                        c.Rating
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("get-three-referrals")]
        public async Task<IActionResult> GetThreeReferrals([FromBody] ThreeReferralRequest request)
        {
            try
            {
                if (!await _geospatialService.ValidateZipCodeAsync(request.ZipCode))
                {
                    return BadRequest(new { error = "Invalid ZIP code" });
                }

                var contractors = await _geospatialService.FindContractorsInRadiusAsync(
                    request.ZipCode, 
                    request.ServiceType, 
                    request.MaxDistance ?? 25, 
                    3
                );

                if (contractors.Count == 0)
                {
                    return Ok(new
                    {
                        success = false,
                        message = "No contractors found in the specified area",
                        zipCode = request.ZipCode,
                        serviceType = request.ServiceType,
                        contractors = new List<object>()
                    });
                }

                // Auto-create referral if customer info provided
                int? referralId = null;
                if (!string.IsNullOrEmpty(request.CustomerName) || !string.IsNullOrEmpty(request.CustomerPhone))
                {
                    referralId = await _geospatialService.LogReferralAsync(
                        request.CustomerName ?? "",
                        request.CustomerPhone ?? "",
                        request.ZipCode,
                        request.ServiceType ?? "",
                        contractors.Select(c => c.ContractorId).ToList(),
                        request.CreatedBy ?? "API"
                    );
                }

                return Ok(new
                {
                    success = true,
                    referralId = referralId,
                    zipCode = request.ZipCode,
                    serviceType = request.ServiceType,
                    contractorsFound = contractors.Count,
                    contractors = contractors.Select((c, index) => new
                    {
                        position = index + 1,
                        c.ContractorId,
                        c.CompanyName,
                        c.ContactName,
                        c.Phone,
                        c.Email,
                        c.Address,
                        c.City,
                        c.ZipCode,
                        distance = Math.Round(c.Distance, 2),
                        c.Rating,
                        c.ServiceTypes
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("update-referral-status")]
        public async Task<IActionResult> UpdateReferralStatus([FromBody] UpdateReferralStatusRequest request)
        {
            try
            {
                var success = await _geospatialService.UpdateReferralDetailStatusAsync(
                    request.ReferralDetailId,
                    request.Status,
                    request.ContactedDate,
                    request.AppointmentDate,
                    request.EstimateAmount,
                    request.EstimateNotes
                );

                if (!success)
                {
                    return NotFound(new { error = "Referral detail not found" });
                }

                return Ok(new { success = true, message = "Status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("select-contractor")]
        public async Task<IActionResult> SelectContractor([FromBody] SelectContractorRequest request)
        {
            try
            {
                var success = await _geospatialService.SelectContractorAsync(
                    request.ReferralId,
                    request.SelectedContractorId,
                    request.WorkStartDate
                );

                if (!success)
                {
                    return NotFound(new { error = "Referral not found" });
                }

                return Ok(new { success = true, message = "Contractor selected successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("referral-status/{referralId}")]
        public async Task<IActionResult> GetReferralStatus(int referralId)
        {
            try
            {
                var referralStatus = await _geospatialService.GetReferralStatusAsync(referralId);
                
                if (referralStatus == null)
                {
                    return NotFound(new { error = "Referral not found" });
                }

                return Ok(referralStatus);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPost("complete-work")]
        public async Task<IActionResult> CompleteWork([FromBody] CompleteWorkRequest request)
        {
            try
            {
                var success = await _geospatialService.CompleteWorkAsync(
                    request.ReferralDetailId,
                    request.WorkCompletedDate
                );

                if (!success)
                {
                    return NotFound(new { error = "Referral detail not found" });
                }

                return Ok(new { success = true, message = "Work marked as completed" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }
    }


}