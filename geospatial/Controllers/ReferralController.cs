using Microsoft.AspNetCore.Mvc;
using UrbanReferralNetwork.Services;
using UrbanReferralNetwork.Models;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReferralController : ControllerBase
    {
        private readonly IGeospatialService _geospatialService;

        public ReferralController(IGeospatialService geospatialService)
        {
            _geospatialService = geospatialService;
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
                var isValid = await _geospatialService.ValidateZipCodeAsync(zipCode);
                return Ok(new { zipCode = zipCode, isValid = isValid });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
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

        [HttpGet("all")]
        public async Task<IActionResult> GetAllReferrals([FromQuery] string? status = null, [FromQuery] string? dateFilter = null)
        {
            try
            {
                var referrals = await _geospatialService.GetAllReferralsAsync(status, dateFilter);
                return Ok(new { success = true, referrals = referrals });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReferral(int id)
        {
            try
            {
                var referral = await _geospatialService.GetReferralByIdAsync(id);
                if (referral == null)
                {
                    return NotFound(new { error = "Referral not found" });
                }
                return Ok(referral);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReferral(int id, [FromBody] UpdateReferralRequest request)
        {
            try
            {
                var success = await _geospatialService.UpdateReferralAsync(id, request);
                if (!success)
                {
                    return NotFound(new { error = "Referral not found" });
                }
                return Ok(new { success = true, message = "Referral updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReferral(int id)
        {
            try
            {
                var success = await _geospatialService.DeleteReferralAsync(id);
                if (!success)
                {
                    return NotFound(new { error = "Referral not found" });
                }
                return Ok(new { success = true, message = "Referral deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("statuses")]
        public IActionResult GetAvailableStatuses()
        {
            try
            {
                var statuses = new
                {
                    success = true,
                    statuses = new[]
                    {
                        new { value = "Pending", label = "Pending" },
                        new { value = "Contacted", label = "Contacted" },
                        new { value = "Scheduled", label = "Scheduled" },
                        new { value = "Completed", label = "Completed" },
                        new { value = "Cancelled", label = "Cancelled" },
                        new { value = "InProgress", label = "In Progress" }
                    }
                };
                return Ok(statuses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }
    }


}