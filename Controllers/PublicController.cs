using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanReferralNetwork.Data;

namespace UrbanReferralNetwork.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PublicController : ControllerBase
    {
        private readonly UrbanReferralContext _context;

        public PublicController(UrbanReferralContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetPublicStats()
        {
            try
            {
                var contractorCount = await _context.Contractors
                    .Where(c => c.IsActive)
                    .CountAsync();

                var serviceAreas = await _context.ServiceAreas
                    .Where(sa => sa.IsActive)
                    .CountAsync();

                var zipCodesCovered = await _context.ZipCodes
                    .Where(z => z.IsActive)
                    .CountAsync();

                var completedJobs = await _context.ReferralDetails
                    .Where(rd => rd.Status == "Completed")
                    .CountAsync();

                return Ok(new
                {
                    success = true,
                    contractorCount,
                    serviceAreas,
                    zipCodesCovered,
                    completedJobs
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("contractors/active")]
        public async Task<IActionResult> GetActiveContractors()
        {
            try
            {
                var contractors = await _context.Contractors
                    .Where(c => c.IsActive)
                    .Select(c => new
                    {
                        c.ContractorId,
                        c.CompanyName,
                        c.ContactName,
                        c.ZipCodeId
                    })
                    .Take(20) // Limit for performance
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    contractors
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpGet("coverage-overview")]
        public async Task<IActionResult> GetCoverageOverview()
        {
            try
            {
                var coverageData = await _context.ServiceAreas
                    .Include(sa => sa.Contractor)
                    .Include(sa => sa.ZipCode)
                    .Where(sa => sa.IsActive && sa.Contractor.IsActive)
                    .Select(sa => new
                    {
                        ContractorId = sa.ContractorId,
                        CompanyName = sa.Contractor.CompanyName,
                        ZipCode = sa.ZipCode.ZipCodeValue,
                        City = sa.ZipCode.City,
                        Latitude = sa.ZipCode.Latitude,
                        Longitude = sa.ZipCode.Longitude,
                        ServiceRadius = sa.Contractor.ServiceRadius
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    coverageData
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }
}